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
import type {
  CreateLeadRoutingRecipientInput,
  Lead,
  LeadRoutingRecipient,
  LeadStatus,
  UpdateLeadRoutingRecipientInput,
} from "@/lib/leads/types";
import type {
  CreateProspectInput,
  CreateProspectInteractionInput,
  Prospect,
  ProspectInteraction,
  ProspectStatus,
  UpdateProspectInput,
} from "@/lib/prospects/types";
import type {
  MarketingSiteSettings,
  UpdateMarketingSiteSettingsInput,
} from "@/lib/vendor/feature-and-profit-types";
import type { SiteTranslation } from "@/lib/i18n/site-translation-types";
import type { MarketingInsights } from "@/lib/analytics/types";
import type {
  CommissionSettings,
  UpdateCommissionSettingsInput,
} from "@/lib/momo/commission";

export async function getMarketingInsights(days = 30): Promise<MarketingInsights> {
  const data = await operatorFetch<{ insights: MarketingInsights }>(
    `/marketing-insights?days=${days}`
  );
  return data.insights;
}

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
    // Server-side co-located Ops must hit a reachable production host. VERCEL_URL
    // is the per-deployment hostname (often SSO-gated); prefer the stable alias.
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const origin =
      typeof window === "undefined" && productionHost
        ? `https://${productionHost.replace(/^https?:\/\//, "")}`
        : typeof window === "undefined" && process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : (process.env.NEXT_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "") ??
            "http://localhost:3000");
    url =
      typeof window === "undefined" ? `${origin}${relative}` : relative;
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

export async function listLeads(filters?: {
  search?: string;
  status?: LeadStatus;
}): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  const data = await operatorFetch<{ leads: Lead[] }>(
    `/leads${query ? `?${query}` : ""}`
  );
  return data.leads;
}

export async function patchLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<Lead> {
  const data = await operatorFetch<{ lead: Lead }>("/leads", {
    method: "PATCH",
    body: JSON.stringify({ leadId, status }),
  });
  return data.lead;
}

export async function listLeadRoutingRecipients(): Promise<
  LeadRoutingRecipient[]
> {
  const data = await operatorFetch<{ recipients: LeadRoutingRecipient[] }>(
    "/lead-routing"
  );
  return data.recipients;
}

export async function createLeadRoutingRecipient(
  input: CreateLeadRoutingRecipientInput
): Promise<LeadRoutingRecipient> {
  const data = await operatorFetch<{ recipient: LeadRoutingRecipient }>(
    "/lead-routing",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  return data.recipient;
}

export async function patchLeadRoutingRecipient(
  recipientId: string,
  input: UpdateLeadRoutingRecipientInput
): Promise<LeadRoutingRecipient> {
  const data = await operatorFetch<{ recipient: LeadRoutingRecipient }>(
    "/lead-routing",
    {
      method: "PATCH",
      body: JSON.stringify({ recipientId, ...input }),
    }
  );
  return data.recipient;
}

export async function deleteLeadRoutingRecipient(
  recipientId: string
): Promise<void> {
  await operatorFetch<{ removed: true }>("/lead-routing", {
    method: "DELETE",
    body: JSON.stringify({ recipientId }),
  });
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

export type VendorPayoutActionResponse = {
  ok: boolean;
  code?: string;
  message: string;
  payout: import("@/lib/types").VendorPayout | null;
  started: boolean;
};

export async function vendorPayoutAction(
  orderId: string,
  action: "retry" | "sync",
): Promise<VendorPayoutActionResponse> {
  return operatorFetch<VendorPayoutActionResponse>(
    `/orders/${encodeURIComponent(orderId)}/payout`,
    {
      method: "POST",
      body: JSON.stringify({ action }),
    },
  );
}

// --- Prospects ---

export async function listProspects(filters?: {
  search?: string;
  status?: ProspectStatus;
}): Promise<Prospect[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  const query = params.toString();
  const data = await operatorFetch<{ prospects: Prospect[] }>(
    `/prospects${query ? `?${query}` : ""}`
  );
  return data.prospects;
}

export async function createProspect(
  input: CreateProspectInput
): Promise<Prospect> {
  const data = await operatorFetch<{ prospect: Prospect }>("/prospects", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.prospect;
}

export async function bulkCreateProspects(
  rows: CreateProspectInput[]
): Promise<Prospect[]> {
  const data = await operatorFetch<{ prospects: Prospect[] }>("/prospects", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
  return data.prospects;
}

export async function patchProspect(
  prospectId: string,
  input: UpdateProspectInput
): Promise<Prospect> {
  const data = await operatorFetch<{ prospect: Prospect }>("/prospects", {
    method: "PATCH",
    body: JSON.stringify({ prospectId, ...input }),
  });
  return data.prospect;
}

export async function addProspectInteraction(
  prospectId: string,
  input: CreateProspectInteractionInput
): Promise<ProspectInteraction> {
  const data = await operatorFetch<{ interaction: ProspectInteraction }>(
    "/prospects",
    {
      method: "POST",
      body: JSON.stringify({
        action: "interact",
        prospectId,
        ...input,
      }),
    }
  );
  return data.interaction;
}

export async function convertProspect(
  prospectId: string,
  vendorId: string,
  leadId?: string
): Promise<Prospect> {
  const data = await operatorFetch<{ prospect: Prospect }>("/prospects", {
    method: "POST",
    body: JSON.stringify({ action: "convert", prospectId, vendorId, leadId }),
  });
  return data.prospect;
}

// --- Marketing site settings ---

export async function getMarketingSiteSettings(): Promise<MarketingSiteSettings> {
  const data = await operatorFetch<{ settings: MarketingSiteSettings }>(
    "/marketing-settings"
  );
  return data.settings;
}

export async function patchMarketingSiteSettings(
  input: UpdateMarketingSiteSettingsInput
): Promise<MarketingSiteSettings> {
  const data = await operatorFetch<{ settings: MarketingSiteSettings }>(
    "/marketing-settings",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
  return data.settings;
}

// --- Site copy translations (Ops → Settings → Languages) ---

export async function listSiteTranslations(
  locale?: string
): Promise<SiteTranslation[]> {
  const query = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  const data = await operatorFetch<{ translations: SiteTranslation[] }>(
    `/site-translations${query}`
  );
  return data.translations;
}

export async function upsertSiteTranslation(
  locale: string,
  key: string,
  value: string
): Promise<SiteTranslation> {
  const data = await operatorFetch<{ translation: SiteTranslation }>(
    "/site-translations",
    {
      method: "PATCH",
      body: JSON.stringify({ locale, key, value }),
    }
  );
  return data.translation;
}

export async function deleteSiteTranslation(
  locale: string,
  key: string
): Promise<boolean> {
  const data = await operatorFetch<{ deleted: boolean }>("/site-translations", {
    method: "DELETE",
    body: JSON.stringify({ locale, key }),
  });
  return data.deleted;
}

// --- Commission settings (ADR-0096 Slice 3) ---

export async function getCommissionSettings(): Promise<CommissionSettings> {
  const data = await operatorFetch<{ settings: CommissionSettings }>(
    "/commission-settings"
  );
  return data.settings;
}

export async function patchCommissionSettings(
  input: UpdateCommissionSettingsInput
): Promise<CommissionSettings> {
  const data = await operatorFetch<{ settings: CommissionSettings }>(
    "/commission-settings",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  );
  return data.settings;
}
