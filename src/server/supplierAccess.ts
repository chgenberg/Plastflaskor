import { redirect } from "next/navigation";
import { isAquaAdmin } from "@/domain/policies/roles";
import { requireRole } from "./rbac";

const SUPPLIER_ROLES = ["LABEL", "BOTTLER", "FACTORY", "AQUA_STAFF", "AQUA_ADMIN"] as const;

export async function requireSupplier(kind: "label" | "bottler") {
  const roles =
    kind === "label"
      ? (["LABEL", "AQUA_STAFF", "AQUA_ADMIN"] as string[])
      : (["BOTTLER", "FACTORY", "AQUA_STAFF", "AQUA_ADMIN"] as string[]);
  const user = await requireRole(roles);
  if (user.role === "LABEL" && kind !== "label") redirect("/labels");
  if ((user.role === "BOTTLER" || user.role === "FACTORY") && kind !== "bottler") redirect("/bottler");
  return user;
}

export function scopedFactoryId(user: { role: string; factoryId?: string | null }) {
  return (SUPPLIER_ROLES as readonly string[]).includes(user.role) && user.factoryId && !isAquaAdmin(user.role)
    ? user.factoryId
    : isAquaAdmin(user.role)
      ? undefined
      : user.factoryId ?? undefined;
}
