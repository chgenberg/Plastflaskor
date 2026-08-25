import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireRole(roles: string[]) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(roles[0] === "FACTORY" ? "/factory" : roles.includes("RESELLER") ? "/partner" : "/operations")}`);
  if (!roles.includes(user.role)) redirect("/login?error=forbidden");
  return user;
}

export function homeForRole(role?: string | null) {
  if (role === "RESELLER") return "/partner";
  if (role === "FACTORY") return "/factory";
  if (role === "AQUA_STAFF" || role === "AQUA_ADMIN") return "/operations";
  return "/";
}
