import { createFileRoute, Link } from "@tanstack/react-router";
import { IconShield } from "@/components/icons";
import { APP_NAME } from "@/lib/constants";

export const Route = createFileRoute("/")({ component: Landing });

const STEPS = [
  {
    n: "01",
    title: "Ask",
    body: "Post a small request when you need a hand.",
  },
  {
    n: "02",
    title: "Help",
    body: "Offer your time or skills to someone who needs help.",
  },
  {
    n: "03",
    title: "Connect",
    body: "Meet people through genuine acts of help.",
  },
  {
    n: "04",
    title: "Build trust",
    body: "Good experiences create stronger community connections.",
  },
] as const;

function Landing() {
  return (
    <main className="home">
      <header className="home-nav">
        <Link to="/" className="home-brand" aria-label={APP_NAME}>
          <img src="/onegai-mark.png" alt="" width={72} height={22} />
          <span>{APP_NAME}</span>
        </Link>
        <Link to="/app" className="home-btn home-btn-primary">
          Open {APP_NAME}
        </Link>
      </header>

      <section className="home-hero" aria-label="Onegai artwork">
        <figure className="home-art">
          <img
            src="/onegai-artwork.png"
            alt="Onegai: Small favors. Real connections. Ask for help, help someone nearby, and build trust in your community."
            width={1500}
            height={1000}
          />
        </figure>
        <div className="home-hero-cta">
          <Link to="/app" className="home-btn home-btn-primary">
            Get started
          </Link>
          <a href="#how" className="home-btn home-btn-ghost">
            How it works
          </a>
        </div>
      </section>

      <section className="home-block" id="how">
        <p className="home-kicker">How {APP_NAME} works</p>
        <h2 className="home-title">Ask. Help. Connect. Repeat.</h2>
        <ol className="home-steps">
          {STEPS.map((s) => (
            <li className="home-step" key={s.n}>
              <span className="home-step-n">{s.n}</span>
              <strong>{s.title}</strong>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-block">
        <div className="home-trust">
          <IconShield size={22} />
          <h2 className="home-title">Trust is built through real experiences.</h2>
          <p>
            Ratings and reputation should come from completed favors and genuine interactions—not self-awarded
            claims.
          </p>
        </div>
      </section>

      <section className="home-block home-final">
        <h2 className="home-title">Small favors can make a big difference.</h2>
        <p>Give a little. Get a little. Build something better together.</p>
        <Link to="/app" className="home-btn home-btn-primary">
          Join {APP_NAME}
        </Link>
      </section>
    </main>
  );
}
