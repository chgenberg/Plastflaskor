/** Bottler-listans tre statusar. Jobbstatus och orderstatus slås ihop. */
export function bottlerDeskStatus(input: { jobStatus: string; orderStatus: string }) {
  if (input.orderStatus === "SHIPPED") {
    return { status: "SHIPPED", statusLabel: "Skickad" };
  }
  if (input.jobStatus === "DONE" || input.orderStatus === "READY_TO_SHIP") {
    return { status: "DONE", statusLabel: "Klar" };
  }
  return { status: "NOT_PLANNED", statusLabel: "Etikett mottagen" };
}
