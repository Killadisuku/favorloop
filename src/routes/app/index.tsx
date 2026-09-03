import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FavorCard } from "@/components/favor-card";
import { ApproxMap } from "@/components/approx-map";
import { AREAS } from "@/lib/constants";
import { APP_NAME } from "@/lib/constants";
import { formatDistance, relativeTime } from "@/lib/format";
import { requestGps } from "@/lib/location";
import { getHome, setMyLocation } from "@/lib/loop";
import { useApi } from "@/lib/use-api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi(() => getHome(), []);
  const [view, setView] = useState<"list" | "map">("list");
  const [locBusy, setLocBusy] = useState(false);
  const [chooseArea, setChooseArea] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const marks = useMemo(
    () =>
      (data?.recommended ?? [])
        .filter((f) => f.approxLat != null && f.approxLng != null)
        .map((f) => ({ id: f.id, lat: f.approxLat!, lng: f.approxLng!, title: f.title })),
    [data?.recommended],
  );

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 36, width: "60%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 140, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 90 }} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="card empty">
        <p>{error === "signin" ? "Please sign in again." : error || "Could not load home."}</p>
        <button className="btn btn-primary" onClick={() => void reload()}>
          Retry
        </button>
      </div>
    );
  }
  const { me, recommended, skillMatches, notifications, openMine, helping, impact, circles, needsLocation } = data;
  const center = me.lat != null && me.lng != null ? { lat: me.lat, lng: me.lng } : { lat: 25.2048, lng: 55.2708 };
  const preview = recommended.find((f) => f.id === previewId) ?? null;

  const useGps = async () => {
    setLocBusy(true);
    const res = await requestGps();
    setLocBusy(false);
    if ("error" in res) {
      toast.error(res.error);
      setChooseArea(true);
    } else {
      await setMyLocation({ data: { ...res, source: "gps" } });
      toast.success(`Showing favors near ${res.area}.`);
      await reload();
    }
  };

  const pickArea = async (name: string) => {
    const a = AREAS.find((x) => x.name === name);
    if (!a) return;
    await setMyLocation({ data: { lat: a.lat, lng: a.lng, area: a.name, city: a.city, source: "manual" } });
    toast.success(`Showing favors near ${a.name}.`);
    setChooseArea(false);
    await reload();
  };

  return (
    <div>
      <p className="kicker">
        {APP_NAME} · {me.area || me.city || "Nearby"}
      </p>
      <section className="ask-hero">
        <h1 className="h1">Need a hand?</h1>
        <p className="tiny">Ask a neighbor, or offer the help you already have.</p>
        <div className="ask-actions">
          <Link className="btn btn-primary" to="/app/post">
            Ask for help
          </Link>
          <Link className="btn btn-ghost" to="/app/help">
            I can help
          </Link>
        </div>
      </section>

      {(needsLocation || chooseArea) && (
        <section className="card loc-prompt">
          <b>Want to see favors near you?</b>
          <p className="tiny">Onegai uses an approximate area — never your exact door. You can skip GPS and pick a neighborhood.</p>
          <div className="ask-actions">
            <button className="btn btn-primary" disabled={locBusy} onClick={() => void useGps()}>
              {locBusy ? "Finding you…" : "Use my location"}
            </button>
            <button className="btn btn-ghost" onClick={() => setChooseArea(true)}>
              Choose area instead
            </button>
          </div>
          <div className="filters" style={{ marginTop: 10 }}>
            {AREAS.filter((a) => a.name !== "Nearby").map((a) => (
              <button key={a.name} type="button" className="chip" onClick={() => void pickArea(a.name)}>
                {a.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {openMine.length > 0 && (
        <>
          <div className="pulse">
            <h2 className="h2">Your requests</h2>
          </div>
          {openMine.map((f) => (
            <FavorCard key={f.id} favor={f} />
          ))}
        </>
      )}
      {helping.length > 0 && (
        <>
          <div className="pulse">
            <h2 className="h2">You're helping</h2>
          </div>
          {helping.map((f) => (
            <FavorCard key={f.id} favor={f} />
          ))}
        </>
      )}

      <div className="pulse">
        <div>
          <h2 className="h2">Requests that match you</h2>
          <p className="tiny">Skills, distance, reliability, Circles, and when you’re free</p>
        </div>
        <Link className="tiny" to="/app/help">
          Update
        </Link>
      </div>
      {skillMatches.length === 0 && (
        <div className="card empty">
          <p>Nothing matches your skills right now.</p>
          <p className="tiny">{me.skills.slice(0, 3).join(" · ") || "Add skills in I can help"} · or be the first person to ask for a hand.</p>
        </div>
      )}
      {skillMatches.map((f) => (
        <FavorCard key={`s-${f.id}`} favor={f} cta="I can help" />
      ))}

      <div className="pulse">
        <div>
          <h2 className="h2">People nearby who need help</h2>
          <p className="tiny">Matched by skill, distance, reliability, and Circles</p>
        </div>
        <div className="view-toggle">
          <button type="button" className={view === "list" ? "on" : ""} onClick={() => setView("list")}>
            List
          </button>
          <button type="button" className={view === "map" ? "on" : ""} onClick={() => setView("map")}>
            Map
          </button>
        </div>
      </div>

      {view === "map" ? (
        <>
          <ApproxMap
            center={center}
            marks={marks}
            onOpen={(id) => setPreviewId(id)}
          />
          {preview ? (
            <div className="card amap-preview">
              <b>{preview.title}</b>
              <p className="tiny">
                {formatDistance(preview.distanceKm, preview.presence)} · {preview.whenNeeded}
              </p>
              <div className="ask-actions">
                <button className="btn btn-primary" onClick={() => nav({ to: "/app/favor/$id", params: { id: preview.id } })}>
                  View favor
                </button>
                <button className="btn btn-ghost" onClick={() => setPreviewId(null)}>
                  Close
                </button>
              </div>
            </div>
          ) : (
            <p className="tiny" style={{ marginBottom: 16 }}>
              Tap a marker for a preview. Locations are approximate.
            </p>
          )}
        </>
      ) : null}

      {view === "list" && recommended.length === 0 && (
        <div className="card empty">
          <p>No favors nearby yet.</p>
          <p className="tiny">Be the first person to ask for a hand, or check your Circles.</p>
        </div>
      )}
      {view === "list" &&
        recommended.map((f) => (
          <FavorCard key={f.id} favor={f} cta="I can help" />
        ))}

      <div className="pulse">
        <h2 className="h2">Your {APP_NAME}</h2>
        <Link className="tiny" to="/app/profile">
          Trust
        </Link>
      </div>
      <div className="impact-grid">
        <div className="stat">
          <b>{impact.favorsCompleted}</b>
          <span>Favors completed</span>
        </div>
        <div className="stat">
          <b>{impact.peopleHelped}</b>
          <span>People helped</span>
        </div>
        <div className="stat">
          <b>{impact.hoursGiven}h</b>
          <span>Time given</span>
        </div>
        <div className="stat">
          <b>{impact.peopleHelpedYou}</b>
          <span>People who helped you</span>
        </div>
      </div>

      <div className="pulse">
        <h2 className="h2">Your Circles</h2>
        <Link className="tiny" to="/app/circles">
          Manage
        </Link>
      </div>
      <div className="card">
        {circles.filter((c) => c.joined).length === 0 && <p className="tiny">Join a Circle to ask people you already trust first. Empty Circles wait for the first ask.</p>}
        {circles
          .filter((c) => c.joined)
          .map((c) => (
            <Link key={c.id} className="tx" to="/app/circles">
              <div>
                <b>{c.name}</b>
                <div className="tiny">
                  {c.kind} · {c.memberCount} members
                </div>
              </div>
            </Link>
          ))}
      </div>

      <div className="pulse">
        <h2 className="h2">Activity</h2>
        <Link className="tiny" to="/app/activity">
          All
        </Link>
      </div>
      <div className="card activity">
        {notifications.length === 0 && <p className="empty">No notifications yet. Help someone nearby and this fills in.</p>}
        {notifications.map((n) => (
          <article
            key={n.id}
            style={{ padding: "10px 0", cursor: n.href ? "pointer" : "default" }}
            onClick={() => {
              if (n.href) nav({ to: n.href as "/app" });
            }}
          >
            <i className={`dot ${n.read ? "read" : ""}`} />
            <div>
              <b>{n.title}</b>
              <p className="tiny">
                {n.body} · {relativeTime(n.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
