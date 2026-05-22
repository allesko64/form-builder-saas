/** Public web origin for share links (client-safe). */
export function getWebAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";
}

export function publicFormUrl(slug: string): string {
  return `${getWebAppOrigin()}/f/${slug}`;
}
