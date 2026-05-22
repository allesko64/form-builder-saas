const STORAGE_KEY = "form-builder-terminal-id";

/** Stable per-browser id; sent as `x-terminal-id` and hashed server-side. */
export function getOrCreateTerminalId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }

  return id;
}
