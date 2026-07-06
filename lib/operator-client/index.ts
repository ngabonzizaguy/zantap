import type {
  MenuItem,
  OperatorAction,
  OperatorOrderPatch,
  OperatorUpdateVendorInput,
  OperatorVendorDetail,
  Order,
  UpdateMenuItemInput,
  Vendor,
  VendorListEntry,
  VendorRecoveryEvent,
} from "@/lib/types";

export function getOperatorApiBaseUrl(): string {
  const configured = process.env.ZANTAP_OPERATOR_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  // Co-located Ops: same-origin relative path. operatorFetch resolves the origin
  // via VERCEL_URL (prod) or localhost in dev — not NEXT_PUBLIC_BASE_URL, which
  // is the public storefront domain and may differ from the deployment host.
  return "/api/operator/v1";
}

function getOperatorApiKey(): string {
  const key = process.env.OPERATOR_API_KEY?.trim();
  if (!key) {
    throw new Error("OPERATOR_API_KEY is not configured");
  }
  return key;
}

async function operatorFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const base = getOperatorApiBaseUrl();
  const relative = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  let url = relative;
  if (!relative.startsWith("http")) {
    const origin =
      process.env.NEXT_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "") ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    url =
      typeof window === "undefined"
        ? `${origin}${relative}`
        : relative;
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${getOperatorApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(
      (payload as { error?: string }).error ?? `Request failed (${response.status})`
    );
  }
  return payload;
}

export async function listVendors(filters?: {
  search?: string;
  isActive?: boolean;
}): Promise<VendorListEntry[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.isActive !== undefined) {
    params.set("isActive", String(filters.isActive));
  }
  const query = params.toString();
  const data = await operatorFetch<{ vendors: VendorListEntry[] }>(
    `/vendors${query ? `?${query}` : ""}`
  );
  return data.vendors;
}

export async function getVendorDetail(
  slug: string
): Promise<OperatorVendorDetail | null> {
  try {
    const data = await operatorFetch<{ detail: OperatorVendorDetail }>(
      `/vendors/${encodeURIComponent(slug)}`
    );
    return data.detail;
  } catch (error) {
    if (error instanceof Error && error.message === "Vendor not found") {
      return null;
    }
    throw error;
  }
}

export async function suspendVendor(
  slug: string,
  reason?: string
): Promise<Vendor> {
  const data = await operatorFetch<{ vendor: Vendor }>(
    `/vendors/${encodeURIComponent(slug)}/suspend`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  );
  return data.vendor;
}

export async function reactivateVendor(slug: string): Promise<Vendor> {
  const data = await operatorFetch<{ vendor: Vendor }>(
    `/vendors/${encodeURIComponent(slug)}/reactivate`,
    { method: "POST", body: "{}" }
  );
  return data.vendor;
}

export async function patchVendor(
  slug: string,
  input: OperatorUpdateVendorInput
): Promise<Vendor> {
  const data = await operatorFetch<{ vendor: Vendor }>(
    `/vendors/${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
  return data.vendor;
}

export async function revokeOwnerToken(slug: string): Promise<Vendor> {
  const data = await operatorFetch<{ vendor: Vendor }>(
    `/vendors/${encodeURIComponent(slug)}/owner-token/revoke`,
    { method: "POST", body: "{}" }
  );
  return data.vendor;
}

export async function reissueOwnerToken(
  slug: string
): Promise<{ ownerToken: string }> {
  return operatorFetch<{ ownerToken: string }>(
    `/vendors/${encodeURIComponent(slug)}/owner-token/reissue`,
    { method: "POST", body: "{}" }
  );
}

export async function listRecoveryEvents(filters?: {
  vendorSlug?: string;
  unreviewedOnly?: boolean;
  limit?: number;
}): Promise<VendorRecoveryEvent[]> {
  const params = new URLSearchParams();
  if (filters?.vendorSlug) params.set("vendorSlug", filters.vendorSlug);
  if (filters?.unreviewedOnly) params.set("unreviewedOnly", "true");
  if (filters?.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  const data = await operatorFetch<{ events: VendorRecoveryEvent[] }>(
    `/recovery-events${query ? `?${query}` : ""}`
  );
  return data.events;
}

export async function reviewRecoveryEvent(
  eventId: string,
  reviewNote?: string
): Promise<VendorRecoveryEvent> {
  const data = await operatorFetch<{ event: VendorRecoveryEvent }>(
    "/recovery-events",
    {
      method: "PATCH",
      body: JSON.stringify({ eventId, reviewNote }),
    }
  );
  return data.event;
}

export async function listAuditActions(
  slug: string,
  limit = 50
): Promise<OperatorAction[]> {
  const data = await operatorFetch<{ actions: OperatorAction[] }>(
    `/vendors/${encodeURIComponent(slug)}/audit?limit=${limit}`
  );
  return data.actions;
}

export async function listVendorMenu(slug: string): Promise<MenuItem[]> {
  const data = await operatorFetch<{ menu: MenuItem[] }>(
    `/vendors/${encodeURIComponent(slug)}/menu`
  );
  return data.menu;
}

export async function patchMenuItem(
  slug: string,
  itemId: string,
  patch: UpdateMenuItemInput
): Promise<MenuItem> {
  const data = await operatorFetch<{ item: MenuItem }>(
    `/vendors/${encodeURIComponent(slug)}/menu`,
    {
      method: "PATCH",
      body: JSON.stringify({ itemId, patch }),
    }
  );
  return data.item;
}

export async function archiveMenuItem(
  slug: string,
  itemId: string
): Promise<MenuItem> {
  const data = await operatorFetch<{ item: MenuItem }>(
    `/vendors/${encodeURIComponent(slug)}/menu`,
    {
      method: "PATCH",
      body: JSON.stringify({ itemId, action: "archive" }),
    }
  );
  return data.item;
}

export async function toggleMenuAvailability(
  slug: string,
  itemId: string
): Promise<MenuItem> {
  const data = await operatorFetch<{ item: MenuItem }>(
    `/vendors/${encodeURIComponent(slug)}/menu`,
    {
      method: "PATCH",
      body: JSON.stringify({ itemId, action: "toggle" }),
    }
  );
  return data.item;
}

export async function patchOrder(
  orderId: string,
  patch: OperatorOrderPatch
): Promise<Order> {
  const data = await operatorFetch<{ order: Order }>(
    `/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    }
  );
  return data.order;
}
