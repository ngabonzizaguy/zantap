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
  PaginatedOrders,
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
import type {
  CreateLeadRoutingRecipientInput,
  CreateLeadInput,
  Lead,
  LeadRoutingAssignment,
  LeadRoutingRecipient,
  LeadStatus,
  UpdateLeadRoutingRecipientInput,
} from "@/lib/leads/types";
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

/**
 * The single seam through which all persistent reads and mutations pass.
 * Every adapter (in-memory, Prisma) implements this exact surface so callers
 * never depend on a concrete backend. The browser never sees this type; it is
 * reached only from Server Actions and React Server Components.
 */
export interface Store {
  // Vendor reads + provision
  getVendorBySlug(slug: string): Promise<Vendor | null>;
  isSlugAvailable(slug: string): Promise<boolean>;
  createVendor(input: CreateVendorInput): Promise<Vendor>;
  updateVendor(
    vendorSlug: string,
    input: UpdateVendorInput
  ): Promise<Vendor | null>;

  // Owner token (per-vendor capability, ADR-0022). The hash is server-only and
  // never appears on the domain Vendor; validate via lib/vendor/owner-token.
  getVendorOwnerTokenHash(vendorSlug: string): Promise<string | null>;
  setVendorOwnerToken(
    vendorSlug: string,
    ownerTokenHash: string
  ): Promise<Vendor | null>;

  // Recovery-event log — the seam the future admin panel (candidate #17) consumes.
  recordRecoveryEvent(
    input: RecordRecoveryEventInput
  ): Promise<VendorRecoveryEvent>;
  listRecoveryEvents(vendorId: string): Promise<VendorRecoveryEvent[]>;
  listAllRecoveryEvents(
    filters?: RecoveryEventFilters
  ): Promise<VendorRecoveryEvent[]>;
  reviewRecoveryEvent(
    eventId: string,
    reviewNote?: string
  ): Promise<VendorRecoveryEvent | null>;

  // Marketing leads (ADR-0046 §9) — durable capture and Ops follow-up seam.
  createLead(input: CreateLeadInput): Promise<Lead>;
  listLeads(): Promise<Lead[]>;
  updateLeadStatus(leadId: string, status: LeadStatus): Promise<Lead | null>;
  listLeadRoutingRecipients(): Promise<LeadRoutingRecipient[]>;
  createLeadRoutingRecipient(
    input: CreateLeadRoutingRecipientInput
  ): Promise<LeadRoutingRecipient>;
  updateLeadRoutingRecipient(
    recipientId: string,
    input: UpdateLeadRoutingRecipientInput
  ): Promise<LeadRoutingRecipient | null>;
  removeLeadRoutingRecipient(recipientId: string): Promise<boolean>;
  assignLeadRoutingRecipient(
    leadId: string
  ): Promise<LeadRoutingAssignment | null>;

  // Outbound prospects (ADR-0054)
  createProspect(input: CreateProspectInput): Promise<Prospect>;
  bulkCreateProspects(input: BulkCreateProspectsInput): Promise<Prospect[]>;
  listProspects(status?: ProspectStatus): Promise<Prospect[]>;
  getProspect(prospectId: string): Promise<Prospect | null>;
  updateProspect(
    prospectId: string,
    input: UpdateProspectInput
  ): Promise<Prospect | null>;
  addProspectInteraction(
    prospectId: string,
    input: CreateProspectInteractionInput
  ): Promise<ProspectInteraction | null>;
  convertProspect(
    prospectId: string,
    vendorId: string,
    leadId?: string
  ): Promise<Prospect | null>;

  // Marketing site settings (footer socials / contacts)
  getMarketingSiteSettings(): Promise<MarketingSiteSettings>;
  updateMarketingSiteSettings(
    input: UpdateMarketingSiteSettingsInput
  ): Promise<MarketingSiteSettings>;

  // Vendor expenses + profit insights
  listVendorExpenses(
    vendorSlug: string,
    from?: Date,
    to?: Date
  ): Promise<VendorExpense[]>;
  createVendorExpense(
    vendorSlug: string,
    input: CreateVendorExpenseInput
  ): Promise<VendorExpense>;
  deleteVendorExpense(
    vendorSlug: string,
    expenseId: string
  ): Promise<boolean>;
  getProfitSnapshot(
    vendorSlug: string,
    from: Date,
    to: Date
  ): Promise<ProfitSnapshot | null>;
  /** Mean paid gross for the same weekday over the last `weeks` weeks (excl. today). */
  getWeekdayAverageGross(
    vendorSlug: string,
    weeks?: number
  ): Promise<number>;
  getAllTimePaidRevenue(vendorSlug: string): Promise<number>;

  // Operator console (ADR-0039) — only callable from lib/operator-control/
  listVendors(filters?: VendorListFilters): Promise<VendorListEntry[]>;
  getOperatorVendorDetail(vendorSlug: string): Promise<OperatorVendorDetail | null>;
  setVendorActive(
    vendorSlug: string,
    active: boolean,
    reason?: string
  ): Promise<Vendor | null>;
  operatorUpdateVendor(
    vendorSlug: string,
    input: OperatorUpdateVendorInput
  ): Promise<Vendor | null>;
  operatorRevokeOwnerToken(vendorSlug: string): Promise<Vendor | null>;
  operatorReissueOwnerToken(
    vendorSlug: string
  ): Promise<OperatorReissueTokenResult | null>;
  operatorUpdateOrder(
    orderId: string,
    patch: OperatorOrderPatch
  ): Promise<Order | null>;
  recordOperatorAction(
    input: RecordOperatorActionInput
  ): Promise<OperatorAction>;
  listOperatorActions(vendorSlug?: string, limit?: number): Promise<OperatorAction[]>;

  // Menu reads + availability mutation
  getMenu(vendorSlug: string): Promise<MenuItem[]>;
  getAvailableMenu(vendorSlug: string): Promise<MenuItem[]>;
  getArchivedMenu(vendorSlug: string): Promise<MenuItem[]>;
  getMenuItem(vendorSlug: string, itemId: string): Promise<MenuItem | null>;
  getCategories(vendorSlug: string): Promise<string[]>;
  createMenuItem(
    vendorSlug: string,
    input: CreateMenuItemInput
  ): Promise<MenuItem>;
  updateMenuItem(
    vendorSlug: string,
    itemId: string,
    input: UpdateMenuItemInput
  ): Promise<MenuItem | null>;
  archiveMenuItem(vendorSlug: string, itemId: string): Promise<MenuItem | null>;
  restoreMenuItem(vendorSlug: string, itemId: string): Promise<MenuItem | null>;
  renameCategory(
    vendorSlug: string,
    from: string,
    to: string
  ): Promise<number>;
  addMenuImage(
    vendorSlug: string,
    itemId: string,
    input: AddMenuImageInput
  ): Promise<MenuImage>;
  uploadMenuImageBlob(
    vendorSlug: string,
    itemId: string,
    file: Buffer,
    mime: string
  ): Promise<MenuImage>;
  reorderMenuImages(
    vendorSlug: string,
    itemId: string,
    imageIds: string[]
  ): Promise<MenuImage[]>;
  setPrimaryMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<MenuImage | null>;
  removeMenuImage(
    vendorSlug: string,
    itemId: string,
    imageId: string
  ): Promise<boolean>;
  toggleItemAvailability(
    vendorSlug: string,
    itemId: string
  ): Promise<MenuItem | null>;
  setAllItemsAvailable(vendorSlug: string): Promise<MenuItem[]>;

  // Order reads + create + status
  listOrders(vendorSlug: string): Promise<Order[]>;
  listActiveOrders(vendorSlug: string): Promise<Order[]>;
  /** KDS queue scope — active tickets plus today's completed; not full history. */
  listKdsOrders(vendorSlug: string): Promise<Order[]>;
  /** Cheap change token for SSE poll loops (ADR-0023). */
  getKdsSnapshotRevision(vendorSlug: string): Promise<string>;
  listOrdersFiltered(
    vendorSlug: string,
    filters: OrderHistoryFilters,
    pagination: Pagination
  ): Promise<PaginatedOrders>;
  getOrder(orderId: string): Promise<Order | null>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null>;
  updateKitchenStage(
    orderId: string,
    stage: KitchenStage
  ): Promise<Order | null>;
  bulkUpdateKitchenStage(
    orderIds: string[],
    stage: KitchenStage
  ): Promise<Order[]>;

  // Drivers
  getDrivers(vendorSlug: string): Promise<Driver[]>;
  createDriver(vendorSlug: string, input: CreateDriverInput): Promise<Driver>;
  updateDriver(
    vendorSlug: string,
    driverId: string,
    input: UpdateDriverInput
  ): Promise<Driver | null>;
  deleteDriver(vendorSlug: string, driverId: string): Promise<boolean>;
  assignOrderDriver(orderId: string, driverId: string): Promise<Order | null>;
  bulkAssignOrderDriver(
    orderIds: string[],
    driverId: string
  ): Promise<Order[]>;

  // Today's gross (+ yesterday for dashboard delta)
  getTodayGross(vendorSlug: string): Promise<number>;
  getYesterdayGross(vendorSlug: string): Promise<number>;

  // Kitchen open/close
  isKitchenOpen(vendorSlug: string): Promise<boolean>;
  setKitchenOpen(vendorSlug: string, open: boolean): Promise<boolean>;

  // Payment (idempotent MoMo state machine — ADR-0001)
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentByRef(ref: string): Promise<Payment | null>;
  getPaymentForOrder(orderId: string): Promise<Payment | null>;
  confirmPayment(ref: string, pin: string): Promise<ConfirmPaymentResult>;
  confirmManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<ConfirmManualPaymentResult>;
  abandonManualPayment(
    orderId: string,
    customerPhone: string
  ): Promise<AbandonManualPaymentResult>;
  findResumableManualOrder(
    vendorSlug: string,
    customerPhone: string
  ): Promise<ResumableManualOrder | null>;
}

/**
 * Adapters used in tests expose a reset hook so each test starts from the same
 * seed. The in-memory adapter resets synchronously; the Prisma adapter reseeds
 * a disposable database, so reset may also be asynchronous.
 */
export interface ResettableStore extends Store {
  reset(): void | Promise<void>;
}
