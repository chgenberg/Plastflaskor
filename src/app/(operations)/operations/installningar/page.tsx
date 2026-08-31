import { getFortnoxConnection } from "@/server/integrations/status";
import { IntegrationBadge } from "@/ui/shell/FortnoxBadge";
import { PageHeader, Panel } from "@/ui/shell/primitives";

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
    <div className="space-y-8">
      <PageHeader
        title="Inställningar"
        subtitle="Mock-portar. UI:t ändras inte när live slås på."
        action={<IntegrationBadge label={fortnox.label} />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => (
          <section key={item.id} className="rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-[17px] font-semibold tracking-tight">{item.title}</h2>
              <IntegrationBadge label={MOCK_LABEL} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#6b7280]">{item.body}</p>
          </section>
        ))}
      </div>
      <Panel title="Kommunikation">
        <p className="text-sm leading-relaxed text-[#1d1d1f]">
          Ingen intern chatt (Word §54). Kontakt går via e-post och notiser — inte en inbyggd chatt.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#6b7280]">
          Pappersmuggar. Tryckfil i två steg. OB låser spec och pris. Ett tryckeri.
        </p>
      </Panel>
    </div>
  );
}
