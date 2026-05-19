/**
 * Mapbox access token — must be set via VITE_MAPBOX_TOKEN (see .env.example).
 * Do not hardcode tokens in components; Mapbox keys in client bundles are public
 * but should still come from environment / hosting secrets.
 */
export function getMapboxToken(): string {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  if (typeof token === 'string' && token.trim()) {
    return token.trim();
  }
  if (import.meta.env.DEV) {
    console.warn(
      '[Mapbox] VITE_MAPBOX_TOKEN is not set. Maps, geocoding, and directions will not work.'
    );
  }
  return '';
}
