import { Link } from "@tanstack/react-router";
import { formatDistance, relativeTime } from "@/lib/format";
import type { PostCard } from "@/lib/types";
import { Avatar } from "./avatar";

export function FavorCard({ favor, cta }: { favor: PostCard; cta?: string }) {
  const boosted = favor.boostedUntil && new Date(favor.boostedUntil) > new Date();
  return (
    <Link to="/app/favor/$id" params={{ id: favor.id }} className="card" style={{ display: "block" }}>
      <div className="favor-top">
        <Avatar user={favor.author} />
        <div className="who">
          <b>
            {favor.author.name}
            {favor.author.verified ? " ✓" : ""}
          </b>
          <span>
            {favor.author.area || favor.author.city} · {favor.author.reputation}% trust
          </span>
        </div>
        <span className={`chip ${boosted ? "gold" : ""}`}>{favor.creditReward} credits</span>
      </div>
      <p className="title-line">{favor.title}</p>
      <div className="meta">
        <span>{favor.category}</span>
        <span>{formatDistance(favor.distanceKm)}</span>
        <span>{favor.estimatedTime}</span>
        <span>{relativeTime(favor.createdAt)}</span>
      </div>
      {cta ? <span className="tiny">{cta}</span> : null}
    </Link>
  );
}
