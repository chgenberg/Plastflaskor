import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/rbac";
import { PageIntro, PillLink } from "@/ui/public/PageIntro";

export default async function CheckoutThanksPage() {
  const user = await getSessionUser();
  if (user?.role === "CUSTOMER") redirect("/konto/ordrar");
  if (user?.role === "RESELLER") redirect("/partner/ordrar");
  if (user?.role === "AQUA_STAFF" || user?.role === "AQUA_ADMIN") redirect("/operations");

  return (
    <main className="mx-auto max-w-lg px-4 pb-24 pt-16">
      <PageIntro title="Beställ efter inloggning" />
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--av-text-secondary)]">
        Priser och order ligger i kundportalen. Den publika sidan är till för information, inspiration och offert.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <PillLink href="/login">Logga in</PillLink>
        <PillLink href="/offert" variant="ghost">
          Begär offert
        </PillLink>
      </div>
    </main>
  );
}
