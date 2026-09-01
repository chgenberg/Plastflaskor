import { redirect } from "next/navigation";
import { isAquaAdmin } from "@/domain/policies/roles";
import { auth } from "./auth";
import { prisma } from "./db";

export async function getSessionUser() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;
  const email = user.email?.toLowerCase().trim();
  if (!email) return user;
  const fresh = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      resellerId: true,
      factoryId: true,
      customerId: true,
      isActive: true,
    },
  });
  if (!fresh?.isActive) return null;
  return {
    id: fresh.id,
    name: fresh.name,
    email: fresh.email,
    role: fresh.role,
    resellerId: fresh.resellerId,
    factoryId: fresh.factoryId,
    customerId: fresh.customerId,
  };
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
