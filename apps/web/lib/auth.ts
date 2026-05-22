/** Where the browser should call auth (same origin as the web app). */
export function getAuthBaseUrl(requestOrigin?: string): string {
  if (requestOrigin) return requestOrigin;
  return (
    process.env.AUTH_SERVER_URL ??
    process.env.NEXT_PUBLIC_AUTH_URL ??
    process.env.NEXT_PUBLIC_WEB_APP_URL ??
    "http://localhost:8000"
  );
}

export async function getSessionFromRequest(
  cookieHeader: string | null,
  requestOrigin?: string,
) {
  const base = getAuthBaseUrl(requestOrigin);
  const res = await fetch(`${base}/api/auth/get-session`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.user) return null;

  return data;
}
