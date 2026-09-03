import { Link } from "@tanstack/react-router";
import { formatDistance, formatDuration, formatWalk } from "@/lib/format";
import { presenceLabel } from "@/lib/constants";
import type { PostCard } from "@/lib/types";
import { Avatar } from "./avatar";

export function FavorCard({ favor, cta }: { favor: PostCard; cta?: string }) {
  const walk = formatWalk(favor.distanceKm);
  return (
    <Link to="/app/favor/$id" params={{ id: favor.id }} className="card req-card">
      <div className="favor-top">
        <Avatar user={favor.author} />
        <div className="who">
          <b>
            {favor.author.name}
            {favor.author.verified ? " ✓" : ""}
          </b>
          <span>✓ {favor.author.reputation}% reliable</span>
        </div>
        <span className={`chip htype-${favor.helpType}`}>{favor.lifecycle}</span>
      </div>
      <p className="title-line">{favor.title}</p>
      <div className="meta">
        <span>{formatDistance(favor.distanceKm, favor.presence)}</span>
        {walk ? <span>{walk}</span> : null}
        <span>{favor.whenNeeded}</span>
        <span>{formatDuration(favor.estimatedTime)}</span>
        <span>{favor.category}</span>
        <span>{presenceLabel(favor.presence)}</span>
        {favor.presence === "pickup" && favor.destArea ? (
          <span>
            {favor.area} → {favor.destArea}
          </span>
        ) : null}
      </div>
      {cta ? <span className="tiny req-cta">{cta}</span> : null}
    </Link>
  );
}
