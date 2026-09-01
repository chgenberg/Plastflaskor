/**
 * Aqua Visibility house map — same shape as the paper sketch:
 * Order → Etiketter (accept ETD → POD) / Bottler (accept → POD → FRAKT) / Kund (Korr → POA → OB)
 * then Frakt → POD → Faktura → Fortnox (mock).
 *
 * Word still wins on sequence: Korr/POA before locked OB. Agenten never Fakturera / OB.
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
  | "freight"
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

export type HouseStep = {
  id: string;
  label: string;
  note: string;
  domainId: DomainId;
};

export type HouseTrack = {
  id: string;
  label: string;
  domainId: DomainId;
  steps: HouseStep[];
};

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: "ingress", label: "Ingång" },
  { id: "brain", label: "Agenten" },
  { id: "roles", label: "Spår" },
  { id: "spine", label: "Order" },
  { id: "outbound", label: "Frakt / faktura" },
];

export const NODES: DomainNode[] = [
  {
    id: "public",
    label: "Publik sajt",
    layer: "ingress",
    x: 10,
    y: 12,
    blurb: "Information och login. Inga kundpriser.",
    files: ["src/app/(public)/page.tsx", "src/ui/public/PublicNav.tsx"],
    apis: [],
  },
  {
    id: "auth",
    label: "Auth",
    layer: "ingress",
    x: 28,
    y: 12,
    blurb: "Session och roll. Bara aktiva konton.",
    files: ["src/server/auth.ts", "src/middleware.ts"],
    apis: ["/api/auth"],
  },
  {
    id: "order",
    label: "Order",
    layer: "spine",
    x: 50,
    y: 22,
    blurb: "Roten. En registrering. Kvitto är inte slutlig OB.",
    files: ["src/server/services/order.service.ts", "src/domain/orderBrief.ts"],
    apis: [],
    pulseKey: "order",
  },
  {
    id: "operations",
    label: "Master Dashboard",
    layer: "brain",
    x: 72,
    y: 14,
    blurb: "Navet. Vad behöver jag göra nu?",
    files: [
      "src/app/(operations)/operations/page.tsx",
      "src/app/(operations)/operations/dokument/page.tsx",
      "src/app/(operations)/operations/ordrar/ny/page.tsx",
      "src/domain/exceptions.ts",
    ],
    apis: ["/api/operations/orchestrator"],
    pulseKey: "operations",
  },
  {
    id: "labels",
    label: "Etiketter",
    layer: "roles",
    x: 18,
    y: 48,
    blurb: "accept ETD → POD. Aldrig kr eller faktura.",
    files: ["src/ui/supplier/SupplierDesk.tsx", "src/server/supplierAccess.ts"],
    apis: [],
    pulseKey: "labels",
  },
  {
    id: "bottler",
    label: "Bottler",
    layer: "roles",
    x: 50,
    y: 48,
    blurb: "accept → POD → FRAKT. Samma flaska som på OB.",
    files: [
      "src/app/(bottler)/bottler/page.tsx",
      "src/ui/supplier/BottlerJobsTable.tsx",
      "src/app/(bottler)/bottler/jobb/[jobId]/page.tsx",
      "src/app/(bottler)/bottler/dokument/page.tsx",
    ],
    apis: ["/api/bottler/print-plan", "/api/bottler/waybill"],
    pulseKey: "bottler",
  },
  {
    id: "customer",
    label: "Kund",
    layer: "roles",
    x: 82,
    y: 48,
    blurb: "Korr → POA → OB. Tracking och faktura efteråt.",
    files: ["src/app/(konto)/konto/page.tsx", "src/ui/order/BuyerOrderDetail.tsx"],
    apis: [],
    pulseKey: "customer",
  },
  {
    id: "artwork",
    label: "Korr / POA",
    layer: "roles",
    x: 82,
    y: 68,
    blurb: "Korrektur, sedan kundens POA. Inte slutlig OB.",
    files: ["src/server/services/artwork.service.ts", "src/domain/orderArtwork.ts"],
    apis: ["/api/artwork"],
    pulseKey: "artwork",
  },
  {
    id: "freight",
    label: "Frakt / POD",
    layer: "outbound",
    x: 50,
    y: 72,
    blurb: "FRAKT och POD till kund. Ingen faktura hos bottler.",
    files: ["src/app/(operations)/operations/frakt/page.tsx", "src/app/(bottler)/bottler/skickat/page.tsx"],
    apis: [],
    pulseKey: "freight",
  },
  {
    id: "money",
    label: "Faktura",
    layer: "outbound",
    x: 72,
    y: 86,
    blurb: "Faktura → Fortnox-mock. Agenten trycker aldrig Fakturera.",
    files: ["src/app/(operations)/operations/ekonomi/page.tsx", "src/server/integrations/status.ts"],
    apis: [],
    pulseKey: "money",
  },
  {
    id: "email",
    label: "Mejl",
    layer: "outbound",
    x: 18,
    y: 86,
    blurb: "Kvitto och påminnelser. Respektera EMAIL_PAUSED.",
    files: ["src/server/services/notify.ts"],
    apis: [],
  },
];

export const EDGES: GraphEdge[] = [
  { id: "public-auth", from: "public", to: "auth", label: "logga in" },
  { id: "auth-operations", from: "auth", to: "operations", label: "aqua" },
  { id: "auth-customer", from: "auth", to: "customer", label: "kund" },
  { id: "auth-labels", from: "auth", to: "labels", label: "etikett" },
  { id: "auth-bottler", from: "auth", to: "bottler", label: "tappning" },
  { id: "customer-order", from: "customer", to: "order", label: "ny order" },
  { id: "order-operations", from: "order", to: "operations", label: "granska" },
  { id: "order-labels", from: "order", to: "labels", label: "etikettspår" },
  { id: "order-bottler", from: "order", to: "bottler", label: "tappningsspår" },
  { id: "order-customer", from: "order", to: "customer", label: "kundspår" },
  { id: "operations-artwork", from: "operations", to: "artwork", label: "korr" },
  { id: "artwork-customer", from: "artwork", to: "customer", label: "POA" },
  { id: "operations-labels", from: "operations", to: "labels", label: "OB låst" },
  { id: "labels-bottler", from: "labels", to: "bottler", label: "POD" },
  { id: "bottler-freight", from: "bottler", to: "freight", label: "FRAKT" },
  { id: "freight-customer", from: "freight", to: "customer", label: "POD" },
  { id: "freight-money", from: "freight", to: "money", label: "faktura" },
  { id: "money-email", from: "money", to: "email", label: "faktura" },
  { id: "order-email", from: "order", to: "email", label: "kvitto" },
];

export const HOUSE_TRACKS: HouseTrack[] = [
  {
    id: "labels",
    label: "Etiketter",
    domainId: "labels",
    steps: [
      { id: "etd", label: "accept ETD", note: "Sista skickdatum.", domainId: "labels" },
      { id: "label-pod", label: "POD", note: "Etiketter skickade till bottler.", domainId: "labels" },
    ],
  },
  {
    id: "bottler",
    label: "Bottler",
    domainId: "bottler",
    steps: [
      { id: "accept", label: "accept", note: "Etiketter mottagna.", domainId: "bottler" },
      { id: "bottler-pod", label: "POD", note: "Flaskor klara / skickade.", domainId: "bottler" },
      { id: "frakt", label: "FRAKT", note: "Fraktsedel.", domainId: "freight" },
    ],
  },
  {
    id: "customer",
    label: "Kund",
    domainId: "customer",
    steps: [
      { id: "korr", label: "Korr", note: "Aqua skickar korrektur.", domainId: "artwork" },
      { id: "poa", label: "POA", note: "Kunden godkänner. Inte slutlig OB.", domainId: "customer" },
      { id: "ob", label: "OB", note: "Aqua låser snapshot. Aldrig agenten.", domainId: "order" },
    ],
  },
];

export const HOUSE_TAIL: HouseStep[] = [
  { id: "out-frakt", label: "Frakt", note: "Gods till kund.", domainId: "freight" },
  { id: "out-pod", label: "POD", note: "Leveransbevis.", domainId: "freight" },
  { id: "out-faktura", label: "Faktura", note: "Fortnox-mock.", domainId: "money" },
];

export const PLAYBOOKS: Playbook[] = [
  {
    id: "new-order",
    title: "Order",
    blurb: "Kunden lägger. Aqua granskar. Kvitto är inte OB.",
    steps: [
      { edgeId: "customer-order", nodeId: "order", note: "createBuyerOrder" },
      { edgeId: "order-operations", nodeId: "operations", note: "SUBMITTED / AQUA_REVIEW" },
      { edgeId: "order-email", nodeId: "email", note: "mottagningskvitto" },
    ],
  },
  {
    id: "artwork",
    title: "Korr / POA",
    blurb: "Aqua skickar korrektur. Kunden gör POA. Inte CONFIRMED.",
    steps: [
      { edgeId: "operations-artwork", nodeId: "artwork", note: "Korr" },
      { edgeId: "artwork-customer", nodeId: "customer", note: "POA" },
    ],
  },
  {
    id: "confirm-ob",
    title: "OB",
    blurb: "Aqua låser snapshot och släpper till etiketter. Aldrig agenten.",
    steps: [{ edgeId: "operations-labels", nodeId: "labels", note: "sendOrderConfirmation" }],
  },
  {
    id: "produce",
    title: "Etiketter → Bottler → FRAKT",
    blurb: "accept ETD → POD → accept → POD → FRAKT.",
    steps: [
      { edgeId: "labels-bottler", nodeId: "bottler", note: "POD etiketter" },
      { edgeId: "bottler-freight", nodeId: "freight", note: "FRAKT" },
    ],
  },
  {
    id: "invoice",
    title: "Faktura / Fortnox",
    blurb: "Efter POD. Fortnox är mock tills live. Människa trycker Fakturera.",
    steps: [{ edgeId: "freight-money", nodeId: "money", note: "Fortnox-mock" }],
  },
];

export const NODE_BY_ID: Record<DomainId, DomainNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
) as Record<DomainId, DomainNode>;

export const EDGE_BY_ID: Record<string, GraphEdge> = Object.fromEntries(
  EDGES.map((e) => [e.id, e]),
);
