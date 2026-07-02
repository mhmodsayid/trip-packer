import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_HOST } from "@/lib/constants";
import { verifySessionTokenEdge } from "@/lib/admin-auth-edge";

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (
    host.endsWith(".vercel.app") &&
    host !== CANONICAL_HOST
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const canonical = canonicalHostRedirect(request);
  if (canonical) return canonical;

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_session")?.value;
  if (!(await verifySessionTokenEdge(token))) {
    const login = new URL("/admin/login", request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
