import { getSessionUser } from "@/server/rbac";
import { Parallax } from "@/ui/motion/Parallax";
import { PublicFooter, PublicHeader } from "@/ui/public/PublicChrome";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <div className="min-h-screen bg-[var(--av-bg)]">
      <PublicHeader email={user?.email} />
      <Parallax />
      {children}
      <PublicFooter />
    </div>
  );
}
