import { requireRole } from "@/server/rbac";
import { prisma } from "@/server/db";

export default async function FactoryDocs() {
  const user = await requireRole(["FACTORY", "AQUA_STAFF", "AQUA_ADMIN"]);
  const docs = await prisma.document.findMany({
    where: {
      kind: { in: ["PRODUCTION", "LOGISTICS", "ARTWORK", "WAYBILL"] },
      ...(user.factoryId ? { order: { factoryId: user.factoryId } } : {}),
    },
    include: { order: true },
  });
  return (
    <div>
      <h1 className="text-3xl font-semibold">Dokument</h1>
      <ul className="mt-6 divide-y rounded-2xl bg-white">
        {docs.map((d) => (
          <li key={d.id} className="flex justify-between px-4 py-3 text-sm">
            <span>{d.title}</span>
            <span className="font-mono">{d.order?.orderNo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
