import { nearestArea } from "@/lib/constants";

export function requestGps(): Promise<{ lat: number; lng: number; area: string; city: string } | { error: string }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: "This device cannot share a location. Choose an area instead." });
      return;
    }
    const finish = (value: { lat: number; lng: number; area: string; city: string } | { error: string }) => resolve(value);
    const timer = window.setTimeout(() => finish({ error: "Location is taking too long. Choose an area instead." }), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timer);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const area = nearestArea(lat, lng);
        finish({ lat, lng, area: area.name, city: area.city });
      },
      () => {
        window.clearTimeout(timer);
        finish({ error: "Location was not allowed. Choose an area instead." });
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 120_000 },
    );
  });
}
