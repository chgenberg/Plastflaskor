import type { IntegrationRegistry } from "../../types";

function notImplemented(name: string): never {
  throw new Error(`${name} är inte kopplad ännu. Sätt INTEGRATION_MODE=mock.`);
}

export function createLiveIntegrations(): IntegrationRegistry {
  return {
    fortnox: {
      createCustomer: () => notImplemented("fortnox.createCustomer"),
      createInvoice: () => notImplemented("fortnox.createInvoice"),
      sendInvoice: () => notImplemented("fortnox.sendInvoice"),
      getPaymentStatus: () => notImplemented("fortnox.getPaymentStatus"),
    },
    shipment: {
      createWaybill: () => notImplemented("shipment.createWaybill"),
      getTracking: () => notImplemented("shipment.getTracking"),
      getDeliveryStatus: () => notImplemented("shipment.getDeliveryStatus"),
    },
    label: {
      orderLabels: () => notImplemented("label.orderLabels"),
      getPrintStatus: () => notImplemented("label.getPrintStatus"),
      getTracking: () => notImplemented("label.getTracking"),
    },
    factory: {
      submitProduction: () => notImplemented("factory.submitProduction"),
      getProductionStatus: () => notImplemented("factory.getProductionStatus"),
      getDeliveryStatus: () => notImplemented("factory.getDeliveryStatus"),
    },
    email: {
      sendOrderConfirmation: () => notImplemented("email.sendOrderConfirmation"),
      sendArtworkApproval: () => notImplemented("email.sendArtworkApproval"),
      sendDeliveryNotice: () => notImplemented("email.sendDeliveryNotice"),
      sendRepeatReminder: () => notImplemented("email.sendRepeatReminder"),
    },
    notifications: {
      publish: () => notImplemented("notifications.publish"),
      listForUser: () => notImplemented("notifications.listForUser"),
      markRead: () => notImplemented("notifications.markRead"),
    },
  };
}
