import { useMemo, useState } from "react";
import { AREAS } from "@/lib/constants";
import { requestGps } from "@/lib/location";
import { ApproxMap } from "./approx-map";

export type PlaceValue = {
  lat: number;
  lng: number;
  area: string;
  city: string;
};

export function PlacePicker({
  value,
  onChange,
  dest,
  onDest,
  needPlace,
  needDest,
  optional,
}: {
  value: PlaceValue | null;
  onChange: (v: PlaceValue) => void;
  dest?: string;
  onDest?: (area: string) => void;
  needPlace: boolean;
  needDest?: boolean;
  optional?: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "search" | "pin">("idle");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return AREAS.filter((a) => a.name !== "Nearby");
    return AREAS.filter((a) => `${a.name} ${a.city}`.toLowerCase().includes(s));
  }, [q]);

  const gps = async () => {
    setBusy(true);
    setErr(null);
    const res = await requestGps();
    setBusy(false);
    if ("error" in res) setErr(res.error);
    else {
      onChange(res);
      setMode("idle");
    }
  };

  if (!needPlace && !optional) {
    return <p className="tiny">No physical location needed for this kind of help.</p>;
  }

  return (
    <div className="place-picker">
      {optional && !needPlace ? (
        <p className="tiny">Optional. Add an area if meeting in person is also fine — or skip it.</p>
      ) : null}
      <div className="filters">
        <button type="button" className="chip" onClick={() => void gps()} disabled={busy}>
          {busy ? "Finding you…" : "Use my current location"}
        </button>
        <button type="button" className={`chip ${mode === "search" ? "on" : ""}`} onClick={() => setMode(mode === "search" ? "idle" : "search")}>
          Search for a place
        </button>
        <button type="button" className={`chip ${mode === "pin" ? "on" : ""}`} onClick={() => setMode(mode === "pin" ? "idle" : "pin")}>
          Drop a pin
        </button>
      </div>
      {err ? <p className="tiny">{err}</p> : null}
      {value ? (
        <p className="tiny">
          Approximate area: {value.area}, {value.city}. Exact address stays private.
        </p>
      ) : (
        <p className="tiny">Choose an area. Helpers see this neighborhood, not your door.</p>
      )}
      {mode === "search" || mode === "idle" ? (
        <div className="filters">
          {mode === "search" ? (
            <input className="input" placeholder="Marina, Al Barsha…" value={q} onChange={(e) => setQ(e.target.value)} />
          ) : null}
          {hits.slice(0, 8).map((a) => (
            <button
              key={a.name}
              type="button"
              className={`chip ${value?.area === a.name ? "on" : ""}`}
              onClick={() => {
                onChange({ lat: a.lat, lng: a.lng, area: a.name, city: a.city });
                setMode("idle");
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      ) : null}
      {mode === "pin" ? (
        <ApproxMap
          center={value ?? { lat: 25.2048, lng: 55.2708 }}
          marks={value ? [{ id: "pin", lat: value.lat, lng: value.lng }] : []}
          pick
          onPick={(lat, lng) => {
            const nearest = AREAS.reduce((b, x) => {
              const d = (x.lat - lat) ** 2 + (x.lng - lng) ** 2;
              const bd = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
              return d < bd ? x : b;
            }, AREAS[0]);
            onChange({ lat, lng, area: nearest.name, city: nearest.city });
          }}
        />
      ) : null}
      {needDest && onDest ? (
        <div className="field" style={{ marginTop: 12 }}>
          <label>Drop-off area</label>
          <div className="filters">
            {AREAS.filter((a) => a.name !== "Nearby").map((a) => (
              <button key={a.name} type="button" className={`chip ${dest === a.name ? "on" : ""}`} onClick={() => onDest(a.name)}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
