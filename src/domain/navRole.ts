import { isAquaAdmin } from "./policies/roles";

export type NavRole = "CUSTOMER" | "AQUA" | "LABEL" | "BOTTLER";

export function navRoleOf(role?: string | null): NavRole {
  if (isAquaAdmin(role)) return "AQUA";
  if (role === "CUSTOMER") return "CUSTOMER";
  if (role === "LABEL") return "LABEL";
  return "BOTTLER";
}
