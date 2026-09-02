import { createFileRoute, Link } from "@tanstack/react-router";
import { IconLoop, IconShield } from "@/components/icons";

export const Route = createFileRoute("/")({ component: Landing });

const ONEGAI_ARTWORK = "data:image/webp;base64,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";

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
              src={ONEGAI_ARTWORK}
              alt="Onegai — Small favors. Real connections."
              style={{
                display: "block",
                width: "100%",
                maxWidth: 520,
                maxHeight: 620,
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
