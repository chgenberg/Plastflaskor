import type { Role } from "@prisma/client";

export function canSeePrices(role?: Role | string | null) {
  return role === "CUSTOMER" || role === "AQUA_STAFF" || role === "AQUA_ADMIN";
}

export function canSeeFinance(role?: Role | string | null) {
  return role === "AQUA_STAFF" || role === "AQUA_ADMIN";
}

export function canSeeFactoryFloor(role?: Role | string | null) {
  return role === "FACTORY" || role === "LABEL" || role === "BOTTLER" || role === "AQUA_STAFF" || role === "AQUA_ADMIN";
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
