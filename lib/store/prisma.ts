import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

import type {
  Driver as PrismaDriver,
  InventoryAdjustment as PrismaInventoryAdjustment,
  InventoryItem as PrismaInventoryItem,
  Lead as PrismaLead,
  LeadRoutingAssignment as PrismaLeadRoutingAssignment,
  LeadRoutingRecipient as PrismaLeadRoutingRecipient,
  MenuImage as PrismaMenuImage,
  MenuItem as PrismaMenuItem,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  PrismaClient,
  Vendor as PrismaVendor,
  VendorRecoveryEvent as PrismaVendorRecoveryEvent,
  VendorUpdateBatch as PrismaVendorUpdateBatch,
  VendorUpdateEntry as PrismaVendorUpdateEntry,
} from "@prisma/client";

import { MOMO_SIM_VALID_PIN } from "@/lib/momo/constants";
import { PAYMENT_WINDOW_MS, isWithinPaymentWindow } from "@/lib/momo/payment-window";
import {
  buildMomoUssdDial,
  orderPhoneMatches,
} from "@/lib/momo/ussd-dial";
import {
  isForwardKitchenTransition,
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
} from "@/lib/kds/kitchen-stage";
import { deleteMenuImageBlob, putMenuImageBlob } from "@/lib/menu/blob-storage";
import { sanitizeItemNotes } from "@/lib/menu/customization";
import {
  assertCanAddMenuImage,
  buildMenuBlobPathname,
  MenuImageError,
  nextMenuImageSortOrder,
  pickNextPrimaryImage,
  sortMenuImages,
  validateMenuImageFile,
} from "@/lib/menu/media";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { canonicalizePhone } from "@/lib/format";
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
  deriveDriverHue,
  deriveDriverInitials,
  normalizeDriverName,
} from "@/lib/vendor/driver-display";
import type { Store } from "@/lib/store/types";
import type { CreateMarketingFunnelEventInput, MarketingFunnelEvent, MarketingEventName } from "@/lib/analytics/types";
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
  PayoutMethod,
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
import { isReservedVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";
import { mintOwnerToken } from "@/lib/vendor/owner-token";
import { thumbGradientForId } from "@/lib/menu/gradients";
import {
  normalizePagination,
  resolveDateRange,
  startOfDayInTimezone,
} from "@/lib/orders/history-filters";
import { buildKdsSnapshotRevision } from "@/lib/kds/revision";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
} from "@/lib/menu/validation";
import type {
  CreateInventoryItemInput,
  InventoryAdjustment,
  InventoryCategory,
  InventoryItem,
  InventoryItemDetail,
  InventoryListFilters,
  PaginatedInventory,
  RecordInventoryAdjustmentInput,
  UpdateInventoryItemInput,
} from "@/lib/inventory/types";
import type { PublicRestaurant } from "@/lib/customer-restaurants/types";
import type {
  RecordVendorUpdateInput,
  VendorUpdateBatch,
  VendorUpdateCounter,
  VendorUpdateOverview,
  VendorUpdateSettings,
} from "@/lib/vendor-updates/types";
import {
  VENDOR_UPDATE_BATCH_WINDOW_MS,
  VENDOR_UPDATE_TTL_MS,
} from "@/lib/vendor-updates/types";
import {
  inventoryStatus,
  resolveInventoryUnit,
  validateCreateInventoryItemInput,
  validateInventoryAdjustmentInput,
  validateUpdateInventoryItemInput,
} from "@/lib/inventory/validation";

// Statuses that count toward a vendor's gross takings for the day.
const COUNTED_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];
const ACTIVE_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED"];

type PrismaMenuItemWithImages = PrismaMenuItem & {
  images?: PrismaMenuImage[];
};

type PrismaInventoryItemWithHistory = PrismaInventoryItem & {
  adjustments: PrismaInventoryAdjustment[];
};

type PrismaOrderWithItems = PrismaOrder & {
  orderItems: (PrismaOrderItem & { menuItem: PrismaMenuItemWithImages })[];
  driver?: PrismaDriver | null;
};

const activeMenuWhere = { archivedAt: null } as const;

const menuImageInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.MenuItemInclude;

const orderInclude = {
  orderItems: { include: { menuItem: { include: menuImageInclude } } },
  driver: true,
} satisfies Prisma.OrderInclude;

/** KDS queue reads — line items need menu names, not full image galleries. */
const kdsOrderInclude = {
  orderItems: {
    include: {
      menuItem: {
        select: {
          id: true,
          vendorId: true,
          name: true,
          description: true,
          priceRwf: true,
          imageUrl: true,
          category: true,
          isAvailable: true,
          thumbFrom: true,
          thumbTo: true,
          stockCount: true,
          lowStockThreshold: true,
          costPriceRwf: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
  driver: true,
} satisfies Prisma.OrderInclude;

function kdsOrdersWhere(
  vendorId: string,
  ref: Date = new Date()
): Prisma.OrderWhereInput {
  const startOfToday = startOfDayInTimezone(ref);
  return {
    vendorId,
    OR: [
      { status: { in: ["PAID", "DISPATCHED"] } },
      { status: "COMPLETED", updatedAt: { gte: startOfToday } },
    ],
  };
}

function mapVendor(vendor: PrismaVendor): Vendor {
  return {
    id: vendor.id,
    name: vendor.name,
    slug: vendor.slug,
    phoneNumber: vendor.phoneNumber,
    momoCode: vendor.momoCode,
    isActive: vendor.isActive,
    tagline: vendor.tagline ?? undefined,
    location: vendor.location ?? undefined,
    deliveryTime: vendor.deliveryTime ?? undefined,
    rating: vendor.rating ?? undefined,
    businessCategory: vendor.businessCategory ?? undefined,
    payoutMethod: vendor.payoutMethod as PayoutMethod,
    logoUrl: vendor.logoUrl ?? undefined,
    coverImageUrl: vendor.coverImageUrl ?? undefined,
    description: vendor.description ?? undefined,
    featureWhatsappNotify: vendor.featureWhatsappNotify,
    featureStockTracking: vendor.featureStockTracking,
    featureProfitInsights: vendor.featureProfitInsights,
    createdAt: vendor.createdAt,
    // ownerTokenHash deliberately omitted — server-only (ADR-0022).
  };
}

function mapRecoveryEvent(
  event: PrismaVendorRecoveryEvent,
  vendor?: { slug: string; name: string }
): VendorRecoveryEvent {
  return {
    id: event.id,
    vendorId: event.vendorId,
    context: event.context ?? undefined,
    at: event.at,
    reviewedAt: event.reviewedAt ?? undefined,
    reviewNote: event.reviewNote ?? undefined,
    vendorSlug: vendor?.slug,
    vendorName: vendor?.name,
  };
}

function mapLeadRoutingAssignment(
  assignment: PrismaLeadRoutingAssignment
): LeadRoutingAssignment {
  return {
    id: assignment.id,
    leadId: assignment.leadId,
    recipientId: assignment.recipientId,
    recipientName: assignment.recipientName,
    recipientPhone: assignment.recipientPhone,
    assignedAt: assignment.assignedAt,
  };
}

function mapLead(
  lead: PrismaLead & {
    routingAssignment?: PrismaLeadRoutingAssignment | null;
  }
): Lead {
  return {
    id: lead.id,
    businessName: lead.businessName,
    businessType: lead.businessType,
    contactName: lead.contactName,
    phone: lead.phone,
    area: lead.area,
    message: lead.message ?? undefined,
    status: lead.status as LeadStatus,
    source: lead.source ?? undefined,
    consentAt: lead.consentAt,
    createdAt: lead.createdAt,
    routingAssignment: lead.routingAssignment
      ? mapLeadRoutingAssignment(lead.routingAssignment)
      : undefined,
  };
}

function mapLeadRoutingRecipient(
  recipient: PrismaLeadRoutingRecipient
): LeadRoutingRecipient {
  return {
    id: recipient.id,
    name: recipient.name,
    phone: recipient.phone,
    enabled: recipient.enabled,
    createdAt: recipient.createdAt,
    updatedAt: recipient.updatedAt,
  };
}

function mapOperatorAction(
  row: {
    id: string;
    vendorId: string | null;
    action: string;
    detail: string | null;
    operatorId: string;
    at: Date;
  }
): OperatorAction {
  return {
    id: row.id,
    vendorId: row.vendorId ?? undefined,
    action: row.action,
    detail: row.detail ?? undefined,
    operatorId: row.operatorId,
    at: row.at,
  };
}

function mapMenuImage(image: PrismaMenuImage): MenuImage {
  return {
    id: image.id,
    menuItemId: image.menuItemId,
    url: image.url,
    blobPath: image.blobPath ?? undefined,
    sortOrder: image.sortOrder,
    isPrimary: image.isPrimary,
    createdAt: image.createdAt,
  };
}

function mapMenuItem(item: PrismaMenuItemWithImages): MenuItem {
  const images = item.images
    ? sortMenuImages(item.images.map(mapMenuImage))
    : undefined;
  return {
    id: item.id,
    vendorId: item.vendorId,
    name: item.name,
    description: item.description ?? undefined,
    priceRwf: item.priceRwf,
    imageUrl: item.imageUrl ?? undefined,
    category: item.category,
    isAvailable: item.isAvailable,
    thumbFrom: item.thumbFrom ?? undefined,
    thumbTo: item.thumbTo ?? undefined,
    stockCount: item.stockCount ?? undefined,
    lowStockThreshold: item.lowStockThreshold ?? undefined,
    costPriceRwf: item.costPriceRwf ?? undefined,
    archivedAt: item.archivedAt ?? undefined,
    images: images && images.length > 0 ? images : undefined,
  };
}

function mapVendorUpdateBatch(
  batch: PrismaVendorUpdateBatch & { entries: PrismaVendorUpdateEntry[] }
): VendorUpdateBatch {
  return {
    id: batch.id,
    vendorId: batch.vendorId,
    revision: batch.revision,
    publishedAt: batch.publishedAt,
    expiresAt: batch.expiresAt,
    openCount: batch.openCount,
    menuVisitCount: batch.menuVisitCount,
    entries: batch.entries.map((entry) => ({
      id: entry.id,
      batchId: entry.batchId,
      type: entry.type,
      subjectId: entry.subjectId,
      name: entry.name,
      imageUrl: entry.imageUrl ?? undefined,
      oldPriceRwf: entry.oldPriceRwf ?? undefined,
      currentPriceRwf: entry.currentPriceRwf ?? undefined,
      summary: entry.summary ?? undefined,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })),
  };
}

const INVENTORY_CATEGORY_TO_PRISMA = {
  Ingredients: "INGREDIENTS",
  Drinks: "DRINKS",
  Packaging: "PACKAGING",
  Cleaning: "CLEANING",
  Other: "OTHER",
} as const;

const INVENTORY_CATEGORY_FROM_PRISMA: Record<string, InventoryCategory> = {
  INGREDIENTS: "Ingredients",
  DRINKS: "Drinks",
  PACKAGING: "Packaging",
  CLEANING: "Cleaning",
  OTHER: "Other",
};

function mapInventoryItem(item: PrismaInventoryItem): InventoryItem {
  return {
    id: item.id,
    vendorId: item.vendorId,
    name: item.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    lowStockThreshold: Number(item.lowStockThreshold),
    category: INVENTORY_CATEGORY_FROM_PRISMA[item.category] ?? "Other",
    unitCostRwf: item.unitCostRwf ?? undefined,
    note: item.note ?? undefined,
    archivedAt: item.archivedAt ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapInventoryAdjustment(
  entry: PrismaInventoryAdjustment
): InventoryAdjustment {
  return {
    id: entry.id,
    inventoryItemId: entry.inventoryItemId,
    type: entry.type,
    quantity: Number(entry.quantity),
    oldQuantity: Number(entry.oldQuantity),
    newQuantity: Number(entry.newQuantity),
    note: entry.note ?? undefined,
    createdAt: entry.createdAt,
  };
}

function mapInventoryDetail(
  row: PrismaInventoryItemWithHistory
): InventoryItemDetail {
  return {
    item: mapInventoryItem(row),
    history: row.adjustments.map(mapInventoryAdjustment),
  };
}

function mapDriver(driver: PrismaDriver): Driver {
  return {
    id: driver.id,
    vendorId: driver.vendorId,
    name: driver.name,
    phone: driver.phone,
    initials: driver.initials,
    hue: driver.hue,
  };
}

function mapPayment(payment: PrismaPayment): Payment {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    provider: payment.provider as Payment["provider"],
    transactionRef: payment.transactionRef,
    status: payment.status as Payment["status"],
    createdAt: payment.createdAt,
  };
}

function mapOrder(order: PrismaOrderWithItems): Order {
  return {
    id: order.id,
    vendorId: order.vendorId,
    customerPhone: order.customerPhone,
    deliverySector: order.deliverySector,
    landmark: order.landmark,
    totalAmount: order.totalAmount,
    status: order.status as OrderStatus,
    kitchenStage: order.kitchenStage ?? undefined,
    driverId: order.driverId ?? undefined,
    assignedDriver: order.driver ? mapDriver(order.driver) : undefined,
    paidAt: order.paidAt ?? undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    orderItems: order.orderItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      menuItem: mapMenuItem(item.menuItem),
      quantity: item.quantity,
      unitPriceRwf: item.unitPriceRwf,
      notes: item.notes ?? undefined,
    })),
  };
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function isTransactionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
}

/**
 * Prisma/Postgres adapter: the durable production Store. Every method maps
 * Prisma rows onto the hand-written domain types so callers never see Prisma's
 * shapes. It satisfies the exact same contract suite as the in-memory adapter,
 * so the two cannot drift. ids come from Prisma (cuid) and are never assumed.
 */
export function createPrismaStore(client: PrismaClient = defaultPrisma): Store {
  async function getVendorBySlug(slug: string): Promise<Vendor | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(slug) },
    });
    return vendor ? mapVendor(vendor) : null;
  }

  async function isSlugAvailable(slug: string): Promise<boolean> {
    const normalized = normalizeVendorSlug(slug);
    if (!normalized) return false;
    if (isReservedVendorSlug(normalized)) return false;
    const vendor = await client.vendor.findUnique({ where: { slug: normalized } });
    return vendor === null;
  }

  async function createVendor(input: CreateVendorInput): Promise<Vendor> {
    const normalizedSlug = normalizeVendorSlug(input.slug);
    if (!normalizedSlug) {
      throw new Error("Invalid slug");
    }

    try {
      const vendor = await client.vendor.create({
        data: {
          name: input.name.trim(),
          slug: normalizedSlug,
          phoneNumber: input.phoneNumber,
          momoCode: input.momoCode,
          isActive: true,
          kitchenOpen: true,
          tagline: input.tagline ?? null,
          location: input.location ?? null,
          deliveryTime: input.deliveryTime ?? null,
          businessCategory: input.businessCategory ?? null,
          payoutMethod: input.payoutMethod ?? "MERCHANT_CODE",
          logoUrl: input.logoUrl ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
          description: input.description ?? null,
          ownerTokenHash: input.ownerTokenHash ?? null,
          featureWhatsappNotify: false,
          featureStockTracking: false,
          featureProfitInsights: false,
        },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("Slug already taken");
      }
      throw error;
    }
  }

  async function updateVendor(
    vendorSlug: string,
    input: UpdateVendorInput
  ): Promise<Vendor | null> {
    const slug = normalizeVendorSlug(vendorSlug);
    if (input.slug !== undefined) {
      const newSlug = normalizeVendorSlug(input.slug);
      if (!newSlug) return null;
      if (newSlug !== slug && !(await isSlugAvailable(newSlug))) {
        throw new Error("Slug already taken");
      }
    }

    try {
      const vendor = await client.vendor.update({
        where: { slug },
        data: {
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
        },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      if (isUniqueConstraintError(error)) {
        throw new Error("Slug already taken");
      }
      throw error;
    }
  }

  async function getVendorUpdateSettings(
    vendorSlug: string
  ): Promise<VendorUpdateSettings> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { updatesEnabled: true },
    });
    return { enabled: vendor?.updatesEnabled ?? true };
  }

  async function setVendorUpdatesEnabled(
    vendorSlug: string,
    enabled: boolean
  ): Promise<VendorUpdateSettings | null> {
    try {
      const vendor = await client.vendor.update({
        where: { slug: normalizeVendorSlug(vendorSlug) },
        data: { updatesEnabled: enabled },
        select: { updatesEnabled: true },
      });
      return { enabled: vendor.updatesEnabled };
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function recordVendorUpdate(
    vendorSlug: string,
    input: RecordVendorUpdateInput
  ): Promise<VendorUpdateBatch | null> {
    if (input.announce === false) return null;
    const at = new Date(input.at ?? Date.now());

    return client.$transaction(async (tx) => {
      const vendor = await tx.vendor.findUnique({
        where: { slug: normalizeVendorSlug(vendorSlug) },
        select: { id: true, isActive: true, updatesEnabled: true },
      });
      if (!vendor?.isActive || !vendor.updatesEnabled) return null;

      const latest = await tx.vendorUpdateBatch.findFirst({
        where: { vendorId: vendor.id },
        orderBy: { publishedAt: "desc" },
        include: { entries: true },
      });
      const rollsIntoLatest =
        latest != null &&
        at.getTime() - latest.publishedAt.getTime() <=
          VENDOR_UPDATE_BATCH_WINDOW_MS;

      if (!rollsIntoLatest) {
        const created = await tx.vendorUpdateBatch.create({
          data: {
            vendorId: vendor.id,
            revision: 1,
            publishedAt: at,
            expiresAt: new Date(at.getTime() + VENDOR_UPDATE_TTL_MS),
            entries: {
              create: {
                type: input.entry.type,
                subjectId: input.entry.subjectId,
                name: input.entry.name,
                imageUrl: input.entry.imageUrl ?? null,
                oldPriceRwf: input.entry.oldPriceRwf ?? null,
                currentPriceRwf: input.entry.currentPriceRwf ?? null,
                summary: input.entry.summary ?? null,
                createdAt: at,
                updatedAt: at,
              },
            },
          },
          include: { entries: true },
        });
        return mapVendorUpdateBatch(created);
      }

      await tx.vendorUpdateEntry.upsert({
        where: {
          batchId_type_subjectId: {
            batchId: latest.id,
            type: input.entry.type,
            subjectId: input.entry.subjectId,
          },
        },
        create: {
          batchId: latest.id,
          type: input.entry.type,
          subjectId: input.entry.subjectId,
          name: input.entry.name,
          imageUrl: input.entry.imageUrl ?? null,
          oldPriceRwf: input.entry.oldPriceRwf ?? null,
          currentPriceRwf: input.entry.currentPriceRwf ?? null,
          summary: input.entry.summary ?? null,
          createdAt: at,
          updatedAt: at,
        },
        update: {
          name: input.entry.name,
          imageUrl: input.entry.imageUrl ?? null,
          currentPriceRwf: input.entry.currentPriceRwf ?? null,
          summary: input.entry.summary ?? null,
          updatedAt: at,
        },
      });
      const revised = await tx.vendorUpdateBatch.update({
        where: { id: latest.id },
        data: {
          revision: { increment: 1 },
          publishedAt: at,
          expiresAt: new Date(at.getTime() + VENDOR_UPDATE_TTL_MS),
        },
        include: { entries: true },
      });
      return mapVendorUpdateBatch(revised);
    });
  }

  async function getVendorUpdateOverview(
    vendorSlug: string,
    at = new Date()
  ): Promise<VendorUpdateOverview | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true, updatesEnabled: true },
    });
    if (!vendor) return null;
    const [activeBatch, totals] = await Promise.all([
      client.vendorUpdateBatch.findFirst({
        where: { vendorId: vendor.id, expiresAt: { gt: at } },
        orderBy: { publishedAt: "desc" },
        include: { entries: true },
      }),
      client.vendorUpdateBatch.aggregate({
        where: { vendorId: vendor.id },
        _count: { _all: true },
        _sum: {
          revision: true,
          openCount: true,
          menuVisitCount: true,
        },
      }),
    ]);
    return {
      settings: { enabled: vendor.updatesEnabled },
      activeBatch: activeBatch ? mapVendorUpdateBatch(activeBatch) : null,
      totals: {
        batches: totals._count._all,
        revisions: totals._sum.revision ?? 0,
        opens: totals._sum.openCount ?? 0,
        menuVisits: totals._sum.menuVisitCount ?? 0,
      },
    };
  }

  async function incrementVendorUpdateCounter(
    batchId: string,
    counter: VendorUpdateCounter
  ): Promise<VendorUpdateBatch | null> {
    try {
      const batch = await client.vendorUpdateBatch.update({
        where: { id: batchId },
        data:
          counter === "open"
            ? { openCount: { increment: 1 } }
            : { menuVisitCount: { increment: 1 } },
        include: { entries: true },
      });
      return mapVendorUpdateBatch(batch);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function getVendorOwnerTokenHash(
    vendorSlug: string
  ): Promise<string | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { ownerTokenHash: true },
    });
    return vendor?.ownerTokenHash ?? null;
  }

  async function setVendorOwnerToken(
    vendorSlug: string,
    ownerTokenHash: string
  ): Promise<Vendor | null> {
    try {
      const vendor = await client.vendor.update({
        where: { slug: normalizeVendorSlug(vendorSlug) },
        data: { ownerTokenHash },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function recordRecoveryEvent(
    input: RecordRecoveryEventInput
  ): Promise<VendorRecoveryEvent> {
    const event = await client.vendorRecoveryEvent.create({
      data: {
        vendorId: input.vendorId,
        context: input.context ?? null,
      },
    });
    return mapRecoveryEvent(event);
  }

  async function listRecoveryEvents(
    vendorId: string
  ): Promise<VendorRecoveryEvent[]> {
    const events = await client.vendorRecoveryEvent.findMany({
      where: { vendorId },
      orderBy: { at: "desc" },
    });
    return events.map((event) => mapRecoveryEvent(event));
  }

  async function listAllRecoveryEvents(
    filters?: RecoveryEventFilters
  ): Promise<VendorRecoveryEvent[]> {
    const where: Prisma.VendorRecoveryEventWhereInput = {};
    if (filters?.vendorSlug) {
      where.vendor = { slug: normalizeVendorSlug(filters.vendorSlug) };
    }
    if (filters?.unreviewedOnly) {
      where.reviewedAt = null;
    }
    const events = await client.vendorRecoveryEvent.findMany({
      where,
      include: { vendor: { select: { slug: true, name: true } } },
      orderBy: { at: "desc" },
      take: filters?.limit ?? 100,
    });
    return events.map((event) =>
      mapRecoveryEvent(event, {
        slug: event.vendor.slug,
        name: event.vendor.name,
      })
    );
  }

  async function reviewRecoveryEvent(
    eventId: string,
    reviewNote?: string
  ): Promise<VendorRecoveryEvent | null> {
    try {
      const event = await client.vendorRecoveryEvent.update({
        where: { id: eventId },
        data: {
          reviewedAt: new Date(),
          reviewNote: reviewNote?.trim() || null,
        },
      });
      return mapRecoveryEvent(event);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function createLead(input: CreateLeadInput): Promise<Lead> {
    const phone = canonicalizePhone(input.phone);
    if (!phone) throw new Error("Invalid lead phone");

    const lead = await client.lead.create({
      data: {
        businessName: input.businessName.trim(),
        businessType: input.businessType.trim(),
        contactName: input.contactName.trim(),
        phone,
        area: input.area.trim(),
        message: input.message?.trim() || null,
        source: input.source?.trim() || null,
        consentAt: input.consentAt,
      },
    });
    return mapLead(lead);
  }

  async function listLeads(): Promise<Lead[]> {
    const leads = await client.lead.findMany({
      include: { routingAssignment: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return leads.map(mapLead);
  }

  async function updateLeadStatus(
    leadId: string,
    status: LeadStatus
  ): Promise<Lead | null> {
    try {
      const lead = await client.lead.update({
        where: { id: leadId },
        data: { status },
      });
      return mapLead(lead);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function listLeadRoutingRecipients(): Promise<LeadRoutingRecipient[]> {
    const recipients = await client.leadRoutingRecipient.findMany({
      where: { archivedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return recipients.map(mapLeadRoutingRecipient);
  }

  async function createLeadRoutingRecipient(
    input: CreateLeadRoutingRecipientInput
  ): Promise<LeadRoutingRecipient> {
    const normalized = normalizeLeadRoutingRecipient(input);
    const existing = await client.leadRoutingRecipient.findUnique({
      where: { phone: normalized.phone },
    });
    if (existing && !existing.archivedAt) {
      throw new Error("A recipient with this WhatsApp number already exists");
    }

    try {
      const recipient = existing
        ? await client.leadRoutingRecipient.update({
            where: { id: existing.id },
            data: { ...normalized, archivedAt: null },
          })
        : await client.leadRoutingRecipient.create({ data: normalized });
      return mapLeadRoutingRecipient(recipient);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("A recipient with this WhatsApp number already exists");
      }
      throw error;
    }
  }

  async function updateLeadRoutingRecipient(
    recipientId: string,
    input: UpdateLeadRoutingRecipientInput
  ): Promise<LeadRoutingRecipient | null> {
    const current = await client.leadRoutingRecipient.findFirst({
      where: { id: recipientId, archivedAt: null },
    });
    if (!current) return null;

    const normalized = normalizeLeadRoutingRecipient({
      name: input.name ?? current.name,
      phone: input.phone ?? current.phone,
      enabled: input.enabled ?? current.enabled,
    });
    try {
      const recipient = await client.leadRoutingRecipient.update({
        where: { id: recipientId },
        data: normalized,
      });
      return mapLeadRoutingRecipient(recipient);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("A recipient with this WhatsApp number already exists");
      }
      throw error;
    }
  }

  async function removeLeadRoutingRecipient(
    recipientId: string
  ): Promise<boolean> {
    const result = await client.leadRoutingRecipient.updateMany({
      where: { id: recipientId, archivedAt: null },
      data: { enabled: false, archivedAt: new Date() },
    });
    return result.count > 0;
  }

  async function assignLeadRoutingRecipient(
    leadId: string
  ): Promise<LeadRoutingAssignment | null> {
    return client.$transaction(
      async (tx) => {
        // One global transaction-scoped lock serializes cursor reads/writes
        // across Vercel instances. It releases at commit or rollback.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(873014205)`;

        const assignmentId = randomUUID();
        const assignments = await tx.$queryRaw<PrismaLeadRoutingAssignment[]>`
          WITH "existing" AS (
            SELECT assignment.*
            FROM "LeadRoutingAssignment" assignment
            WHERE assignment."leadId" = ${leadId}
          ),
          "enabled" AS (
            SELECT
              recipient.*,
              ROW_NUMBER() OVER (
                ORDER BY recipient."createdAt" ASC, recipient."id" ASC
              ) AS "position"
            FROM "LeadRoutingRecipient" recipient
            WHERE recipient."enabled" = true
              AND recipient."archivedAt" IS NULL
          ),
          "cursor" AS (
            SELECT enabled."position"
            FROM "enabled" enabled
            JOIN "LeadRoutingSettings" settings
              ON settings."id" = 'default'
             AND settings."lastRecipientId" = enabled."id"
          ),
          "nextRecipient" AS (
            SELECT enabled.*
            FROM "enabled" enabled
            ORDER BY
              CASE
                WHEN enabled."position" > COALESCE(
                  (SELECT cursor."position" FROM "cursor" cursor),
                  0
                ) THEN 0
                ELSE 1
              END,
              enabled."position"
            LIMIT 1
          ),
          "inserted" AS (
            INSERT INTO "LeadRoutingAssignment" (
              "id",
              "leadId",
              "recipientId",
              "recipientName",
              "recipientPhone",
              "assignedAt"
            )
            SELECT
              ${assignmentId},
              ${leadId},
              recipient."id",
              recipient."name",
              recipient."phone",
              CURRENT_TIMESTAMP
            FROM "nextRecipient" recipient
            WHERE EXISTS (SELECT 1 FROM "Lead" lead WHERE lead."id" = ${leadId})
              AND NOT EXISTS (SELECT 1 FROM "existing")
            ON CONFLICT ("leadId") DO NOTHING
            RETURNING *
          ),
          "cursorUpdate" AS (
            INSERT INTO "LeadRoutingSettings" (
              "id",
              "lastRecipientId",
              "updatedAt"
            )
            SELECT 'default', inserted."recipientId", CURRENT_TIMESTAMP
            FROM "inserted" inserted
            ON CONFLICT ("id") DO UPDATE SET
              "lastRecipientId" = EXCLUDED."lastRecipientId",
              "updatedAt" = CURRENT_TIMESTAMP
            RETURNING "id"
          )
          SELECT existing.* FROM "existing" existing
          UNION ALL
          SELECT inserted.* FROM "inserted" inserted
          LIMIT 1
        `;
        return assignments[0]
          ? mapLeadRoutingAssignment(assignments[0])
          : null;
      },
      { maxWait: 15_000, timeout: 30_000 }
    );
  }

  async function listVendors(
    filters?: VendorListFilters
  ): Promise<VendorListEntry[]> {
    const where: Prisma.VendorWhereInput = {};
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { slug: { contains: filters.search, mode: "insensitive" } },
        { phoneNumber: { contains: filters.search } },
      ];
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    const rows = await client.vendor.findMany({
      where,
      include: {
        _count: { select: { recoveryEvents: true } },
        recoveryEvents: {
          orderBy: { at: "desc" },
          take: 1,
          select: { at: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((vendor) => ({
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      phoneNumber: vendor.phoneNumber,
      isActive: vendor.isActive,
      kitchenOpen: vendor.kitchenOpen && vendor.isActive,
      createdAt: vendor.createdAt,
      recoveryEventCount: vendor._count.recoveryEvents,
      lastRecoveryAt: vendor.recoveryEvents[0]?.at,
    }));
  }

  async function getOperatorVendorDetail(
    vendorSlug: string
  ): Promise<OperatorVendorDetail | null> {
    const vendor = await getVendorBySlug(vendorSlug);
    if (!vendor) return null;
    const [menuItemCount, activeOrderCount, recoveryEventCount, recentOrders] =
      await Promise.all([
        client.menuItem.count({
          where: { vendorId: vendor.id, archivedAt: null },
        }),
        client.order.count({
          where: {
            vendorId: vendor.id,
            status: { in: ["PENDING", "PAID", "DISPATCHED"] },
          },
        }),
        client.vendorRecoveryEvent.count({ where: { vendorId: vendor.id } }),
        client.order.findMany({
          where: { vendorId: vendor.id },
          include: kdsOrderInclude,
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ]);

    const menu = await getMenu(vendorSlug);
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
      menuItemCount,
      activeOrderCount,
      recoveryEventCount,
      recentOrders: recentOrders.map(mapOrder),
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
    try {
      const vendor = await client.vendor.update({
        where: { slug: normalizeVendorSlug(vendorSlug) },
        data: {
          isActive: active,
          ...(!active ? { kitchenOpen: false } : {}),
        },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function operatorUpdateVendor(
    vendorSlug: string,
    input: OperatorUpdateVendorInput
  ): Promise<Vendor | null> {
    const {
      isActive,
      kitchenOpen: nextKitchenOpen,
      featureWhatsappNotify,
      featureStockTracking,
      featureProfitInsights,
      ...rest
    } = input;
    const updated = await updateVendor(vendorSlug, rest);
    if (!updated) return null;

    const featureFlagData: Record<string, boolean> = {};
    if (featureWhatsappNotify !== undefined)
      featureFlagData.featureWhatsappNotify = featureWhatsappNotify;
    if (featureStockTracking !== undefined)
      featureFlagData.featureStockTracking = featureStockTracking;
    if (featureProfitInsights !== undefined)
      featureFlagData.featureProfitInsights = featureProfitInsights;

    if (Object.keys(featureFlagData).length > 0) {
      try {
        await client.vendor.update({
          where: { slug: normalizeVendorSlug(vendorSlug) },
          data: featureFlagData,
        });
      } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
      }
    }

    if (isActive !== undefined) {
      return setVendorActive(vendorSlug, isActive);
    }
    if (nextKitchenOpen !== undefined) {
      try {
        const vendor = await client.vendor.update({
          where: { slug: normalizeVendorSlug(vendorSlug) },
          data: { kitchenOpen: nextKitchenOpen },
        });
        return mapVendor(vendor);
      } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
      }
    }
    return getVendorBySlug(vendorSlug);
  }

  async function operatorRevokeOwnerToken(
    vendorSlug: string
  ): Promise<Vendor | null> {
    try {
      const vendor = await client.vendor.update({
        where: { slug: normalizeVendorSlug(vendorSlug) },
        data: { ownerTokenHash: null },
      });
      return mapVendor(vendor);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
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
    const existing = await client.order.findUnique({
      where: { id: orderId },
      select: { id: true, paidAt: true },
    });
    if (!existing) return null;

    const data: Prisma.OrderUpdateInput = { updatedAt: new Date() };
    if (patch.status !== undefined) {
      data.status = patch.status;
      if (patch.status === "PAID" && !existing.paidAt) {
        data.paidAt = new Date();
        data.kitchenStage = "NEW";
      }
    }
    if (patch.kitchenStage !== undefined) {
      data.kitchenStage = patch.kitchenStage;
    }

    const order = await client.order.update({
      where: { id: orderId },
      include: kdsOrderInclude,
      data,
    });
    return mapOrder(order);
  }

  async function recordOperatorAction(
    input: RecordOperatorActionInput
  ): Promise<OperatorAction> {
    const row = await client.operatorAction.create({
      data: {
        vendorId: input.vendorId ?? null,
        action: input.action,
        detail: input.detail ?? null,
        operatorId: input.operatorId ?? "platform",
      },
    });
    return mapOperatorAction(row);
  }

  async function listOperatorActions(
    vendorSlug?: string,
    limit = 50
  ): Promise<OperatorAction[]> {
    const vendor = vendorSlug
      ? await client.vendor.findUnique({
          where: { slug: normalizeVendorSlug(vendorSlug) },
          select: { id: true },
        })
      : undefined;
    if (vendorSlug && !vendor) return [];
    const rows = await client.operatorAction.findMany({
      where: vendor ? { vendorId: vendor.id } : undefined,
      orderBy: { at: "desc" },
      take: limit,
    });
    return rows.map(mapOperatorAction);
  }

  async function getMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: { vendor: { slug: vendorSlug }, ...activeMenuWhere },
      include: menuImageInclude,
      orderBy: { createdAt: "asc" },
    });
    return items.map(mapMenuItem);
  }

  async function getAvailableMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: {
        vendor: { slug: vendorSlug },
        isAvailable: true,
        ...activeMenuWhere,
      },
      include: menuImageInclude,
      orderBy: { createdAt: "asc" },
    });
    return items.map(mapMenuItem);
  }

  async function getArchivedMenu(vendorSlug: string): Promise<MenuItem[]> {
    const items = await client.menuItem.findMany({
      where: { vendor: { slug: vendorSlug }, archivedAt: { not: null } },
      include: menuImageInclude,
      orderBy: { archivedAt: "desc" },
    });
    return items.map(mapMenuItem);
  }

  async function getMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    return item ? mapMenuItem(item) : null;
  }

  async function getCategories(vendorSlug: string): Promise<string[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    const rows = await client.menuItem.findMany({
      where: { vendorId: vendor.id, ...activeMenuWhere },
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return ["All", ...rows.map((r) => r.category)];
  }

  async function createMenuItem(
    vendorSlug: string,
    input: CreateMenuItemInput
  ): Promise<MenuItem> {
    const validationError = validateCreateMenuItemInput(input);
    if (validationError) {
      throw new Error(validationError);
    }

    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) throw new Error("Vendor not found");

    const gradient = thumbGradientForId(`new_${Date.now()}`);
    const created = await client.menuItem.create({
      data: {
        vendorId: vendor.id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        priceRwf: input.priceRwf,
        category: input.category?.trim() || "General",
        isAvailable: true,
        thumbFrom: gradient.thumbFrom,
        thumbTo: gradient.thumbTo,
      },
    });
    return mapMenuItem(created);
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

    const existing = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
    });
    if (!existing) return null;

    const data: Prisma.MenuItemUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.priceRwf !== undefined) data.priceRwf = input.priceRwf;
    if (input.description !== undefined) {
      data.description = input.description.trim() || null;
    }
    if (input.category !== undefined) {
      data.category = input.category.trim() || "General";
    }
    if (input.stockCount !== undefined) {
      data.stockCount = input.stockCount;
    }
    if (input.lowStockThreshold !== undefined) {
      data.lowStockThreshold = input.lowStockThreshold;
    }
    if (input.costPriceRwf !== undefined) {
      data.costPriceRwf = input.costPriceRwf;
    }

    try {
      const updated = await client.menuItem.update({
        where: { id: existing.id },
        data,
      });
      return mapMenuItem(updated);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function archiveMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const existing = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug }, ...activeMenuWhere },
    });
    if (!existing) return null;

    try {
      const updated = await client.menuItem.update({
        where: { id: existing.id },
        data: { archivedAt: new Date() },
      });
      return mapMenuItem(updated);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function restoreMenuItem(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const existing = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug }, archivedAt: { not: null } },
    });
    if (!existing) return null;

    try {
      const updated = await client.menuItem.update({
        where: { id: existing.id },
        data: { archivedAt: null },
      });
      return mapMenuItem(updated);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function renameCategory(
    vendorSlug: string,
    from: string,
    to: string
  ): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;

    const result = await client.menuItem.updateMany({
      where: {
        vendorId: vendor.id,
        category: from,
        ...activeMenuWhere,
      },
      data: { category: to.trim() || "General" },
    });
    return result.count;
  }

  async function resolvePublicRestaurants(
    vendorIds: string[]
  ): Promise<PublicRestaurant[]> {
    const uniqueIds = [...new Set(vendorIds)];
    if (uniqueIds.length === 0) return [];
    const rows = await client.vendor.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        logoUrl: true,
        location: true,
        tagline: true,
      },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return uniqueIds.flatMap((vendorId) => {
      const row = byId.get(vendorId);
      if (!row) return [];
      return [
        {
          vendorId: row.id,
          slug: row.slug,
          name: row.name,
          isAvailable: row.isActive,
          logoUrl: row.logoUrl ?? undefined,
          location: row.location ?? undefined,
          tagline: row.tagline ?? undefined,
        },
      ];
    });
  }

  async function listInventory(
    vendorSlug: string,
    filters: InventoryListFilters,
    pagination: Pagination
  ): Promise<PaginatedInventory> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
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

    const [activeRows, filteredRows] = await Promise.all([
      client.inventoryItem.findMany({
        where: { vendorId: vendor.id, archivedAt: null },
      }),
      client.inventoryItem.findMany({
        where: {
          vendorId: vendor.id,
          archivedAt: filters.archived ? { not: null } : null,
          ...(filters.search?.trim()
            ? { name: { contains: filters.search.trim(), mode: "insensitive" } }
            : {}),
          ...(filters.category && filters.category !== "ALL"
            ? { category: INVENTORY_CATEGORY_TO_PRISMA[filters.category] }
            : {}),
        },
      }),
    ]);

    const counts = activeRows.reduce(
      (result, row) => {
        result.active += 1;
        const status = inventoryStatus(
          Number(row.quantity),
          Number(row.lowStockThreshold)
        );
        if (status === "OUT") result.out += 1;
        if (status === "LOW") result.low += 1;
        return result;
      },
      { active: 0, low: 0, out: 0 }
    );
    const rank = { OUT: 0, LOW: 1, OK: 2 } as const;
    const rows = filteredRows.sort((a, b) => {
      const statusDelta =
        rank[inventoryStatus(Number(a.quantity), Number(a.lowStockThreshold))] -
        rank[inventoryStatus(Number(b.quantity), Number(b.lowStockThreshold))];
      return statusDelta || a.name.localeCompare(b.name);
    });
    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, lastPage);
    const start = (page - 1) * pageSize;
    return {
      items: rows.slice(start, start + pageSize).map(mapInventoryItem),
      total,
      page,
      pageSize,
      counts,
    };
  }

  async function createInventoryItem(
    vendorSlug: string,
    input: CreateInventoryItemInput
  ): Promise<InventoryItem> {
    validateCreateInventoryItemInput(input);
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
    if (!vendor) throw new Error("Vendor not found");
    const created = await client.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          vendorId: vendor.id,
          name: input.name.trim(),
          quantity: input.quantity,
          unit: resolveInventoryUnit(input.unit, input.customUnit),
          lowStockThreshold: input.lowStockThreshold,
          category: INVENTORY_CATEGORY_TO_PRISMA[input.category],
          unitCostRwf: input.unitCostRwf,
          note: input.note?.trim() || null,
        },
      });
      await tx.inventoryAdjustment.create({
        data: {
          inventoryItemId: item.id,
          sequence: 1,
          type: "CORRECTION",
          quantity: input.quantity,
          oldQuantity: 0,
          newQuantity: input.quantity,
          note: "Opening quantity",
        },
      });
      return item;
    });
    return mapInventoryItem(created);
  }

  async function getInventoryItem(
    vendorSlug: string,
    itemId: string
  ): Promise<InventoryItemDetail | null> {
    const item = await client.inventoryItem.findFirst({
      where: {
        id: itemId,
        vendor: { slug: normalizeVendorSlug(vendorSlug) },
      },
      include: { adjustments: { orderBy: { sequence: "desc" } } },
    });
    return item ? mapInventoryDetail(item) : null;
  }

  async function updateInventoryItem(
    vendorSlug: string,
    itemId: string,
    input: UpdateInventoryItemInput
  ): Promise<InventoryItemDetail | null> {
    validateUpdateInventoryItemInput(input);
    const existing = await client.inventoryItem.findFirst({
      where: {
        id: itemId,
        vendor: { slug: normalizeVendorSlug(vendorSlug) },
      },
      select: { id: true },
    });
    if (!existing) return null;
    await client.inventoryItem.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.unit !== undefined
          ? { unit: resolveInventoryUnit(input.unit, input.customUnit) }
          : {}),
        ...(input.lowStockThreshold !== undefined
          ? { lowStockThreshold: input.lowStockThreshold }
          : {}),
        ...(input.category !== undefined
          ? { category: INVENTORY_CATEGORY_TO_PRISMA[input.category] }
          : {}),
        ...(input.unitCostRwf !== undefined
          ? { unitCostRwf: input.unitCostRwf }
          : {}),
        ...(input.note !== undefined
          ? { note: input.note?.trim() || null }
          : {}),
      },
    });
    return getInventoryItem(vendorSlug, itemId);
  }

  async function adjustInventoryItem(
    vendorSlug: string,
    itemId: string,
    input: RecordInventoryAdjustmentInput
  ): Promise<InventoryItemDetail | null> {
    validateInventoryAdjustmentInput(input);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const found = await client.$transaction(
          async (tx) => {
            const item = await tx.inventoryItem.findFirst({
              where: {
                id: itemId,
                vendor: { slug: normalizeVendorSlug(vendorSlug) },
              },
            });
            if (!item) return false;
            if (item.archivedAt) {
              throw new Error("Restore this item before adjusting it");
            }
            const oldQuantity = Number(item.quantity);
            const newQuantity =
              input.type === "RECEIVED"
                ? oldQuantity + input.quantity
                : input.type === "CORRECTION"
                  ? input.quantity
                  : oldQuantity - input.quantity;
            if (newQuantity < 0) throw new Error("Stock cannot go below zero");
            const latest = await tx.inventoryAdjustment.aggregate({
              where: { inventoryItemId: item.id },
              _max: { sequence: true },
            });
            await tx.inventoryItem.update({
              where: { id: item.id },
              data: { quantity: newQuantity },
            });
            await tx.inventoryAdjustment.create({
              data: {
                inventoryItemId: item.id,
                sequence: (latest._max.sequence ?? 0) + 1,
                type: input.type,
                quantity: input.quantity,
                oldQuantity,
                newQuantity,
                note: input.note?.trim() || null,
              },
            });
            return true;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );
        return found ? getInventoryItem(vendorSlug, itemId) : null;
      } catch (error) {
        if (attempt < 2 && (isTransactionConflict(error) || isUniqueConstraintError(error))) {
          continue;
        }
        throw error;
      }
    }
    throw new Error("Could not record inventory adjustment");
  }

  async function archiveInventoryItem(
    vendorSlug: string,
    itemId: string
  ): Promise<InventoryItemDetail | null> {
    const existing = await client.inventoryItem.findFirst({
      where: {
        id: itemId,
        vendor: { slug: normalizeVendorSlug(vendorSlug) },
      },
      select: { id: true },
    });
    if (!existing) return null;
    await client.inventoryItem.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
    });
    return getInventoryItem(vendorSlug, itemId);
  }

  async function restoreInventoryItem(
    vendorSlug: string,
    itemId: string
  ): Promise<InventoryItemDetail | null> {
    const existing = await client.inventoryItem.findFirst({
      where: {
        id: itemId,
        vendor: { slug: normalizeVendorSlug(vendorSlug) },
      },
      select: { id: true },
    });
    if (!existing) return null;
    await client.inventoryItem.update({
      where: { id: existing.id },
      data: { archivedAt: null },
    });
    return getInventoryItem(vendorSlug, itemId);
  }

  async function addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput
  ): Promise<MenuImage> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    assertCanAddMenuImage(item.images.length);
    const isFirst = item.images.length === 0;

    const created = await client.$transaction(async (tx) => {
      const image = await tx.menuImage.create({
        data: {
          menuItemId: item.id,
          url: input.url.trim(),
          sortOrder: nextMenuImageSortOrder(item.images.map(mapMenuImage)),
          isPrimary: isFirst,
        },
      });
      if (isFirst) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: { imageUrl: image.url },
        });
      }
      return image;
    });

    return mapMenuImage(created);
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

    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    assertCanAddMenuImage(item.images.length);
    const isFirst = item.images.length === 0;
    const pathname = buildMenuBlobPathname(vendorSlug, itemId, mime);
    const uploaded = await putMenuImageBlob(pathname, file, mime);

    const created = await client.$transaction(async (tx) => {
      const image = await tx.menuImage.create({
        data: {
          menuItemId: item.id,
          url: uploaded.url,
          blobPath: uploaded.pathname,
          sortOrder: nextMenuImageSortOrder(item.images.map(mapMenuImage)),
          isPrimary: isFirst,
        },
      });
      if (isFirst) {
        await tx.menuItem.update({
          where: { id: item.id },
          data: { imageUrl: image.url },
        });
      }
      return image;
    });

    return mapMenuImage(created);
  }

  async function reorderMenuImages(
    vendorSlug: string,
    itemId: string,
    imageIds: string[]
  ): Promise<MenuImage[]> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) {
      throw new MenuImageError("Menu item not found", "NOT_FOUND");
    }

    if (
      imageIds.length !== item.images.length ||
      !imageIds.every((id) => item.images.some((image) => image.id === id))
    ) {
      throw new MenuImageError("Image set mismatch", "INVALID_SET");
    }

    await client.$transaction(
      imageIds.map((id, sortOrder) =>
        client.menuImage.update({
          where: { id },
          data: { sortOrder },
        })
      )
    );

    const refreshed = await client.menuImage.findMany({
      where: { menuItemId: item.id },
      orderBy: { sortOrder: "asc" },
    });
    return sortMenuImages(refreshed.map(mapMenuImage));
  }

  async function setPrimaryMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<MenuImage | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) return null;

    const target = item.images.find((image) => image.id === imageId);
    if (!target) return null;

    await client.$transaction(async (tx) => {
      await tx.menuImage.updateMany({
        where: { menuItemId: item.id },
        data: { isPrimary: false },
      });
      await tx.menuImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
      await tx.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: target.url },
      });
    });

    return mapMenuImage({ ...target, isPrimary: true });
  }

  async function removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<boolean> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug } },
      include: menuImageInclude,
    });
    if (!item) return false;

    const target = item.images.find((image) => image.id === imageId);
    if (!target) return false;

    const remaining = item.images.filter((image) => image.id !== imageId);
    const nextPrimary = target.isPrimary
      ? pickNextPrimaryImage(remaining.map(mapMenuImage))
      : remaining.find((image) => image.isPrimary);

    await client.$transaction(async (tx) => {
      await tx.menuImage.delete({ where: { id: imageId } });
      if (target.isPrimary && nextPrimary) {
        await tx.menuImage.update({
          where: { id: nextPrimary.id },
          data: { isPrimary: true },
        });
      }
      await tx.menuItem.update({
        where: { id: item.id },
        data: { imageUrl: nextPrimary?.url ?? null },
      });
    });

    if (target.blobPath) {
      await deleteMenuImageBlob(target.blobPath);
    }

    return true;
  }

  async function toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null> {
    const item = await client.menuItem.findFirst({
      where: { id: itemId, vendor: { slug: vendorSlug }, ...activeMenuWhere },
    });
    if (!item) return null;

    const updated = await client.menuItem.update({
      where: { id: item.id },
      data: { isAvailable: !item.isAvailable },
    });
    return mapMenuItem(updated);
  }

  async function setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    await client.menuItem.updateMany({
      where: { vendorId: vendor.id, ...activeMenuWhere },
      data: { isAvailable: true },
    });
    return getMenu(vendorSlug);
  }

  async function listOrders(vendorSlug: string): Promise<Order[]> {
    const orders = await client.order.findMany({
      where: { vendor: { slug: vendorSlug } },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async function listActiveOrders(vendorSlug: string): Promise<Order[]> {
    const orders = await client.order.findMany({
      where: {
        vendor: { slug: vendorSlug },
        status: { in: ACTIVE_STATUSES },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async function listKdsOrders(vendorSlug: string): Promise<Order[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return [];

    const orders = await client.order.findMany({
      where: kdsOrdersWhere(vendor.id),
      include: kdsOrderInclude,
      orderBy: { createdAt: "desc" },
    });
    return orders.map(mapOrder);
  }

  async function getKdsSnapshotRevision(vendorSlug: string): Promise<string> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true, kitchenOpen: true, isActive: true },
    });
    if (!vendor) return "missing";

    const [orderRows, menuRows, todayGrossResult, yesterdayGrossResult] =
      await Promise.all([
      client.order.findMany({
        where: kdsOrdersWhere(vendor.id),
        select: {
          id: true,
          status: true,
          kitchenStage: true,
          totalAmount: true,
        },
        orderBy: { id: "asc" },
      }),
      client.menuItem.findMany({
        where: { vendorId: vendor.id, archivedAt: null },
        select: { id: true, isAvailable: true },
        orderBy: { id: "asc" },
      }),
      aggregateGrossForPreset(vendor.id, "today"),
      aggregateGrossForPreset(vendor.id, "yesterday"),
    ]);

    return buildKdsSnapshotRevision({
      orders: orderRows.map((row) => ({
        id: row.id,
        status: row.status as OrderStatus,
        kitchenStage: row.kitchenStage ?? undefined,
        totalAmount: row.totalAmount,
      })),
      menu: menuRows,
      todayGross: todayGrossResult,
      yesterdayGross: yesterdayGrossResult,
      kitchenOpen: vendor.kitchenOpen && vendor.isActive,
    });
  }

  async function listOrdersFiltered(
    vendorSlug: string,
    filters: OrderHistoryFilters,
    pagination: Pagination
  ) {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    const { page, pageSize, skip } = normalizePagination(pagination);

    if (!vendor) {
      return { orders: [], total: 0, page, pageSize };
    }

    const range = resolveDateRange(filters);
    const where: Prisma.OrderWhereInput = { vendorId: vendor.id };

    if (range) {
      where.createdAt = { gte: range.from, lte: range.to };
    }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
      where.payment = { status: filters.paymentStatus };
    }

    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { customerPhone: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      client.order.findMany({
        where,
        include: {
          ...orderInclude,
          payment: { select: { status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      client.order.count({ where }),
    ]);

    return {
      orders: rows.map((row) => {
        const { payment, ...orderRow } = row;
        return {
          order: mapOrder(orderRow as PrismaOrderWithItems),
          paymentStatus: payment?.status ?? null,
        };
      }),
      total,
      page,
      pageSize,
    };
  }

  async function getOrder(orderId: string): Promise<Order | null> {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    return order ? mapOrder(order) : null;
  }

  async function createOrder(input: CreateOrderInput): Promise<Order> {
    const vendor = await client.vendor.findUnique({
      where: { slug: input.vendorSlug },
      select: { id: true, isActive: true },
    });
    if (!vendor) throw new Error("Vendor not found");
    if (!vendor.isActive) {
      throw new Error("This storefront is temporarily unavailable");
    }

    const menuItems = await client.menuItem.findMany({
      where: { vendorId: vendor.id, ...activeMenuWhere },
    });
    const menuById = new Map(menuItems.map((m) => [m.id, m]));

    const lines = input.items.map((line) => {
      const menuItem = menuById.get(line.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new Error(`Item unavailable: ${line.menuItemId}`);
      }
      const notes = line.notes ? sanitizeItemNotes(line.notes) : undefined;
      return {
        menuItemId: menuItem.id,
        quantity: line.quantity,
        unitPriceRwf: menuItem.priceRwf,
        ...(notes ? { notes } : {}),
      };
    });

    const totalAmount = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPriceRwf,
      0
    );

    const order = await client.order.create({
      data: {
        vendorId: vendor.id,
        customerPhone: input.customerPhone,
        deliverySector: input.deliverySector,
        landmark: input.landmark,
        totalAmount,
        status: "PENDING",
        orderItems: { create: lines },
      },
      include: orderInclude,
    });
    return mapOrder(order);
  }

  async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null> {
    try {
      const current = await client.order.findUnique({
        where: { id: orderId },
        select: { paidAt: true },
      });
      if (!current) return null;

      const kitchenStage = kitchenStageForOrderStatus(status);
      const paidAt =
        status === "PAID" && !current.paidAt ? new Date() : undefined;

      const order = await client.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(kitchenStage != null ? { kitchenStage } : {}),
          ...(paidAt ? { paidAt } : {}),
        },
        include: orderInclude,
      });
      return mapOrder(order);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  async function updateKitchenStage(
    orderId: string,
    stage: KitchenStage
  ): Promise<Order | null> {
    const current = await client.order.findUnique({
      where: { id: orderId },
      select: { kitchenStage: true },
    });
    if (!current?.kitchenStage) return null;
    if (
      current.kitchenStage !== stage &&
      !isForwardKitchenTransition(
        current.kitchenStage as KitchenStage,
        stage
      )
    ) {
      return null;
    }

    const statusSideEffect = orderStatusForKitchenStage(stage);
    try {
      const order = await client.order.update({
        where: { id: orderId },
        data: {
          kitchenStage: stage,
          ...(statusSideEffect ? { status: statusSideEffect } : {}),
        },
        include: orderInclude,
      });
      return mapOrder(order);
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
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

  async function getDrivers(vendorSlug: string): Promise<Driver[]> {
    const drivers = await client.driver.findMany({
      where: { vendor: { slug: vendorSlug } },
      orderBy: { createdAt: "asc" },
    });
    return drivers.map(mapDriver);
  }

  async function resolveVendorId(vendorSlug: string): Promise<string | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    return vendor?.id ?? null;
  }

  function normalizeDriverPhone(phone: string): string | null {
    return canonicalizePhone(phone, "250");
  }

  async function createDriver(
    vendorSlug: string,
    input: CreateDriverInput
  ): Promise<Driver> {
    const vendorId = await resolveVendorId(vendorSlug);
    if (!vendorId) {
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

    const existingCount = await client.driver.count({ where: { vendorId } });
    const driver = await client.driver.create({
      data: {
        vendorId,
        name,
        phone,
        initials: deriveDriverInitials(name),
        hue: deriveDriverHue(existingCount),
      },
    });
    return mapDriver(driver);
  }

  async function updateDriver(
    vendorSlug: string,
    driverId: string,
    input: UpdateDriverInput
  ): Promise<Driver | null> {
    const vendorId = await resolveVendorId(vendorSlug);
    if (!vendorId) return null;

    const existing = await client.driver.findFirst({
      where: { id: driverId, vendorId },
    });
    if (!existing) return null;

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

    const driver = await client.driver.update({
      where: { id: driverId },
      data: {
        name,
        phone,
        initials: deriveDriverInitials(name),
      },
    });
    return mapDriver(driver);
  }

  async function deleteDriver(
    vendorSlug: string,
    driverId: string
  ): Promise<boolean> {
    const vendorId = await resolveVendorId(vendorSlug);
    if (!vendorId) return false;

    const existing = await client.driver.findFirst({
      where: { id: driverId, vendorId },
      select: { id: true },
    });
    if (!existing) return false;

    await client.driver.delete({ where: { id: driverId } });
    return true;
  }

  async function assignOrderDriver(
    orderId: string,
    driverId: string
  ): Promise<Order | null> {
    const order = await client.order.findUnique({
      where: { id: orderId },
      select: { id: true, vendorId: true },
    });
    if (!order) return null;

    const driver = await client.driver.findFirst({
      where: { id: driverId, vendorId: order.vendorId },
    });
    if (!driver) return null;

    const updated = await client.order.update({
      where: { id: orderId },
      data: { driverId },
      include: orderInclude,
    });
    return mapOrder(updated);
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

  async function aggregateGrossForPreset(
    vendorId: string,
    preset: "today" | "yesterday"
  ): Promise<number> {
    const range = resolveDateRange({ datePreset: preset });
    if (!range) return 0;

    const result = await client.order.aggregate({
      where: {
        vendorId,
        createdAt: { gte: range.from, lte: range.to },
        status: { in: COUNTED_STATUSES },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0;
  }

  async function getTodayGross(vendorSlug: string): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;
    return aggregateGrossForPreset(vendor.id, "today");
  }

  async function getYesterdayGross(vendorSlug: string): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { id: true },
    });
    if (!vendor) return 0;
    return aggregateGrossForPreset(vendor.id, "yesterday");
  }

  async function isKitchenOpen(vendorSlug: string): Promise<boolean> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: { kitchenOpen: true, isActive: true },
    });
    if (!vendor) return false;
    return vendor.kitchenOpen && vendor.isActive;
  }

  async function setKitchenOpen(
    vendorSlug: string,
    open: boolean
  ): Promise<boolean> {
    try {
      const vendor = await client.vendor.update({
        where: { slug: vendorSlug },
        data: { kitchenOpen: open },
        select: { kitchenOpen: true },
      });
      return vendor.kitchenOpen;
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
  }

  async function decrementStockOnPaid(orderId: string): Promise<void> {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });
    if (!order) return;
    for (const line of order.orderItems) {
      const item = await client.menuItem.findUnique({
        where: { id: line.menuItemId },
        select: { stockCount: true },
      });
      if (item?.stockCount != null) {
        await client.menuItem.update({
          where: { id: line.menuItemId },
          data: { stockCount: Math.max(0, item.stockCount - line.quantity) },
        });
      }
    }
  }

  async function createPayment(
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> {
    const order = await client.order.findUnique({
      where: { id: input.orderId },
      select: { id: true },
    });
    if (!order) {
      return { ok: false, code: "ORDER_NOT_FOUND" };
    }

    const existing = await client.payment.findUnique({
      where: { orderId: input.orderId },
    });
    if (existing) {
      if (existing.status === "PENDING" || existing.status === "SUCCESS") {
        return { ok: true, payment: mapPayment(existing) };
      }
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }

    try {
      const created = await client.payment.create({
        data: {
          orderId: input.orderId,
          amount: input.amount,
          provider: input.provider ?? "MTN_MOMO",
          transactionRef: input.transactionRef,
          status: "PENDING",
        },
      });
      return { ok: true, payment: mapPayment(created) };
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      const raced = await client.payment.findUnique({
        where: { orderId: input.orderId },
      });
      if (!raced) throw error;

      if (raced.status === "PENDING" || raced.status === "SUCCESS") {
        return { ok: true, payment: mapPayment(raced) };
      }
      return { ok: false, code: "PAYMENT_TERMINALLY_FAILED" };
    }
  }

  async function getPaymentByRef(ref: string): Promise<Payment | null> {
    const payment = await client.payment.findUnique({
      where: { transactionRef: ref },
    });
    return payment ? mapPayment(payment) : null;
  }

  async function getPaymentForOrder(orderId: string): Promise<Payment | null> {
    const payment = await client.payment.findUnique({
      where: { orderId },
    });
    return payment ? mapPayment(payment) : null;
  }

  async function confirmPayment(
    ref: string,
    pin: string
  ): Promise<ConfirmPaymentResult> {
    const payment = await client.payment.findUnique({
      where: { transactionRef: ref },
    });
    if (!payment) {
      return { ok: false, code: "NOT_FOUND" };
    }

    if (payment.status === "SUCCESS") {
      return { ok: true, payment: mapPayment(payment) };
    }

    if (payment.status === "FAILED") {
      return {
        ok: false,
        code: "PAYMENT_TERMINALLY_FAILED",
        payment: mapPayment(payment),
      };
    }

    if (pin !== MOMO_SIM_VALID_PIN) {
      return {
        ok: false,
        code: "INVALID_PIN",
        payment: mapPayment(payment),
      };
    }

    const updated = await client.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { transactionRef: ref },
      });
      if (!current) {
        throw new Error("Payment not found during confirm transaction");
      }
      if (current.status === "SUCCESS") {
        return { row: current, firstPaid: false };
      }

      const [paymentRow] = await Promise.all([
        tx.payment.update({
          where: { id: current.id },
          data: { status: "SUCCESS" },
        }),
        tx.order.update({
          where: { id: current.orderId },
          data: {
            status: "PAID",
            kitchenStage: "NEW",
            paidAt: new Date(),
          },
        }),
      ]);
      return { row: paymentRow, firstPaid: true };
    });

    if (updated.firstPaid) {
      await decrementStockOnPaid(payment.orderId);
    }
    return { ok: true, payment: mapPayment(updated.row) };
  }

  async function confirmManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<ConfirmManualPaymentResult> {
    const orderRow = await client.order.findUnique({
      where: { id: orderId },
      include: {
        ...orderInclude,
        vendor: { select: { isActive: true } },
      },
    });
    if (!orderRow) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const order = mapOrder(orderRow);
    if (!orderRow.vendor.isActive) {
      return { ok: false, code: "ORDER_NOT_PENDING" };
    }
    if (!orderPhoneMatches(order.customerPhone, customerPhone)) {
      return { ok: false, code: "PHONE_MISMATCH" };
    }

    const paymentRow = await client.payment.findUnique({
      where: { orderId },
    });
    if (!paymentRow) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = mapPayment(paymentRow);

    if (payment.status === "SUCCESS" && order.status === "PAID") {
      return { ok: true, payment, order };
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

    const updated = await client.$transaction(async (tx) => {
      const [paymentUpdated, orderUpdated] = await Promise.all([
        tx.payment.update({
          where: { id: payment.id },
          data: { status: "SUCCESS" },
        }),
        tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            kitchenStage: "NEW",
            paidAt: new Date(),
          },
          include: orderInclude,
        }),
      ]);
      return { paymentUpdated, orderUpdated };
    });

    await decrementStockOnPaid(orderId);

    return {
      ok: true,
      payment: mapPayment(updated.paymentUpdated),
      order: mapOrder(updated.orderUpdated),
    };
  }

  async function abandonManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<AbandonManualPaymentResult> {
    const orderRow = await client.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!orderRow) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const order = mapOrder(orderRow);
    if (!orderPhoneMatches(order.customerPhone, customerPhone)) {
      return { ok: false, code: "PHONE_MISMATCH" };
    }

    if (order.status === "PAID") {
      return { ok: false, code: "ALREADY_PAID" };
    }

    const paymentRow = await client.payment.findUnique({
      where: { orderId },
    });
    if (!paymentRow) {
      return { ok: false, code: "NOT_FOUND" };
    }

    const payment = mapPayment(paymentRow);

    if (order.status === "CANCELLED" && payment.status === "FAILED") {
      return { ok: true, payment, order };
    }

    const updated = await client.$transaction(async (tx) => {
      const [paymentUpdated, orderUpdated] = await Promise.all([
        tx.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        }),
        tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
          include: orderInclude,
        }),
      ]);
      return { paymentUpdated, orderUpdated };
    });

    return {
      ok: true,
      payment: mapPayment(updated.paymentUpdated),
      order: mapOrder(updated.orderUpdated),
    };
  }

  async function findResumableManualOrder(
    vendorSlug: string,
    customerPhone: string
  ): Promise<ResumableManualOrder | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: vendorSlug },
      select: {
        id: true,
        payoutMethod: true,
        momoCode: true,
      },
    });
    if (!vendor) return null;

    const windowStart = new Date(Date.now() - PAYMENT_WINDOW_MS);
    const candidates = await client.order.findMany({
      where: {
        vendorId: vendor.id,
        status: "PENDING",
        createdAt: { gte: windowStart },
        payment: { status: "PENDING" },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    for (const row of candidates) {
      const order = mapOrder(row);
      if (!orderPhoneMatches(order.customerPhone, customerPhone)) continue;

      const dial = buildMomoUssdDial(
        {
          payoutMethod: vendor.payoutMethod as PayoutMethod,
          momoCode: vendor.momoCode,
        },
        order.totalAmount
      );
      if (!dial.ok) continue;

      return { order, ussdDial: dial.ussd };
    }

    return null;
  }

  // ─── Prospects (ADR-0054) ───────────────────────────────────────────────────

  function mapProspectInteraction(row: {
    id: string;
    prospectId: string;
    at: Date;
    channel: string;
    note: string | null;
  }): ProspectInteraction {
    return {
      id: row.id,
      prospectId: row.prospectId,
      at: row.at,
      channel: row.channel as ProspectInteraction["channel"],
      note: row.note ?? undefined,
    };
  }

  function mapProspect(row: {
    id: string;
    businessName: string;
    contactName: string | null;
    phone: string | null;
    area: string | null;
    source: string | null;
    mapsUrl: string | null;
    instagramHandle: string | null;
    notes: string | null;
    status: string;
    nextFollowUpAt: Date | null;
    convertedVendorId: string | null;
    convertedLeadId: string | null;
    createdAt: Date;
    updatedAt: Date;
    interactions?: Array<{
      id: string;
      prospectId: string;
      at: Date;
      channel: string;
      note: string | null;
    }>;
  }): Prospect {
    return {
      id: row.id,
      businessName: row.businessName,
      contactName: row.contactName ?? undefined,
      phone: row.phone ?? undefined,
      area: row.area ?? undefined,
      source: row.source ?? undefined,
      mapsUrl: row.mapsUrl ?? undefined,
      instagramHandle: row.instagramHandle ?? undefined,
      notes: row.notes ?? undefined,
      status: row.status as ProspectStatus,
      nextFollowUpAt: row.nextFollowUpAt ?? undefined,
      convertedVendorId: row.convertedVendorId ?? undefined,
      convertedLeadId: row.convertedLeadId ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      interactions: row.interactions?.map(mapProspectInteraction),
    };
  }

  async function createProspect(input: CreateProspectInput): Promise<Prospect> {
    const row = await client.prospect.create({
      data: {
        businessName: input.businessName.trim(),
        contactName: input.contactName?.trim() || null,
        phone: input.phone?.trim() || null,
        area: input.area?.trim() || null,
        source: input.source?.trim() || null,
        mapsUrl: input.mapsUrl?.trim() || null,
        instagramHandle: input.instagramHandle?.trim() || null,
        notes: input.notes?.trim() || null,
        status: "FOUND",
        nextFollowUpAt: input.nextFollowUpAt ?? null,
      },
    });
    return mapProspect(row);
  }

  async function bulkCreateProspects(input: BulkCreateProspectsInput): Promise<Prospect[]> {
    const results: Prospect[] = [];
    for (const row of input.rows) {
      results.push(await createProspect(row));
    }
    return results;
  }

  async function listProspects(status?: ProspectStatus): Promise<Prospect[]> {
    const where = status ? { status } : {};
    const rows = await client.prospect.findMany({
      where,
      include: { interactions: { orderBy: { at: "desc" } } },
      orderBy: [
        { nextFollowUpAt: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    });
    return rows.map(mapProspect);
  }

  async function getProspect(prospectId: string): Promise<Prospect | null> {
    const row = await client.prospect.findUnique({
      where: { id: prospectId },
      include: { interactions: { orderBy: { at: "desc" } } },
    });
    return row ? mapProspect(row) : null;
  }

  async function updateProspect(
    prospectId: string,
    input: UpdateProspectInput
  ): Promise<Prospect | null> {
    const existing = await client.prospect.findUnique({ where: { id: prospectId } });
    if (!existing) return null;

    if (input.status !== undefined && input.status !== existing.status) {
      if (!canTransitionProspectStatus(existing.status as ProspectStatus, input.status)) {
        throw new Error(
          `Invalid status transition: ${existing.status} → ${input.status}`
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (input.businessName !== undefined) data.businessName = input.businessName.trim();
    if (input.contactName !== undefined) data.contactName = input.contactName?.trim() || null;
    if (input.phone !== undefined) data.phone = input.phone?.trim() || null;
    if (input.area !== undefined) data.area = input.area?.trim() || null;
    if (input.source !== undefined) data.source = input.source?.trim() || null;
    if (input.mapsUrl !== undefined) data.mapsUrl = input.mapsUrl?.trim() || null;
    if (input.instagramHandle !== undefined)
      data.instagramHandle = input.instagramHandle?.trim() || null;
    if (input.notes !== undefined) data.notes = input.notes?.trim() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.nextFollowUpAt !== undefined) data.nextFollowUpAt = input.nextFollowUpAt;
    if (input.convertedVendorId !== undefined) data.convertedVendorId = input.convertedVendorId;
    if (input.convertedLeadId !== undefined) data.convertedLeadId = input.convertedLeadId;

    const row = await client.prospect.update({
      where: { id: prospectId },
      data,
      include: { interactions: { orderBy: { at: "desc" } } },
    });
    return mapProspect(row);
  }

  async function addProspectInteraction(
    prospectId: string,
    input: CreateProspectInteractionInput
  ): Promise<ProspectInteraction | null> {
    const existing = await client.prospect.findUnique({ where: { id: prospectId } });
    if (!existing) return null;
    const row = await client.prospectInteraction.create({
      data: {
        prospectId,
        channel: input.channel,
        note: input.note?.trim() || null,
        at: input.at ?? new Date(),
      },
    });
    return mapProspectInteraction(row);
  }

  async function convertProspect(
    prospectId: string,
    vendorId: string,
    leadId?: string
  ): Promise<Prospect | null> {
    const existing = await client.prospect.findUnique({ where: { id: prospectId } });
    if (!existing) return null;
    if (!canTransitionProspectStatus(existing.status as ProspectStatus, "CONVERTED")) {
      throw new Error(`Invalid status transition: ${existing.status} → CONVERTED`);
    }
    const row = await client.prospect.update({
      where: { id: prospectId },
      data: {
        status: "CONVERTED",
        convertedVendorId: vendorId,
        convertedLeadId: leadId ?? null,
      },
      include: { interactions: { orderBy: { at: "desc" } } },
    });
    return mapProspect(row);
  }

  // ─── Marketing site settings ──────────────────────────────────────────────────

  async function getMarketingSiteSettings(): Promise<MarketingSiteSettings> {
    const row = await client.marketingSiteSettings.upsert({
      where: { id: "default" },
      create: { id: "default" },
      update: {},
    });
    return {
      id: row.id,
      publicPhone: row.publicPhone ?? undefined,
      publicEmail: row.publicEmail ?? undefined,
      socialX: row.socialX ?? undefined,
      socialTiktok: row.socialTiktok ?? undefined,
      socialInstagram: row.socialInstagram ?? undefined,
      socialFacebook: row.socialFacebook ?? undefined,
      socialLinkedin: row.socialLinkedin ?? undefined,
      socialYoutube: row.socialYoutube ?? undefined,
      socialWhatsapp: row.socialWhatsapp ?? undefined,
      updatedAt: row.updatedAt,
    };
  }

  async function updateMarketingSiteSettings(
    input: UpdateMarketingSiteSettingsInput
  ): Promise<MarketingSiteSettings> {
    const data: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        data[key] = value === null ? null : (value as string).trim() || null;
      }
    }
    const row = await client.marketingSiteSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });
    return {
      id: row.id,
      publicPhone: row.publicPhone ?? undefined,
      publicEmail: row.publicEmail ?? undefined,
      socialX: row.socialX ?? undefined,
      socialTiktok: row.socialTiktok ?? undefined,
      socialInstagram: row.socialInstagram ?? undefined,
      socialFacebook: row.socialFacebook ?? undefined,
      socialLinkedin: row.socialLinkedin ?? undefined,
      socialYoutube: row.socialYoutube ?? undefined,
      socialWhatsapp: row.socialWhatsapp ?? undefined,
      updatedAt: row.updatedAt,
    };
  }

  // ─── Site copy translations ──────────────────────────────────────────────────

  async function listSiteTranslations(locale?: string) {
    const rows = await client.siteTranslation.findMany({
      where: locale ? { locale } : undefined,
      orderBy: [{ locale: "asc" }, { key: "asc" }],
    });
    return rows.map((row) => ({
      locale: row.locale,
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt,
    }));
  }

  async function upsertSiteTranslation(
    locale: string,
    key: string,
    value: string
  ) {
    const row = await client.siteTranslation.upsert({
      where: { locale_key: { locale, key } },
      create: { locale, key, value },
      update: { value },
    });
    return {
      locale: row.locale,
      key: row.key,
      value: row.value,
      updatedAt: row.updatedAt,
    };
  }

  async function deleteSiteTranslation(locale: string, key: string) {
    const result = await client.siteTranslation.deleteMany({
      where: { locale, key },
    });
    return result.count > 0;
  }

  async function recordMarketingFunnelEvent(input: CreateMarketingFunnelEventInput) {
    const row = await client.marketingFunnelEvent.create({ data: input });
    return toMarketingFunnelEvent(row);
  }

  async function listMarketingFunnelEvents(from: Date) {
    const rows = await client.marketingFunnelEvent.findMany({
      where: { createdAt: { gte: from } },
      orderBy: { createdAt: "desc" },
      take: 50_000,
    });
    return rows.map(toMarketingFunnelEvent);
  }

  function toMarketingFunnelEvent(row: Awaited<ReturnType<typeof client.marketingFunnelEvent.create>>): MarketingFunnelEvent {
    return {
      ...row,
      event: row.event as MarketingEventName,
      target: row.target ?? undefined,
      referrerHost: row.referrerHost ?? undefined,
      utmSource: row.utmSource ?? undefined,
      utmMedium: row.utmMedium ?? undefined,
      utmCampaign: row.utmCampaign ?? undefined,
    };
  }

  // ─── Vendor expenses + profit ─────────────────────────────────────────────────

  async function listVendorExpenses(
    vendorSlug: string,
    from?: Date,
    to?: Date
  ): Promise<VendorExpense[]> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
    if (!vendor) return [];
    const where: Prisma.VendorExpenseWhereInput = { vendorId: vendor.id };
    if (from || to) {
      where.spentAt = {};
      if (from) where.spentAt.gte = from;
      if (to) where.spentAt.lte = to;
    }
    const rows = await client.vendorExpense.findMany({
      where,
      orderBy: { spentAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      vendorId: row.vendorId,
      amountRwf: row.amountRwf,
      category: row.category,
      note: row.note ?? undefined,
      spentAt: row.spentAt,
      createdAt: row.createdAt,
    }));
  }

  async function createVendorExpense(
    vendorSlug: string,
    input: CreateVendorExpenseInput
  ): Promise<VendorExpense> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
    if (!vendor) throw new Error("Vendor not found");
    const row = await client.vendorExpense.create({
      data: {
        vendorId: vendor.id,
        amountRwf: input.amountRwf,
        category: input.category.trim(),
        note: input.note?.trim() || null,
        spentAt: input.spentAt ?? new Date(),
      },
    });
    return {
      id: row.id,
      vendorId: row.vendorId,
      amountRwf: row.amountRwf,
      category: row.category,
      note: row.note ?? undefined,
      spentAt: row.spentAt,
      createdAt: row.createdAt,
    };
  }

  async function deleteVendorExpense(
    vendorSlug: string,
    expenseId: string
  ): Promise<boolean> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
    if (!vendor) return false;
    const result = await client.vendorExpense.deleteMany({
      where: { id: expenseId, vendorId: vendor.id },
    });
    return result.count > 0;
  }

  async function getProfitSnapshot(
    vendorSlug: string,
    from: Date,
    to: Date
  ): Promise<ProfitSnapshot | null> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
    if (!vendor) return null;

    const [todayGrossRwf, weekdayAverageRwf, periodRevResult, expenses, itemStats] =
      await Promise.all([
        getTodayGross(vendorSlug),
        getWeekdayAverageGross(vendorSlug),
        client.order.aggregate({
          where: {
            vendorId: vendor.id,
            createdAt: { gte: from, lte: to },
            status: { in: COUNTED_STATUSES },
          },
          _sum: { totalAmount: true },
        }),
        client.vendorExpense.aggregate({
          where: { vendorId: vendor.id, spentAt: { gte: from, lte: to } },
          _sum: { amountRwf: true },
        }),
        client.orderItem.findMany({
          where: {
            order: {
              vendorId: vendor.id,
              createdAt: { gte: from, lte: to },
              status: { in: COUNTED_STATUSES },
            },
          },
          include: { menuItem: { select: { id: true, name: true, costPriceRwf: true } } },
        }),
      ]);

    const periodRevenueRwf = periodRevResult._sum.totalAmount ?? 0;
    const periodExpensesRwf = expenses._sum.amountRwf ?? 0;

    const marginMap = new Map<string, {
      name: string; soldQty: number; revenueRwf: number; costRwf: number;
    }>();
    let periodCostOfGoodsRwf = 0;
    for (const line of itemStats) {
      const existing = marginMap.get(line.menuItemId) ?? {
        name: line.menuItem.name,
        soldQty: 0,
        revenueRwf: 0,
        costRwf: 0,
      };
      existing.soldQty += line.quantity;
      existing.revenueRwf += line.quantity * line.unitPriceRwf;
      const cost = (line.menuItem.costPriceRwf ?? 0) * line.quantity;
      existing.costRwf += cost;
      periodCostOfGoodsRwf += cost;
      marginMap.set(line.menuItemId, existing);
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
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
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
      const result = await client.order.aggregate({
        where: {
          vendorId: vendor.id,
          createdAt: { gte: dayStart, lte: dayEnd },
          status: { in: COUNTED_STATUSES },
        },
        _sum: { totalAmount: true },
      });
      total += result._sum.totalAmount ?? 0;
      count++;
    }
    return count > 0 ? Math.round(total / count) : 0;
  }

  async function getAllTimePaidRevenue(vendorSlug: string): Promise<number> {
    const vendor = await client.vendor.findUnique({
      where: { slug: normalizeVendorSlug(vendorSlug) },
      select: { id: true },
    });
    if (!vendor) return 0;
    const result = await client.order.aggregate({
      where: {
        vendorId: vendor.id,
        status: { in: COUNTED_STATUSES },
      },
      _sum: { totalAmount: true },
    });
    return result._sum.totalAmount ?? 0;
  }

  return {
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
    listInventory,
    createInventoryItem,
    getInventoryItem,
    updateInventoryItem,
    adjustInventoryItem,
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
    findResumableManualOrder,
  };
}
