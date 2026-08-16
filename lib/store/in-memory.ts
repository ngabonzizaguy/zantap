import type {
  AbandonManualPaymentResult,
  AddMenuImageInput,
  ConfirmManualPaymentResult,
  ConfirmPaymentResult,
  CreateMenuItemInput,
  CreateOrderInput,
  CreatePaymentInput,
  CreatePaymentResult,
  CreateVendorInput,
  CreateDriverInput,
  Driver,
  KitchenStage,
  MenuImage,
  MenuItem,
  Order,
  OrderHistoryFilters,
  OrderStatus,
  Pagination,
  Payment,
  RecordRecoveryEventInput,
  RecordOperatorActionInput,
  OperatorAction,
  OperatorOrderPatch,
  OperatorReissueTokenResult,
  OperatorUpdateVendorInput,
  OperatorVendorDetail,
  RecoveryEventFilters,
  VendorListEntry,
  VendorListFilters,
  ResumableManualOrder,
  UpdateMenuItemInput,
  UpdateDriverInput,
  UpdateVendorInput,
  Vendor,
  VendorRecoveryEvent,
} from "@/lib/types";
import type { ResettableStore } from "@/lib/store/types";
import type { CreateMarketingFunnelEventInput, MarketingFunnelEvent } from "@/lib/analytics/types";
import type {
  CreateLeadRoutingRecipientInput,
  CreateLeadInput,
  Lead,
  LeadRoutingAssignment,
  LeadRoutingRecipient,
  LeadStatus,
  UpdateLeadRoutingRecipientInput,
} from "@/lib/leads/types";
import { normalizeLeadRoutingRecipient } from "@/lib/leads/routing";
import { canTransitionProspectStatus } from "@/lib/prospects/status";
import type {
  BulkCreateProspectsInput,
  CreateProspectInput,
  CreateProspectInteractionInput,
  Prospect,
  ProspectInteraction,
  ProspectStatus,
  UpdateProspectInput,
} from "@/lib/prospects/types";
import type {
  CreateVendorExpenseInput,
  MarketingSiteSettings,
  ProfitSnapshot,
  UpdateMarketingSiteSettingsInput,
  VendorExpense,
} from "@/lib/vendor/feature-and-profit-types";
import { computeGlowScore } from "@/lib/vendor/profit";
import {
  matchesOrderSearch,
  normalizePagination,
  paymentMatchesFilter,
  resolveDateRange,
  startOfDayInTimezone,
} from "@/lib/orders/history-filters";
import { putMenuImageBlob } from "@/lib/menu/blob-storage";
import { sanitizeItemNotes } from "@/lib/menu/customization";
import { thumbGradientForId } from "@/lib/menu/gradients";
import {
  assertCanAddMenuImage,
  buildMenuBlobPathname,
  MenuImageError,
  nextMenuImageSortOrder,
  pickNextPrimaryImage,
  sortMenuImages,
  validateMenuImageFile,
} from "@/lib/menu/media";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
} from "@/lib/menu/validation";
import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";
import { isWithinPaymentWindow } from "@/lib/momo/payment-window";
import {
  buildMomoUssdDial,
  orderPhoneMatches,
} from "@/lib/momo/ussd-dial";
import {
  isForwardKitchenTransition,
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
} from "@/lib/kds/kitchen-stage";
import {
  DEMO_OWNER_TOKEN_HASH,
  seedDrivers,
  seedMenuItems,
  seedOrders,
  seedVendor,
} from "@/lib/store/seed-data";
import { isReservedVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";
import { mintOwnerToken } from "@/lib/vendor/owner-token";
import { canonicalizePhone } from "@/lib/format";
import {
  deriveDriverHue,
  deriveDriverInitials,
  normalizeDriverName,
} from "@/lib/vendor/driver-display";
import { buildKdsSnapshotRevision } from "@/lib/kds/revision";
import { filterKdsQueueOrders } from "@/lib/kds/visible-orders";

const COUNTED_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];

/**
 * Internal row shape: the domain Vendor plus the server-only owner-token hash.
 * The hash is stripped in cloneVendor so it never crosses the Store seam.
 */
type StoredVendor = Vendor & { ownerTokenHash?: string };

function cloneOrder(order: Order): Order {
  const createdAt = new Date(order.createdAt);
  return {
    ...order,
    createdAt,
    updatedAt: order.updatedAt
      ? new Date(order.updatedAt)
      : new Date(order.paidAt ?? createdAt),
    paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
    assignedDriver: order.assignedDriver ? { ...order.assignedDriver } : undefined,
    orderItems: order.orderItems.map((item) => ({
      ...item,
      menuItem: item.menuItem
        ? {
            ...item.menuItem,
            archivedAt: item.menuItem.archivedAt
              ? new Date(item.menuItem.archivedAt)
              : undefined,
            images: item.menuItem.images?.map((image) => ({
              ...image,
              createdAt: new Date(image.createdAt),
            })),
          }
        : undefined,
    })),
  };
}

function clonePayment(payment: Payment): Payment {
  return { ...payment, createdAt: new Date(payment.createdAt) };
}

/**
 * In-memory adapter: the demo dataset promoted to a real Store implementation.
 * State lives in this closure (one instance per process) so a single dev
 * process has one source of truth. Tests get their own instances and reset
 * between runs. ids are generated internally and must not be assumed by callers.
 */
export function createInMemoryStore(): ResettableStore {
  let menuItems: MenuItem[] = [];
  let menuImages: MenuImage[] = [];
  let orders: Order[] = [];
  let payments: Payment[] = [];
  let vendors: StoredVendor[] = [];
  let leads: Lead[] = [];
  let leadRoutingRecipients: LeadRoutingRecipient[] = [];
  let lastAssignedLeadRoutingRecipientId: string | undefined;
  let recoveryEvents: VendorRecoveryEvent[] = [];
  let operatorActions: OperatorAction[] = [];
  let drivers: Driver[] = [];
  let prospects: Prospect[] = [];
  let prospectInteractions: ProspectInteraction[] = [];
  let expenses: VendorExpense[] = [];
  let marketingFunnelEvents: MarketingFunnelEvent[] = [];
  let marketingSettings: MarketingSiteSettings = {
    id: "default",
    updatedAt: new Date(),
  };
  const siteTranslations = new Map<
    string,
    import("@/lib/i18n/site-translation-types").SiteTranslation
  >();
  let kitchenOpen = true;
  let orderCounter = 0;
  let orderItemCounter = 0;
  let paymentCounter = 0;
  let menuItemCounter = 0;
  let menuImageCounter = 0;
  let vendorCounter = 0;
  let leadCounter = 0;
  let leadRoutingRecipientCounter = 0;
  let leadRoutingAssignmentCounter = 0;
  let recoveryEventCounter = 0;
  let operatorActionCounter = 0;
  let driverCounter = 0;
  let prospectCounter = 0;
  let prospectInteractionCounter = 0;
  let expenseCounter = 0;
  let marketingFunnelEventCounter = 0;

  function cloneVendor(vendor: StoredVendor): Vendor {
    // Strip the server-only owner-token hash — it must never leave the Store.
    const { ownerTokenHash: _ownerTokenHash, ...rest } = vendor;
    return { ...rest, createdAt: new Date(vendor.createdAt) };
  }

  function cloneRecoveryEvent(event: VendorRecoveryEvent): VendorRecoveryEvent {
    return {
      ...event,
      at: new Date(event.at),
      reviewedAt: event.reviewedAt ? new Date(event.reviewedAt) : undefined,
    };
  }

  function cloneOperatorAction(action: OperatorAction): OperatorAction {
    return { ...action, at: new Date(action.at) };
  }

  function cloneLead(lead: Lead): Lead {
    return {
      ...lead,
      consentAt: new Date(lead.consentAt),
      createdAt: new Date(lead.createdAt),
      routingAssignment: lead.routingAssignment
        ? {
            ...lead.routingAssignment,
            assignedAt: new Date(lead.routingAssignment.assignedAt),
          }
        : undefined,
    };
  }

  function cloneLeadRoutingRecipient(
    recipient: LeadRoutingRecipient
  ): LeadRoutingRecipient {
    return {
      ...recipient,
      createdAt: new Date(recipient.createdAt),
      updatedAt: new Date(recipient.updatedAt),
    };
  }

  function isActiveItem(item: MenuItem): boolean {
    return item.archivedAt == null;
  }

  function cloneMenuImage(image: MenuImage): MenuImage {
    return { ...image, createdAt: new Date(image.createdAt) };
  }

  function imagesForItem(itemId: string): MenuImage[] {
    return sortMenuImages(
      menuImages.filter((image) => image.menuItemId === itemId)
    ).map(cloneMenuImage);
  }

  function syncPrimaryToMenuItem(itemId: string): void {
    const index = menuItems.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const primary = menuImages.find(
      (image) => image.menuItemId === itemId && image.isPrimary
    );
    menuItems[index] = {
      ...menuItems[index],
      imageUrl: primary?.url,
    };
  }

  function hydrateMenuItem(item: MenuItem): MenuItem {
    const images = imagesForItem(item.id);
    return {
      ...cloneMenuItem(item),
      images: images.length > 0 ? images : undefined,
    };
  }

  function cloneMenuItem(item: MenuItem): MenuItem {
    return {
      ...item,
      archivedAt: item.archivedAt ? new Date(item.archivedAt) : undefined,
    };
  }

  function load(): void {
    menuItems = seedMenuItems.map((item) => ({ ...item }));
    menuImages = [];
    orders = seedOrders.map(cloneOrder);
    payments = [];
    vendors = [
      { ...seedVendor, ownerTokenHash: DEMO_OWNER_TOKEN_HASH },
    ];
    recoveryEvents = [];
    operatorActions = [];
    leads = [];
    leadRoutingRecipients = [];
    lastAssignedLeadRoutingRecipientId = undefined;
    drivers = seedDrivers.map((driver) => ({ ...driver }));
    prospects = [];
    prospectInteractions = [];
    expenses = [];
    marketingFunnelEvents = [];
    marketingSettings = { id: "default", updatedAt: new Date() };
    kitchenOpen = true;
    orderCounter = 0;
    orderItemCounter = 0;
    paymentCounter = 0;
    vendorCounter = 0;
    recoveryEventCounter = 0;
    driverCounter = 0;
    leadCounter = 0;
    leadRoutingRecipientCounter = 0;
    leadRoutingAssignmentCounter = 0;
    prospectCounter = 0;
    prospectInteractionCounter = 0;
    expenseCounter = 0;
    marketingFunnelEventCounter = 0;
  }

  load();

  async function getVendorBySlug(slug: string): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(slug);
    const vendor = vendors.find((row) => row.slug === normalized);
    return vendor ? cloneVendor(vendor) : null;
  }

  async function isSlugAvailable(slug: string): Promise<boolean> {
    const normalized = normalizeVendorSlug(slug);
    if (!normalized) return false;
    if (isReservedVendorSlug(normalized)) return false;
    return !vendors.some((row) => row.slug === normalized);
  }

  async function createVendor(input: CreateVendorInput): Promise<Vendor> {
    const normalizedSlug = normalizeVendorSlug(input.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid slug");
    }
    if (!(await isSlugAvailable(normalizedSlug))) {
      throw new Error("Slug already taken");
    }

    const vendor: StoredVendor = {
      id: `vendor_${++vendorCounter}_${Date.now()}`,
      name: input.name.trim(),
      slug: normalizedSlug,
      phoneNumber: input.phoneNumber,
      momoCode: input.momoCode,
      isActive: true,
      tagline: input.tagline,
      location: input.location,
      deliveryTime: input.deliveryTime,
      businessCategory: input.businessCategory,
      payoutMethod: input.payoutMethod ?? "MERCHANT_CODE",
      logoUrl: input.logoUrl,
      coverImageUrl: input.coverImageUrl,
      description: input.description,
      featureWhatsappNotify: false,
      featureStockTracking: false,
      featureProfitInsights: false,
      ownerTokenHash: input.ownerTokenHash,
      createdAt: new Date(),
    };
    vendors.push(vendor);
    return cloneVendor(vendor);
  }

  async function updateVendor(
    vendorSlug: string,
    input: UpdateVendorInput
  ): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const index = vendors.findIndex((row) => row.slug === normalized);
    if (index === -1) return null;

    const current = vendors[index];
    if (input.slug !== undefined) {
      const newSlug = normalizeVendorSlug(input.slug);
      if (!newSlug) return null;
      if (newSlug !== current.slug && !(await isSlugAvailable(newSlug))) {
        throw new Error("Slug already taken");
      }
    }

    const updated: StoredVendor = {
      ...current,
      ...(input.slug !== undefined
        ? { slug: normalizeVendorSlug(input.slug)! }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phoneNumber !== undefined
        ? { phoneNumber: input.phoneNumber }
        : {}),
      ...(input.momoCode !== undefined ? { momoCode: input.momoCode } : {}),
      ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.deliveryTime !== undefined
        ? { deliveryTime: input.deliveryTime }
        : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.businessCategory !== undefined
        ? { businessCategory: input.businessCategory }
        : {}),
      ...(input.payoutMethod !== undefined
        ? { payoutMethod: input.payoutMethod }
        : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.coverImageUrl !== undefined
        ? { coverImageUrl: input.coverImageUrl }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    };
    vendors[index] = updated;
    return cloneVendor(updated);
  }

  async function getVendorOwnerTokenHash(
    vendorSlug: string
  ): Promise<string | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const vendor = vendors.find((row) => row.slug === normalized);
    return vendor?.ownerTokenHash ?? null;
  }

  async function setVendorOwnerToken(
    vendorSlug: string,
    ownerTokenHash: string
  ): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const index = vendors.findIndex((row) => row.slug === normalized);
    if (index === -1) return null;

    vendors[index] = { ...vendors[index], ownerTokenHash };
    return cloneVendor(vendors[index]);
  }

  async function recordRecoveryEvent(
    input: RecordRecoveryEventInput
  ): Promise<VendorRecoveryEvent> {
    const event: VendorRecoveryEvent = {
      id: `rec_${++recoveryEventCounter}_${Date.now()}`,
      vendorId: input.vendorId,
      context: input.context,
      at: new Date(),
    };
    recoveryEvents.push(event);
    return cloneRecoveryEvent(event);
  }

  async function listRecoveryEvents(
    vendorId: string
  ): Promise<VendorRecoveryEvent[]> {
    return recoveryEvents
      .filter((event) => event.vendorId === vendorId)
      .map(cloneRecoveryEvent)
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }

  async function listAllRecoveryEvents(
    filters?: RecoveryEventFilters
  ): Promise<VendorRecoveryEvent[]> {
    let rows = recoveryEvents.map(cloneRecoveryEvent);
    if (filters?.vendorSlug) {
      const vendor = vendors.find(
        (v) => v.slug === normalizeVendorSlug(filters.vendorSlug!)
      );
      if (!vendor) return [];
      rows = rows.filter((e) => e.vendorId === vendor.id);
    }
    if (filters?.unreviewedOnly) {
      rows = rows.filter((e) => !e.reviewedAt);
    }
    rows.sort((a, b) => b.at.getTime() - a.at.getTime());
    const limit = filters?.limit ?? 100;
    return rows.slice(0, limit).map((event) => {
      const vendor = vendors.find((v) => v.id === event.vendorId);
      return {
        ...event,
        vendorSlug: vendor?.slug,
        vendorName: vendor?.name,
      };
    });
  }

  async function reviewRecoveryEvent(
    eventId: string,
    reviewNote?: string
  ): Promise<VendorRecoveryEvent | null> {
    const index = recoveryEvents.findIndex((e) => e.id === eventId);
    if (index === -1) return null;
    recoveryEvents[index] = {
      ...recoveryEvents[index],
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || undefined,
    };
    return cloneRecoveryEvent(recoveryEvents[index]);
  }

  async function createLead(input: CreateLeadInput): Promise<Lead> {
    const phone = canonicalizePhone(input.phone);
    if (!phone) throw new Error("Invalid lead phone");

    const lead: Lead = {
      id: `lead_${++leadCounter}_${Date.now()}`,
      businessName: input.businessName.trim(),
      businessType: input.businessType.trim(),
      contactName: input.contactName.trim(),
      phone,
      area: input.area.trim(),
      message: input.message?.trim() || undefined,
      status: "NEW",
      source: input.source?.trim() || undefined,
      consentAt: new Date(input.consentAt),
      createdAt: new Date(),
    };
    leads.unshift(lead);
    return cloneLead(lead);
  }

  async function listLeads(): Promise<Lead[]> {
    return leads.map(cloneLead);
  }

  async function updateLeadStatus(
    leadId: string,
    status: LeadStatus
  ): Promise<Lead | null> {
    const index = leads.findIndex((lead) => lead.id === leadId);
    if (index === -1) return null;
    leads[index] = { ...leads[index], status };
    return cloneLead(leads[index]);
  }

  async function listLeadRoutingRecipients(): Promise<
    LeadRoutingRecipient[]
  > {
    return leadRoutingRecipients.map(cloneLeadRoutingRecipient);
  }

  async function createLeadRoutingRecipient(
    input: CreateLeadRoutingRecipientInput
  ): Promise<LeadRoutingRecipient> {
    const normalized = normalizeLeadRoutingRecipient(input);
    if (
      leadRoutingRecipients.some(
        (recipient) => recipient.phone === normalized.phone
      )
    ) {
      throw new Error("A recipient with this WhatsApp number already exists");
    }
    const now = new Date();
    const recipient: LeadRoutingRecipient = {
      id: `lead_recipient_${++leadRoutingRecipientCounter}_${Date.now()}`,
      ...normalized,
      createdAt: now,
      updatedAt: now,
    };
    leadRoutingRecipients.push(recipient);
    return cloneLeadRoutingRecipient(recipient);
  }

  async function updateLeadRoutingRecipient(
    recipientId: string,
    input: UpdateLeadRoutingRecipientInput
  ): Promise<LeadRoutingRecipient | null> {
    const index = leadRoutingRecipients.findIndex(
      (recipient) => recipient.id === recipientId
    );
    if (index === -1) return null;

    const current = leadRoutingRecipients[index];
    const normalized = normalizeLeadRoutingRecipient({
      name: input.name ?? current.name,
      phone: input.phone ?? current.phone,
      enabled: input.enabled ?? current.enabled,
    });
    if (
      leadRoutingRecipients.some(
        (recipient) =>
          recipient.id !== recipientId && recipient.phone === normalized.phone
      )
    ) {
      throw new Error("A recipient with this WhatsApp number already exists");
    }
    leadRoutingRecipients[index] = {
      ...current,
      ...normalized,
      updatedAt: new Date(),
    };
    return cloneLeadRoutingRecipient(leadRoutingRecipients[index]);
  }

  async function removeLeadRoutingRecipient(
    recipientId: string
  ): Promise<boolean> {
    const index = leadRoutingRecipients.findIndex(
      (recipient) => recipient.id === recipientId
    );
    if (index === -1) return false;
    leadRoutingRecipients.splice(index, 1);
    return true;
  }

  async function assignLeadRoutingRecipient(
    leadId: string
  ): Promise<LeadRoutingAssignment | null> {
    const leadIndex = leads.findIndex((lead) => lead.id === leadId);
    if (leadIndex === -1) return null;
    if (leads[leadIndex].routingAssignment) {
      return cloneLead(leads[leadIndex]).routingAssignment ?? null;
    }

    const enabledRecipients = leadRoutingRecipients.filter(
      (recipient) => recipient.enabled
    );
    if (enabledRecipients.length === 0) return null;

    const previousIndex = enabledRecipients.findIndex(
      (recipient) => recipient.id === lastAssignedLeadRoutingRecipientId
    );
    const recipient =
      enabledRecipients[(previousIndex + 1) % enabledRecipients.length];
    const assignment: LeadRoutingAssignment = {
      id: `lead_assignment_${++leadRoutingAssignmentCounter}_${Date.now()}`,
      leadId,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      assignedAt: new Date(),
    };
    leads[leadIndex] = { ...leads[leadIndex], routingAssignment: assignment };
    lastAssignedLeadRoutingRecipientId = recipient.id;
    return cloneLead(leads[leadIndex]).routingAssignment ?? null;
  }

  async function listVendors(
    filters?: VendorListFilters
  ): Promise<VendorListEntry[]> {
    let rows = vendors.map((vendor) => {
      const vendorEvents = recoveryEvents.filter(
        (e) => e.vendorId === vendor.id
      );
      const lastRecovery = vendorEvents.sort(
        (a, b) => b.at.getTime() - a.at.getTime()
      )[0];
      return {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        phoneNumber: vendor.phoneNumber,
        isActive: vendor.isActive,
        kitchenOpen: kitchenOpen && vendor.isActive,
        createdAt: new Date(vendor.createdAt),
        recoveryEventCount: vendorEvents.length,
        lastRecoveryAt: lastRecovery ? new Date(lastRecovery.at) : undefined,
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.slug.toLowerCase().includes(q) ||
          v.phoneNumber.includes(q)
      );
    }
    if (filters?.isActive !== undefined) {
      rows = rows.filter((v) => v.isActive === filters.isActive);
    }
    return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function getOperatorVendorDetail(
    vendorSlug: string
  ): Promise<OperatorVendorDetail | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const menu = await getMenu(vendorSlug);
    const vendorOrders = orders.filter((o) => o.vendorId === vendor.id);
    const activeOrderCount = vendorOrders.filter((o) =>
      ["PAID", "DISPATCHED", "PENDING"].includes(o.status)
    ).length;
    const vendorRecovery = recoveryEvents.filter(
      (e) => e.vendorId === vendor.id
    );
    const recentOrders = vendorOrders
      .map(cloneOrder)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    const tracked = menu.filter((item) => item.stockCount != null);
    const low = tracked.filter(
      (item) =>
        item.stockCount != null &&
        item.stockCount <= (item.lowStockThreshold ?? 0)
    );
    const todayGrossRwf = await getTodayGross(vendorSlug);
    const weekdayAverageRwf = await getWeekdayAverageGross(vendorSlug);
    const weekTo = new Date();
    const weekFrom = new Date(weekTo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekProfit = await getProfitSnapshot(vendorSlug, weekFrom, weekTo);

    return {
      vendor,
      menuItemCount: menu.length,
      activeOrderCount,
      recoveryEventCount: vendorRecovery.length,
      recentOrders,
      stockTrackedItemCount: tracked.length,
      stockLowItemCount: low.length,
      todayGrossRwf,
      weekdayAverageRwf,
      weekProfitRwf: weekProfit?.periodProfitRwf,
    };
  }

  async function setVendorActive(
    vendorSlug: string,
    active: boolean,
    _reason?: string
  ): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const index = vendors.findIndex((row) => row.slug === normalized);
    if (index === -1) return null;
    vendors[index] = { ...vendors[index], isActive: active };
    if (!active) {
      kitchenOpen = false;
    }
    return cloneVendor(vendors[index]);
  }

  async function operatorUpdateVendor(
    vendorSlug: string,
    input: OperatorUpdateVendorInput
  ): Promise<Vendor | null> {
    const {
      isActive: nextActive,
      kitchenOpen: nextKitchenOpen,
      featureWhatsappNotify,
      featureStockTracking,
      featureProfitInsights,
      ...rest
    } = input;
    const updated = await updateVendor(vendorSlug, rest);
    if (!updated) return null;

    const normalized = normalizeVendorSlug(vendorSlug);
    const vendorIdx = vendors.findIndex((row) => row.slug === normalized);
    if (vendorIdx !== -1) {
      if (featureWhatsappNotify !== undefined)
        vendors[vendorIdx] = { ...vendors[vendorIdx], featureWhatsappNotify };
      if (featureStockTracking !== undefined)
        vendors[vendorIdx] = { ...vendors[vendorIdx], featureStockTracking };
      if (featureProfitInsights !== undefined)
        vendors[vendorIdx] = { ...vendors[vendorIdx], featureProfitInsights };
    }

    if (nextActive !== undefined) {
      return setVendorActive(vendorSlug, nextActive);
    }
    if (nextKitchenOpen !== undefined) {
      kitchenOpen = nextKitchenOpen;
    }
    return getVendorBySlug(vendorSlug);
  }

  async function operatorRevokeOwnerToken(
    vendorSlug: string
  ): Promise<Vendor | null> {
    return setVendorOwnerToken(vendorSlug, "");
  }

  async function operatorReissueOwnerToken(
    vendorSlug: string
  ): Promise<OperatorReissueTokenResult | null> {
    const { token, hash } = mintOwnerToken();
    const updated = await setVendorOwnerToken(vendorSlug, hash);
    if (!updated) return null;
    return { ownerToken: token };
  }

  async function operatorUpdateOrder(
    orderId: string,
    patch: OperatorOrderPatch
  ): Promise<Order | null> {
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;
    let order = orders[index];
    if (patch.status !== undefined) {
      order = {
        ...order,
        status: patch.status,
        updatedAt: new Date(),
        ...(patch.status === "PAID" && !order.paidAt
          ? { paidAt: new Date(), kitchenStage: "NEW" as KitchenStage }
          : {}),
      };
    }
    if (patch.kitchenStage !== undefined) {
      order = {
        ...order,
        kitchenStage: patch.kitchenStage,
        updatedAt: new Date(),
      };
    }
    orders[index] = order;
    return cloneOrder(order);
  }

  async function recordOperatorAction(
    input: RecordOperatorActionInput
  ): Promise<OperatorAction> {
    const action: OperatorAction = {
      id: `op_${++operatorActionCounter}_${Date.now()}`,
      vendorId: input.vendorId,
      action: input.action,
      detail: input.detail,
      operatorId: input.operatorId ?? "platform",
      at: new Date(),
    };
    operatorActions.push(action);
    return cloneOperatorAction(action);
  }

  async function listOperatorActions(
    vendorSlug?: string,
    limit = 50
  ): Promise<OperatorAction[]> {
    const vendor = vendorSlug ? await getVendorBySlug(vendorSlug) : undefined;
    if (vendorSlug && !vendor) return [];
    return operatorActions
      .filter((a) => !vendorSlug || a.vendorId === vendor?.id)
      .map(cloneOperatorAction)
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);
  }

  async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return menuItems
      .filter((item) => item.vendorId === vendor.id && isActiveItem(item))
      .map(hydrateMenuItem);
  }

  async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
    const menu = await getMenu(vendorSlug);
    return menu.filter((item) => item.isAvailable);
  }

  async function getArchivedMenu(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return menuItems
      .filter((item) => item.vendorId === vendor.id && !isActiveItem(item))
      .map(hydrateMenuItem);
  }

  async function getMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const item = menuItems.find(
      (row) => row.id === itemId && row.vendorId === vendor.id
    );
    return item ? hydrateMenuItem(item) : null;
  }

  async function getCategories(vendorSlug: string): Promise<string[]> {
    const menu = await getMenu(vendorSlug);
    const categories = [...new Set(menu.map((item) => item.category))].sort();
    return ["All", ...categories];
  }

  async function createMenuItem(
    vendorSlug: string,
    input: CreateMenuItemInput
  ): Promise<MenuItem> {
    const validationError = validateCreateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) throw new Error("Vendor not found");

    const id = `mi_${++menuItemCounter}_${Date.now()}`;
    const gradient = thumbGradientForId(id);
    const item: MenuItem = {
      id,
      vendorId: vendor.id,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      priceRwf: input.priceRwf,
      category: input.category?.trim() || "General",
      isAvailable: true,
      ...gradient,
    };
    menuItems.push(item);
    return cloneMenuItem(item);
  }

  async function updateMenuItem(
    vendorSlug: string,
    itemId: string,
    input: UpdateMenuItemInput
  ): Promise<MenuItem | null> {
    const validationError = validateUpdateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id
    );
    if (index === -1) return null;

    const current = menuItems[index];
    menuItems[index] = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      priceRwf: input.priceRwf ?? current.priceRwf,
      description:
        input.description !== undefined
          ? input.description.trim() || undefined
          : current.description,
      category:
        input.category !== undefined
          ? input.category.trim() || "General"
          : current.category,
      ...(input.stockCount !== undefined
        ? { stockCount: input.stockCount ?? undefined }
        : {}),
      ...(input.lowStockThreshold !== undefined
        ? { lowStockThreshold: input.lowStockThreshold ?? undefined }
        : {}),
      ...(input.costPriceRwf !== undefined
        ? { costPriceRwf: input.costPriceRwf ?? undefined }
        : {}),
    };
    return cloneMenuItem(menuItems[index]);
  }

  async function archiveMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id
    );
    if (index === -1) return null;

    menuItems[index] = {
      ...menuItems[index],
      archivedAt: new Date(),
    };
    return cloneMenuItem(menuItems[index]);
  }

  async function restoreMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id
    );
    if (index === -1) return null;

    const { archivedAt: _archivedAt, ...rest } = menuItems[index];
    menuItems[index] = rest;
    return cloneMenuItem(menuItems[index]);
  }

  async function renameCategory(
    vendorSlug: string,
    from: string,
    to: string
  ): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;

    const trimmedTo = to.trim() || "General";
    let updated = 0;
    menuItems = menuItems.map((item) => {
      if (
        item.vendorId === vendor.id &&
        isActiveItem(item) &&
        item.category === from
      ) {
        updated += 1;
        return { ...item, category: trimmedTo };
      }
      return item;
    });
    return updated;
  }

  async function addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput
  ): Promise<MenuImage> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    const existing = menuImages.filter((image) => image.menuItemId === itemId);
    assertCanAddMenuImage(existing.length);

    const isFirst = existing.length === 0;
    const image: MenuImage = {
      id: `mimg_${++menuImageCounter}_${Date.now()}`,
      menuItemId: itemId,
      url: input.url.trim(),
      sortOrder: nextMenuImageSortOrder(existing),
      isPrimary: isFirst,
      createdAt: new Date(),
    };
    menuImages.push(image);
    if (isFirst) syncPrimaryToMenuItem(itemId);
    return cloneMenuImage(image);
  }

  async function uploadMenuImageBlob(
    vendorSlug: string,
    itemId: string,
    file: Buffer,
    mime: string
  ): Promise<MenuImage> {
    const validationError = validateMenuImageFile(file.byteLength, mime);
    if (validationError) {
      throw new Error(validationError);
    }

    const pathname = buildMenuBlobPathname(vendorSlug, itemId, mime);
    const uploaded = await putMenuImageBlob(pathname, file, mime);
    return addMenuImage(vendorSlug, itemId, {
      url: uploaded.url,
    }).then((image) => {
      const index = menuImages.findIndex((row) => row.id === image.id);
      if (index !== -1) {
        menuImages[index] = { ...menuImages[index], blobPath: pathname };
      }
      return { ...image, blobPath: pathname };
    });
  }

  async function reorderMenuImages(
    vendorSlug: string,
    itemId: string,
    imageIds: string[]
  ): Promise<MenuImage[]> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item?.images?.length) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    const itemImages = menuImages.filter((image) => image.menuItemId === itemId);
    if (
      imageIds.length !== itemImages.length ||
      !imageIds.every((id) => itemImages.some((image) => image.id === id))
    ) {
      throw new MenuImageError("Image set mismatch", "INVALID_SET");
    }

    imageIds.forEach((id, sortOrder) => {
      const index = menuImages.findIndex((image) => image.id === id);
      if (index !== -1) {
        menuImages[index] = { ...menuImages[index], sortOrder };
      }
    });

    return imagesForItem(itemId);
  }

  async function setPrimaryMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<MenuImage | null> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) return null;

    const target = menuImages.find(
      (image) => image.menuItemId === itemId && image.id === imageId
    );
    if (!target) return null;

    menuImages = menuImages.map((image) =>
      image.menuItemId === itemId
        ? { ...image, isPrimary: image.id === imageId }
        : image
    );
    syncPrimaryToMenuItem(itemId);
    return cloneMenuImage({ ...target, isPrimary: true });
  }

  async function removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<boolean> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) return false;

    const index = menuImages.findIndex(
      (image) => image.menuItemId === itemId && image.id === imageId
    );
    if (index === -1) return false;

    const removed = menuImages[index];
    menuImages.splice(index, 1);

    if (removed.isPrimary) {
      const next = pickNextPrimaryImage(
        menuImages.filter((image) => image.menuItemId === itemId)
      );
      menuImages = menuImages.map((image) =>
        image.menuItemId === itemId
          ? { ...image, isPrimary: next ? image.id === next.id : false }
          : image
      );
    }

    syncPrimaryToMenuItem(itemId);
    return true;
  }

  async function listOrders(vendorSlug: string): Promise<Order[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return orders
      .filter((o) => o.vendorId === vendor.id)
      .map(cloneOrder)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function listActiveOrders(vendorSlug: string): Promise<Order[]> {
    const all = await listOrders(vendorSlug);
    return all.filter((o) => o.status === "PAID" || o.status === "DISPATCHED");
  }

  async function listKdsOrders(vendorSlug: string): Promise<Order[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return filterKdsQueueOrders(
      orders.filter((o) => o.vendorId === vendor.id).map(cloneOrder)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function getKdsSnapshotRevision(vendorSlug: string): Promise<string> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return "missing";

    const queueOrders = filterKdsQueueOrders(
      orders.filter((o) => o.vendorId === vendor.id)
    );
    const activeMenu = menuItems.filter(
      (item) => item.vendorId === vendor.id && isActiveItem(item)
    );
    const todayGross = grossForDatePreset(vendor.id, "today");
    const yesterdayGross = grossForDatePreset(vendor.id, "yesterday");

    return buildKdsSnapshotRevision({
      orders: queueOrders.map((order) => ({
        id: order.id,
        status: order.status,
        kitchenStage: order.kitchenStage,
        totalAmount: order.totalAmount,
      })),
      menu: activeMenu.map((item) => ({
        id: item.id,
        isAvailable: item.isAvailable,
      })),
      todayGross,
      yesterdayGross,
      kitchenOpen: kitchenOpen && vendor.isActive,
    });
  }

  function paymentForOrder(orderId: string): Payment | null {
    return payments.find((p) => p.orderId === orderId) ?? null;
  }

  async function listOrdersFiltered(
    vendorSlug: string,
    filters: OrderHistoryFilters,
    pagination: Pagination
  ) {
    const vendor = await getVendorBySlug(vendorSlug);
    const { page, pageSize, skip } = normalizePagination(pagination);

    if (!vendor) {
      return { orders: [], total: 0, page, pageSize };
    }

    const range = resolveDateRange(filters);
    const statusFilter =
      filters.status && filters.status !== "ALL" ? filters.status : null;
    const paymentFilter =
      filters.paymentStatus && filters.paymentStatus !== "ALL"
        ? filters.paymentStatus
        : null;
    const search = filters.search?.trim() ?? "";

    let matched = orders.filter((o) => o.vendorId === vendor.id);

    if (range) {
      matched = matched.filter(
        (o) => o.createdAt >= range.from && o.createdAt <= range.to
      );
    }

    if (statusFilter) {
      matched = matched.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter) {
      matched = matched.filter((o) =>
        paymentMatchesFilter(paymentForOrder(o.id)?.status, paymentFilter)
      );
    }

    if (search) {
      matched = matched.filter((o) => matchesOrderSearch(o, search));
    }

    matched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = matched.length;
    const slice = matched.slice(skip, skip + pageSize);

    return {
      orders: slice.map((order) => ({
        order: cloneOrder(order),
        paymentStatus: paymentForOrder(order.id)?.status ?? null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async function getOrder(orderId: string): Promise<Order | null> {
    const order = orders.find((o) => o.id === orderId);
    return order ? cloneOrder(order) : null;
  }

  async function createOrder(input: CreateOrderInput): Promise<Order> {
    const vendor = await getVendorBySlug(input.vendorSlug);
    if (!vendor) throw new Error("Vendor not found");
    if (!vendor.isActive) {
      throw new Error("This storefront is temporarily unavailable");
    }

    const menu = await getMenu(input.vendorSlug);
    const id = `ord_${++orderCounter}_${Date.now()}`;

    const orderItems = input.items.map((line) => {
      const menuItem = menu.find((m) => m.id === line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Error(`Item unavailable: ${line.menuItemId}`);
      }
      const notes = line.notes ? sanitizeItemNotes(line.notes) : undefined;
      return {
        id: `oi_${++orderItemCounter}_${Date.now()}`,
        orderId: id,
        menuItemId: menuItem.id,
        menuItem: hydrateMenuItem(menuItem),
        quantity: line.quantity,
        unitPriceRwf: menuItem.priceRwf,
        ...(notes ? { notes } : {}),
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceRwf,
      0
    );

    const order: Order = {
      id,
      vendorId: vendor.id,
      customerPhone: input.customerPhone,
      deliverySector: input.deliverySector,
      landmark: input.landmark,
      totalAmount,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
      orderItems,
    };

    orders = [order, ...orders];
    return cloneOrder(order);
  }

  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null> {
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const current = orders[index];
    const kitchenStage = kitchenStageForOrderStatus(status);
    const paidAt =
      status === "PAID" && !current.paidAt ? new Date() : current.paidAt;

    orders[index] = {
      ...current,
      status,
      ...(kitchenStage != null ? { kitchenStage } : {}),
      paidAt,
      updatedAt: new Date(),
    };
    return cloneOrder(orders[index]);
  }

  async function updateKitchenStage(
    orderId: string,
    stage: KitchenStage
  ): Promise<Order | null> {
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) return null;

    const current = orders[index];
    if (current.kitchenStage == null) return null;
    if (
      current.kitchenStage !== stage &&
      !isForwardKitchenTransition(current.kitchenStage, stage)
    ) {
      return null;
    }

    const statusSideEffect = orderStatusForKitchenStage(stage);
    orders[index] = {
      ...current,
      kitchenStage: stage,
      ...(statusSideEffect ? { status: statusSideEffect } : {}),
      updatedAt: new Date(),
    };
    return cloneOrder(orders[index]);
  }

  async function bulkUpdateKitchenStage(
    orderIds: string[],
    stage: KitchenStage
  ): Promise<Order[]> {
    const updated: Order[] = [];
    for (const orderId of orderIds) {
      const order = await updateKitchenStage(orderId, stage);
      if (order) updated.push(order);
    }
    return updated;
  }

  async function toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) =>
        item.id === itemId && item.vendorId === vendor.id && isActiveItem(item)
    );
    if (index === -1) return null;

    menuItems[index] = {
      ...menuItems[index],
      isAvailable: !menuItems[index].isAvailable,
    };
    return { ...menuItems[index] };
  }

  async function setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];

    menuItems = menuItems.map((item) =>
      item.vendorId === vendor.id && isActiveItem(item)
        ? { ...item, isAvailable: true }
        : item
    );
    return getMenu(vendorSlug);
  }

  async function getDrivers(vendorSlug: string): Promise<Driver[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    return drivers
      .filter((d) => d.vendorId === vendor.id)
      .map((d) => ({ ...d }));
  }

  function normalizeDriverPhone(phone: string): string | null {
    return canonicalizePhone(phone, "250");
  }

  async function createDriver(
    vendorSlug: string,
    input: CreateDriverInput
  ): Promise<Driver> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    const name = normalizeDriverName(input.name);
    if (!name) {
      throw new Error("Driver name is required");
    }

    const phone = normalizeDriverPhone(input.phone);
    if (!phone) {
      throw new Error("Valid driver phone is required");
    }

    const existingCount = drivers.filter((d) => d.vendorId === vendor.id).length;
    const driver: Driver = {
      id: `drv_${++driverCounter}_${Date.now()}`,
      vendorId: vendor.id,
      name,
      phone,
      initials: deriveDriverInitials(name),
      hue: deriveDriverHue(existingCount),
    };
    drivers.push(driver);
    return { ...driver };
  }

  async function updateDriver(
    vendorSlug: string,
    driverId: string,
    input: UpdateDriverInput
  ): Promise<Driver | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = drivers.findIndex(
      (driver) => driver.id === driverId && driver.vendorId === vendor.id
    );
    if (index < 0) return null;

    const existing = drivers[index];
    const name =
      input.name !== undefined ? normalizeDriverName(input.name) : existing.name;
    if (!name) {
      throw new Error("Driver name is required");
    }

    const phone =
      input.phone !== undefined
        ? normalizeDriverPhone(input.phone)
        : existing.phone;
    if (!phone) {
      throw new Error("Valid driver phone is required");
    }

    const updated: Driver = {
      ...existing,
      name,
      phone,
      initials: deriveDriverInitials(name),
    };
    drivers[index] = updated;
    orders = orders.map((order) =>
      order.driverId === driverId
        ? { ...order, assignedDriver: { ...updated } }
        : order
    );
    return { ...updated };
  }

  async function deleteDriver(
    vendorSlug: string,
    driverId: string
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;

    const before = drivers.length;
    drivers = drivers.filter(
      (driver) => !(driver.id === driverId && driver.vendorId === vendor.id)
    );
    if (drivers.length === before) return false;

    orders = orders.map((order) =>
      order.driverId === driverId
        ? { ...order, driverId: undefined, assignedDriver: undefined }
        : order
    );
    return true;
  }

  async function assignOrderDriver(
    orderId: string,
    driverId: string
  ): Promise<Order | null> {
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const order = orders[index];
    const driver = drivers.find(
      (row) => row.id === driverId && row.vendorId === order.vendorId
    );
    if (!driver) return null;

    const updated: Order = {
      ...order,
      driverId,
      assignedDriver: { ...driver },
    };
    orders[index] = updated;
    return cloneOrder(updated);
  }

  async function bulkAssignOrderDriver(
    orderIds: string[],
    driverId: string
  ): Promise<Order[]> {
    const updated: Order[] = [];
    for (const orderId of orderIds) {
      const order = await assignOrderDriver(orderId, driverId);
      if (order) updated.push(order);
    }
    return updated;
  }

  function grossForDatePreset(
    vendorId: string,
    preset: "today" | "yesterday"
  ): number {
    const range = resolveDateRange({ datePreset: preset });
    if (!range) return 0;

    return orders
      .filter(
        (o) =>
          o.vendorId === vendorId &&
          o.createdAt >= range.from &&
          o.createdAt <= range.to &&
          COUNTED_STATUSES.includes(o.status)
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }

  async function getTodayGross(vendorSlug: string): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;
    return grossForDatePreset(vendor.id, "today");
  }

  async function getYesterdayGross(vendorSlug: string): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;
    return grossForDatePreset(vendor.id, "yesterday");
  }

  async function isKitchenOpen(vendorSlug: string): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    return kitchenOpen && vendor.isActive;
  }

  async function setKitchenOpen(
    vendorSlug: string,
    open: boolean
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    kitchenOpen = open;
    return kitchenOpen;
  }

  async function createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> {
    const order = orders.find((o) => o.id === input.orderId);
    if (!order) {
      return { ok: false, code: "ORDER_NOT_FOUND" };
    }

    const existing = payments.find((p) => p.orderId === input.orderId);
    if (existing) {
      if (existing.status === "PENDING" || existing.status === "SUCCESS") {
        return { ok: true, payment: clonePayment(existing) };
      }
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }

    const payment: Payment = {
      id: `pay_${++paymentCounter}_${Date.now()}`,
      orderId: input.orderId,
      amount: input.amount,
      provider: input.provider ?? "MTN_MOMO",
      transactionRef: input.transactionRef,
      status: "PENDING",
      createdAt: new Date(),
    };

    payments = [...payments, payment];
    return { ok: true, payment: clonePayment(payment) };
  }

  async function getPaymentByRef(ref: string): Promise<Payment | null> {
    const payment = payments.find((p) => p.transactionRef === ref);
    return payment ? clonePayment(payment) : null;
  }

  async function getPaymentForOrder(orderId: string): Promise<Payment | null> {
    const payment = paymentForOrder(orderId);
    return payment ? clonePayment(payment) : null;
  }

  function decrementStockForOrder(orderId: string): void {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    for (const line of order.orderItems) {
      const itemIdx = menuItems.findIndex((m) => m.id === line.menuItemId);
      if (itemIdx === -1) continue;
      const item = menuItems[itemIdx];
      if (item.stockCount != null) {
        menuItems[itemIdx] = {
          ...item,
          stockCount: Math.max(0, item.stockCount - line.quantity),
        };
      }
    }
  }

  async function confirmPayment(
    ref: string,
    pin: string
  ): Promise<ConfirmPaymentResult> {
    const index = payments.findIndex((p) => p.transactionRef === ref);
    if (index === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[index];

    if (payment.status === "SUCCESS") {
      return { ok: true, payment: clonePayment(payment) };
    }

    if (payment.status === "FAILED") {
      return {
        ok: false,
        code: "PAYMENT_TERMINALLY_FAILED",
        payment: clonePayment(payment),
      };
    }

    if (pin !== MOMO_SIM_VALID_PIN) {
      return {
        ok: false,
        code: "INVALID_PIN",
        payment: clonePayment(payment),
      };
    }

    payments[index] = { ...payment, status: "SUCCESS" };
    await updateOrderStatus(payment.orderId, "PAID");
    decrementStockForOrder(payment.orderId);

    return { ok: true, payment: clonePayment(payments[index]) };
  }

  async function confirmManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<ConfirmManualPaymentResult> {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const order = orders[orderIndex];
    const vendorRow = vendors.find((v) => v.id === order.vendorId);
    if (!vendorRow?.isActive) {
      return { ok: false, code: "ORDER_NOT_PENDING" };
    }

    if (!orderPhoneMatches(order.customerPhone, customerPhone)) {
      return { ok: false, code: "PHONE_MISMATCH" };
    }

    const paymentIndex = payments.findIndex((p) => p.orderId === orderId);
    if (paymentIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[paymentIndex];

    if (payment.status === "SUCCESS" && order.status === "PAID") {
      return {
        ok: true,
        payment: clonePayment(payment),
        order: cloneOrder(order),
      };
    }

    if (order.status === "CANCELLED" || payment.status === "FAILED") {
      return { ok: false, code: "WINDOW_EXPIRED" };
    }

    if (order.status !== "PENDING") {
      return { ok: false, code: "ORDER_NOT_PENDING" };
    }

    if (!isWithinPaymentWindow(order.createdAt)) {
      return { ok: false, code: "WINDOW_EXPIRED" };
    }

    if (payment.status !== "PENDING") {
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }

    payments[paymentIndex] = { ...payment, status: "SUCCESS" };
    await updateOrderStatus(orderId, "PAID");
    decrementStockForOrder(orderId);
    const updatedOrder = orders.find((o) => o.id === orderId);

    return {
      ok: true,
      payment: clonePayment(payments[paymentIndex]),
      order: cloneOrder(updatedOrder ?? order),
    };
  }

  async function abandonManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<AbandonManualPaymentResult> {
    const orderIndex = orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const order = orders[orderIndex];
    if (!orderPhoneMatches(order.customerPhone, customerPhone)) {
      return { ok: false, code: "PHONE_MISMATCH" };
    }

    if (order.status === "PAID") {
      return { ok: false, code: "ALREADY_PAID" };
    }

    const paymentIndex = payments.findIndex((p) => p.orderId === orderId);
    if (paymentIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[paymentIndex];

    if (order.status === "CANCELLED" && payment.status === "FAILED") {
      return {
        ok: true,
        payment: clonePayment(payment),
        order: cloneOrder(order),
      };
    }

    payments[paymentIndex] = { ...payment, status: "FAILED" };
    await updateOrderStatus(orderId, "CANCELLED");
    const updatedOrder = orders.find((o) => o.id === orderId);

    return {
      ok: true,
      payment: clonePayment(payments[paymentIndex]),
      order: cloneOrder(updatedOrder ?? order),
    };
  }

  async function findResumableManualOrder(
    vendorSlug: string,
    customerPhone: string
  ): Promise<ResumableManualOrder | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const candidates = orders
      .filter(
        (order) =>
          order.vendorId === vendor.id &&
          order.status === "PENDING" &&
          isWithinPaymentWindow(order.createdAt)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const order of candidates) {
      if (!orderPhoneMatches(order.customerPhone, customerPhone)) continue;
      const payment = paymentForOrder(order.id);
      if (!payment || payment.status !== "PENDING") continue;

      const dial = buildMomoUssdDial(vendor, order.totalAmount);
      if (!dial.ok) continue;

      return { order: cloneOrder(order), ussdDial: dial.ussd };
    }

    return null;
  }

  // ─── Prospects ──────────────────────────────────────────────────────────────

  async function createProspect(input: CreateProspectInput): Promise<Prospect> {
    const now = new Date();
    const prospect: Prospect = {
      id: `prospect_${++prospectCounter}_${Date.now()}`,
      businessName: input.businessName.trim(),
      contactName: input.contactName?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      area: input.area?.trim() || undefined,
      source: input.source?.trim() || undefined,
      mapsUrl: input.mapsUrl?.trim() || undefined,
      instagramHandle: input.instagramHandle?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      status: "FOUND",
      nextFollowUpAt: input.nextFollowUpAt,
      createdAt: now,
      updatedAt: now,
    };
    prospects.push(prospect);
    return { ...prospect, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  async function bulkCreateProspects(input: BulkCreateProspectsInput): Promise<Prospect[]> {
    const results: Prospect[] = [];
    for (const row of input.rows) {
      results.push(await createProspect(row));
    }
    return results;
  }

  async function listProspects(status?: ProspectStatus): Promise<Prospect[]> {
    let rows = [...prospects];
    if (status) rows = rows.filter((p) => p.status === status);
    rows.sort((a, b) => {
      const aFollow = a.nextFollowUpAt?.getTime() ?? Infinity;
      const bFollow = b.nextFollowUpAt?.getTime() ?? Infinity;
      if (aFollow !== bFollow) return aFollow - bFollow;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    return rows.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      nextFollowUpAt: p.nextFollowUpAt ? new Date(p.nextFollowUpAt) : undefined,
      interactions: prospectInteractions
        .filter((i) => i.prospectId === p.id)
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .map((i) => ({ ...i, at: new Date(i.at) })),
    }));
  }

  async function getProspect(prospectId: string): Promise<Prospect | null> {
    const p = prospects.find((row) => row.id === prospectId);
    if (!p) return null;
    return {
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
      nextFollowUpAt: p.nextFollowUpAt ? new Date(p.nextFollowUpAt) : undefined,
      interactions: prospectInteractions
        .filter((i) => i.prospectId === p.id)
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .map((i) => ({ ...i, at: new Date(i.at) })),
    };
  }

  async function updateProspect(
    prospectId: string,
    input: UpdateProspectInput
  ): Promise<Prospect | null> {
    const idx = prospects.findIndex((p) => p.id === prospectId);
    if (idx === -1) return null;
    const existing = prospects[idx];

    if (input.status !== undefined && input.status !== existing.status) {
      if (!canTransitionProspectStatus(existing.status, input.status)) {
        throw new Error(
          `Invalid status transition: ${existing.status} → ${input.status}`
        );
      }
    }

    const updated: Prospect = { ...existing, updatedAt: new Date() };
    if (input.businessName !== undefined) updated.businessName = input.businessName.trim();
    if (input.contactName !== undefined) updated.contactName = input.contactName?.trim() || undefined;
    if (input.phone !== undefined) updated.phone = input.phone?.trim() || undefined;
    if (input.area !== undefined) updated.area = input.area?.trim() || undefined;
    if (input.source !== undefined) updated.source = input.source?.trim() || undefined;
    if (input.mapsUrl !== undefined) updated.mapsUrl = input.mapsUrl?.trim() || undefined;
    if (input.instagramHandle !== undefined) updated.instagramHandle = input.instagramHandle?.trim() || undefined;
    if (input.notes !== undefined) updated.notes = input.notes?.trim() || undefined;
    if (input.status !== undefined) updated.status = input.status;
    if (input.nextFollowUpAt !== undefined) updated.nextFollowUpAt = input.nextFollowUpAt ?? undefined;
    if (input.convertedVendorId !== undefined) updated.convertedVendorId = input.convertedVendorId ?? undefined;
    if (input.convertedLeadId !== undefined) updated.convertedLeadId = input.convertedLeadId ?? undefined;

    prospects[idx] = updated;
    return getProspect(prospectId);
  }

  async function addProspectInteraction(
    prospectId: string,
    input: CreateProspectInteractionInput
  ): Promise<ProspectInteraction | null> {
    if (!prospects.find((p) => p.id === prospectId)) return null;
    const interaction: ProspectInteraction = {
      id: `pi_${++prospectInteractionCounter}_${Date.now()}`,
      prospectId,
      channel: input.channel,
      note: input.note?.trim() || undefined,
      at: input.at ?? new Date(),
    };
    prospectInteractions.push(interaction);
    return { ...interaction, at: new Date(interaction.at) };
  }

  async function convertProspect(
    prospectId: string,
    vendorId: string,
    leadId?: string
  ): Promise<Prospect | null> {
    const idx = prospects.findIndex((p) => p.id === prospectId);
    if (idx === -1) return null;
    const existing = prospects[idx];
    if (!canTransitionProspectStatus(existing.status, "CONVERTED")) {
      throw new Error(`Invalid status transition: ${existing.status} → CONVERTED`);
    }
    prospects[idx] = {
      ...existing,
      status: "CONVERTED",
      convertedVendorId: vendorId,
      convertedLeadId: leadId,
      updatedAt: new Date(),
    };
    return getProspect(prospectId);
  }

  // ─── Marketing site settings ──────────────────────────────────────────────────

  async function getMarketingSiteSettings(): Promise<MarketingSiteSettings> {
    return { ...marketingSettings, updatedAt: new Date(marketingSettings.updatedAt) };
  }

  async function updateMarketingSiteSettings(
    input: UpdateMarketingSiteSettingsInput
  ): Promise<MarketingSiteSettings> {
    const updated = { ...marketingSettings, updatedAt: new Date() };
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        (updated as Record<string, unknown>)[key] =
          value === null ? undefined : (value as string).trim() || undefined;
      }
    }
    marketingSettings = updated;
    return { ...marketingSettings, updatedAt: new Date(marketingSettings.updatedAt) };
  }

  // ─── Site copy translations ──────────────────────────────────────────────────

  async function listSiteTranslations(locale?: string) {
    return [...siteTranslations.values()]
      .filter((t) => !locale || t.locale === locale)
      .map((t) => ({ ...t, updatedAt: new Date(t.updatedAt) }));
  }

  async function upsertSiteTranslation(
    locale: string,
    key: string,
    value: string
  ) {
    const entry = { locale, key, value, updatedAt: new Date() };
    siteTranslations.set(`${locale}\u0000${key}`, entry);
    return { ...entry };
  }

  async function deleteSiteTranslation(locale: string, key: string) {
    return siteTranslations.delete(`${locale}\u0000${key}`);
  }

  async function recordMarketingFunnelEvent(input: CreateMarketingFunnelEventInput) {
    const row: MarketingFunnelEvent = {
      ...input,
      id: `marketing-event-${++marketingFunnelEventCounter}`,
      createdAt: new Date(),
    };
    marketingFunnelEvents.push(row);
    return { ...row, createdAt: new Date(row.createdAt) };
  }

  async function listMarketingFunnelEvents(from: Date) {
    return marketingFunnelEvents
      .filter((row) => row.createdAt >= from)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
  }

  // ─── Vendor expenses + profit ─────────────────────────────────────────────────

  async function listVendorExpenses(
    vendorSlug: string,
    from?: Date,
    to?: Date
  ): Promise<VendorExpense[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    let rows = expenses.filter((e) => e.vendorId === vendor.id);
    if (from) rows = rows.filter((e) => e.spentAt >= from);
    if (to) rows = rows.filter((e) => e.spentAt <= to);
    return rows
      .sort((a, b) => b.spentAt.getTime() - a.spentAt.getTime())
      .map((e) => ({ ...e, spentAt: new Date(e.spentAt), createdAt: new Date(e.createdAt) }));
  }

  async function createVendorExpense(
    vendorSlug: string,
    input: CreateVendorExpenseInput
  ): Promise<VendorExpense> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) throw new Error("Vendor not found");
    const now = new Date();
    const expense: VendorExpense = {
      id: `exp_${++expenseCounter}_${Date.now()}`,
      vendorId: vendor.id,
      amountRwf: input.amountRwf,
      category: input.category.trim(),
      note: input.note?.trim() || undefined,
      spentAt: input.spentAt ?? now,
      createdAt: now,
    };
    expenses.push(expense);
    return { ...expense, spentAt: new Date(expense.spentAt), createdAt: new Date(now) };
  }

  async function deleteVendorExpense(
    vendorSlug: string,
    expenseId: string
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    const before = expenses.length;
    expenses = expenses.filter(
      (e) => !(e.id === expenseId && e.vendorId === vendor.id)
    );
    return expenses.length < before;
  }

  async function getProfitSnapshot(
    vendorSlug: string,
    from: Date,
    to: Date
  ): Promise<ProfitSnapshot | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const todayGrossRwf = await getTodayGross(vendorSlug);
    const weekdayAverageRwf = await getWeekdayAverageGross(vendorSlug);

    const periodOrders = orders.filter(
      (o) =>
        o.vendorId === vendor.id &&
        o.createdAt >= from &&
        o.createdAt <= to &&
        COUNTED_STATUSES.includes(o.status)
    );
    const periodRevenueRwf = periodOrders.reduce((s, o) => s + o.totalAmount, 0);

    const periodExpenses = expenses.filter(
      (e) => e.vendorId === vendor.id && e.spentAt >= from && e.spentAt <= to
    );
    const periodExpensesRwf = periodExpenses.reduce((s, e) => s + e.amountRwf, 0);

    const marginMap = new Map<string, {
      name: string; soldQty: number; revenueRwf: number; costRwf: number;
    }>();
    let periodCostOfGoodsRwf = 0;
    for (const order of periodOrders) {
      for (const line of order.orderItems) {
        const item = menuItems.find((m) => m.id === line.menuItemId);
        const existing = marginMap.get(line.menuItemId) ?? {
          name: item?.name ?? "Unknown",
          soldQty: 0,
          revenueRwf: 0,
          costRwf: 0,
        };
        existing.soldQty += line.quantity;
        existing.revenueRwf += line.quantity * line.unitPriceRwf;
        const cost = (item?.costPriceRwf ?? 0) * line.quantity;
        existing.costRwf += cost;
        periodCostOfGoodsRwf += cost;
        marginMap.set(line.menuItemId, existing);
      }
    }

    const itemMargins = [...marginMap.entries()].map(([menuItemId, data]) => ({
      menuItemId,
      name: data.name,
      soldQty: data.soldQty,
      revenueRwf: data.revenueRwf,
      costRwf: data.costRwf,
      marginRwf: data.revenueRwf - data.costRwf,
      marginPct: data.revenueRwf > 0
        ? (data.revenueRwf - data.costRwf) / data.revenueRwf
        : null,
    }));

    return {
      todayGrossRwf,
      weekdayAverageRwf,
      glowScore: computeGlowScore(todayGrossRwf, weekdayAverageRwf),
      periodRevenueRwf,
      periodExpensesRwf,
      periodCostOfGoodsRwf,
      periodProfitRwf: periodRevenueRwf - periodExpensesRwf - periodCostOfGoodsRwf,
      itemMargins,
    };
  }

  async function getWeekdayAverageGross(
    vendorSlug: string,
    weeks = 4
  ): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;

    const now = new Date();
    const todayStart = startOfDayInTimezone(now);
    const targetDay = now.getDay();

    let total = 0;
    let count = 0;
    for (let w = 1; w <= weeks; w++) {
      const dayStart = new Date(todayStart.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      if (dayStart.getDay() !== targetDay) continue;
      const gross = orders
        .filter(
          (o) =>
            o.vendorId === vendor.id &&
            o.createdAt >= dayStart &&
            o.createdAt <= dayEnd &&
            COUNTED_STATUSES.includes(o.status)
        )
        .reduce((s, o) => s + o.totalAmount, 0);
      total += gross;
      count++;
    }
    return count > 0 ? Math.round(total / count) : 0;
  }

  async function getAllTimePaidRevenue(vendorSlug: string): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;
    return orders
      .filter(
        (o) => o.vendorId === vendor.id && COUNTED_STATUSES.includes(o.status)
      )
      .reduce((s, o) => s + o.totalAmount, 0);
  }

  function reset(): void {
    load();
  }

  return {
    getVendorBySlug,
    isSlugAvailable,
    createVendor,
    updateVendor,
    getVendorOwnerTokenHash,
    setVendorOwnerToken,
    recordRecoveryEvent,
    listRecoveryEvents,
    listAllRecoveryEvents,
    reviewRecoveryEvent,
    createLead,
    listLeads,
    updateLeadStatus,
    listLeadRoutingRecipients,
    createLeadRoutingRecipient,
    updateLeadRoutingRecipient,
    removeLeadRoutingRecipient,
    assignLeadRoutingRecipient,
    createProspect,
    bulkCreateProspects,
    listProspects,
    getProspect,
    updateProspect,
    addProspectInteraction,
    convertProspect,
    getMarketingSiteSettings,
    updateMarketingSiteSettings,
    listSiteTranslations,
    upsertSiteTranslation,
    deleteSiteTranslation,
    recordMarketingFunnelEvent,
    listMarketingFunnelEvents,
    listVendorExpenses,
    createVendorExpense,
    deleteVendorExpense,
    getProfitSnapshot,
    getWeekdayAverageGross,
    getAllTimePaidRevenue,
    listVendors,
    getOperatorVendorDetail,
    setVendorActive,
    operatorUpdateVendor,
    operatorRevokeOwnerToken,
    operatorReissueOwnerToken,
    operatorUpdateOrder,
    recordOperatorAction,
    listOperatorActions,
    getMenu,
    getAvailableMenu,
    getArchivedMenu,
    getMenuItem,
    getCategories,
    createMenuItem,
    updateMenuItem,
    archiveMenuItem,
    restoreMenuItem,
    renameCategory,
    addMenuImage,
    uploadMenuImageBlob,
    reorderMenuImages,
    setPrimaryMenuImage,
    removeMenuImage,
    toggleItemAvailability,
    setAllItemsAvailable,
    listOrders,
    listActiveOrders,
    listKdsOrders,
    getKdsSnapshotRevision,
    listOrdersFiltered,
    getOrder,
    createOrder,
    updateOrderStatus,
    updateKitchenStage,
    bulkUpdateKitchenStage,
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    assignOrderDriver,
    bulkAssignOrderDriver,
    getTodayGross,
    getYesterdayGross,
    isKitchenOpen,
    setKitchenOpen,
    createPayment,
    getPaymentByRef,
    getPaymentForOrder,
    confirmPayment,
    confirmManualPayment,
    abandonManualPayment,
    findResumableManualOrder,
    reset,
  };
}
