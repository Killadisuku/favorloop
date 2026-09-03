import { useMemo, useRef, type MouseEvent } from "react";
import { AREAS } from "@/lib/constants";

export type MapMark = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  count?: number;
};

function lngX(lng: number, z: number) {
  return ((lng + 180) / 360) * 2 ** z;
}
function latY(lat: number, z: number) {
  const s = Math.sin((lat * Math.PI) / 180);
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 2 ** z;
}

function cluster(marks: MapMark[]) {
  const buckets = new Map<string, MapMark & { ids: string[] }>();
  for (const m of marks) {
    const key = `${m.lat.toFixed(2)}:${m.lng.toFixed(2)}`;
    const cur = buckets.get(key);
    if (!cur) buckets.set(key, { ...m, count: m.count ?? 1, ids: [m.id] });
    else {
      cur.count = (cur.count ?? 1) + (m.count ?? 1);
      cur.ids.push(m.id);
    }
  }
  return [...buckets.values()];
}

export function ApproxMap({
  marks,
  center,
  pick,
  onPick,
  onOpen,
}: {
  marks: MapMark[];
  center: { lat: number; lng: number };
  pick?: boolean;
  onPick?: (lat: number, lng: number) => void;
  onOpen?: (id: string) => void;
}) {
  const z = 12;
  const box = useRef<HTMLDivElement>(null);
  const grouped = useMemo(() => cluster(marks), [marks]);
  const cx = lngX(center.lng, z);
  const cy = latY(center.lat, z);
  const tileX = Math.floor(cx) - 1;
  const tileY = Math.floor(cy) - 1;
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) tiles.push({ x: tileX + x, y: tileY + y });
  const size = 256;

  const toPx = (lat: number, lng: number) => {
    const x = (lngX(lng, z) - tileX) * size;
    const y = (latY(lat, z) - tileY) * size;
    return { x, y };
  };

  const labels = useMemo(
    () =>
      AREAS.filter((a) => a.name !== "Nearby").map((a) => ({
        name: a.name,
        ...toPx(a.lat, a.lng),
      })),
    [tileX, tileY, z],
  );

  const click = (e: MouseEvent<HTMLDivElement>) => {
    if (!pick || !onPick || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * (size * 3);
    const py = ((e.clientY - r.top) / r.height) * (size * 3);
    const tx = tileX + px / size;
    const ty = tileY + py / size;
    const n = 2 ** z;
    const lng = (tx / n) * 360 - 180;
    const rad = Math.PI - (2 * Math.PI * ty) / n;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(rad) - Math.exp(-rad)));
    onPick(Math.round(lat * 10000) / 10000, Math.round(lng * 10000) / 10000);
  };

  return (
    <div className="amap">
      <div className="amap-stage" ref={box} onClick={click} role={pick ? "button" : undefined}>
        <div className="amap-tiles" style={{ width: size * 3, height: size * 3 }}>
          {tiles.map((t) => (
            <img
              key={`${t.x}-${t.y}`}
              alt=""
              width={size}
              height={size}
              draggable={false}
              src={`https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${t.x}/${t.y}.png`}
            />
          ))}
          {labels.map((a) => (
            <span key={a.name} className="amap-label" style={{ left: a.x, top: a.y }}>
              {a.name}
            </span>
          ))}
          {grouped.map((m) => {
            const p = toPx(m.lat, m.lng);
            return (
              <button
                key={m.id}
                type="button"
                className="amap-dot"
                style={{ left: p.x, top: p.y }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen?.(m.ids?.[0] ?? m.id);
                }}
              >
                {m.count && m.count > 1 ? m.count : ""}
              </button>
            );
          })}
        </div>
      </div>
      <p className="amap-note">Approximate areas only. Map data © OpenStreetMap, © CARTO</p>
    </div>
  );
}
