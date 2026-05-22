import { env } from "~/env.js";

/** WebSocket endpoint for live analytics (auth via session cookies on API origin). */
export function getAnalyticsWsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) {
    return explicit.endsWith("/ws/analytics")
      ? explicit
      : `${explicit.replace(/\/$/, "")}/ws/analytics`;
  }

  const api = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc";
  const base = api.replace(/\/trpc\/?$/i, "") || "http://localhost:8000";
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/analytics";
  url.search = "";
  url.hash = "";
  return url.toString();
}
