"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAquaAdmin } from "@/domain/policies/roles";
import { getSessionUser } from "@/server/rbac";
import { createDirectCustomer, updateCustomer } from "@/server/services/customer.service";

async function requireStaffAdmin() {
  const user = await getSessionUser();
  if (!isAquaAdmin(user?.role)) throw new Error("Forbidden");
}

function field(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

export async function createCustomerAction(formData: FormData) {
  await requireStaffAdmin();
  const name = field(formData, "name");
  if (!name) throw new Error("Namn krävs");
  const customer = await createDirectCustomer({
    name,
    orgNr: field(formData, "orgNr"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    priceListId: field(formData, "priceListId"),
    line1: field(formData, "line1"),
    postalCode: field(formData, "postalCode"),
    city: field(formData, "city"),
  });
  redirect(`/operations/kunder/${customer.id}`);
}

export async function updateCustomerAction(formData: FormData) {
  await requireStaffAdmin();
  const id = field(formData, "id");
  const name = field(formData, "name");
  if (!id || !name) throw new Error("Ogiltig kund");
  await updateCustomer(id, {
    name,
    orgNr: field(formData, "orgNr"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    priceListId: field(formData, "priceListId"),
  });
  revalidatePath("/operations/kunder");
  revalidatePath(`/operations/kunder/${id}`);
}
