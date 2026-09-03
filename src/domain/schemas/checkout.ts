import { z } from "zod";
import { buyerOrderSchema } from "@/domain/schemas";
import { formatOrgNr, isValidOrgNr, normalizeOrgNr } from "@/domain/orgNr";

export const orgNrSchema = z
  .string()
  .transform((v) => formatOrgNr(normalizeOrgNr(v)))
  .refine((d) => isValidOrgNr(d), "Ogiltigt organisationsnummer");

export const checkoutRegisterSchema = z.object({
  company: z.string().trim().min(2).max(120),
  orgNr: orgNrSchema,
  contactName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(6).max(30),
  password: z.string().min(8).max(200),
  login: z.boolean().optional(),
  clientToken: z.string().uuid(),
  variantId: z.string().min(1).optional(),
  qty: z.number().int().min(1).optional(),
});

export const checkoutOrderSchema = buyerOrderSchema
  .pick({
    variantId: true,
    qty: true,
    requestedDate: true,
    waterType: true,
    cap: true,
    color: true,
    designId: true,
  })
  .extend({
    line1: z.string().trim().min(2),
    postalCode: z.string().trim().min(3),
    city: z.string().trim().min(2),
    invoiceRef: z.string().trim().min(1).max(80),
    acceptTerms: z.literal("on"),
    clientToken: z.string().uuid(),
  });

export type CheckoutRegisterInput = z.infer<typeof checkoutRegisterSchema>;
export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
