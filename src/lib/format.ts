export function relativeTime(iso: string) {
  const t = +new Date(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatDistance(km: number | null, presence?: string) {
  if (presence === "online") return "Online";
  if (km == null) return "Near your selected area";
  if (km < 0.2) return "Right here";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function formatWalk(km: number | null) {
  if (km == null || km < 0.25 || km > 4) return null;
  const mins = Math.max(5, Math.round((km / 5) * 60 / 5) * 5);
  return `About ${mins} min away`;
}

export function formatDuration(est: string) {
  if (est.startsWith("5")) return "About 10 minutes";
  if (est.startsWith("15")) return "About 20 minutes";
  if (est.startsWith("30")) return "About 45 minutes";
  if (est.startsWith("1")) return "About 90 minutes";
  return est;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    const max = 360;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process photo.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function isUnauthorized(err: unknown) {
  return err instanceof Error && err.message === "Unauthorized";
}
