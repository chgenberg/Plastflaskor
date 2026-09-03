import { BUYER_STATUS, ORDER_STEP_LABELS, statusTone, type OrderStatusCode } from "./enums";
import type { NavRole } from "./navRole";
import { isOverdue, needsNewArtworkAfterReject } from "./orderBrief";

export type HintFacts = {
  hasArtwork: boolean;
  customerApproved: boolean;
  artworkRejected?: boolean;
  requestedDate?: string | null;
  factoryIssueNote?: string | null;
  factoryDeadlineAccepted?: boolean;
};

export type Hint = { label: string; tone: "done" | "next" | "blocked" | "idle" };

export function hintFactsFromOrder(o: {
  designs?: { files?: { id: string }[] }[];
  artworkVersions?: { id: string; createdAt?: Date | string }[];
  artworkApprovals?: { kind: string; createdAt?: Date | string }[];
  requestedDate?: string | null;
  factoryIssueNote?: string | null;
  factoryDeadlineAccepted?: boolean;
}): HintFacts {
  const fromDesigns = (o.designs ?? []).some((d) => (d.files ?? []).length > 0);
  return {
    hasArtwork: fromDesigns || (o.artworkVersions ?? []).length > 0,
    customerApproved: (o.artworkApprovals ?? []).some((a) => a.kind === "CUSTOMER_FINAL"),
    artworkRejected: needsNewArtworkAfterReject(o),
    requestedDate: o.requestedDate,
    factoryIssueNote: o.factoryIssueNote,
    factoryDeadlineAccepted: o.factoryDeadlineAccepted,
  };
}

const LABEL_HINT: Partial<Record<OrderStatusCode, Hint>> = {
  CONFIRMED: { label: "Acceptera deadline", tone: "next" },
  LABEL_PRODUCTION: { label: "Etiketter i produktion", tone: "next" },
  LABELS_DISPATCHED: { label: "Skickade till bottler", tone: "done" },
};

const BOTTLER_HINT: Partial<Record<OrderStatusCode, Hint>> = {
  LABELS_DISPATCHED: { label: "Ta emot etiketter", tone: "next" },
  LABELS_RECEIVED: { label: "Planera produktion", tone: "next" },
  PRODUCTION_SCHEDULED: { label: "Produktion planerad", tone: "idle" },
  IN_PRODUCTION: { label: "I produktion", tone: "next" },
  READY_TO_SHIP: { label: "Printa fraktsedel · markera skickad", tone: "next" },
  SHIPPED: { label: "Skickad", tone: "done" },
};

function customerHint(status: OrderStatusCode, f: HintFacts): Hint | null {
  if ((status === "SUBMITTED" || status === "AQUA_REVIEW") && !f.hasArtwork) {
    return { label: "Artwork saknas", tone: "next" };
  }
  if ((status === "SUBMITTED" || status === "AQUA_REVIEW") && f.hasArtwork) {
    return { label: "Aqua granskar", tone: "idle" };
  }
  if (status === "ARTWORK_AQUA_REVIEW") return { label: "Korrektur på väg", tone: "idle" };
  if (status === "ARTWORK_CUSTOMER_APPROVAL" && !f.customerApproved) {
    return { label: "Godkänn korrektur", tone: "next" };
  }
  if (status === "ARTWORK_CUSTOMER_APPROVAL" && f.customerApproved) {
    return { label: "Väntar på orderbekräftelse", tone: "idle" };
  }
  if (status === "INVOICED") return { label: "Faktura att betala", tone: "next" };
  if (status === "PAID") return { label: "Klar", tone: "done" };
  return null;
}

export function statusHint(status: OrderStatusCode | string, f: HintFacts, viewer: NavRole): Hint {
  const code = status as OrderStatusCode;
  if (f.factoryIssueNote && !f.factoryDeadlineAccepted) return { label: "Problem flaggat", tone: "blocked" };
  if (f.artworkRejected) {
    return {
      label: viewer === "CUSTOMER" ? "Ladda upp artwork" : "Kund ska ladda upp ny artwork",
      tone: "blocked",
    };
  }
  if (isOverdue(status, f.requestedDate)) return { label: "Försenad", tone: "blocked" };

  if (viewer === "LABEL" || viewer === "BOTTLER") {
    if (code === "INVOICED" || code === "PAID" || code === "READY_TO_INVOICE") {
      return { label: "Klar", tone: "done" };
    }
    const dict = viewer === "LABEL" ? LABEL_HINT : BOTTLER_HINT;
    return dict[code] ?? { label: ORDER_STEP_LABELS[code] ?? status, tone: statusTone(status, f.requestedDate) };
  }

  if (["SUBMITTED", "AQUA_REVIEW"].includes(status) && !f.hasArtwork) {
    return { label: viewer === "CUSTOMER" ? "Ladda upp artwork" : "Saknar artwork", tone: "blocked" };
  }

  if (status === "ARTWORK_CUSTOMER_APPROVAL" && !f.customerApproved) {
    return {
      label: viewer === "CUSTOMER" ? "Godkänn korrektur" : "Väntar på kund",
      tone: viewer === "CUSTOMER" ? "next" : "idle",
    };
  }

  if (viewer === "CUSTOMER") {
    return customerHint(code, f) ?? {
      label: BUYER_STATUS[status] ?? status,
      tone: statusTone(status, f.requestedDate),
    };
  }

  return { label: ORDER_STEP_LABELS[code] ?? status, tone: statusTone(status, f.requestedDate) };
}
