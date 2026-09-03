import type { CompanyLookupService } from "./ports/companyLookup";

export type PaymentStatus = "unpaid" | "paid" | "partial";
export type DeliveryStatus = "CREATED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";
export type { CompanyHit, CompanyLookupService } from "./ports/companyLookup";

export interface FortnoxService {
  createCustomer(input: { name: string; orgNr?: string; email?: string }): Promise<{ fortnoxId: string }>;
  createInvoice(orderId: string): Promise<{ invoiceNo: string; status: string; issuedAt: string }>;
  sendInvoice(invoiceNo: string): Promise<{ invoiceNo: string; status: string }>;
  getPaymentStatus(invoiceNo: string): Promise<PaymentStatus>;
}

export interface ShipmentService {
  createWaybill(input: {
    orderId: string;
    jobId?: string;
    packages: number;
    weightKg: number;
    carrier: string;
  }): Promise<{ shipmentId: string; trackingNo: string; carrier: string; labelPdfUrl: string; status: string }>;
  getTracking(trackingNo: string): Promise<{ status: DeliveryStatus; updatedAt: string }>;
  getDeliveryStatus(trackingNo: string): Promise<DeliveryStatus>;
}

export interface LabelService {
  orderLabels(orderId: string): Promise<{ labelOrderId: string; status: string }>;
  getPrintStatus(labelOrderId: string): Promise<string>;
  getTracking(labelOrderId: string): Promise<{ trackingNo: string; status: string }>;
}

export interface FactoryService {
  submitProduction(jobId: string): Promise<{ ack: string }>;
  getProductionStatus(jobId: string): Promise<string>;
  getDeliveryStatus(jobId: string): Promise<string>;
}

export interface EmailService {
  sendOrderConfirmation(orderId: string): Promise<{ id: string }>;
  sendArtworkApproval(orderId: string): Promise<{ id: string }>;
  sendArtworkRejected(orderId: string): Promise<{ id: string }>;
  sendDeliveryNotice(orderId: string): Promise<{ id: string }>;
  sendRepeatReminder(orderId: string): Promise<{ id: string }>;
}

export interface NotificationService {
  publish(input: { userId: string; type: string; title: string; body: string; entityType?: string; entityId?: string }): Promise<void>;
  listForUser(userId: string): Promise<Array<{ id: string; title: string; body: string; readAt: Date | null }>>;
  markRead(id: string): Promise<void>;
}

export interface IntegrationRegistry {
  fortnox: FortnoxService;
  shipment: ShipmentService;
  label: LabelService;
  factory: FactoryService;
  email: EmailService;
  notifications: NotificationService;
  companyLookup: CompanyLookupService;
}
