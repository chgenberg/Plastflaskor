import Image from "next/image";
import type { VisualSpec } from "@/domain/visualSpec";

function Badge({ children, accent }: { children: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${
        accent ? "bg-[#E8EEFA] text-[#3B5BAA]" : "bg-[#f4f5f7] text-[#3f3f46]"
      }`}
    >
      {children}
    </span>
  );
}

export function VisualSpecCard({ spec, compact, dense }: { spec: VisualSpec; compact?: boolean; dense?: boolean }) {
  const badges = [spec.volumeLabel || null, spec.wall, spec.eco ? "ECO-mugg" : null, spec.finish, spec.lid].filter(Boolean) as string[];
  if (dense) {
    return (
      <div className="flex flex-wrap gap-1">
        {badges.slice(0, 3).map((b) => (
          <Badge key={b} accent={b === "ECO-mugg" || b === "Dubbelvägg"}>
            {b}
          </Badge>
        ))}
      </div>
    );
  }
  const img = compact ? "h-[88px] w-[72px]" : "h-[168px] w-[136px]";

  return (
    <div
      className={`flex items-start gap-5 ${compact ? "" : "rounded-[22px] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]"}`}
    >
      <div className={`relative shrink-0 overflow-hidden rounded-2xl bg-[#f4f5f7] ${img}`}>
        {spec.imageSrc ? (
          <Image src={spec.imageSrc} alt={spec.productName} fill className="object-contain p-2" sizes={compact ? "72px" : "136px"} />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.12em] text-[#9ca3af]">Mugg</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Pappersmugg</p>
        <p className={`${compact ? "mt-1 text-xl" : "mt-1.5 text-[28px]"} font-semibold tracking-tight tabular-nums`}>
          {spec.qty.toLocaleString("sv-SE")} st
        </p>
        <p className={`${compact ? "mt-0.5 text-sm" : "mt-1 text-lg"} font-medium`}>
          {spec.volumeLabel ? `${spec.volumeLabel} · ` : ""}
          {spec.productName}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <Badge key={b} accent={b === "ECO-mugg" || b === "Dubbelvägg"}>
              {b}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
