import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, supabase, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/match") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/developer") ||
    pathname.startsWith("/requests");

  if (!user) {
    if (isProtected) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  // Logged in: figure out whether they've picked Seeker/Developer yet (as a
  // default landing view, not a permanent lock — a user can hold both a
  // seeker and a developer identity on one account, see Navbar's role-switch
  // links) and whether they have a developer profile, and route "/",
  // "/onboarding", and "/developer/*" accordingly so nobody lands on a stale
  // prompt or a developer-only page with no profile behind it. "/match" is
  // open to any logged-in user regardless of role.
  if (
    pathname === "/" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/developer")
  ) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role as "seeker" | "developer" | null | undefined;

    const { data: devProfile } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    const hasDevProfile = Boolean(devProfile);

    // Where this user lands by default — not an access restriction, just the
    // initial destination based on their onboarding choice.
    const home = !role
      ? "/onboarding"
      : role === "seeker"
        ? "/match"
        : hasDevProfile
          ? "/developer/dashboard"
          : "/developer/profile";

    if (pathname === "/") {
      return NextResponse.redirect(new URL(home, request.url));
    }
    if (pathname.startsWith("/onboarding") && role) {
      return NextResponse.redirect(new URL(home, request.url));
    }
    if (pathname.startsWith("/developer")) {
      if (!hasDevProfile) {
        if (pathname !== "/developer/profile") {
          return NextResponse.redirect(new URL("/developer/profile", request.url));
        }
      } else if (pathname.startsWith("/developer/profile")) {
        return NextResponse.redirect(new URL("/developer/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - image files
     * - the OAuth callback route (must run unauthenticated)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
