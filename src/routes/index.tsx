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
            Small favors. Real connections.
          </p>
          <h1 className="display">Small favors. Real connections.</h1>
          <p className="sub">Ask for help, help someone nearby, and build trust in your community.</p>
          <div className="loop-line">
            <span>Ask for help</span>
            <span>Help someone nearby</span>
            <span>Build trust</span>
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
            ["1", "Ask", "Post a small request and let someone nearby help."],
            ["2", "Help", "Offer your time to someone who needs a hand."],
            ["3", "Connect", "Meet people nearby through meaningful favors."],
            ["4", "Build trust", "Good experiences build your community reputation."],
            ["5", "Keep it going", "Give a little. Get a little. Repeat."],
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
            Ratings only happen after a completed favor. Profiles show what neighbors actually experienced.
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
