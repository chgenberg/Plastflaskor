"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AgentRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), 20_000);
    return () => window.clearInterval(id);
  }, [router]);
  return null;
}
