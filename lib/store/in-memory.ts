import type {
  AbandonManualPaymentResult,
  AddMenuImageInput,
  ApplyProviderPaymentResult,
  ApplyVendorPayoutResult,
  ConfirmManualPaymentResult,
  ConfirmPaymentResult,
  CreateMenuItemInput,
  CreateOrderInput,
  CreatePaymentInput,
  CreatePaymentResult,
  CreateVendorInput,
  CreateVendorPayoutInput,
  CreateVendorPayoutResult,
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
  ProviderPaymentResult,
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
  VendorPayout,
  VendorPayoutOpsRow,
  VendorRecoveryEvent,
} from "@/lib/types";
import type { ResettableStore } from "@/lib/store/types";
import type {
  CommissionSettings,
  UpdateCommissionSettingsInput,
} from "@/lib/momo/commission";
import type {
  CreateMarketingFunnelEventInput,
  MarketingFunnelEvent,
} from "@/lib/analytics/types";
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
import {
  normalizeMenuItemAddOnGroups,
  resolveAddOnSelection,
} from "@/lib/menu/add-ons";
import { thumbGradientForId } from "@/lib/menu/gradients";
import {
  getMenuItemPrice,
  getMenuItemSizeOption,
  getSizeOptionsStartingPrice,
  normalizeMenuItemSizeOptions,
} from "@/lib/menu/sizes";
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
import { buildMomoUssdDial, orderPhoneMatches } from "@/lib/momo/ussd-dial";
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
import type {
  CreateInventoryItemInput,
  InventoryAdjustment,
  InventoryItem,
  InventoryItemDetail,
  InventoryListFilters,
  PaginatedInventory,
  RecordInventoryAdjustmentInput,
  UpdateInventoryItemInput,
} from "@/lib/inventory/types";
import {
  inventoryStatus,
  resolveInventoryUnit,
  validateCreateInventoryItemInput,
  validateInventoryAdjustmentInput,
  validateUpdateInventoryItemInput,
} from "@/lib/inventory/validation";
import type { PublicRestaurant } from "@/lib/customer-restaurants/types";
import type {
  RecordVendorUpdateInput,
  VendorUpdateBatch,
  VendorUpdateCounter,
  VendorUpdateEntry,
  VendorUpdateOverview,
  VendorUpdateSettings,
  PublicVendorUpdateFeedItem,
} from "@/lib/vendor-updates/types";
import { createInMemoryBriefingStore } from "@/lib/briefing/store/in-memory";
import {
  VENDOR_UPDATE_BATCH_WINDOW_MS,
  VENDOR_UPDATE_TTL_MS,
} from "@/lib/vendor-updates/types";
import type {
  BriefingInterest,
  BriefingInterestInput,
} from "@/lib/briefing/interest";
import type {
  AddMenuIntakeRevisionInput,
  AddMenuIntakeRevisionResult,
  AnswerMenuIntakeQuestionInput,
  AddMenuIntakeAttachmentInput,
  CreateMenuIntakeAccessInput,
  LogMenuIntakeContactInput,
  CreateMenuIntakeInput,
  CreateMenuIntakeResult,
  MenuIntake,
  MenuIntakeAccess,
  MenuIntakeAttachment,
  MenuIntakeDetail,
  MenuIntakeQuestion,
  MenuIntakeRevision,
  MenuIntakeImportRequest,
  MenuIntakeImportResult,
  UpdateMenuIntakeReviewInput,
  MenuIntakeContactLog,
} from "@/lib/menu-intake/types";
import { canPurgeMenuIntake } from "@/lib/menu-intake/retention";
import { readPrivateMenuIntakeBlob } from "@/lib/menu-intake/blob-storage";

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
    assignedDriver: order.assignedDriver
      ? { ...order.assignedDriver }
      : undefined,
    orderItems: order.orderItems.map((item) => ({
      ...item,
      addOnSelections: item.addOnSelections?.map((group) => ({
        ...group,
        choices: group.choices.map((choice) => ({ ...choice })),
      })),
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

function cloneVendorPayout(payout: VendorPayout): VendorPayout {
  return {
    ...payout,
    createdAt: new Date(payout.createdAt),
    updatedAt: new Date(payout.updatedAt),
  };
}

const PAID_LIKE: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];

function buildPayoutOpsRow(
  order: Order,
  latest: VendorPayout | null,
): VendorPayoutOpsRow {
  const status = latest?.status;
  return {
    orderId: order.id,
    orderStatus: order.status,
    orderTotalAmount: order.totalAmount,
    orderCreatedAt: new Date(order.createdAt),
    customerPhone: order.customerPhone,
    landmark: order.landmark,
    latestPayout: latest ? cloneVendorPayout(latest) : null,
    canRetry: status !== "SUCCESS" && status !== "PENDING",
    canSync: status === "PENDING",
  };
}

/**
 * In-memory adapter: the demo dataset promoted to a real Store implementation.
 * State lives in this closure (one instance per process) so a single dev
 * process has one source of truth. Tests get their own instances and reset
 * between runs. ids are generated internally and must not be assumed by callers.
 */
export function createInMemoryStore(): ResettableStore {
  const briefing = createInMemoryBriefingStore();
  let menuItems: MenuItem[] = [];
  let inventoryItems: InventoryItem[] = [];
  let inventoryAdjustments: InventoryAdjustment[] = [];
  let menuImages: MenuImage[] = [];
  let orders: Order[] = [];
  let payments: Payment[] = [];
  let vendorPayouts: VendorPayout[] = [];
  let vendors: StoredVendor[] = [];
  let leads: Lead[] = [];
  let menuIntakes: MenuIntake[] = [];
  let menuIntakeRevisions: MenuIntakeRevision[] = [];
  let menuIntakeAccess: MenuIntakeAccess[] = [];
  let menuIntakeQuestions: MenuIntakeQuestion[] = [];
  let menuIntakeAttachments: MenuIntakeAttachment[] = [];
  let menuIntakeContactLogs: MenuIntakeContactLog[] = [];
  let menuIntakeImportResults = new Map<string, MenuIntakeImportResult>();
  let briefingInterests: BriefingInterest[] = [];
  let leadRoutingRecipients: LeadRoutingRecipient[] = [];
  let lastAssignedLeadRoutingRecipientId: string | undefined;
  let recoveryEvents: VendorRecoveryEvent[] = [];
  let operatorActions: OperatorAction[] = [];
  let drivers: Driver[] = [];
  let prospects: Prospect[] = [];
  let prospectInteractions: ProspectInteraction[] = [];
  let expenses: VendorExpense[] = [];
  let marketingFunnelEvents: MarketingFunnelEvent[] = [];
  let vendorUpdateSettings = new Map<string, boolean>();
  let vendorUpdateBatches: VendorUpdateBatch[] = [];
  let marketingSettings: MarketingSiteSettings = {
    id: "default",
    showMenuIntakeLanguageChoices: false,
    showKdsLanguageSelector: true,
    kdsLanguageRw: true,
    kdsLanguageFr: true,
    kdsLanguageSw: true,
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
  let vendorPayoutCounter = 0;
  let menuItemCounter = 0;
  let inventoryItemCounter = 0;
  let inventoryAdjustmentCounter = 0;
  let menuImageCounter = 0;
  let vendorCounter = 0;
  let leadCounter = 0;
  let menuIntakeCounter = 0;
  let menuIntakeRevisionCounter = 0;
  let menuIntakeAccessCounter = 0;
  let menuIntakeQuestionCounter = 0;
  let briefingInterestCounter = 0;
  let leadRoutingRecipientCounter = 0;
  let leadRoutingAssignmentCounter = 0;
  let recoveryEventCounter = 0;
  let operatorActionCounter = 0;
  let driverCounter = 0;
  let prospectCounter = 0;
  let prospectInteractionCounter = 0;
  let expenseCounter = 0;
  let marketingFunnelEventCounter = 0;
  let vendorUpdateBatchCounter = 0;
  let vendorUpdateEntryCounter = 0;

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
    recipient: LeadRoutingRecipient,
  ): LeadRoutingRecipient {
    return {
      ...recipient,
      createdAt: new Date(recipient.createdAt),
      updatedAt: new Date(recipient.updatedAt),
    };
  }

  function cloneMenuIntake(intake: MenuIntake): MenuIntake {
    return {
      ...intake,
      createdAt: new Date(intake.createdAt),
      updatedAt: new Date(intake.updatedAt),
      importedAt: intake.importedAt ? new Date(intake.importedAt) : undefined,
      cancelledAt: intake.cancelledAt
        ? new Date(intake.cancelledAt)
        : undefined,
      deletedAt: intake.deletedAt ? new Date(intake.deletedAt) : undefined,
    };
  }

  function cloneMenuIntakeRevision(
    revision: MenuIntakeRevision,
  ): MenuIntakeRevision {
    return {
      ...revision,
      content: structuredClone(revision.content),
      createdAt: new Date(revision.createdAt),
    };
  }

  function cloneMenuIntakeAccess(access: MenuIntakeAccess): MenuIntakeAccess {
    return {
      ...access,
      expiresAt: new Date(access.expiresAt),
      lastActiveAt: new Date(access.lastActiveAt),
      consumedAt: access.consumedAt ? new Date(access.consumedAt) : undefined,
      revokedAt: access.revokedAt ? new Date(access.revokedAt) : undefined,
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
      menuImages.filter((image) => image.menuItemId === itemId),
    ).map(cloneMenuImage);
  }

  function syncPrimaryToMenuItem(itemId: string): void {
    const index = menuItems.findIndex((item) => item.id === itemId);
    if (index === -1) return;

    const primary = menuImages.find(
      (image) => image.menuItemId === itemId && image.isPrimary,
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
      sizeOptions: item.sizeOptions?.map((option) => ({ ...option })),
      addOnGroups: item.addOnGroups?.map((group) => ({
        ...group,
        choices: group.choices.map((choice) => ({ ...choice })),
      })),
      archivedAt: item.archivedAt ? new Date(item.archivedAt) : undefined,
    };
  }

  function cloneVendorUpdateBatch(batch: VendorUpdateBatch): VendorUpdateBatch {
    return {
      ...batch,
      publishedAt: new Date(batch.publishedAt),
      expiresAt: new Date(batch.expiresAt),
      entries: batch.entries.map((entry) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
      })),
    };
  }

  function load(): void {
    menuItems = seedMenuItems.map((item) => ({ ...item }));
    inventoryItems = [];
    inventoryAdjustments = [];
    menuImages = [];
    orders = seedOrders.map(cloneOrder);
    payments = [];
    vendorPayouts = [];
    vendors = [{ ...seedVendor, ownerTokenHash: DEMO_OWNER_TOKEN_HASH }];
    recoveryEvents = [];
    operatorActions = [];
    leads = [];
    menuIntakes = [];
    menuIntakeRevisions = [];
    menuIntakeAccess = [];
    menuIntakeQuestions = [];
    menuIntakeAttachments = [];
    menuIntakeContactLogs = [];
    menuIntakeImportResults = new Map();
    briefingInterests = [];
    leadRoutingRecipients = [];
    lastAssignedLeadRoutingRecipientId = undefined;
    drivers = seedDrivers.map((driver) => ({ ...driver }));
    prospects = [];
    prospectInteractions = [];
    expenses = [];
    marketingFunnelEvents = [];
    vendorUpdateSettings = new Map();
    vendorUpdateBatches = [];
    marketingSettings = {
      id: "default",
      showMenuIntakeLanguageChoices: false,
      showKdsLanguageSelector: true,
      kdsLanguageRw: true,
      kdsLanguageFr: true,
      kdsLanguageSw: true,
      updatedAt: new Date(),
    };
    kitchenOpen = true;
    orderCounter = 0;
    orderItemCounter = 0;
    paymentCounter = 0;
    vendorPayoutCounter = 0;
    inventoryItemCounter = 0;
    inventoryAdjustmentCounter = 0;
    vendorCounter = 0;
    recoveryEventCounter = 0;
    driverCounter = 0;
    leadCounter = 0;
    briefingInterestCounter = 0;
    leadRoutingRecipientCounter = 0;
    leadRoutingAssignmentCounter = 0;
    prospectCounter = 0;
    prospectInteractionCounter = 0;
    expenseCounter = 0;
    marketingFunnelEventCounter = 0;
    vendorUpdateBatchCounter = 0;
    vendorUpdateEntryCounter = 0;
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
      // ADR-0096 Commission defaults
      commissionEnabled: true,
      commissionPercent: null,
      feeReminderEnabled: false,
      ownerTokenHash: input.ownerTokenHash,
      createdAt: new Date(),
    };
    vendors.push(vendor);
    return cloneVendor(vendor);
  }

  async function updateVendor(
    vendorSlug: string,
    input: UpdateVendorInput,
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
      // ADR-0096 Commission fields
      ...(input.commissionEnabled !== undefined
        ? { commissionEnabled: input.commissionEnabled }
        : {}),
      ...(input.commissionPercent !== undefined
        ? { commissionPercent: input.commissionPercent }
        : {}),
      ...(input.feeReminderEnabled !== undefined
        ? { feeReminderEnabled: input.feeReminderEnabled }
        : {}),
    };
    vendors[index] = updated;
    return cloneVendor(updated);
  }

  async function getVendorUpdateSettings(
    vendorSlug: string,
  ): Promise<VendorUpdateSettings> {
    const vendor = await getVendorBySlug(vendorSlug);
    return {
      enabled: vendor ? (vendorUpdateSettings.get(vendor.id) ?? true) : true,
    };
  }

  async function setVendorUpdatesEnabled(
    vendorSlug: string,
    enabled: boolean,
  ): Promise<VendorUpdateSettings | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    vendorUpdateSettings.set(vendor.id, enabled);
    return { enabled };
  }

  async function recordVendorUpdate(
    vendorSlug: string,
    input: RecordVendorUpdateInput,
  ): Promise<VendorUpdateBatch | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (
      !vendor ||
      !vendor.isActive ||
      input.announce === false ||
      vendorUpdateSettings.get(vendor.id) === false
    ) {
      return null;
    }

    const at = new Date(input.at ?? Date.now());
    let batch = [...vendorUpdateBatches]
      .filter((candidate) => candidate.vendorId === vendor.id)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0];
    const rollsIntoLatest =
      batch != null &&
      at.getTime() - batch.publishedAt.getTime() <=
        VENDOR_UPDATE_BATCH_WINDOW_MS;

    if (!rollsIntoLatest) {
      batch = {
        id: `vub_${++vendorUpdateBatchCounter}_${Date.now()}`,
        vendorId: vendor.id,
        revision: 0,
        publishedAt: at,
        expiresAt: new Date(at.getTime() + VENDOR_UPDATE_TTL_MS),
        openCount: 0,
        menuVisitCount: 0,
        entries: [],
      };
      vendorUpdateBatches.push(batch);
    }

    const existingIndex = batch.entries.findIndex(
      (entry) =>
        entry.type === input.entry.type &&
        entry.subjectId === input.entry.subjectId,
    );
    if (existingIndex === -1) {
      const entry: VendorUpdateEntry = {
        ...input.entry,
        id: `vue_${++vendorUpdateEntryCounter}_${Date.now()}`,
        batchId: batch.id,
        createdAt: at,
        updatedAt: at,
      };
      batch.entries.push(entry);
    } else {
      const existing = batch.entries[existingIndex];
      batch.entries[existingIndex] = {
        ...existing,
        ...input.entry,
        oldPriceRwf: existing.oldPriceRwf ?? input.entry.oldPriceRwf,
        createdAt: existing.createdAt,
        updatedAt: at,
      };
    }
    batch.revision += 1;
    batch.publishedAt = at;
    batch.expiresAt = new Date(at.getTime() + VENDOR_UPDATE_TTL_MS);
    return cloneVendorUpdateBatch(batch);
  }

  async function getVendorUpdateOverview(
    vendorSlug: string,
    at = new Date(),
  ): Promise<VendorUpdateOverview | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const batches = vendorUpdateBatches.filter(
      (batch) => batch.vendorId === vendor.id,
    );
    const activeBatch = [...batches]
      .filter((batch) => batch.expiresAt.getTime() > at.getTime())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0];
    return {
      settings: await getVendorUpdateSettings(vendorSlug),
      activeBatch: activeBatch ? cloneVendorUpdateBatch(activeBatch) : null,
      totals: batches.reduce(
        (totals, batch) => ({
          batches: totals.batches + 1,
          revisions: totals.revisions + batch.revision,
          opens: totals.opens + batch.openCount,
          menuVisits: totals.menuVisits + batch.menuVisitCount,
        }),
        { batches: 0, revisions: 0, opens: 0, menuVisits: 0 },
      ),
    };
  }

  async function incrementVendorUpdateCounter(
    batchId: string,
    counter: VendorUpdateCounter,
  ): Promise<VendorUpdateBatch | null> {
    const batch = vendorUpdateBatches.find(
      (candidate) => candidate.id === batchId,
    );
    if (!batch) return null;
    if (counter === "open") batch.openCount += 1;
    else batch.menuVisitCount += 1;
    return cloneVendorUpdateBatch(batch);
  }

  async function listPublicVendorUpdates(
    vendorIds: string[],
    at = new Date(),
  ): Promise<PublicVendorUpdateFeedItem[]> {
    const uniqueIds = [...new Set(vendorIds)].slice(0, 50);
    return uniqueIds.flatMap((vendorId) => {
      const vendor = vendors.find((row) => row.id === vendorId);
      if (!vendor) return [];
      const batches = vendor.isActive
        ? vendorUpdateBatches
            .filter(
              (batch) =>
                batch.vendorId === vendor.id &&
                batch.expiresAt.getTime() > at.getTime(),
            )
            .sort(
              (left, right) =>
                right.publishedAt.getTime() - left.publishedAt.getTime(),
            )
            .map((batch) => ({
              id: batch.id,
              vendorId: batch.vendorId,
              revision: batch.revision,
              publishedAt: new Date(batch.publishedAt),
              expiresAt: new Date(batch.expiresAt),
              entries: batch.entries.map((entry) => {
                const subject = menuItems.find(
                  (item) => item.id === entry.subjectId,
                );
                return {
                  ...entry,
                  createdAt: new Date(entry.createdAt),
                  updatedAt: new Date(entry.updatedAt),
                  isCurrentlyAvailable:
                    entry.type === "PROFILE_CHANGE" ||
                    Boolean(
                      subject && isActiveItem(subject) && subject.isAvailable,
                    ),
                };
              }),
            }))
        : [];
      return [
        {
          vendorId: vendor.id,
          slug: vendor.slug,
          name: vendor.name,
          logoUrl: vendor.logoUrl,
          isAvailable: vendor.isActive,
          batches,
        },
      ];
    });
  }

  async function getVendorOwnerTokenHash(
    vendorSlug: string,
  ): Promise<string | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const vendor = vendors.find((row) => row.slug === normalized);
    return vendor?.ownerTokenHash ?? null;
  }

  async function setVendorOwnerToken(
    vendorSlug: string,
    ownerTokenHash: string,
  ): Promise<Vendor | null> {
    const normalized = normalizeVendorSlug(vendorSlug);
    const index = vendors.findIndex((row) => row.slug === normalized);
    if (index === -1) return null;

    vendors[index] = { ...vendors[index], ownerTokenHash };
    return cloneVendor(vendors[index]);
  }

  async function recordRecoveryEvent(
    input: RecordRecoveryEventInput,
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
    vendorId: string,
  ): Promise<VendorRecoveryEvent[]> {
    return recoveryEvents
      .filter((event) => event.vendorId === vendorId)
      .map(cloneRecoveryEvent)
      .sort((a, b) => b.at.getTime() - a.at.getTime());
  }

  async function listAllRecoveryEvents(
    filters?: RecoveryEventFilters,
  ): Promise<VendorRecoveryEvent[]> {
    let rows = recoveryEvents.map(cloneRecoveryEvent);
    if (filters?.vendorSlug) {
      const vendor = vendors.find(
        (v) => v.slug === normalizeVendorSlug(filters.vendorSlug!),
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
    reviewNote?: string,
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
    status: LeadStatus,
  ): Promise<Lead | null> {
    const index = leads.findIndex((lead) => lead.id === leadId);
    if (index === -1) return null;
    leads[index] = { ...leads[index], status };
    return cloneLead(leads[index]);
  }

  async function createMenuIntake(
    input: CreateMenuIntakeInput,
  ): Promise<CreateMenuIntakeResult> {
    if (menuIntakes.some((intake) => intake.reference === input.reference)) {
      throw new Error("Menu intake reference already exists");
    }
    const now = new Date();
    const intakeId = `menu_intake_${++menuIntakeCounter}_${Date.now()}`;
    const intake: MenuIntake = {
      id: intakeId,
      reference: input.reference,
      status: "SUBMITTED",
      businessName: input.businessName.trim(),
      contactName: input.contactName.trim(),
      phone: input.phone,
      locale: input.locale,
      alreadyOnZantap: input.alreadyOnZantap,
      storefrontHint: input.storefrontHint?.trim() || undefined,
      currentRevision: 1,
      createdAt: now,
      updatedAt: now,
    };
    const revision: MenuIntakeRevision = {
      id: `menu_intake_revision_${++menuIntakeRevisionCounter}_${Date.now()}`,
      intakeId,
      sequence: 1,
      source: "VENDOR",
      content: structuredClone(input.content),
      createdAt: now,
    };
    const access: MenuIntakeAccess = {
      id: `menu_intake_access_${++menuIntakeAccessCounter}_${Date.now()}`,
      intakeId,
      tokenHash: input.resumeTokenHash,
      kind: "BROWSER",
      expiresAt: new Date(input.resumeExpiresAt),
      lastActiveAt: now,
    };
    menuIntakes.unshift(intake);
    menuIntakeRevisions.push(revision);
    menuIntakeAccess.push(access);
    if (input.content.question) {
      menuIntakeQuestions.push({
        id: `menu_intake_question_${++menuIntakeQuestionCounter}_${Date.now()}`,
        intakeId,
        revisionId: revision.id,
        question: input.content.question,
        status: "UNANSWERED",
        createdAt: now,
      });
    }
    return {
      intake: cloneMenuIntake(intake),
      revision: cloneMenuIntakeRevision(revision),
      access: cloneMenuIntakeAccess(access),
    };
  }

  async function getMenuIntake(
    intakeId: string,
  ): Promise<MenuIntakeDetail | null> {
    const intake = menuIntakes.find((row) => row.id === intakeId);
    if (!intake) return null;
    return {
      intake: cloneMenuIntake(intake),
      revisions: menuIntakeRevisions
        .filter((row) => row.intakeId === intakeId)
        .sort((a, b) => a.sequence - b.sequence)
        .map(cloneMenuIntakeRevision),
      questions: menuIntakeQuestions
        .filter((row) => row.intakeId === intakeId)
        .map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt),
          answeredAt: row.answeredAt ? new Date(row.answeredAt) : undefined,
        })),
      attachments: menuIntakeAttachments
        .filter((row) => row.intakeId === intakeId)
        .map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
      contactLogs: menuIntakeContactLogs
        .filter((row) => row.intakeId === intakeId)
        .map((row) => ({ ...row, createdAt: new Date(row.createdAt) })),
    };
  }

  async function addMenuIntakeRevision(
    input: AddMenuIntakeRevisionInput,
  ): Promise<AddMenuIntakeRevisionResult | null> {
    const intakeIndex = menuIntakes.findIndex(
      (row) => row.id === input.intakeId,
    );
    if (intakeIndex === -1) return null;
    const intake = menuIntakes[intakeIndex];
    if (["IMPORTING", "CANCELLED"].includes(intake.status))
      return null;

    const accessIndex = menuIntakeAccess.findIndex(
      (row) =>
        row.intakeId === input.intakeId &&
        row.tokenHash === input.resumeTokenHash &&
        !row.revokedAt &&
        !row.consumedAt &&
        row.expiresAt.getTime() > input.at.getTime(),
    );
    if (accessIndex === -1) return null;

    const sequence = intake.currentRevision + 1;
    const revision: MenuIntakeRevision = {
      id: `menu_intake_revision_${++menuIntakeRevisionCounter}_${Date.now()}`,
      intakeId: intake.id,
      sequence,
      source: "VENDOR",
      content: structuredClone(input.content),
      createdAt: new Date(input.at),
    };
    menuIntakeRevisions.push(revision);
    menuIntakeAccess[accessIndex] = {
      ...menuIntakeAccess[accessIndex],
      lastActiveAt: new Date(input.at),
    };
    menuIntakes[intakeIndex] = {
      ...intake,
      status: intake.status === "IMPORTED" ? "IN_REVIEW" : "SUBMITTED",
      currentRevision: sequence,
      updatedAt: new Date(input.at),
    };
    if (input.content.question) {
      menuIntakeQuestions.push({
        id: `menu_intake_question_${++menuIntakeQuestionCounter}_${Date.now()}`,
        intakeId: intake.id,
        revisionId: revision.id,
        question: input.content.question,
        status: "UNANSWERED",
        createdAt: new Date(input.at),
      });
    }
    return {
      intake: cloneMenuIntake(menuIntakes[intakeIndex]),
      revision: cloneMenuIntakeRevision(revision),
    };
  }

  async function listMenuIntakes(): Promise<MenuIntake[]> {
    return menuIntakes
      .filter((row) => !row.deletedAt)
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(cloneMenuIntake);
  }

  async function listDeletedMenuIntakes(): Promise<MenuIntake[]> {
    return menuIntakes
      .filter((row) => Boolean(row.deletedAt))
      .slice()
      .sort((a, b) => (b.deletedAt?.getTime() ?? 0) - (a.deletedAt?.getTime() ?? 0))
      .map(cloneMenuIntake);
  }

  async function deleteMenuIntake(
    intakeId: string,
    at: Date,
  ): Promise<MenuIntake | null> {
    const index = menuIntakes.findIndex((row) => row.id === intakeId);
    if (
      index === -1 ||
      menuIntakes[index].status === "IMPORTED" ||
      menuIntakes[index].deletedAt
    ) return null;
    menuIntakes[index] = {
      ...menuIntakes[index],
      deletedAt: new Date(at),
      updatedAt: new Date(at),
    };
    await revokeMenuIntakeAccess(intakeId, at);
    return cloneMenuIntake(menuIntakes[index]);
  }

  async function restoreMenuIntake(
    intakeId: string,
    at: Date,
  ): Promise<MenuIntake | null> {
    const index = menuIntakes.findIndex(
      (row) => row.id === intakeId && Boolean(row.deletedAt),
    );
    if (
      index === -1 ||
      canPurgeMenuIntake(menuIntakes[index].deletedAt!, at)
    ) return null;
    menuIntakes[index] = {
      ...menuIntakes[index],
      deletedAt: undefined,
      updatedAt: new Date(at),
    };
    return cloneMenuIntake(menuIntakes[index]);
  }

  async function purgeMenuIntake(
    intakeId: string,
    at: Date,
  ): Promise<MenuIntakeAttachment[] | null> {
    const index = menuIntakes.findIndex((row) => row.id === intakeId);
    const deletedAt = index === -1 ? undefined : menuIntakes[index].deletedAt;
    if (
      index === -1 ||
      !deletedAt ||
      !canPurgeMenuIntake(deletedAt, at)
    ) {
      return null;
    }
    const attachments = menuIntakeAttachments
      .filter((row) => row.intakeId === intakeId)
      .map((row) => ({ ...row, createdAt: new Date(row.createdAt) }));
    menuIntakes.splice(index, 1);
    menuIntakeRevisions = menuIntakeRevisions.filter((row) => row.intakeId !== intakeId);
    menuIntakeAccess = menuIntakeAccess.filter((row) => row.intakeId !== intakeId);
    menuIntakeQuestions = menuIntakeQuestions.filter((row) => row.intakeId !== intakeId);
    menuIntakeAttachments = menuIntakeAttachments.filter((row) => row.intakeId !== intakeId);
    menuIntakeContactLogs = menuIntakeContactLogs.filter((row) => row.intakeId !== intakeId);
    menuIntakeImportResults = new Map(
      [...menuIntakeImportResults].filter(([, result]) => result.intakeId !== intakeId),
    );
    return attachments;
  }

  async function authorizeMenuIntake(
    intakeId: string,
    tokenHash: string,
    at: Date,
  ): Promise<MenuIntakeDetail | null> {
    const accessIndex = menuIntakeAccess.findIndex(
      (row) =>
        row.intakeId === intakeId &&
        row.tokenHash === tokenHash &&
        !row.revokedAt &&
        !row.consumedAt &&
        row.expiresAt.getTime() > at.getTime(),
    );
    if (accessIndex === -1) return null;
    if (menuIntakes.find((row) => row.id === intakeId)?.deletedAt) return null;
    menuIntakeAccess[accessIndex] = {
      ...menuIntakeAccess[accessIndex],
      lastActiveAt: new Date(at),
      expiresAt: new Date(at.getTime() + 30 * 24 * 60 * 60_000),
      ...(menuIntakeAccess[accessIndex].kind === "ONE_TIME"
        ? { consumedAt: new Date(at) }
        : {}),
    };
    return getMenuIntake(intakeId);
  }

  async function addMenuIntakeAttachment(
    input: AddMenuIntakeAttachmentInput,
  ): Promise<MenuIntakeAttachment | null> {
    const detail = await authorizeMenuIntake(
      input.intakeId,
      input.resumeTokenHash,
      input.at,
    );
    if (
      !detail ||
      ["IMPORTING", "IMPORTED", "CANCELLED"].includes(detail.intake.status)
    )
      return null;
    const attachment: MenuIntakeAttachment = {
      id: `menu_intake_attachment_${Date.now()}_${menuIntakeAttachments.length + 1}`,
      intakeId: input.intakeId,
      kind: input.kind,
      dishClientId: input.dishClientId,
      fileName: input.fileName,
      mime: input.mime,
      byteLength: input.byteLength,
      blobPath: input.blobPath,
      createdAt: new Date(input.at),
    };
    menuIntakeAttachments.push(attachment);
    return { ...attachment, createdAt: new Date(attachment.createdAt) };
  }

  async function removeMenuIntakeAttachment(
    intakeId: string,
    attachmentId: string,
    tokenHash: string,
    at: Date,
  ): Promise<MenuIntakeAttachment | null> {
    const detail = await authorizeMenuIntake(intakeId, tokenHash, at);
    if (
      !detail ||
      ["IMPORTING", "IMPORTED", "CANCELLED"].includes(detail.intake.status)
    )
      return null;
    const index = menuIntakeAttachments.findIndex(
      (row) => row.id === attachmentId && row.intakeId === intakeId,
    );
    if (index === -1) return null;
    const [removed] = menuIntakeAttachments.splice(index, 1);
    return { ...removed, createdAt: new Date(removed.createdAt) };
  }

  async function createMenuIntakeAccess(
    input: CreateMenuIntakeAccessInput,
  ): Promise<MenuIntakeAccess | null> {
    if (!menuIntakes.some((row) => row.id === input.intakeId && !row.deletedAt)) return null;
    const access: MenuIntakeAccess = {
      id: `menu_intake_access_${++menuIntakeAccessCounter}_${Date.now()}`,
      intakeId: input.intakeId,
      tokenHash: input.tokenHash,
      kind: input.kind,
      expiresAt: new Date(input.expiresAt),
      lastActiveAt: new Date(input.at),
    };
    menuIntakeAccess.push(access);
    return cloneMenuIntakeAccess(access);
  }

  async function exchangeMenuIntakeAccess(
    intakeId: string,
    oneTimeTokenHash: string,
    browserTokenHash: string,
    at: Date,
  ): Promise<MenuIntakeDetail | null> {
    const index = menuIntakeAccess.findIndex(
      (row) =>
        row.intakeId === intakeId &&
        row.kind === "ONE_TIME" &&
        row.tokenHash === oneTimeTokenHash &&
        !row.consumedAt &&
        !row.revokedAt &&
        row.expiresAt > at,
    );
    if (index === -1) return null;
    menuIntakeAccess[index] = {
      ...menuIntakeAccess[index],
      consumedAt: new Date(at),
      lastActiveAt: new Date(at),
    };
    await createMenuIntakeAccess({
      intakeId,
      tokenHash: browserTokenHash,
      kind: "BROWSER",
      expiresAt: new Date(at.getTime() + 30 * 24 * 60 * 60_000),
      at,
    });
    return getMenuIntake(intakeId);
  }

  async function revokeMenuIntakeAccess(
    intakeId: string,
    at: Date,
  ): Promise<number> {
    let count = 0;
    menuIntakeAccess = menuIntakeAccess.map((row) => {
      if (row.intakeId !== intakeId || row.revokedAt) return row;
      count += 1;
      return { ...row, revokedAt: new Date(at) };
    });
    return count;
  }

  async function logMenuIntakeContact(
    input: LogMenuIntakeContactInput,
  ): Promise<MenuIntakeContactLog> {
    const row: MenuIntakeContactLog = {
      ...input,
      id: `menu_intake_contact_${Date.now()}_${menuIntakeContactLogs.length + 1}`,
      createdAt: new Date(input.at),
    };
    menuIntakeContactLogs.push(row);
    return { ...row, createdAt: new Date(row.createdAt) };
  }

  async function updateMenuIntakeReview(
    input: UpdateMenuIntakeReviewInput,
  ): Promise<MenuIntakeDetail | null> {
    const index = menuIntakes.findIndex((row) => row.id === input.intakeId);
    if (
      index === -1 ||
      menuIntakes[index].deletedAt ||
      ["IMPORTING", "IMPORTED"].includes(menuIntakes[index].status)
    ) {
      return null;
    }
    let destinationVendorId = menuIntakes[index].destinationVendorId;
    let destinationVendorSlug = menuIntakes[index].destinationVendorSlug;
    if (input.destinationVendorSlug !== undefined) {
      const vendor = vendors.find(
        (row) => row.slug === input.destinationVendorSlug,
      );
      if (!vendor) return null;
      destinationVendorId = vendor.id;
      destinationVendorSlug = vendor.slug;
    }
    if (input.content) {
      const sequence = menuIntakes[index].currentRevision + 1;
      menuIntakeRevisions.push({
        id: `menu_intake_revision_${++menuIntakeRevisionCounter}_${Date.now()}`,
        intakeId: input.intakeId,
        sequence,
        source: "OPERATOR",
        content: structuredClone(input.content),
        createdAt: new Date(input.at),
      });
      menuIntakes[index] = { ...menuIntakes[index], currentRevision: sequence };
    }
    menuIntakes[index] = {
      ...menuIntakes[index],
      status: input.status,
      destinationVendorId,
      destinationVendorSlug,
      cancelledAt:
        input.status === "CANCELLED" ? new Date(input.at) : undefined,
      updatedAt: new Date(input.at),
    };
    return getMenuIntake(input.intakeId);
  }

  async function answerMenuIntakeQuestion(
    input: AnswerMenuIntakeQuestionInput,
  ): Promise<MenuIntakeQuestion | null> {
    const index = menuIntakeQuestions.findIndex(
      (row) => row.id === input.questionId && row.intakeId === input.intakeId,
    );
    if (index === -1) return null;
    menuIntakeQuestions[index] = {
      ...menuIntakeQuestions[index],
      answer: input.answer.trim(),
      answeredBy: input.operator,
      answeredAt: new Date(input.at),
      status: input.status,
      deliveryMethod: input.deliveryMethod,
    };
    menuIntakeContactLogs.push({
      id: `menu_intake_contact_${Date.now()}_${menuIntakeContactLogs.length + 1}`,
      intakeId: input.intakeId,
      kind: "QUESTION_REPLY",
      message: input.answer.trim(),
      operatorId: input.operator,
      method: input.deliveryMethod,
      createdAt: new Date(input.at),
    });
    return {
      ...menuIntakeQuestions[index],
      createdAt: new Date(menuIntakeQuestions[index].createdAt),
      answeredAt: new Date(input.at),
    };
  }

  async function importMenuIntake(
    input: MenuIntakeImportRequest,
  ): Promise<MenuIntakeImportResult> {
    const previous = menuIntakeImportResults.get(input.idempotencyKey);
    if (previous) return structuredClone(previous);
    const index = menuIntakes.findIndex((row) => row.id === input.intakeId);
    if (index === -1 || menuIntakes[index].deletedAt)
      throw new Error("Menu intake not found");
    if (menuIntakes[index].status === "IMPORTED") {
      throw new Error("Menu intake already imported");
    }
    if (menuIntakes[index].status !== "READY_TO_IMPORT") {
      throw new Error("Menu intake is not ready to import");
    }

    menuIntakes[index] = {
      ...menuIntakes[index],
      status: "IMPORTING",
      updatedAt: new Date(),
    };
    let vendorSlug: string;
    try {
      if (input.destination.kind === "EXISTING") {
        const vendor = await getVendorBySlug(input.destination.vendorSlug);
        if (!vendor) throw new Error("Destination Vendor not found");
        vendorSlug = vendor.slug;
      } else {
        const vendor = await createVendor(input.destination.vendor);
        vendorSlug = vendor.slug;
      }
      const results: MenuIntakeImportResult["items"] = [];
      for (const item of input.items) {
        if (item.decision === "SKIP") {
          results.push({
            intakeDishClientId: item.intakeDishClientId,
            outcome: "SKIPPED",
          });
          continue;
        }
        const catalog = {
          name: item.reviewedDish.name,
          description: item.reviewedDish.description,
          category: item.reviewedDish.category,
          priceRwf: item.reviewedDish.priceRwf,
          sizeOptions: item.reviewedDish.sizeOptions,
          addOnGroups: item.reviewedDish.addOnGroups,
        };
        let importedMenuItemId: string;
        if (item.decision === "UPDATE_EXISTING") {
          if (!item.existingMenuItemId)
            throw new Error("Existing menu item is required");
          const updated = await updateMenuItem(
            vendorSlug,
            item.existingMenuItemId,
            catalog,
          );
          if (!updated) throw new Error("Existing menu item not found");
          results.push({
            intakeDishClientId: item.intakeDishClientId,
            outcome: "UPDATED",
            menuItemId: updated.id,
          });
          importedMenuItemId = updated.id;
        } else {
          const created = await createMenuItem(vendorSlug, catalog);
          results.push({
            intakeDishClientId: item.intakeDishClientId,
            outcome: "CREATED",
            menuItemId: created.id,
          });
          importedMenuItemId = created.id;
        }
        for (const attachmentId of item.reviewedDish.imageAttachmentIds ?? []) {
          const attachment = menuIntakeAttachments.find(
            (row) =>
              row.id === attachmentId &&
              row.intakeId === input.intakeId &&
              row.kind === "DISH_IMAGE" &&
              row.dishClientId === item.intakeDishClientId,
          );
          if (!attachment) throw new Error("Approved intake image not found");
          const source = await readPrivateMenuIntakeBlob(attachment.blobPath);
          if (!source) throw new Error("Private intake image is unavailable");
          await uploadMenuImageBlob(
            vendorSlug,
            importedMenuItemId,
            source.body,
            source.contentType,
          );
        }
      }
      const result: MenuIntakeImportResult = {
        intakeId: input.intakeId,
        idempotencyKey: input.idempotencyKey,
        vendorSlug,
        status: "COMPLETED",
        items: results,
      };
      menuIntakes[index] = {
        ...menuIntakes[index],
        status: "IMPORTED",
        destinationVendorId: vendors.find((row) => row.slug === vendorSlug)?.id,
        destinationVendorSlug: vendorSlug,
        importedAt: new Date(),
        updatedAt: new Date(),
      };
      menuIntakeImportResults.set(
        input.idempotencyKey,
        structuredClone(result),
      );
      return result;
    } catch (error) {
      menuIntakes[index] = {
        ...menuIntakes[index],
        status: "READY_TO_IMPORT",
        updatedAt: new Date(),
      };
      throw error;
    }
  }

  async function createBriefingInterest(
    input: BriefingInterestInput,
  ): Promise<BriefingInterest> {
    const interest: BriefingInterest = {
      id: `briefing_interest_${++briefingInterestCounter}_${Date.now()}`,
      ...input,
      createdAt: new Date(),
    };
    briefingInterests.unshift(interest);
    return { ...interest, createdAt: new Date(interest.createdAt) };
  }

  async function listBriefingInterests(): Promise<BriefingInterest[]> {
    return briefingInterests.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
    }));
  }

  async function listLeadRoutingRecipients(): Promise<LeadRoutingRecipient[]> {
    return leadRoutingRecipients.map(cloneLeadRoutingRecipient);
  }

  async function createLeadRoutingRecipient(
    input: CreateLeadRoutingRecipientInput,
  ): Promise<LeadRoutingRecipient> {
    const normalized = normalizeLeadRoutingRecipient(input);
    if (
      leadRoutingRecipients.some(
        (recipient) => recipient.phone === normalized.phone,
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
    input: UpdateLeadRoutingRecipientInput,
  ): Promise<LeadRoutingRecipient | null> {
    const index = leadRoutingRecipients.findIndex(
      (recipient) => recipient.id === recipientId,
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
          recipient.id !== recipientId && recipient.phone === normalized.phone,
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
    recipientId: string,
  ): Promise<boolean> {
    const index = leadRoutingRecipients.findIndex(
      (recipient) => recipient.id === recipientId,
    );
    if (index === -1) return false;
    leadRoutingRecipients.splice(index, 1);
    return true;
  }

  async function assignLeadRoutingRecipient(
    leadId: string,
  ): Promise<LeadRoutingAssignment | null> {
    const leadIndex = leads.findIndex((lead) => lead.id === leadId);
    if (leadIndex === -1) return null;
    if (leads[leadIndex].routingAssignment) {
      return cloneLead(leads[leadIndex]).routingAssignment ?? null;
    }

    const enabledRecipients = leadRoutingRecipients.filter(
      (recipient) => recipient.enabled,
    );
    if (enabledRecipients.length === 0) return null;

    const previousIndex = enabledRecipients.findIndex(
      (recipient) => recipient.id === lastAssignedLeadRoutingRecipientId,
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
    filters?: VendorListFilters,
  ): Promise<VendorListEntry[]> {
    let rows = vendors.map((vendor) => {
      const vendorEvents = recoveryEvents.filter(
        (e) => e.vendorId === vendor.id,
      );
      const lastRecovery = vendorEvents.sort(
        (a, b) => b.at.getTime() - a.at.getTime(),
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
          v.phoneNumber.includes(q),
      );
    }
    if (filters?.isActive !== undefined) {
      rows = rows.filter((v) => v.isActive === filters.isActive);
    }
    return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function getOperatorVendorDetail(
    vendorSlug: string,
  ): Promise<OperatorVendorDetail | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const menu = await getMenu(vendorSlug);
    const vendorOrders = orders.filter((o) => o.vendorId === vendor.id);
    const activeOrderCount = vendorOrders.filter((o) =>
      ["PAID", "DISPATCHED", "PENDING"].includes(o.status),
    ).length;
    const vendorRecovery = recoveryEvents.filter(
      (e) => e.vendorId === vendor.id,
    );
    const recentOrders = vendorOrders
      .map(cloneOrder)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    const tracked = menu.filter((item) => item.stockCount != null);
    const low = tracked.filter(
      (item) =>
        item.stockCount != null &&
        item.stockCount <= (item.lowStockThreshold ?? 0),
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
      payoutRows: await listVendorPayoutOpsRows(vendorSlug),
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
    _reason?: string,
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
    input: OperatorUpdateVendorInput,
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
    vendorSlug: string,
  ): Promise<Vendor | null> {
    return setVendorOwnerToken(vendorSlug, "");
  }

  async function operatorReissueOwnerToken(
    vendorSlug: string,
  ): Promise<OperatorReissueTokenResult | null> {
    const { token, hash } = mintOwnerToken();
    const updated = await setVendorOwnerToken(vendorSlug, hash);
    if (!updated) return null;
    return { ownerToken: token };
  }

  async function operatorUpdateOrder(
    orderId: string,
    patch: OperatorOrderPatch,
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
    input: RecordOperatorActionInput,
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
    limit = 50,
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
    itemId: string,
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const item = menuItems.find(
      (row) => row.id === itemId && row.vendorId === vendor.id,
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
    input: CreateMenuItemInput,
  ): Promise<MenuItem> {
    const validationError = validateCreateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) throw new Error("Vendor not found");

    const id = `mi_${++menuItemCounter}_${Date.now()}`;
    const gradient = thumbGradientForId(id);
    const sizeOptions = input.sizeOptions
      ? normalizeMenuItemSizeOptions(input.sizeOptions)
      : undefined;
    const addOnGroups = input.addOnGroups?.length
      ? normalizeMenuItemAddOnGroups(input.addOnGroups)
      : undefined;
    const item: MenuItem = {
      id,
      vendorId: vendor.id,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      priceRwf: sizeOptions
        ? getSizeOptionsStartingPrice(sizeOptions)
        : input.priceRwf,
      sizeOptions,
      addOnGroups,
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
    input: UpdateMenuItemInput,
  ): Promise<MenuItem | null> {
    const validationError = validateUpdateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id,
    );
    if (index === -1) return null;

    const current = menuItems[index];
    const nextSizeOptions = input.sizeOptions
      ? normalizeMenuItemSizeOptions(input.sizeOptions)
      : input.sizeOptions === null
        ? undefined
        : current.sizeOptions;
    const nextAddOnGroups = input.addOnGroups
      ? normalizeMenuItemAddOnGroups(input.addOnGroups)
      : input.addOnGroups === null
        ? undefined
        : current.addOnGroups;
    menuItems[index] = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      priceRwf: nextSizeOptions
        ? getSizeOptionsStartingPrice(nextSizeOptions)
        : (input.priceRwf ?? current.priceRwf),
      ...(input.sizeOptions !== undefined
        ? { sizeOptions: nextSizeOptions }
        : {}),
      ...(input.addOnGroups !== undefined
        ? { addOnGroups: nextAddOnGroups }
        : {}),
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
    itemId: string,
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id,
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
    itemId: string,
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) => item.id === itemId && item.vendorId === vendor.id,
    );
    if (index === -1) return null;

    const { archivedAt: _archivedAt, ...rest } = menuItems[index];
    menuItems[index] = rest;
    return cloneMenuItem(menuItems[index]);
  }

  async function renameCategory(
    vendorSlug: string,
    from: string,
    to: string,
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

  async function resolvePublicRestaurants(
    vendorIds: string[],
  ): Promise<PublicRestaurant[]> {
    const uniqueIds = [...new Set(vendorIds)];
    return uniqueIds.flatMap((vendorId) => {
      const vendor = vendors.find((row) => row.id === vendorId);
      if (!vendor) return [];
      return [
        {
          vendorId: vendor.id,
          slug: vendor.slug,
          name: vendor.name,
          isAvailable: vendor.isActive,
          logoUrl: vendor.logoUrl,
          location: vendor.location,
          tagline: vendor.tagline,
        },
      ];
    });
  }

  async function listInventory(
    vendorSlug: string,
    filters: InventoryListFilters,
    pagination: Pagination,
  ): Promise<PaginatedInventory> {
    const vendor = await getVendorBySlug(vendorSlug);
    const pageSize = pagination.pageSize > 0 ? pagination.pageSize : 10;
    const requestedPage = pagination.page > 0 ? pagination.page : 1;
    if (!vendor) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize,
        counts: { active: 0, low: 0, out: 0 },
      };
    }

    const activeItems = inventoryItems.filter(
      (item) => item.vendorId === vendor.id && !item.archivedAt,
    );
    const counts = activeItems.reduce(
      (result, item) => {
        result.active += 1;
        const status = inventoryStatus(item.quantity, item.lowStockThreshold);
        if (status === "OUT") result.out += 1;
        if (status === "LOW") result.low += 1;
        return result;
      },
      { active: 0, low: 0, out: 0 },
    );
    const search = filters.search?.trim().toLocaleLowerCase() ?? "";
    const rows = inventoryItems
      .filter((item) => item.vendorId === vendor.id)
      .filter((item) =>
        filters.archived ? !!item.archivedAt : !item.archivedAt,
      )
      .filter(
        (item) => !search || item.name.toLocaleLowerCase().includes(search),
      )
      .filter(
        (item) =>
          !filters.category ||
          filters.category === "ALL" ||
          item.category === filters.category,
      )
      .sort((a, b) => {
        const rank = { OUT: 0, LOW: 1, OK: 2 } as const;
        const statusDelta =
          rank[inventoryStatus(a.quantity, a.lowStockThreshold)] -
          rank[inventoryStatus(b.quantity, b.lowStockThreshold)];
        return statusDelta || a.name.localeCompare(b.name);
      });
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, lastPage);
    const start = (page - 1) * pageSize;
    return {
      items: rows.slice(start, start + pageSize).map((item) => ({
        ...item,
        archivedAt: item.archivedAt ? new Date(item.archivedAt) : undefined,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async function createInventoryItem(
    vendorSlug: string,
    input: CreateInventoryItemInput,
  ): Promise<InventoryItem> {
    validateCreateInventoryItemInput(input);
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) throw new Error("Vendor not found");
    const now = new Date();
    const item: InventoryItem = {
      id: `inv_${++inventoryItemCounter}_${Date.now()}`,
      vendorId: vendor.id,
      name: input.name.trim(),
      quantity: input.quantity,
      unit: resolveInventoryUnit(input.unit, input.customUnit),
      lowStockThreshold: input.lowStockThreshold,
      category: input.category,
      unitCostRwf: input.unitCostRwf,
      note: input.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    inventoryItems.push(item);
    inventoryAdjustments.push({
      id: `inv_adj_${++inventoryAdjustmentCounter}_${Date.now()}`,
      inventoryItemId: item.id,
      type: "CORRECTION",
      quantity: input.quantity,
      oldQuantity: 0,
      newQuantity: input.quantity,
      note: "Opening quantity",
      createdAt: now,
    });
    return { ...item, createdAt: new Date(now), updatedAt: new Date(now) };
  }

  async function getInventoryItem(
    vendorSlug: string,
    itemId: string,
  ): Promise<InventoryItemDetail | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const item = inventoryItems.find(
      (row) => row.id === itemId && row.vendorId === vendor.id,
    );
    if (!item) return null;
    return {
      item: {
        ...item,
        archivedAt: item.archivedAt ? new Date(item.archivedAt) : undefined,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
      history: inventoryAdjustments
        .filter((entry) => entry.inventoryItemId === item.id)
        .reverse()
        .map((entry) => ({ ...entry, createdAt: new Date(entry.createdAt) })),
    };
  }

  async function adjustInventoryItem(
    vendorSlug: string,
    itemId: string,
    input: RecordInventoryAdjustmentInput,
  ): Promise<InventoryItemDetail | null> {
    validateInventoryAdjustmentInput(input);
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const index = inventoryItems.findIndex(
      (row) => row.id === itemId && row.vendorId === vendor.id,
    );
    if (index === -1) return null;
    const current = inventoryItems[index];
    if (current.archivedAt)
      throw new Error("Restore this item before adjusting it");
    const oldQuantity = current.quantity;
    const newQuantity =
      input.type === "RECEIVED"
        ? oldQuantity + input.quantity
        : input.type === "CORRECTION"
          ? input.quantity
          : oldQuantity - input.quantity;
    if (newQuantity < 0) throw new Error("Stock cannot go below zero");
    const now = new Date();
    inventoryItems[index] = {
      ...current,
      quantity: newQuantity,
      updatedAt: now,
    };
    inventoryAdjustments.push({
      id: `inv_adj_${++inventoryAdjustmentCounter}_${Date.now()}`,
      inventoryItemId: current.id,
      type: input.type,
      quantity: input.quantity,
      oldQuantity,
      newQuantity,
      note: input.note?.trim() || undefined,
      createdAt: now,
    });
    return getInventoryItem(vendorSlug, itemId);
  }

  async function updateInventoryItem(
    vendorSlug: string,
    itemId: string,
    input: UpdateInventoryItemInput,
  ): Promise<InventoryItemDetail | null> {
    validateUpdateInventoryItemInput(input);
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const index = inventoryItems.findIndex(
      (row) => row.id === itemId && row.vendorId === vendor.id,
    );
    if (index === -1) return null;
    const current = inventoryItems[index];
    inventoryItems[index] = {
      ...current,
      name: input.name !== undefined ? input.name.trim() : current.name,
      unit:
        input.unit !== undefined
          ? resolveInventoryUnit(input.unit, input.customUnit)
          : current.unit,
      lowStockThreshold: input.lowStockThreshold ?? current.lowStockThreshold,
      category: input.category ?? current.category,
      unitCostRwf:
        input.unitCostRwf !== undefined
          ? (input.unitCostRwf ?? undefined)
          : current.unitCostRwf,
      note:
        input.note !== undefined
          ? input.note?.trim() || undefined
          : current.note,
      updatedAt: new Date(),
    };
    return getInventoryItem(vendorSlug, itemId);
  }

  async function archiveInventoryItem(
    vendorSlug: string,
    itemId: string,
  ): Promise<InventoryItemDetail | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const index = inventoryItems.findIndex(
      (row) => row.id === itemId && row.vendorId === vendor.id,
    );
    if (index === -1) return null;
    inventoryItems[index] = {
      ...inventoryItems[index],
      archivedAt: new Date(),
      updatedAt: new Date(),
    };
    return getInventoryItem(vendorSlug, itemId);
  }

  async function restoreInventoryItem(
    vendorSlug: string,
    itemId: string,
  ): Promise<InventoryItemDetail | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const index = inventoryItems.findIndex(
      (row) => row.id === itemId && row.vendorId === vendor.id,
    );
    if (index === -1) return null;
    const { archivedAt: _archivedAt, ...rest } = inventoryItems[index];
    inventoryItems[index] = { ...rest, updatedAt: new Date() };
    return getInventoryItem(vendorSlug, itemId);
  }

  async function addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput,
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
    mime: string,
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
    imageIds: string[],
  ): Promise<MenuImage[]> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item?.images?.length) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    const itemImages = menuImages.filter(
      (image) => image.menuItemId === itemId,
    );
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
    imageId: string,
  ): Promise<MenuImage | null> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) return null;

    const target = menuImages.find(
      (image) => image.menuItemId === itemId && image.id === imageId,
    );
    if (!target) return null;

    menuImages = menuImages.map((image) =>
      image.menuItemId === itemId
        ? { ...image, isPrimary: image.id === imageId }
        : image,
    );
    syncPrimaryToMenuItem(itemId);
    return cloneMenuImage({ ...target, isPrimary: true });
  }

  async function removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string,
  ): Promise<boolean> {
    const item = await getMenuItem(vendorSlug, itemId);
    if (!item) return false;

    const index = menuImages.findIndex(
      (image) => image.menuItemId === itemId && image.id === imageId,
    );
    if (index === -1) return false;

    const removed = menuImages[index];
    menuImages.splice(index, 1);

    if (removed.isPrimary) {
      const next = pickNextPrimaryImage(
        menuImages.filter((image) => image.menuItemId === itemId),
      );
      menuImages = menuImages.map((image) =>
        image.menuItemId === itemId
          ? { ...image, isPrimary: next ? image.id === next.id : false }
          : image,
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
      orders.filter((o) => o.vendorId === vendor.id).map(cloneOrder),
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async function getKdsSnapshotRevision(vendorSlug: string): Promise<string> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return "missing";

    const queueOrders = filterKdsQueueOrders(
      orders.filter((o) => o.vendorId === vendor.id),
    );
    const activeMenu = menuItems.filter(
      (item) => item.vendorId === vendor.id && isActiveItem(item),
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
    pagination: Pagination,
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
        (o) => o.createdAt >= range.from && o.createdAt <= range.to,
      );
    }

    if (statusFilter) {
      matched = matched.filter((o) => o.status === statusFilter);
    }

    if (paymentFilter) {
      matched = matched.filter((o) =>
        paymentMatchesFilter(paymentForOrder(o.id)?.status, paymentFilter),
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
      const addOns = resolveAddOnSelection(
        menuItem.addOnGroups,
        line.addOnChoiceIds,
      );
      return {
        id: `oi_${++orderItemCounter}_${Date.now()}`,
        orderId: id,
        menuItemId: menuItem.id,
        menuItem: hydrateMenuItem(menuItem),
        quantity: line.quantity,
        unitPriceRwf:
          getMenuItemPrice(menuItem, line.sizeOptionId) + addOns.surchargeRwf,
        ...(line.sizeOptionId
          ? {
              sizeOptionId: line.sizeOptionId,
              sizeLabel: getMenuItemSizeOption(menuItem, line.sizeOptionId)!
                .label,
            }
          : {}),
        ...(notes ? { notes } : {}),
        ...(addOns.groups.length ? { addOnSelections: addOns.groups } : {}),
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceRwf,
      0,
    );

    // ADR-0096: enforce minimum order total
    const settings = await getCommissionSettings();
    if (totalAmount < settings.minimumOrderTotalRwf) {
      throw new Error(
        `Minimum order total is ${settings.minimumOrderTotalRwf} RWF`,
      );
    }

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
    status: OrderStatus,
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
    stage: KitchenStage,
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
    stage: KitchenStage,
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
    itemId: string,
  ): Promise<MenuItem | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = menuItems.findIndex(
      (item) =>
        item.id === itemId && item.vendorId === vendor.id && isActiveItem(item),
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
        : item,
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
    input: CreateDriverInput,
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

    const existingCount = drivers.filter(
      (d) => d.vendorId === vendor.id,
    ).length;
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
    input: UpdateDriverInput,
  ): Promise<Driver | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const index = drivers.findIndex(
      (driver) => driver.id === driverId && driver.vendorId === vendor.id,
    );
    if (index < 0) return null;

    const existing = drivers[index];
    const name =
      input.name !== undefined
        ? normalizeDriverName(input.name)
        : existing.name;
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
        : order,
    );
    return { ...updated };
  }

  async function deleteDriver(
    vendorSlug: string,
    driverId: string,
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;

    const before = drivers.length;
    drivers = drivers.filter(
      (driver) => !(driver.id === driverId && driver.vendorId === vendor.id),
    );
    if (drivers.length === before) return false;

    orders = orders.map((order) =>
      order.driverId === driverId
        ? { ...order, driverId: undefined, assignedDriver: undefined }
        : order,
    );
    return true;
  }

  async function assignOrderDriver(
    orderId: string,
    driverId: string,
  ): Promise<Order | null> {
    const index = orders.findIndex((order) => order.id === orderId);
    if (index < 0) return null;

    const order = orders[index];
    const driver = drivers.find(
      (row) => row.id === driverId && row.vendorId === order.vendorId,
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
    driverId: string,
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
    preset: "today" | "yesterday",
  ): number {
    const range = resolveDateRange({ datePreset: preset });
    if (!range) return 0;

    return orders
      .filter(
        (o) =>
          o.vendorId === vendorId &&
          o.createdAt >= range.from &&
          o.createdAt <= range.to &&
          COUNTED_STATUSES.includes(o.status),
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
    open: boolean,
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    kitchenOpen = open;
    return kitchenOpen;
  }

  async function createPayment(
    input: CreatePaymentInput,
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
    pin: string,
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
    customerPhone: string,
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
    customerPhone: string,
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

  async function applyProviderPaymentResult(
    ref: string,
    result: ProviderPaymentResult,
  ): Promise<ApplyProviderPaymentResult> {
    const paymentIndex = payments.findIndex((p) => p.transactionRef === ref);
    if (paymentIndex === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = payments[paymentIndex];
    const order = orders.find((o) => o.id === payment.orderId);
    if (!order) {
      return { ok: false, code: "NOT_FOUND" };
    }

    if (result === "SUCCESS") {
      if (payment.status === "SUCCESS" && order.status === "PAID") {
        return {
          ok: true,
          payment: clonePayment(payment),
          order: cloneOrder(order),
        };
      }
      if (payment.status === "FAILED" || order.status === "CANCELLED") {
        return {
          ok: false,
          code: "PAYMENT_TERMINALLY_FAILED",
          payment: clonePayment(payment),
        };
      }
      if (order.status !== "PENDING" && order.status !== "PAID") {
        return { ok: false, code: "ORDER_NOT_PENDING" };
      }

      payments[paymentIndex] = { ...payment, status: "SUCCESS" };
      await updateOrderStatus(payment.orderId, "PAID");
      decrementStockForOrder(payment.orderId);
      const updatedOrder = orders.find((o) => o.id === payment.orderId);
      return {
        ok: true,
        payment: clonePayment(payments[paymentIndex]),
        order: cloneOrder(updatedOrder ?? order),
      };
    }

    if (payment.status === "FAILED" && order.status === "CANCELLED") {
      return {
        ok: true,
        payment: clonePayment(payment),
        order: cloneOrder(order),
      };
    }
    if (payment.status === "SUCCESS" || order.status === "PAID") {
      return {
        ok: false,
        code: "PAYMENT_TERMINALLY_FAILED",
        payment: clonePayment(payment),
      };
    }

    payments[paymentIndex] = { ...payment, status: "FAILED" };
    await updateOrderStatus(payment.orderId, "CANCELLED");
    const updatedOrder = orders.find((o) => o.id === payment.orderId);
    return {
      ok: true,
      payment: clonePayment(payments[paymentIndex]),
      order: cloneOrder(updatedOrder ?? order),
    };
  }

  async function findResumableManualOrder(
    vendorSlug: string,
    customerPhone: string,
  ): Promise<ResumableManualOrder | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;

    const candidates = orders
      .filter(
        (order) =>
          order.vendorId === vendor.id &&
          order.status === "PENDING" &&
          isWithinPaymentWindow(order.createdAt),
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

  async function createVendorPayout(
    input: CreateVendorPayoutInput,
  ): Promise<CreateVendorPayoutResult> {
    const order = orders.find((o) => o.id === input.orderId);
    if (!order) {
      return { ok: false, code: "ORDER_NOT_FOUND" };
    }
    if (!PAID_LIKE.includes(order.status)) {
      return { ok: false, code: "ORDER_NOT_PAID" };
    }

    const latest = latestVendorPayout(input.orderId);
    if (latest?.status === "SUCCESS") {
      return { ok: false, code: "ALREADY_PAID_OUT", payout: cloneVendorPayout(latest) };
    }
    if (latest?.status === "PENDING") {
      return { ok: false, code: "PAYOUT_IN_FLIGHT", payout: cloneVendorPayout(latest) };
    }

    // ADR-0096: also block if any payout (not just latest) has succeeded
    const anySuccess = vendorPayouts.some(
      (p) => p.orderId === input.orderId && p.status === "SUCCESS"
    );
    if (anySuccess) {
      return { ok: false, code: "ALREADY_PAID_OUT" };
    }

    const now = new Date();
    const payout: VendorPayout = {
      id: `vp_${++vendorPayoutCounter}_${Date.now()}`,
      orderId: input.orderId,
      vendorId: input.vendorId,
      amount: input.amount,
      referenceId: input.referenceId,
      status: input.initialStatus ?? "PENDING",
      payeeType: input.payeeType,
      payeeId: input.payeeId,
      lastError: input.lastError,
      createdAt: now,
      updatedAt: now,
    };
    vendorPayouts = [...vendorPayouts, payout];
    return { ok: true, payout: cloneVendorPayout(payout) };
  }

  function latestVendorPayout(orderId: string): VendorPayout | undefined {
    return vendorPayouts
      .filter((p) => p.orderId === orderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async function getVendorPayoutByRef(ref: string): Promise<VendorPayout | null> {
    const payout = vendorPayouts.find((p) => p.referenceId === ref);
    return payout ? cloneVendorPayout(payout) : null;
  }

  async function getLatestVendorPayoutForOrder(
    orderId: string,
  ): Promise<VendorPayout | null> {
    const latest = latestVendorPayout(orderId);
    return latest ? cloneVendorPayout(latest) : null;
  }

  async function listVendorPayoutOpsRows(
    vendorSlug: string,
  ): Promise<VendorPayoutOpsRow[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];

    const paidOrders = orders
      .filter((o) => o.vendorId === vendor.id && PAID_LIKE.includes(o.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 30);

    return paidOrders.map((order) =>
      buildPayoutOpsRow(order, latestVendorPayout(order.id) ?? null),
    );
  }

  async function applyVendorPayoutResult(
    ref: string,
    result: ProviderPaymentResult,
    lastError?: string,
  ): Promise<ApplyVendorPayoutResult> {
    const index = vendorPayouts.findIndex((p) => p.referenceId === ref);
    if (index === -1) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const current = vendorPayouts[index];
    if (current.status === "SUCCESS") {
      if (result === "SUCCESS") {
        return { ok: true, payout: cloneVendorPayout(current) };
      }
      return { ok: false, code: "TERMINAL", payout: cloneVendorPayout(current) };
    }
    if (current.status === "FAILED" && result === "FAILED") {
      return { ok: true, payout: cloneVendorPayout(current) };
    }
    if (current.status === "FAILED" && result === "SUCCESS") {
      // Late SUCCESS after we marked FAILED (rare) — allow upgrade.
    } else if (current.status !== "PENDING") {
      return { ok: false, code: "TERMINAL", payout: cloneVendorPayout(current) };
    }

    const updated: VendorPayout = {
      ...current,
      status: result === "SUCCESS" ? "SUCCESS" : "FAILED",
      lastError:
        result === "FAILED"
          ? lastError ?? current.lastError
          : undefined,
      updatedAt: new Date(),
    };
    vendorPayouts = [
      ...vendorPayouts.slice(0, index),
      updated,
      ...vendorPayouts.slice(index + 1),
    ];
    return { ok: true, payout: cloneVendorPayout(updated) };
  }

  // ─── Commission Settings (ADR-0096 Slice 3) ───────────────────────────────────
  let commissionSettings: CommissionSettings = {
    id: "default",
    globalEnabled: false,
    globalDefaultPercent: 0,
    minimumOrderTotalRwf: 1000,
    updatedAt: new Date(),
  };

  async function getCommissionSettings(): Promise<CommissionSettings> {
    return { ...commissionSettings };
  }

  async function updateCommissionSettings(
    input: UpdateCommissionSettingsInput,
  ): Promise<CommissionSettings> {
    const { normalizeCommissionPercent, normalizeMinimumOrderTotalRwf } =
      await import("@/lib/momo/commission");

    commissionSettings = {
      ...commissionSettings,
      ...input,
      updatedAt: new Date(),
    };

    // Normalize values through pure math helpers
    if (input.globalDefaultPercent !== undefined) {
      commissionSettings.globalDefaultPercent = normalizeCommissionPercent(
        input.globalDefaultPercent,
      );
    }
    if (input.minimumOrderTotalRwf !== undefined) {
      commissionSettings.minimumOrderTotalRwf =
        normalizeMinimumOrderTotalRwf(input.minimumOrderTotalRwf);
    }

    return { ...commissionSettings };
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

  async function bulkCreateProspects(
    input: BulkCreateProspectsInput,
  ): Promise<Prospect[]> {
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
    input: UpdateProspectInput,
  ): Promise<Prospect | null> {
    const idx = prospects.findIndex((p) => p.id === prospectId);
    if (idx === -1) return null;
    const existing = prospects[idx];

    if (input.status !== undefined && input.status !== existing.status) {
      if (!canTransitionProspectStatus(existing.status, input.status)) {
        throw new Error(
          `Invalid status transition: ${existing.status} → ${input.status}`,
        );
      }
    }

    const updated: Prospect = { ...existing, updatedAt: new Date() };
    if (input.businessName !== undefined)
      updated.businessName = input.businessName.trim();
    if (input.contactName !== undefined)
      updated.contactName = input.contactName?.trim() || undefined;
    if (input.phone !== undefined)
      updated.phone = input.phone?.trim() || undefined;
    if (input.area !== undefined)
      updated.area = input.area?.trim() || undefined;
    if (input.source !== undefined)
      updated.source = input.source?.trim() || undefined;
    if (input.mapsUrl !== undefined)
      updated.mapsUrl = input.mapsUrl?.trim() || undefined;
    if (input.instagramHandle !== undefined)
      updated.instagramHandle = input.instagramHandle?.trim() || undefined;
    if (input.notes !== undefined)
      updated.notes = input.notes?.trim() || undefined;
    if (input.status !== undefined) updated.status = input.status;
    if (input.nextFollowUpAt !== undefined)
      updated.nextFollowUpAt = input.nextFollowUpAt ?? undefined;
    if (input.convertedVendorId !== undefined)
      updated.convertedVendorId = input.convertedVendorId ?? undefined;
    if (input.convertedLeadId !== undefined)
      updated.convertedLeadId = input.convertedLeadId ?? undefined;

    prospects[idx] = updated;
    return getProspect(prospectId);
  }

  async function addProspectInteraction(
    prospectId: string,
    input: CreateProspectInteractionInput,
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
    leadId?: string,
  ): Promise<Prospect | null> {
    const idx = prospects.findIndex((p) => p.id === prospectId);
    if (idx === -1) return null;
    const existing = prospects[idx];
    if (!canTransitionProspectStatus(existing.status, "CONVERTED")) {
      throw new Error(
        `Invalid status transition: ${existing.status} → CONVERTED`,
      );
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
    return {
      ...marketingSettings,
      updatedAt: new Date(marketingSettings.updatedAt),
    };
  }

  async function updateMarketingSiteSettings(
    input: UpdateMarketingSiteSettingsInput,
  ): Promise<MarketingSiteSettings> {
    const updated = { ...marketingSettings, updatedAt: new Date() };
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        (updated as Record<string, unknown>)[key] =
          typeof value === "boolean"
            ? value
            : value === null
              ? undefined
              : (value as string).trim() || undefined;
      }
    }
    marketingSettings = updated;
    return {
      ...marketingSettings,
      updatedAt: new Date(marketingSettings.updatedAt),
    };
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
    value: string,
  ) {
    const entry = { locale, key, value, updatedAt: new Date() };
    siteTranslations.set(`${locale}\u0000${key}`, entry);
    return { ...entry };
  }

  async function deleteSiteTranslation(locale: string, key: string) {
    return siteTranslations.delete(`${locale}\u0000${key}`);
  }

  async function recordMarketingFunnelEvent(
    input: CreateMarketingFunnelEventInput,
  ) {
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
    to?: Date,
  ): Promise<VendorExpense[]> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return [];
    let rows = expenses.filter((e) => e.vendorId === vendor.id);
    if (from) rows = rows.filter((e) => e.spentAt >= from);
    if (to) rows = rows.filter((e) => e.spentAt <= to);
    return rows
      .sort((a, b) => b.spentAt.getTime() - a.spentAt.getTime())
      .map((e) => ({
        ...e,
        spentAt: new Date(e.spentAt),
        createdAt: new Date(e.createdAt),
      }));
  }

  async function createVendorExpense(
    vendorSlug: string,
    input: CreateVendorExpenseInput,
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
    return {
      ...expense,
      spentAt: new Date(expense.spentAt),
      createdAt: new Date(now),
    };
  }

  async function deleteVendorExpense(
    vendorSlug: string,
    expenseId: string,
  ): Promise<boolean> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return false;
    const before = expenses.length;
    expenses = expenses.filter(
      (e) => !(e.id === expenseId && e.vendorId === vendor.id),
    );
    return expenses.length < before;
  }

  async function getProfitSnapshot(
    vendorSlug: string,
    from: Date,
    to: Date,
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
        COUNTED_STATUSES.includes(o.status),
    );
    const periodRevenueRwf = periodOrders.reduce(
      (s, o) => s + o.totalAmount,
      0,
    );

    const periodExpenses = expenses.filter(
      (e) => e.vendorId === vendor.id && e.spentAt >= from && e.spentAt <= to,
    );
    const periodExpensesRwf = periodExpenses.reduce(
      (s, e) => s + e.amountRwf,
      0,
    );

    const marginMap = new Map<
      string,
      {
        name: string;
        soldQty: number;
        revenueRwf: number;
        costRwf: number;
      }
    >();
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
      marginPct:
        data.revenueRwf > 0
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
      periodProfitRwf:
        periodRevenueRwf - periodExpensesRwf - periodCostOfGoodsRwf,
      itemMargins,
    };
  }

  async function getWeekdayAverageGross(
    vendorSlug: string,
    weeks = 4,
  ): Promise<number> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return 0;

    const now = new Date();
    const todayStart = startOfDayInTimezone(now);
    const targetDay = now.getDay();

    let total = 0;
    let count = 0;
    for (let w = 1; w <= weeks; w++) {
      const dayStart = new Date(
        todayStart.getTime() - w * 7 * 24 * 60 * 60 * 1000,
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      if (dayStart.getDay() !== targetDay) continue;
      const gross = orders
        .filter(
          (o) =>
            o.vendorId === vendor.id &&
            o.createdAt >= dayStart &&
            o.createdAt <= dayEnd &&
            COUNTED_STATUSES.includes(o.status),
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
        (o) => o.vendorId === vendor.id && COUNTED_STATUSES.includes(o.status),
      )
      .reduce((s, o) => s + o.totalAmount, 0);
  }

  function reset(): void {
    load();
    briefing.reset();
  }

  return {
    briefing,
    getVendorBySlug,
    resolvePublicRestaurants,
    isSlugAvailable,
    createVendor,
    updateVendor,
    getVendorUpdateSettings,
    setVendorUpdatesEnabled,
    recordVendorUpdate,
    getVendorUpdateOverview,
    incrementVendorUpdateCounter,
    listPublicVendorUpdates,
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
    createMenuIntake,
    getMenuIntake,
    addMenuIntakeRevision,
    listMenuIntakes,
    listDeletedMenuIntakes,
    deleteMenuIntake,
    restoreMenuIntake,
    purgeMenuIntake,
    updateMenuIntakeReview,
    answerMenuIntakeQuestion,
    importMenuIntake,
    authorizeMenuIntake,
    addMenuIntakeAttachment,
    removeMenuIntakeAttachment,
    createMenuIntakeAccess,
    exchangeMenuIntakeAccess,
    revokeMenuIntakeAccess,
    logMenuIntakeContact,
    createBriefingInterest,
    listBriefingInterests,
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
    listInventory,
    createInventoryItem,
    getInventoryItem,
    adjustInventoryItem,
    updateInventoryItem,
    archiveInventoryItem,
    restoreInventoryItem,
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
    applyProviderPaymentResult,
    findResumableManualOrder,
    createVendorPayout,
    getVendorPayoutByRef,
    getLatestVendorPayoutForOrder,
    listVendorPayoutOpsRows,
    applyVendorPayoutResult,
    getCommissionSettings,
    updateCommissionSettings,
    reset,
  };
}
