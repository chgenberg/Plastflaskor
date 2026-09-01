import type { ComponentProps } from "react";
import { BuyerOrderDetail } from "@/ui/order/BuyerOrderDetail";
import { OrderPeek } from "@/ui/order/OrderPeek";

export function kontoPeekHref(path: string, orderNo: string, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  params.set("order", orderNo);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function findKontoOrder<T extends { orderNo: string }>(orders: T[], orderNo?: string | null) {
  if (!orderNo) return null;
  return orders.find((order) => order.orderNo === orderNo) ?? null;
}

export function KontoOrderPeek({
  order,
  role,
  closeHref,
}: {
  order: ComponentProps<typeof BuyerOrderDetail>["order"];
  role: string;
  closeHref: string;
}) {
  const [path, qs] = closeHref.split("?");
  const extra = Object.fromEntries(new URLSearchParams(qs ?? ""));
  return (
    <OrderPeek closeHref={closeHref} title={order.orderNo}>
      <BuyerOrderDetail
        order={order}
        role={role}
        repeatHref={`/konto/ordrar/${order.orderNo}/repeat`}
        returnTo={kontoPeekHref(path, order.orderNo, extra)}
        embedded
      />
    </OrderPeek>
  );
}
