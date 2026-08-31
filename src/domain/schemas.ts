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

export const buyerOrderSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(1),
  addressId: z.string().min(1).optional(),
  line1: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  city: z.string().trim().optional(),
  invoiceRef: z.string().trim().optional(),
  requestedDate: z.string().optional(),
  deliveryRequirement: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  waterType: z.enum(["stilla", "kolsyrat"]).optional(),
  cap: z.enum(["skruvkork", "sportkork", "black", "white"]).optional(),
  color: z.enum(["transparent", "frost", "black"]).optional(),
  designId: z.string().optional(),
  customerId: z.string().optional(),
});

export const repeatSchema = z.object({
  sourceOrderId: z.string().min(1),
  qty: z.number().int().min(1),
  requestedDate: z.string().optional(),
  addressId: z.string().min(1).optional(),
  notes: z.string().optional(),
  invoiceRef: z.string().optional(),
});

export const addressSchema = z.object({
  line1: z.string().trim().min(2),
  postalCode: z.string().trim().min(3),
  city: z.string().trim().min(2),
  type: z.enum(["SHIPPING", "BILLING"]).default("SHIPPING"),
});

export const extraLineSchema = z.object({
  kind: z.enum(["freight", "express", "setup", "special", "discount", "other"]),
  label: z.string().trim().min(1),
  amountExVat: z.number(),
});
