"use server";

import { getStore } from "@/lib/store";
import type { CreateOrderInput, Order } from "@/lib/types";

/**
 * Customer checkout writes the Order through the server-side Store, so it lands
 * in the one source of truth the KDS and the MoMo confirm path both read.
 */
export async function placeOrder(input: CreateOrderInput): Promise<Order> {
  return getStore().createOrder(input);
}
