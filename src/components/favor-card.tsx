import { Link } from "@tanstack/react-router";
import { formatDistance, relativeTime } from "@/lib/format";
import { helpTypeLabel } from "@/lib/constants";
import type { PostCard } from "@/lib/types";
import { Avatar } from "./avatar";

export function FavorCard({ favor, cta }: { favor: PostCard; cta?: string }) {
  return (
    <Link to="/app/favor/$id" params={{ id: favor.id }} className="card req-card">
      <div className="favor-top">
        <Avatar user={favor.author} />
        <div className="who">
          <b>
            {favor.author.name}
            {favor.author.verified ? " ✓" : ""}
          </b>
          <span>
            {formatDistance(favor.distanceKm)} · {favor.author.reputation}% reliable
          </span>
        </div>
        <span className={`chip htype-${favor.helpType}`}>{helpTypeLabel(favor.helpType)}</span>
      </div>
      <p className="title-line">{favor.title}</p>
      <div className="meta">
        <span>{favor.category}</span>
        <span>{favor.whenNeeded}</span>
        <span>{favor.estimatedTime}</span>
        {favor.circleName ? <span>{favor.circleName}</span> : null}
        <span>{favor.lifecycle}</span>
        <span>{relativeTime(favor.createdAt)}</span>
      </div>
      {cta ? <span className="tiny req-cta">{cta}</span> : null}
    </Link>
  );
}
