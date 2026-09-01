import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isAquaAdmin } from "@/domain/policies/roles";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const role = (token?.role as string | undefined) ?? null;

  if (pathname.startsWith("/partner")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (pathname === "/designa/ai" || pathname.startsWith("/designa/ai/")) {
    return NextResponse.redirect(new URL("/designa", req.url));
  }
  if (pathname === "/operations/ledning" || pathname === "/operations/notiser" || pathname === "/operations/visning") {
    return NextResponse.redirect(new URL("/operations", req.url));
  }
  if (pathname === "/operations/etiketter" || pathname.startsWith("/operations/etiketter/")) {
    return NextResponse.redirect(new URL("/operations/ordrar?phase=labels", req.url));
  }
  if (pathname.startsWith("/factory")) {
    if (role === "LABEL") return NextResponse.redirect(new URL("/labels", req.url));
    if (role === "BOTTLER" || role === "FACTORY") return NextResponse.redirect(new URL("/bottler", req.url));
    if (isAquaAdmin(role)) return NextResponse.redirect(new URL("/operations", req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const homeFor =
    role === "CUSTOMER"
      ? "/konto"
      : role === "LABEL"
        ? "/labels"
        : role === "BOTTLER" || role === "FACTORY"
          ? "/bottler"
          : isAquaAdmin(role)
            ? "/operations"
            : "/login?error=forbidden";

  const needs = (prefix: string, roles: string[]) => {
    if (!pathname.startsWith(prefix)) return null;
    if (!token) return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));
    if (!roles.includes(role ?? "")) return NextResponse.redirect(new URL(homeFor, req.url));
    return NextResponse.next();
  };

  return (
    needs("/konto", ["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]) ||
    needs("/designa", ["CUSTOMER", "AQUA_STAFF", "AQUA_ADMIN"]) ||
    needs("/operations", ["AQUA_STAFF", "AQUA_ADMIN"]) ||
    needs("/labels", ["LABEL", "AQUA_STAFF", "AQUA_ADMIN"]) ||
    needs("/bottler", ["BOTTLER", "FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]) ||
    NextResponse.next()
  );
}

export const config = {
  matcher: [
    "/konto",
    "/konto/:path*",
    "/designa",
    "/designa/:path*",
    "/partner",
    "/partner/:path*",
    "/operations",
    "/operations/:path*",
    "/factory",
    "/factory/:path*",
    "/labels",
    "/labels/:path*",
    "/bottler",
    "/bottler/:path*",
  ],
};
