import { Reveal } from "@/ui/motion/Reveal";

export function StatsBand({ moq, leadTimeText }: { moq: number; leadTimeText: string }) {
  const items = [
    { value: "0", label: "Inget att betala vid beställning", hint: "faktura efter leverans" },
    { value: String(moq), label: "minsta antal per order", hint: "flaskor" },
    { value: leadTimeText, label: "normal leveranstid", hint: "Aqua bekräftar datum" },
    { value: "Dalarna", label: "Tollagårdens källa", hint: "svenskt källvatten" },
  ];
  return (
    <section className="av-public-band py-16">
      <Reveal variant="public">
        <div className="av-card grid grid-cols-2 gap-6 p-7 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="av-serif text-3xl tabular-nums tracking-[-0.03em] sm:text-5xl">{item.value}</p>
              <p className="mt-2 text-sm font-medium">{item.label}</p>
              <p className="text-[12px] text-[var(--av-text-muted)]">{item.hint}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
