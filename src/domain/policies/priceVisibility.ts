import type { Role } from "@prisma/client";
import { isAquaAdmin } from "@/domain/policies/roles";

export function canSeePrices(role?: Role | string | null) {
  return role === "CUSTOMER" || isAquaAdmin(role);
}

export function canSeeFinance(role?: Role | string | null) {
  return isAquaAdmin(role);
}

export function canSeeFactoryFloor(role?: Role | string | null) {
  return role === "FACTORY" || role === "LABEL" || role === "BOTTLER" || isAquaAdmin(role);
}

export function stripPrices<T extends Record<string, unknown>>(row: T): T {
  const clone = { ...row };
  delete clone.unitPriceExVat;
  delete clone.amountExVat;
  delete clone.amountIncVat;
  delete clone.vatAmount;
  delete clone.orderValue;
  return clone;
}
