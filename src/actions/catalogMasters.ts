"use server";

import { revalidatePath } from "next/cache";
import { isAquaAdmin } from "@/domain/policies/roles";
import { getSessionUser } from "@/server/rbac";
import { updateWaterProduct, updatePriceListItem } from "@/server/services/catalog.service";

async function requireStaff() {
  const user = await getSessionUser();
  if (!isAquaAdmin(user?.role)) throw new Error("Forbidden");
}

export async function updateProductAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Produkt saknas");
  await updateWaterProduct(id, {
    moq: Number(formData.get("moq")),
    leadTimeDays: Number(formData.get("leadTimeDays")),
    leadTimeText: String(formData.get("leadTimeText") ?? ""),
    printFormat: String(formData.get("printFormat") ?? ""),
    oneLiner: String(formData.get("oneLiner") ?? ""),
  });
  revalidatePath("/operations/produkter");
}

export async function updatePriceItemAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Prisrad saknas");
  await updatePriceListItem(id, {
    minQty: Number(formData.get("minQty")),
    unitPriceExVat: Number(formData.get("unitPriceExVat")),
  });
  revalidatePath("/operations/priser");
}
