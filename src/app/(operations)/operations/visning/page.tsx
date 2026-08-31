import { PageHeader, Panel, LinkButton } from "@/ui/shell/primitives";

const SURFACES = [
  {
    href: "/konto",
    title: "Kundportal",
    account: "kund@demo.aqua",
    body: "Översikt, ny muggorder, korrektur, fakturor. Samma orderobjekt som ÅF.",
  },
  {
    href: "/partner",
    title: "ÅF-portal",
    account: "reseller.gold@demo.aqua",
    body: "Prislista Guld, beställ åt kund, tryckfiler, repeat. Inga Standard-priser.",
  },
  {
    href: "/operations",
    title: "Drift",
    account: "staff@demo.aqua",
    body: "Action-kort, tavla, granska, OB, frakt, faktura. Inte leverantörens yta.",
  },
  {
    href: "/factory",
    title: "Leverantör",
    account: "factory@demo.aqua",
    body: "Dashboard, beställningar, accept/flagga, produktion, fraktsedel. Inga priser.",
  },
];

const SCRIPT = [
  "Kund eller ÅF skapar muggorder (antal, tryckfil, leveranskrav).",
  "Aqua granskar och skickar korrektur — kunden godkänner, ordern låses inte än.",
  "Aqua skickar OB, låser snapshot och sätter senaste utskick.",
  "Leverantör accepterar deadline eller flaggar, startar, markerar klar.",
  "Aqua godkänner datum, skapar fraktsedel. Leverantör markerar skickad.",
  "Levererad → faktura hos Aqua. Leverantören ser aldrig fakturan.",
];

export default function SupplierDemoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Visning för leverantör"
        subtitle="Hela OS:et med demodata. Lösenord AquaDemo26! på alla konton. Logga ut mellan ytor."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {SURFACES.map((s) => (
          <Panel key={s.href} title={s.title}>
            <p className="text-sm text-[var(--av-text-muted)]">{s.body}</p>
            <p className="mt-3 font-mono text-[13px] text-[var(--av-text)]">{s.account}</p>
            <div className="mt-4">
              <LinkButton href={s.href}>Öppna</LinkButton>
            </div>
          </Panel>
        ))}
      </div>
      <Panel title="Manus — en order från start till skickad">
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {SCRIPT.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
