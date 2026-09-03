import { nearestArea } from "@/lib/constants";

export type LocPermission = "granted" | "denied" | "prompt" | "unsupported" | "unknown";

export type GpsFix = {
  lat: number;
  lng: number;
  area: string;
  city: string;
  accuracyM: number | null;
  at: number;
};

export type GpsResult = GpsFix | { error: string; permission: LocPermission };

export function isGpsFix(value: GpsResult): value is GpsFix {
  return !("error" in value);
}

export function permissionLabel(state: LocPermission): string {
  switch (state) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked";
    case "prompt":
      return "Ask first";
    case "unsupported":
      return "Not available";
    default:
      return "Not checked";
  }
}

export function formatAccuracy(meters: number | null): string {
  if (meters == null) return "Approximate";
  if (meters < 50) return `~${meters} m · street-level`;
  if (meters < 250) return `~${meters} m · a few streets`;
  if (meters < 1000) return `~${Math.round(meters / 10) * 10} m · neighborhood`;
  return `~${Math.round(meters / 100) / 10} km · city-level`;
}

export async function queryLocationPermission(): Promise<LocPermission> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return "unsupported";
  if (typeof window !== "undefined" && !window.isSecureContext) return "unsupported";
  try {
    if (!navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted" || status.state === "denied" || status.state === "prompt") {
      return status.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function watchLocationPermission(onChange: (state: LocPermission) => void): () => void {
  let cancelled = false;
  let perm: PermissionStatus | null = null;
  const onPerm = () => {
    const next = perm?.state;
    if (next === "granted" || next === "denied" || next === "prompt") onChange(next);
  };
  void (async () => {
    const current = await queryLocationPermission();
    if (!cancelled) onChange(current);
    try {
      if (!navigator.permissions?.query) return;
      perm = await navigator.permissions.query({ name: "geolocation" });
      if (cancelled) return;
      perm.addEventListener("change", onPerm);
    } catch {
      /* Safari and some WebViews omit the Permissions API. */
    }
  })();
  return () => {
    cancelled = true;
    perm?.removeEventListener("change", onPerm);
  };
}

function mapGeoError(err: GeolocationPositionError | undefined, permission: LocPermission): { error: string; permission: LocPermission } {
  const code = err?.code;
  if (code === 1 || permission === "denied") {
    return {
      error: "Location is blocked for this site. Allow it in your browser’s site settings, then test again.",
      permission: "denied",
    };
  }
  if (code === 3) {
    return { error: "Location is taking too long. Choose an area instead.", permission };
  }
  if (code === 2) {
    return { error: "This device could not find a GPS fix. Choose an area instead.", permission };
  }
  return { error: "Location was not allowed. Choose an area instead.", permission };
}

export function requestGps(): Promise<GpsResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ error: "This device cannot share a location. Choose an area instead.", permission: "unsupported" });
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      resolve({ error: "Location needs a secure connection. Choose an area instead.", permission: "unsupported" });
      return;
    }
    let done = false;
    const finish = (value: GpsResult) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(
      () => finish({ error: "Location is taking too long. Choose an area instead.", permission: "unknown" }),
      8000,
    );
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const area = nearestArea(lat, lng);
        finish({
          lat,
          lng,
          area: area.name,
          city: area.city,
          accuracyM: Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null,
          at: Date.now(),
        });
      },
      (err) => {
        void queryLocationPermission().then((permission) => finish(mapGeoError(err, permission)));
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 120_000 },
    );
  });
}
