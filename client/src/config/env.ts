const DEFAULT_API_ORIGIN = "http://localhost:3000";

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export const API_ORIGIN = normalizeUrl(
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_ORIGIN,
);

export const API_URL = `${API_ORIGIN}/api`;

export const SOCKET_URL = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL?.trim() || API_ORIGIN,
);
