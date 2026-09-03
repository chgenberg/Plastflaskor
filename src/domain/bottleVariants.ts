export function unique<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

export type VariantMatch = {
  id: string;
  volumeMl: number | null;
  waterType: "stilla" | "kolsyrat" | "lime";
  cap?: string;
  color?: string;
};

export const CAP_CHOICES = ["skruvkork", "sportkork"] as const;
export const COLOR_CHOICES = ["transparent", "frost", "black"] as const;

export function matchVariant<T extends VariantMatch>(
  variants: T[],
  volumeMl: number | null,
  waterType: "stilla" | "kolsyrat" | "lime",
  cap?: string,
  color?: string,
): T | undefined {
  return (
    variants.find(
      (v) =>
        v.volumeMl === volumeMl &&
        v.waterType === waterType &&
        (!cap || !v.cap || v.cap === cap) &&
        (!color || !v.color || v.color === color),
    ) ??
    variants.find((v) => v.volumeMl === volumeMl && v.waterType === waterType) ??
    variants.find((v) => v.volumeMl === volumeMl)
  );
}
