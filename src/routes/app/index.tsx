import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FavorCard } from "@/components/favor-card";
import { APP_NAME } from "@/lib/constants";
import { relativeTime } from "@/lib/format";
import { getHome } from "@/lib/loop";
import { useApi } from "@/lib/use-api";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useApi(() => getHome(), []);
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
  const { me, recommended, skillMatches, notifications, openMine, helping, impact, circles } = data;
  return (
    <div>
      <p className="kicker">
        {APP_NAME} · {me.area || me.city || "Nearby"}
      </p>
      <section className="ask-hero">
        <h1 className="h1">What do you need a hand with?</h1>
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
          <h2 className="h2">Requests near you</h2>
          <p className="tiny">Matched by distance, skills, and reliability</p>
        </div>
        <Link className="tiny" to="/app/discover">
          See all
        </Link>
      </div>
      {recommended.length === 0 && (
        <div className="card empty">
          <p>Quiet nearby. Ask for help, or check your Circles.</p>
        </div>
      )}
      {recommended.map((f) => (
        <FavorCard key={f.id} favor={f} cta="I can help" />
      ))}

      {skillMatches.length > 0 && (
        <>
          <div className="pulse">
            <div>
              <h2 className="h2">People who need your skills</h2>
              <p className="tiny">{me.skills.slice(0, 3).join(" · ") || "Add skills to match better"}</p>
            </div>
            <Link className="tiny" to="/app/help">
              Update
            </Link>
          </div>
          {skillMatches.map((f) => (
            <FavorCard key={`s-${f.id}`} favor={f} cta="I can help" />
          ))}
        </>
      )}

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
        {circles.filter((c) => c.joined).length === 0 && <p className="tiny">Join a Circle to ask people you already trust first.</p>}
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
        {notifications.length === 0 && <p className="empty">Quiet for now.</p>}
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
