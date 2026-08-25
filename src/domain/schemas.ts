import { z } from "zod";

export const quoteSchema = z.object({
  company: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  city: z.string().trim().optional(),
  message: z.string().trim().optional(),
  productId: z.string().min(1),
  qty: z.number().int().min(1).max(100_000),
  designId: z.string().min(1).optional(),
});

export const repeatSchema = z.object({
  sourceOrderId: z.string().min(1),
  qty: z.number().int().min(1),
  requestedDate: z.string().min(4),
  addressId: z.string().min(1).optional(),
  sameArtwork: z.boolean(),
  invoiceRef: z.string().optional(),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
  city: z.string().trim().min(2),
  type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
});
