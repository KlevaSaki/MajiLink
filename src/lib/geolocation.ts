/**
 * Browser geolocation, wrapped so callers get a plain result instead of
 * callback soup.
 *
 * We use device location rather than geocoding a typed address because
 * there's no geocoding provider wired up, and because both sides of this
 * app are realistically standing where the pin should go: a vendor
 * onboarding at their shop, a customer ordering to where they are.
 *
 * If a typed-address flow is added later (delivering somewhere you
 * aren't), this becomes one of two ways to set coordinates, not the only
 * one.
 */

export interface Coords {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
}

export type GeolocationFailure =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout";

export type GeolocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: GeolocationFailure };

export const GEOLOCATION_MESSAGES: Record<GeolocationFailure, string> = {
  unsupported: "This device doesn't support location access.",
  denied:
    "Location permission was denied. You can enable it in your browser settings and try again.",
  unavailable: "Couldn't determine your location. Check that location services are on.",
  timeout: "Finding your location took too long. Try again.",
};

export function getCurrentPosition(timeoutMs = 15000): Promise<GeolocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          ok: true,
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
          },
        }),
      (error) => {
        const reason: GeolocationFailure =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
            ? "timeout"
            : "unavailable";
        resolve({ ok: false, reason });
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
