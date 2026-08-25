import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="h-dvh overflow-hidden bg-[#F4F5F7]">{children}</div>;
}
