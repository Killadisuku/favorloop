import { createServerFn } from "@tanstack/react-start";
import { actorMiddleware as authMiddleware } from "@/lib/server/actor";
import { getSql } from "@/lib/db";
import { REVIEW_TAGS } from "@/lib/constants";
import type { ConversationRow, MessageRow, ProfilePublic } from "@/lib/types";
import {
  blockedSet,
  ensureProfile,
  fail,
  isBlockedPair,
  loadProfile,
  nid,
  notify,
  num,
  ok,
  parseList,
  rowsIn,
  toPublic,
  type ProfileRow,
} from "./helpers";

async function ensureConversation(postId: string, a: string, b: string) {
  const sql = await getSql();
  const existing = await sql<{ id: string }>`
    select id from conversations where post_id = ${postId} limit 1
  `;
  let id = existing[0]?.id;
  if (!id) {
    id = nid("c");
    try {
      await sql`insert into conversations (id, post_id) values (${id}, ${postId})`;
    } catch {
      const raced = await sql<{ id: string }>`select id from conversations where post_id = ${postId} limit 1`;
      id = raced[0]?.id ?? id;
    }
  }
  await sql`
    insert into conversation_members (conversation_id, user_id)
    values (${id}, ${a})
    on conflict do nothing
  `;
  await sql`
    insert into conversation_members (conversation_id, user_id)
    values (${id}, ${b})
    on conflict do nothing
  `;
  return id;
}

export const offerHelp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return { postId: String(d.postId ?? ""), message: String(d.message ?? "").trim().slice(0, 500) };
  })
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (!me.onboarding_complete) return fail("Finish onboarding first.");
    const sql = await getSql();
    const posts = await sql<{
      id: string;
      user_id: string;
      title: string;
      status: string;
      helper_id: string | null;
    }>`select id, user_id, title, status, helper_id from posts where id = ${data.postId} limit 1`;
    const post = posts[0];
    if (!post) return fail("Request not found.");
    if (post.user_id === context.userId) return fail("You cannot offer help on your own request.");
    if (post.status !== "open") return fail("This request is no longer open.");
    if (await isBlockedPair(context.userId, post.user_id)) return fail("You cannot interact with this neighbor.");
    const dup = await sql<{ id: string }>`
      select id from offers where post_id = ${post.id} and helper_id = ${context.userId} limit 1
    `;
    if (dup[0]) return fail("You already offered to help on this request.");
    const id = nid("o");
    try {
      await sql`
        insert into offers (id, post_id, requester_id, helper_id, message, status)
        values (${id}, ${post.id}, ${post.user_id}, ${context.userId}, ${data.message}, 'pending')
      `;
    } catch {
      return fail("You already offered to help on this request.");
    }
    await notify({
      userId: post.user_id,
      type: "new_offer",
      title: "New offer to help",
      body: `${me.name} offered to help with “${post.title}”.`,
      href: `/app/favor/${post.id}`,
    });
    return ok({ id, status: "pending" as const });
  });

export const decideOffer = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return { offerId: String(d.offerId ?? ""), action: d.action === "accept" ? "accept" : "decline" };
  })
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      post_id: string;
      requester_id: string;
      helper_id: string;
      status: string;
    }>`select id, post_id, requester_id, helper_id, status from offers where id = ${data.offerId} limit 1`;
    const offer = rows[0];
    if (!offer) return fail("Offer not found.");
    if (offer.requester_id !== context.userId) return fail("Only the requester can accept or decline.");
    if (offer.status !== "pending") return fail("This offer is no longer pending.");
    const posts = await sql<{ id: string; title: string; status: string }>`
      select id, title, status from posts where id = ${offer.post_id} limit 1
    `;
    const post = posts[0];
    if (!post || post.status !== "open") return fail("This request is no longer open.");

    if (data.action === "decline") {
      await sql`update offers set status = 'declined' where id = ${offer.id} and requester_id = ${context.userId}`;
      await notify({
        userId: offer.helper_id,
        type: "offer_declined",
        title: "Offer declined",
        body: `${me.name} declined your offer on “${post.title}”.`,
        href: `/app/favor/${post.id}`,
      });
      return ok({ status: "declined" as const });
    }

    const accepted = await sql<{ id: string }>`
      update posts
      set status = 'accepted', helper_id = ${offer.helper_id}
      where id = ${post.id} and user_id = ${context.userId} and status = 'open'
      returning id
    `;
    if (!accepted[0]) return fail("Could not accept — the request may have changed.");
    await sql`update offers set status = 'accepted' where id = ${offer.id}`;
    await sql`update offers set status = 'declined' where post_id = ${post.id} and id <> ${offer.id} and status = 'pending'`;
    const convoId = await ensureConversation(post.id, offer.requester_id, offer.helper_id);
    await sql`
      insert into messages (id, conversation_id, sender_id, body)
      values (${nid("m")}, ${convoId}, ${offer.helper_id}, ${"Hi — I can help with this."})
    `;
    await notify({
      userId: offer.helper_id,
      type: "offer_accepted",
      title: "Offer accepted",
      body: `${me.name} accepted your help on “${post.title}”.`,
      href: `/app/chat/${convoId}`,
    });
    return ok({ status: "accepted" as const, conversationId: convoId });
  });

export const listInbox = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const memberships = await sql<{ conversation_id: string; last_read_at: string | null; archived: boolean }>`
      select conversation_id, last_read_at, archived
      from conversation_members
      where user_id = ${context.userId} and archived = false
    `;
    const out: ConversationRow[] = [];
    for (const m of memberships) {
      const conv = await sql<{ id: string; post_id: string | null }>`
        select id, post_id from conversations where id = ${m.conversation_id} limit 1
      `;
      if (!conv[0]) continue;
      const others = await sql<{ user_id: string }>`
        select user_id from conversation_members
        where conversation_id = ${m.conversation_id} and user_id <> ${context.userId}
      `;
      const other = others[0] ? await loadProfile(others[0].user_id) : null;
      const last = await sql<{ body: string; created_at: string }>`
        select body, created_at from messages
        where conversation_id = ${m.conversation_id}
        order by created_at desc limit 1
      `;
      const unread = await sql<{ n: number | string }>`
        select count(*)::int as n from messages
        where conversation_id = ${m.conversation_id}
          and sender_id <> ${context.userId}
          and (${m.last_read_at}::timestamptz is null or created_at > ${m.last_read_at})
      `;
      let postTitle: string | null = null;
      if (conv[0].post_id) {
        const p = await sql<{ title: string }>`select title from posts where id = ${conv[0].post_id} limit 1`;
        postTitle = p[0]?.title ?? null;
      }
      out.push({
        id: conv[0].id,
        postId: conv[0].post_id,
        postTitle,
        other: other ? toPublic(other) : null,
        lastMessage: last[0]?.body ?? null,
        lastAt: last[0] ? String(last[0].created_at) : null,
        unread: num(unread[0]?.n),
      });
    }
    out.sort((a, b) => +new Date(b.lastAt ?? 0) - +new Date(a.lastAt ?? 0));
    return ok(out);
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ conversationId: String((raw as { conversationId?: string })?.conversationId ?? "") }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const member = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
      limit 1
    `;
    if (!member[0]) return fail("Chat not found.");
    const conv = await sql<{ id: string; post_id: string | null }>`
      select id, post_id from conversations where id = ${data.conversationId} limit 1
    `;
    if (!conv[0]) return fail("Chat not found.");
    const others = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id <> ${context.userId}
    `;
    const other = others[0] ? await loadProfile(others[0].user_id) : null;
    const rows = await sql<{ id: string; conversation_id: string; sender_id: string; body: string; created_at: string }>`
      select id, conversation_id, sender_id, body, created_at
      from messages where conversation_id = ${data.conversationId}
      order by created_at asc
      limit 300
    `;
    await sql`
      update conversation_members
      set last_read_at = now()
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
    `;
    const messages: MessageRow[] = rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      senderId: r.sender_id,
      body: r.body,
      createdAt: String(r.created_at),
      mine: r.sender_id === context.userId,
    }));
    let post: { id: string; title: string; status: string; helperId: string | null; authorId: string } | null = null;
    if (conv[0].post_id) {
      const p = await sql<{ id: string; title: string; status: string; helper_id: string | null; user_id: string }>`
        select id, title, status, helper_id, user_id from posts where id = ${conv[0].post_id} limit 1
      `;
      if (p[0]) {
        post = {
          id: p[0].id,
          title: p[0].title,
          status: p[0].status,
          helperId: p[0].helper_id,
          authorId: p[0].user_id,
        };
      }
    }
    return ok({
      conversationId: data.conversationId,
      other: other ? toPublic(other) : null,
      post,
      messages,
    });
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return { conversationId: String(d.conversationId ?? ""), body: String(d.body ?? "").trim().slice(0, 2000) };
  })
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (!data.body) return fail("Write a message first.");
    const sql = await getSql();
    const member = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
      limit 1
    `;
    if (!member[0]) return fail("You are not in this conversation.");
    const others = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${data.conversationId} and user_id <> ${context.userId}
    `;
    if (others[0] && (await isBlockedPair(context.userId, others[0].user_id))) {
      return fail("You cannot message this neighbor.");
    }
    const id = nid("m");
    await sql`
      insert into messages (id, conversation_id, sender_id, body)
      values (${id}, ${data.conversationId}, ${context.userId}, ${data.body})
    `;
    if (others[0]) {
      await notify({
        userId: others[0].user_id,
        type: "new_message",
        title: `Message from ${me.name}`,
        body: data.body.slice(0, 80),
        href: `/app/chat/${data.conversationId}`,
      });
    }
    return ok({
      id,
      conversationId: data.conversationId,
      senderId: context.userId,
      body: data.body,
      createdAt: new Date().toISOString(),
      mine: true,
    } satisfies MessageRow);
  });

export const getChatForPost = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ postId: String((raw as { postId?: string })?.postId ?? "") }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const conv = await sql<{ id: string }>`select id from conversations where post_id = ${data.postId} limit 1`;
    if (!conv[0]) return fail("Chat unlocks after an offer is accepted.");
    const member = await sql<{ user_id: string }>`
      select user_id from conversation_members
      where conversation_id = ${conv[0].id} and user_id = ${context.userId} limit 1
    `;
    if (!member[0]) return fail("You are not part of this chat.");
    return ok({ conversationId: conv[0].id });
  });

export const startDirectChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ userId: String((raw as { userId?: string })?.userId ?? "") }))
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (!me.onboarding_complete) return fail("Finish onboarding first.");
    if (!data.userId || data.userId === context.userId) return fail("That's you.");
    if (await isBlockedPair(context.userId, data.userId)) return fail("You cannot message this neighbor.");
    const other = await loadProfile(data.userId);
    if (!other || !other.onboarding_complete) return fail("Profile not found.");
    const sql = await getSql();
    const existing = await sql<{ id: string }>`
      select c.id
      from conversations c
      join conversation_members a on a.conversation_id = c.id and a.user_id = ${context.userId}
      join conversation_members b on b.conversation_id = c.id and b.user_id = ${data.userId}
      order by c.created_at desc
      limit 1
    `;
    if (existing[0]) return ok({ conversationId: existing[0].id });
    const id = nid("c");
    await sql`insert into conversations (id, post_id) values (${id}, null)`;
    await sql`
      insert into conversation_members (conversation_id, user_id)
      values (${id}, ${context.userId})
    `;
    await sql`
      insert into conversation_members (conversation_id, user_id)
      values (${id}, ${data.userId})
    `;
    return ok({ conversationId: id });
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    const tags = Array.isArray(d.tags) ? d.tags.map(String).filter((t) => REVIEW_TAGS.includes(t as (typeof REVIEW_TAGS)[number])) : [];
    return {
      favorId: String(d.favorId ?? ""),
      toUserId: String(d.toUserId ?? ""),
      stars: Math.min(5, Math.max(1, Math.round(num(d.stars, 5)))),
      tags,
      body: String(d.body ?? "").trim().slice(0, 600),
    };
  })
  .handler(async ({ context, data }) => {
    const me = await ensureProfile(context.userId);
    if (data.toUserId === context.userId) return fail("You cannot rate yourself.");
    const sql = await getSql();
    const posts = await sql<{
      id: string;
      user_id: string;
      helper_id: string | null;
      status: string;
      title: string;
    }>`select id, user_id, helper_id, status, title from posts where id = ${data.favorId} limit 1`;
    const post = posts[0];
    if (!post || post.status !== "completed") return fail("Rate only after a completed favor.");
    const involved = post.user_id === context.userId || post.helper_id === context.userId;
    if (!involved) return fail("Only the two people in this favor can rate.");
    const counterpart = post.user_id === context.userId ? post.helper_id : post.user_id;
    if (counterpart !== data.toUserId) return fail("You can only rate the other person in this favor.");
    const dup = await sql<{ id: string }>`
      select id from reviews where favor_id = ${post.id} and from_user_id = ${context.userId} limit 1
    `;
    if (dup[0]) return fail("You already rated this favor.");
    const id = nid("r");
    try {
      await sql`
        insert into reviews (id, favor_id, from_user_id, to_user_id, stars, tags, body)
        values (${id}, ${post.id}, ${context.userId}, ${data.toUserId}, ${data.stars}, ${JSON.stringify(data.tags)}, ${data.body})
      `;
    } catch {
      return fail("You already rated this favor.");
    }
    const delta = (data.stars - 3) * 0.6 + data.tags.length * 0.15;
    await sql`
      update profiles
      set reputation = greatest(50, least(99, round((reputation + ${delta})::numeric, 1))),
          updated_at = now()
      where user_id = ${data.toUserId}
    `;
    await notify({
      userId: data.toUserId,
      type: "rating_received",
      title: "New rating",
      body: `${me.name} rated you ${data.stars}★ for “${post.title}”.`,
      href: `/app/profile/${data.toUserId}`,
    });
    return ok({ id });
  });

export const reportContent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return {
      reportedUserId: typeof d.reportedUserId === "string" ? d.reportedUserId : null,
      postId: typeof d.postId === "string" ? d.postId : null,
      reason: String(d.reason ?? "").trim().slice(0, 400),
    };
  })
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    if (!data.reason) return fail("Please say why you are reporting.");
    if (!data.reportedUserId && !data.postId) return fail("Nothing to report.");
    if (data.reportedUserId === context.userId) return fail("You cannot report yourself.");
    const sql = await getSql();
    await sql`
      insert into reports (id, reporter_id, reported_user_id, post_id, reason, status)
      values (${nid("rp")}, ${context.userId}, ${data.reportedUserId}, ${data.postId}, ${data.reason}, 'open')
    `;
    await notify({
      userId: context.userId,
      type: "report",
      title: "Report received",
      body: "Thanks. Our team will review this.",
      href: "/app/safety",
    });
    return ok(true);
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => {
    const d = (raw ?? {}) as Record<string, unknown>;
    return { userId: String(d.userId ?? ""), blocked: d.blocked !== false };
  })
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    if (!data.userId || data.userId === context.userId) return fail("Invalid neighbor.");
    const sql = await getSql();
    if (data.blocked) {
      await sql`
        insert into blocks (blocker_id, blocked_id)
        values (${context.userId}, ${data.userId})
        on conflict do nothing
      `;
      await sql`
        update offers set status = 'declined'
        where status = 'pending'
          and ((helper_id = ${context.userId} and requester_id = ${data.userId})
            or (helper_id = ${data.userId} and requester_id = ${context.userId}))
      `;
    } else {
      await sql`delete from blocks where blocker_id = ${context.userId} and blocked_id = ${data.userId}`;
    }
    return ok({ blocked: data.blocked });
  });

export const listBlocks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{ blocked_id: string }>`
      select blocked_id from blocks where blocker_id = ${context.userId} order by created_at desc
    `;
    const profiles = await rowsIn<ProfileRow>(
      `select * from profiles where user_id`,
      rows.map((r) => r.blocked_id),
    );
    return ok(profiles.map(toPublic));
  });

export const archiveConversation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((raw: unknown) => ({ conversationId: String((raw as { conversationId?: string })?.conversationId ?? "") }))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId);
    const sql = await getSql();
    await sql`
      update conversation_members
      set archived = true
      where conversation_id = ${data.conversationId} and user_id = ${context.userId}
    `;
    return ok(true);
  });
