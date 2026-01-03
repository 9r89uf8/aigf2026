export const STATUS_TTL_MS = 24 * 60 * 60 * 1000;

export function formatTimeAgoEs(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const diffMs = Math.max(0, now - Number(timestamp));
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Justo ahora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `Hace ${weeks} sem`;
  try {
    return new Date(Number(timestamp)).toLocaleDateString("es-ES");
  } catch {
    return "";
  }
}

export function isStatusActive(status) {
  if (!status?.statusText) return false;
  const fallbackExpiry = status.statusCreatedAt
    ? status.statusCreatedAt + STATUS_TTL_MS
    : 0;
  const expiresAt = status.statusExpiresAt || fallbackExpiry;
  if (!expiresAt) return true;
  return expiresAt > Date.now();
}
