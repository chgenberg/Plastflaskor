/**
 * Aqua Visibility house map. Shared by Cursor and /operations/agenten.
 * Coordinates are percent of the SVG viewBox (0–100).
 */

export type DomainId =
  | "public"
  | "auth"
  | "customer"
  | "operations"
  | "labels"
  | "bottler"
  | "artwork"
  | "order"
  | "email"
  | "money";

export type LayerId = "ingress" | "brain" | "roles" | "spine" | "outbound";

export type DomainNode = {
  id: DomainId;
  label: string;
  layer: LayerId;
  x: number;
  y: number;
  blurb: string;
  files: string[];
  apis: string[];
  pulseKey?: string;
};

export type GraphEdge = {
  id: string;
  from: DomainId;
  to: DomainId;
  label: string;
};

export type PlaybookStep = {
  edgeId: string;
  nodeId: DomainId;
  note: string;
};

export type Playbook = {
  id: string;
  title: string;
  blurb: string;
  steps: PlaybookStep[];
};

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: "ingress", label: "Ingång" },
  { id: "brain", label: "Agenten" },
  { id: "roles", label: "Ytor" },
  { id: "spine", label: "Order" },
  { id: "outbound", label: "Ut" },
];

export const NODES: DomainNode[] = [
  {
    id: "public",
    label: "Publik sajt",
    layer: "ingress",
    x: 10,
    y: 16,
    blurb: "Information och login. Inga kundpriser.",
    files: ["src/app/(public)/page.tsx", "src/ui/public/PublicNav.tsx"],
    apis: [],
  },
  {
    id: "auth",
    label: "Auth",
    layer: "ingress",
    x: 28,
    y: 16,
    blurb: "Session och roll. Bara aktiva konton.",
    files: ["src/server/auth.ts", "src/middleware.ts"],
    apis: ["/api/auth"],
  },
  {
    id: "customer",
    label: "Kundportal",
    layer: "roles",
    x: 48,
    y: 14,
    blurb: "Egna ordrar, korrektur, priser, fakturor.",
    files: ["src/app/(konto)/konto/page.tsx", "src/ui/order/BuyerOrderDetail.tsx"],
    apis: [],
    pulseKey: "customer",
  },
  {
    id: "operations",
    label: "Master Dashboard",
    layer: "roles",
    x: 68,
    y: 14,
    blurb: "Navet. Vad behöver jag göra nu?",
    files: ["src/app/(operations)/operations/page.tsx", "src/domain/exceptions.ts"],
    apis: ["/api/operations/orchestrator"],
    pulseKey: "operations",
  },
  {
    id: "labels",
    label: "Etikett",
    layer: "roles",
    x: 86,
    y: 22,
    blurb: "Etikettorder. Aldrig kr eller faktura.",
    files: ["src/ui/supplier/SupplierDesk.tsx", "src/server/supplierAccess.ts"],
    apis: [],
    pulseKey: "labels",
  },
  {
    id: "bottler",
    label: "Bottler",
    layer: "roles",
    x: 86,
    y: 48,
    blurb: "Samma flaska som på OB. Aldrig faktura.",
    files: ["src/app/(bottler)/bottler/page.tsx", "src/ui/order/VisualSpecCard.tsx"],
    apis: [],
    pulseKey: "bottler",
  },
  {
    id: "artwork",
    label: "Artwork",
    layer: "spine",
    x: 48,
    y: 42,
    blurb: "Två steg: Aqua, sedan kund. Bara FINAL går till etikett.",
    files: ["src/server/services/artwork.service.ts", "src/domain/orderArtwork.ts"],
    apis: ["/api/artwork"],
    pulseKey: "artwork",
  },
  {
    id: "order",
    label: "Order",
    layer: "spine",
    x: 28,
    y: 48,
    blurb: "En registrering. Immutabel snapshot vid OB.",
    files: ["src/server/services/order.service.ts", "src/domain/orderBrief.ts"],
    apis: [],
    pulseKey: "order",
  },
  {
    id: "email",
    label: "Mejl",
    layer: "outbound",
    x: 12,
    y: 72,
    blurb: "Kvitto och påminnelser. Respektera EMAIL_PAUSED.",
    files: ["src/server/services/notify.ts"],
    apis: [],
  },
  {
    id: "money",
    label: "Faktura",
    layer: "outbound",
    x: 48,
    y: 74,
    blurb: "Fortnox-mock. Agenten trycker aldrig Fakturera.",
    files: ["src/server/services/checkout.service.ts", "src/app/(operations)/operations/ekonomi/page.tsx"],
    apis: [],
    pulseKey: "money",
  },
];

export const EDGES: GraphEdge[] = [
  { id: "public-auth", from: "public", to: "auth", label: "logga in" },
  { id: "auth-customer", from: "auth", to: "customer", label: "kund" },
  { id: "auth-operations", from: "auth", to: "operations", label: "aqua" },
  { id: "auth-labels", from: "auth", to: "labels", label: "etikett" },
  { id: "auth-bottler", from: "auth", to: "bottler", label: "tappning" },
  { id: "customer-order", from: "customer", to: "order", label: "ny order" },
  { id: "order-operations", from: "order", to: "operations", label: "granska" },
  { id: "operations-artwork", from: "operations", to: "artwork", label: "korrektur" },
  { id: "artwork-customer", from: "artwork", to: "customer", label: "godkänn" },
  { id: "operations-labels", from: "operations", to: "labels", label: "OB låst" },
  { id: "labels-bottler", from: "labels", to: "bottler", label: "skickat" },
  { id: "bottler-operations", from: "bottler", to: "operations", label: "datum / skickad" },
  { id: "operations-money", from: "operations", to: "money", label: "fakturera" },
  { id: "order-email", from: "order", to: "email", label: "kvitto" },
  { id: "money-email", from: "money", to: "email", label: "faktura" },
];

export const PLAYBOOKS: Playbook[] = [
  {
    id: "new-order",
    title: "Ny order",
    blurb: "Kunden lägger, Aqua granskar. Kvitto är inte OB.",
    steps: [
      { edgeId: "customer-order", nodeId: "order", note: "createBuyerOrder" },
      { edgeId: "order-operations", nodeId: "operations", note: "SUBMITTED / AQUA_REVIEW" },
      { edgeId: "order-email", nodeId: "email", note: "mottagningskvitto" },
    ],
  },
  {
    id: "artwork",
    title: "Artwork",
    blurb: "Aqua granskar, kunden godkänner. Bara FINAL till etikett.",
    steps: [
      { edgeId: "operations-artwork", nodeId: "artwork", note: "Aqua-proof" },
      { edgeId: "artwork-customer", nodeId: "customer", note: "Godkänn korrektur" },
    ],
  },
  {
    id: "confirm-ob",
    title: "Slutlig OB",
    blurb: "Aqua låser snapshot och släpper till etikett. Aldrig agenten.",
    steps: [
      { edgeId: "operations-labels", nodeId: "labels", note: "sendOrderConfirmation" },
    ],
  },
  {
    id: "produce",
    title: "Etikett → bottler → frakt",
    blurb: "Sista skickdatum, mottaget, estimat, fraktsedel, skickad.",
    steps: [
      { edgeId: "labels-bottler", nodeId: "bottler", note: "Labels Dispatched" },
      { edgeId: "bottler-operations", nodeId: "operations", note: "datum / shipped" },
    ],
  },
  {
    id: "invoice",
    title: "Fakturera",
    blurb: "Levererad blir redo. Människa trycker Invoice.",
    steps: [{ edgeId: "operations-money", nodeId: "money", note: "Fortnox-mock" }],
  },
];

export const NODE_BY_ID: Record<DomainId, DomainNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
) as Record<DomainId, DomainNode>;

export const EDGE_BY_ID: Record<string, GraphEdge> = Object.fromEntries(
  EDGES.map((e) => [e.id, e]),
);
