import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Search, User } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <main className="onegai">
      <div className="onegai-inner">
        <header className="onegai-brand">
          <img className="onegai-mark" src="/onegai-mark.png" alt="" width={220} height={132} />
          <h1 className="onegai-word">Onegai</h1>
          <p className="onegai-tag">Small favors. Real connections.</p>
        </header>

        <div className="onegai-grid">
          <div className="onegai-copy">
            <h2 className="onegai-headline">
              Small favors.
              <br />
              Real connections.
            </h2>
            <p className="onegai-lede">
              Ask for help, help someone nearby,
              <br />
              and build trust in your community.
            </p>
            <div className="onegai-pills">
              <Link className="onegai-pill ask" to="/app/post">
                <Search size={16} strokeWidth={2.4} />
                Ask for help
              </Link>
              <Link className="onegai-pill help" to="/app/discover">
                <User size={16} strokeWidth={2.4} />
                Help someone nearby
              </Link>
              <Link className="onegai-pill trust" to="/app">
                <Heart size={16} strokeWidth={2.4} />
                Build trust
              </Link>
            </div>
          </div>
          <div className="onegai-art">
            <img src="/onegai-scene.png" alt="" width={510} height={570} />
          </div>
        </div>
      </div>
    </main>
  );
}
