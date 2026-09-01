import { notFound } from "next/navigation";
import { getInboundLabelDispatch } from "@/server/services/labelDispatch.service";
import { requireSupplier, scopedFactoryId } from "@/server/supplierAccess";
import { FileLink, LinkButton, PageHeader } from "@/ui/shell/primitives";
import { ReceiveDispatchForm } from "@/ui/supplier/ReceiveDispatchForm";

export default async function BottlerReceivePage({ params }: { params: Promise<{ reportNo: string }> }) {
  const user = await requireSupplier("bottler");
  const { reportNo } = await params;
  const detail = await getInboundLabelDispatch(decodeURIComponent(reportNo), scopedFactoryId(user));
  if (!detail) notFound();
  const shipped = new Date(detail.shippedAt).toLocaleDateString("sv-SE");

  return (
    <div className="space-y-4">
      <PageHeader
        title={detail.reportNo}
        subtitle="Leveransrapport från etikettproducent. Inga priser."
      />
      <p>
        <LinkButton href="/bottler" variant="ghost" size="sm">
          Tillbaka
        </LinkButton>
      </p>
      <div className="av-card space-y-1 px-4 py-3 text-[13px]">
        <p>
          Skickad {shipped}
          {detail.trackingNo ? ` · tracking ${detail.trackingNo}` : ""}
        </p>
        <p className="tabular-nums text-[var(--av-text-secondary)]">
          {detail.lines.length} ordrar · {detail.lines.reduce((sum, l) => sum + l.qty, 0).toLocaleString("sv-SE")}{" "}
          etiketter
        </p>
        {detail.notes ? <p className="text-[var(--av-text-secondary)]">{detail.notes}</p> : null}
        {detail.documentId ? (
          <p>
            <FileLink href={`/api/documents/${detail.documentId}`}>Öppna leveransrapport</FileLink>
          </p>
        ) : null}
      </div>
      <ReceiveDispatchForm detail={detail} />
    </div>
  );
}
