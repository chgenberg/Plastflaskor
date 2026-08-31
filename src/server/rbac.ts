import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireRole(roles: string[]) {
  const user = await getSessionUser();
  const fallback =
    roles[0] === "FACTORY" ? "/factory" : roles.includes("CUSTOMER") ? "/konto" : roles.includes("RESELLER") ? "/partner" : "/operations";
  if (!user) redirect(`/login?next=${encodeURIComponent(fallback)}`);
  if (!roles.includes(user.role)) redirect("/login?error=forbidden");
  return user;
}

export function homeForRole(role?: string | null) {
  if (role === "CUSTOMER") return "/konto";
  if (role === "RESELLER") return "/partner";
  if (role === "FACTORY") return "/factory";
  if (role === "AQUA_STAFF" || role === "AQUA_ADMIN") return "/operations";
  return "/";
}
