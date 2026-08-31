export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export const CHECKOUT_WATER_ONLY = "Endast profilvatten kan beställas.";

export function assertCheckoutWater(category: string) {
  if (category !== "WATER") {
    throw new CheckoutError(CHECKOUT_WATER_ONLY);
  }
}
