"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function OrderPeek({
  closeHref,
  title,
  children,
}: {
  closeHref: string;
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    const onClose = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("order")) router.push(closeHref);
    };
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [closeHref, router]);

  return (
    <dialog
      ref={ref}
      className="av-peek"
      aria-labelledby="av-peek-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="av-peek-panel">
        <div className="av-peek-bar">
          <h2 id="av-peek-title" className="av-peek-title">
            {title}
          </h2>
          <button type="button" className="av-peek-close" onClick={() => ref.current?.close()}>
            Stäng
          </button>
        </div>
        <div className="av-peek-body">{children}</div>
      </div>
    </dialog>
  );
}
