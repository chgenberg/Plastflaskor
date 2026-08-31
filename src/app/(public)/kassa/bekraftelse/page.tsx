import { redirect } from "next/navigation";
import { getSessionUser, homeForRole } from "@/server/rbac";

export default async function CheckoutThanksPage() {
  const user = await getSessionUser();
  redirect(user ? homeForRole(user.role) : "/login");
}
