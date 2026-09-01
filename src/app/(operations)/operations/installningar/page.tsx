import { getFortnoxConnection } from "@/server/integrations/status";
import { IntegrationBadge } from "@/ui/shell/FortnoxBadge";
import { DashPage, PageHeader, Panel } from "@/ui/shell/primitives";

const MOCK_LABEL = "API ansluten (mock)";

const INTEGRATIONS = [
  {
    id: "email",
    title: "E-post",
    body: "Orderbekräftelse, artwork-godkännande, leveransbesked och repeat-påminnelse går via mock-adaptern. Samma UI när live slås på.",
  },
  {
    id: "fortnox",
    title: "Fortnox mock",
    body: "Kund, faktura och betalstatus skapas mot mock. Inga live-nycklar i den här miljön.",
  },
  {
    id: "shipping",
    title: "Frakt mock",
    body: "Fraktsedel, tracking och leveransstatus kommer från mock-porten. PDF byts när live-frakt kopplas.",
  },
  {
    id: "notify",
    title: "Notiser",
    body: "In-app-notiser publiceras mot mock. Lista och oläst-räknare är samma yta oavsett adapter.",
  },
] as const;

export default function OpsSettings() {
  const fortnox = getFortnoxConnection();

  return (
    <DashPage>
      <PageHeader
        title="Inställningar"
        subtitle="Mock-portar. UI:t ändras inte när live slås på."
        action={<IntegrationBadge label={fortnox.label} />}
      />
      <div className="grid gap-6 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <section key={item.id} className="space-y-2 border-t border-[var(--av-border)] pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-[15px] font-medium tracking-tight">{item.title}</h2>
              <IntegrationBadge label={MOCK_LABEL} />
            </div>
            <p className="text-[13px] leading-relaxed text-[var(--av-text-muted)]">{item.body}</p>
          </section>
        ))}
      </div>
      <Panel title="Kommunikation">
        <p className="text-sm leading-relaxed text-[var(--av-text)]">
          Ingen intern chatt. Kontakt går via e-post och notiser — inte en inbyggd chatt.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--av-text-muted)]">
          Profilvatten. Artwork i två steg. OB låser spec och pris. Etikettproducent och bottler.
        </p>
      </Panel>
    </DashPage>
  );
}
