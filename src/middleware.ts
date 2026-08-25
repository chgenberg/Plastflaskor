import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = (token?.role as string | undefined) ?? null;

  const needs = (prefix: string, roles: string[]) => {
    if (!pathname.startsWith(prefix)) return null;
    if (!token) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
    if (!roles.includes(role ?? "")) return NextResponse.redirect(new URL("/login?error=forbidden", req.url));
    return NextResponse.next();
  };

  return (
    needs("/partner", ["RESELLER", "AQUA_STAFF", "AQUA_ADMIN"]) ||
    needs("/operations/ledning", ["AQUA_ADMIN", "AQUA_STAFF"]) ||
    needs("/operations", ["AQUA_STAFF", "AQUA_ADMIN"]) ||
    needs("/factory", ["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]) ||
    NextResponse.next()
  );
}

export const config = {
  matcher: ["/partner/:path*", "/operations/:path*", "/factory/:path*"],
};
