import { redirect } from "next/navigation";
import { isAquaAdmin } from "@/domain/policies/roles";
import { getSessionUser, homeForRole } from "./rbac";

const SUPPLIER_ROLES = ["LABEL", "BOTTLER", "FACTORY", "AQUA_STAFF", "AQUA_ADMIN"] as const;

export async function requireSupplier(kind: "label" | "bottler") {
  const dest = kind === "label" ? "/labels" : "/bottler";
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(dest)}`);
  if (user.role === "LABEL" && kind !== "label") redirect("/labels");
  if ((user.role === "BOTTLER" || user.role === "FACTORY") && kind !== "bottler") redirect("/bottler");
  if (user.role === "CUSTOMER") redirect("/konto");
  const roles =
    kind === "label"
      ? (["LABEL", "AQUA_STAFF", "AQUA_ADMIN"] as string[])
      : (["BOTTLER", "FACTORY", "AQUA_STAFF", "AQUA_ADMIN"] as string[]);
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

export function scopedFactoryId(user: { role: string; factoryId?: string | null }) {
  if (isAquaAdmin(user.role)) return undefined;
  if ((SUPPLIER_ROLES as readonly string[]).includes(user.role)) {
    return user.factoryId || "__none__";
  }
  return user.factoryId ?? undefined;
}
