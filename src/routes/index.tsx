import { createFileRoute, Link } from "@tanstack/react-router";
import { IconLoop, IconShield } from "@/components/icons";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-inner">
          <div className="landing-nav">
            <div className="brand" style={{ padding: 0 }}>
              <div className="brand-mark">
                <IconLoop size={18} />
              </div>
              <div className="brand-name">Onegai</div>
            </div>
            <div className="row" style={{ flex: "0 0 auto", gap: 8 }}>
              <Link className="btn btn-primary" to="/app">
                Open app
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 28, marginBottom: 28 }}>
            <img
              src="/og.jpg"
              alt="Onegai"
              style={{
                display: "block",
                width: "100%",
                maxWidth: 760,
                maxHeight: 420,
                objectFit: "cover",
                margin: "0 auto",
                borderRadius: 24,
              }}
            />
          </div>

          <p className="kicker" style={{ marginTop: 24 }}>
            A real-world favor economy
          </p>
          <h1 className="display">Your time is currency.</h1>
          <p className="sub">Help people around you. Earn Favor Credits. Spend them when you need help.</p>
          <div className="loop-line">
            <span>Help someone</span>
            <span>Earn favors</span>
            <span>Get help</span>
          </div>
          <div className="row" style={{ maxWidth: 420, marginTop: 20 }}>
            <Link className="btn btn-primary" to="/app">
              Open app
            </Link>
            <a className="btn btn-ghost" href="#how">
              See how it works
            </a>
          </div>
        </div>
      </header>

      <section className="section" id="how">
        <p className="kicker">How Onegai works</p>
        <h2 className="h1" style={{ fontSize: 32, marginBottom: 18 }}>
          Ask. Help. Earn. Spend. Repeat.
        </h2>
        <div className="steps">
          {[
            ["1", "Ask", "Post a small request with a Favor reward."],
            ["2", "Help", "Someone nearby offers. You accept."],
            ["3", "Earn", "When you confirm, credits move to the helper."],
            ["4", "Spend", "Use credits when you need a hand."],
            ["5", "Trust", "Both of you rate. Reputation grows."],
          ].map(([n, t, d]) => (
            <div className="step" key={n}>
              <b>{n}</b>
              <strong>{t}</strong>
              <p className="tiny">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card">
          <IconShield />
          <h2 className="h2" style={{ margin: "10px 0" }}>
            Trust is earned, never self-awarded.
          </h2>
          <p className="muted">
            Ratings only happen after a completed favor. Credits move on the server. Profiles show what neighbors
            actually experienced.
          </p>
        </div>
      </section>

      <section className="section" style={{ textAlign: "center" }}>
        <h2 className="display" style={{ fontSize: 48 }}>
          Give a little. Get a little.
        </h2>
        <Link className="btn btn-primary" to="/app">
          Join Onegai
        </Link>
      </section>
    </div>
  );
}
