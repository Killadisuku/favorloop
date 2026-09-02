import { ChevronLeft } from "lucide-react";

export function Back({ to = "/app", label }: { to?: string; label?: string }) {
  return (
    <div className="topbar">
      <a href={to} className="icon-btn" aria-label="Back">
        <ChevronLeft size={20} />
      </a>
      {label ? <h1 className="h2">{label}</h1> : null}
    </div>
  );
}
