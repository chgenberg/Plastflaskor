import { redirect } from "next/navigation";
import { isAquaAdmin } from "@/domain/policies/roles";
import { auth } from "./auth";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireRole(roles: string[]) {
  const user = await getSessionUser();
  const fallback =
    roles[0] === "LABEL"
      ? "/labels"
      : roles[0] === "BOTTLER" || roles[0] === "FACTORY"
        ? "/bottler"
        : roles.includes("CUSTOMER")
          ? "/konto"
          : "/operations";
  if (!user) redirect(`/login?next=${encodeURIComponent(fallback)}`);
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

export function homeForRole(role?: string | null) {
  if (role === "CUSTOMER") return "/konto";
  if (role === "RESELLER") return "/login";
  if (role === "LABEL") return "/labels";
  if (role === "BOTTLER") return "/bottler";
  if (role === "FACTORY") return "/bottler";
  if (isAquaAdmin(role)) return "/operations";
  return "/";
}
