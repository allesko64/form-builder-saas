import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "~/lib/auth";

const authEntryPaths = ["/", "/sign-in", "/sign-up"];
const protectedPrefixes = ["/dashboard", "/forms"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSessionFromRequest(request.headers.get("cookie"));
  const isAuthed = !!session?.user;

  if (isAuthed && authEntryPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthed) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-in", "/sign-up", "/dashboard/:path*", "/forms/:path*"],
};
