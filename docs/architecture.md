# ZanTap Architecture

This document describes the current architecture of ZanTap as implemented in the codebase.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Customer View        │  Vendor KDS      │  Ops Console         │
│  (/[slug])            │  (/vendor/[slug])│  (/ops)              │
│  - Storefront         │  - Orders        │  - Vendors           │
│  - Menu & Cart        │  - Menu CRUD     │  - Leads             │
│  - Checkout           │  - History       │  - Recovery          │
│  - Restaurant Hub     │  - Drivers       │  - Routing           │
│                       │  - Profit/Stock  │  - Translations      │
│                       │  - Readiness     │  - Briefing          │
│                       │                  │  - Menu Intake       │
└──────────────────────┴──────────────────┴──────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js App Router                             │
├─────────────────────────────────────────────────────────────────┤
│  Server Components (RSC)                                         │
│  Server Actions (lib/actions/*)                                  │
│  API Routes (app/api/*)                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Modules                                 │
├─────────────────────────────────────────────────────────────────┤
│  lib/checkout/          │  lib/kds/              │  lib/momo/    │
│  - Orchestration        │  - Kitchen stages      │  - Modes       │
│  - Validation           │  - SSE snapshot        │  - Manual USSD │
│  - Totals              │  - Pagination          │  - Open API    │
│                        │  - Feature flags       │  - Commission  │
│  lib/vendor/           │  lib/menu/             │  lib/briefing/ │
│  - Owner token         │  - Add-ons             │  - Access grants│
│  - Onboarding          │  - Sizes               │  - Sessions     │
│  - Profit/Stock        │  - Customization       │  - Evidence     │
│  - Export              │  - Media               │  - Activity     │
│                        │                        │                │
│  lib/menu-intake/      │  lib/vendor-updates/   │  lib/leads/    │
│  - Workflow            │  - Publication         │  - Capture     │
│  - Private storage     │  - Batches             │  - Routing     │
│  - Matching            │  - Engagement          │                │
│                        │                        │  lib/prospects/│
│  lib/operator-control/ │  lib/customer-restaurants/│ - Tracking  │
│  - API auth            │  - Hub                 │                │
│  - Routes              │  - IndexedDB           │  lib/i18n/    │
│  - Audit               │  - Updates             │  - KDS trans. │
│                        │                        │  - Marketing   │
│  lib/pwa/              │  lib/inventory/        │  lib/analytics/│
│  - Manifests           │  - Stock tracking      │  - Funnel events│
│  - Install hints       │                        │                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Store Seam                                    │
├─────────────────────────────────────────────────────────────────┤
│  lib/store/                                                   │
│  - Store interface (single seam)                              │
│  - In-memory adapter (tests/local dev)                         │
│  - Prisma/Postgres adapter (production)                        │
│  - Factory: getStore() selects adapter based on DATABASE_URL    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Persistence Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL (via Prisma)                               │
│  - Vendors, MenuItems, Orders, Payments                         │
│  - Drivers, VendorPayouts, VendorExpenses                       │
│  - Leads, Prospects, MenuIntake                                │
│  - BriefingAccessGrants, BriefingSessions                       │
│  - VendorUpdateBatches, InventoryItems                         │
│  - MarketingSiteSettings, CommissionSettings                    │
│  - SiteTranslations, MarketingFunnelEvents                      │
│                                                                  │
│  Vercel Blob (menu media, private intake storage)              │
│  In-memory fallback (local dev without DATABASE_URL)          │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Customer Checkout Flow

1. **Customer browses storefront** (`/[slug]`)
   - Server Component reads menu via Store (RSC)
   - Cart state managed client-side (CartContext)

2. **Customer adds items to cart**
   - Add-ons, size options selected in CustomizeModal
   - Cart totals computed client-side (lib/checkout/totals.ts)

3. **Customer proceeds to checkout**
   - Validation (lib/checkout/validation.ts)
   - Delivery fields required: phone, sector, landmark
   - Server Action: placeOrder (lib/actions/customer.ts)

4. **Order created**
   - Store.createOrder() creates Order with PENDING status
   - Store.createPayment() creates Payment with PENDING status
   - Payment method determined by MOMO_MODE

5. **Payment processing**
   - **simulate mode**: Customer enters PIN 12345 → confirmPayment() → PAID
   - **manual mode** (production): Customer dials USSD → confirmManualPayment() → PAID
   - **openapi mode** (local only): Collection request → webhook callback → PAID

6. **Order appears on KDS**
   - SSE stream updates automatically
   - Order gated to PAID/DISPATCHED/COMPLETED status

### Vendor KDS Flow

1. **Vendor opens KDS** (`/vendor/[slug]`)
   - Server Component validates owner token (cached by slug)
   - SSE connection established to `/api/vendor/[slug]/kds-stream`

2. **Live updates via SSE**
   - Server polls Store revision token (getKdsSnapshotRevision)
   - Changes detected → full snapshot pushed to client
   - Client updates with useKdsLiveSnapshot hook
   - Stream self-closes at 250s, client reconnects with backoff

3. **Vendor manages orders**
   - View orders by kitchen stage (NEW → ACCEPTED → PREPARING → READY → OUT FOR DELIVERY → COMPLETED)
   - Bulk actions via Server Actions (lib/actions/vendor.ts)
   - Assign drivers via dispatch modal

4. **Vendor manages menu**
   - Menu CRUD via Server Actions (lib/actions/vendor-menu.ts)
   - Images uploaded to Vercel Blob (lib/menu/blob-storage.ts)
   - Add-ons and size options configured

5. **Vendor views profit/stock**
   - Profit insights (lib/vendor/profit.ts)
   - Stock tracking (lib/inventory/)

### Operator Console Flow

1. **Operator logs in** (`/ops/login`)
   - Validates OPERATOR_UI_SECRET
   - Session token stored

2. **Operator manages vendors**
   - View all vendors (lib/operator-control/vendors.ts)
   - Suspend/reactive vendors
   - Audit operator actions
   - Revoke/reissue owner tokens

3. **Operator manages leads**
   - View lead inbox (lib/operator-control/leads.ts)
   - Update lead status
   - Configure WhatsApp routing

4. **Operator manages menu intake**
   - Review submitted intakes (lib/menu-intake/)
   - Import to vendor menu
   - Manage private source storage

5. **Operator manages briefing**
   - Create access grants (lib/briefing/)
   - Pin briefing version
   - View interests and activity

## Persistence

### Store Seam

The Store is the single server-only data seam:

```typescript
// lib/store/index.ts
export function getStore(): Store {
  const cached = globalForStore.__zantapStore;
  if (cached) return cached;
  const store = process.env.DATABASE_URL
    ? createPrismaStore()
    : createInMemoryStore();
  globalForStore.__zantapStore = store;
  return store;
}
```

**Key invariant:** The browser never imports the Store. All data access goes through Server Actions or RSC.

### Adapters

**In-memory adapter** (`lib/store/in-memory.ts`):
- Used for local development without DATABASE_URL
- Used for contract tests
- Seeded with demo vendor `inka-steakhouse`

**Prisma adapter** (`lib/store/prisma.ts`):
- Used in production with DATABASE_URL set
- Connects to Supabase PostgreSQL
- Connection pooling via DATABASE_URL (pgbouncer=true, port 6543)
- Direct connection via DIRECT_URL (port 5432) for migrations

### Database Schema

Key entities (see prisma/schema.prisma for full schema):

- **Vendor**: Business entity with owner token, feature flags, commission settings
- **MenuItem**: Menu items with size options, add-ons, stock, cost price
- **MenuImage**: Gallery images for menu items
- **Order**: Customer orders with status, kitchen stage, commission snapshot
- **OrderItem**: Order line items with add-on selections
- **Payment**: Collection payment records
- **VendorPayout**: Vendor payout attempts (one per Transfer attempt)
- **Driver**: Delivery drivers
- **VendorExpense**: Business expenses for profit calculations
- **Lead**: Marketing lead capture
- **LeadRoutingRecipient/Assignment**: WhatsApp routing configuration
- **Prospect**: Outbound prospect tracking
- **MenuIntake**: Staged vendor menu submissions
- **BriefingAccessGrant**: Private briefing access controls
- **BriefingSession**: Viewing sessions
- **VendorUpdateBatch**: Automatic public vendor updates
- **InventoryItem**: Supply inventory tracking
- **MarketingSiteSettings**: Platform settings (KDS languages, social links)
- **CommissionSettings**: Global commission controls
- **SiteTranslation**: Ops-edited marketing copy
- **MarketingFunnelEvent**: Privacy-minimal funnel analytics

## Payments

### Payment Modes

**simulate mode** (local default):
- Sandbox STK push with PIN 12345
- Used for local development

**manual mode** (production default):
- Customer dials USSD string: `*182*8*1*{code}*{amount}#`
- Customer self-confirms "I've paid"
- Honor system with 10-minute payment window
- TransactionRef: `manual-{orderId}`

**openapi mode** (local only, awaiting production cutover):
- MTN MoMo Open API Collection
- Customer pays ZanTap (collection)
- ZanTap pays Vendor (disbursement/payout)
- Commission applied (if enabled)
- Webhook callbacks for status updates

### Commission

- Global on/off master switch (CommissionSettings.globalEnabled)
- Per-Vendor on/off and % override
- Fee snapshot frozen at payment time
- Minimum order total (default 1,000 RWF)
- Currently implemented but inactive (globalEnabled defaults false)

## Live Updates

### KDS SSE Stream

**Route:** `/api/vendor/[slug]/kds-stream`

**Flow:**
1. Client connects with SSE
2. Server polls Store revision token (getKdsSnapshotRevision)
3. If revision changed, fetch full snapshot (listKdsOrders)
4. Push snapshot to client as SSE event
5. Stream self-closes at MAX_STREAM_MS = 250,000ms
6. Client reconnects with exponential backoff

**Optimizations (ADR-0023):**
- Revision-first polling to avoid full reads on every poll
- Scoped KDS orders query (not full history)
- Narrow includes to reduce pooler egress

**Failure modes:**
- Database unavailable: in-memory fallback
- Connection error: client reconnects
- Timeout: stream self-closes cleanly

## Media Storage

### Menu Images

**Primary storage:** Vercel Blob (BLOB_READ_WRITE_TOKEN)

**Upload flow:**
1. Vendor uploads image via KDS
2. Server Action: uploadMenuImageBlob()
3. Stored in Vercel Blob with path: `menu/{vendorId}/{itemId}/{filename}`
4. MenuImage record created with blobPath and sortOrder

**Local fallback:**
- In-memory blob store when BLOB_READ_WRITE_TOKEN unset
- Served at `/api/local-blob/...`
- Cleared on dev server restart

### Menu Intake Private Storage

**Primary storage:** Separate Vercel Blob store (MENU_INTAKE_READ_WRITE_TOKEN)

**Purpose:**
- Private source files for menu intake
- Separate from public menu media store
- Deleted after 90 days unless retained for dispute

## Authorization

### Current State

**Implemented:**
- Per-vendor owner tokens (ADR-0022)
- Minted at provision, returned plaintext once
- Cached by slug in browser (never typed)
- Hash stored on Vendor (ownerTokenHash)
- Validates vendor-scoped writes via assertOwnerToken()
- Phone-based recovery (recoverOwnerToken())
- Recovery events logged (VendorRecoveryEvent)

**Operator access:**
- OPERATOR_API_KEY for Control API
- OPERATOR_UI_SECRET for /ops login
- Operator actions logged (OperatorAction)
- Bypasses owner token guard (operator override)

**Deferred:**
- Real authentication system (candidate #12)
- Vendor/ops auth beyond owner tokens
- Session management
- User accounts

### Access Control Rules

- **Vendor writes:** Require owner token validation (slug-bound)
- **Operator writes:** Require OPERATOR_API_KEY
- **Customer reads:** Public storefront, no auth
- **KDS access:** Owner token cached by slug
- **Ops console:** OPERATOR_UI_SECRET

## Deployment

### Platform

**Hosting:** Vercel

**Production:** zantap.app

**Environment variables:**
- DATABASE_URL / DIRECT_URL (Supabase PostgreSQL)
- BLOB_READ_WRITE_TOKEN (Vercel Blob)
- MENU_INTAKE_READ_WRITE_TOKEN (private Blob store)
- OPERATOR_API_KEY / OPERATOR_UI_SECRET
- MOMO_MODE (defaults to manual in production)
- NEXT_PUBLIC_BASE_URL (zantap.app)

### Build Process

```bash
npm run build
```

- Next.js production build
- Prisma client generation (postinstall)
- No Prisma migrations in build (deployed separately)

### Deployment Process

```bash
npm run db:deploy  # Apply Prisma migrations to production
git push          # Trigger Vercel deployment
```

**Vercel deployment:**
- Automatic on git push to main
- Builds Next.js app
- Deploys to edge
- Functions have maxDuration = 300s (KDS SSE)

### Production vs Local Development

**Production:**
- DATABASE_URL set → Prisma adapter
- BLOB_READ_WRITE_TOKEN set → Vercel Blob
- MOMO_MODE defaults to manual
- OPERATOR_API_KEY / OPERATOR_UI_SECRET set
- All surfaces live on zantap.app

**Local development:**
- DATABASE_URL unset → in-memory adapter
- BLOB_READ_WRITE_TOKEN unset → in-memory blob fallback
- MOMO_MODE defaults to simulate
- No operator auth required (or set local values)
- All surfaces on localhost:3000

## Failure / Degraded Modes

### Database Unavailable

**Behavior:**
- If DATABASE_URL unset, uses in-memory adapter
- All surfaces work with demo vendor
- No persistence across restarts
- No remote DB connection required for development

**Recovery:**
- Set DATABASE_URL to enable Prisma adapter
- Run db:deploy to apply migrations
- Run db:seed to populate database

### Payment Unavailable

**Manual mode:**
- USSD dial works independently
- Honor system continues
- No external dependency

**Open API mode (when implemented):**
- Collection API down → checkout blocked
- Disbursement API down → payout retries
- Order stays PAID on payout failure
- Ops can retry via console

### Media Storage Unavailable

**Behavior:**
- BLOB_READ_WRITE_TOKEN unset → in-memory fallback
- Images persist only during dev server session
- No uploads lost on restart (clearly communicated)

**Recovery:**
- Set BLOB_READ_WRITE_TOKEN
- Re-upload images after restart

### KDS SSE Unavailable

**Behavior:**
- Stream self-closes on error
- Client reconnects with backoff
- KDS continues to work with stale data
- Manual refresh reloads snapshot

**Recovery:**
- Client auto-reconnects
- Stream re-establishes on recovery
- No data loss (snapshot source of truth)

## Invariants

### Non-Negotiable Invariants

1. **Browser never imports Store**
   - Store is server-only (import "server-only")
   - Client accesses data via Server Actions or RSC only
   - Never bypass the Store seam

2. **Persistence passes through Store seam**
   - All reads/writes go through Store interface
   - No direct Prisma calls outside Store adapters
   - No competing data paths

3. **Vendor data remains vendor-scoped**
   - Owner token validated against specific vendor slug
   - No cross-vendor data access
   - Operator actions logged and audited

4. **Secrets remain server-side**
   - Never expose secrets to browser
   - Owner token plaintext returned once at provision
   - Only hash stored on Vendor

5. **Payment state not fabricated client-side**
   - Order status only changed via Server Actions
   - Payment confirmation validated server-side
   - Manual mode requires phone match

6. **KDS updates avoid unnecessary full reads**
   - Revision-first polling (ADR-0023)
   - Scoped queries for SSE
   - Pooler egress minimized

7. **Server Action modules export only async actions**
   - Never export types from "use server" files
   - Never re-export non-async values
   - Import types from source modules

8. **Public/customer and vendor/internal surfaces remain separated**
   - Separate routes and components
   - No shared auth context
   - Only visual language shared (DESIGN.md)

9. **Existing design system tokens must be respected**
   - Use DESIGN.md tokens
   - No new legacy palettes
   - KDS uses scoped .kds-dark remap

10. **Never claim something is implemented unless code exists**
    - Documentation must match actual implementation
    - Mark deferred/experimental clearly
    - Unknown / requires confirmation when uncertain

## Testing

### Test Structure

**Contract tests:** `lib/store/__tests__/contract.ts`
- Tests Store interface against both adapters
- ~253 tests pass with in-memory adapter
- Prisma suite opt-in (SKIP_PRISMA_TESTS=0)

**Unit tests:** `lib/**/__tests__/*.ts`
- Domain module tests
- Payment logic tests
- Validation tests

**Integration tests:** `app/__tests__/*.ts`
- Route tests
- Manifest tests

### Running Tests

```bash
npm test              # Run all tests (Prisma suite skipped by default)
SKIP_PRISMA_TESTS=0 npm test  # Opt in to Prisma suite
```

### Test Configuration

- Vitest runner
- Postinstall runs prisma generate
- Hook timeout: 90000ms (Prisma suite is slow)
- Test timeout: 30000ms
- Test database: TEST_DATABASE_URL (direct connection, not pooler)

## Implementation vs Production Activation

This section clarifies the distinction between technical implementation and production activation.

### Terminology

**Implemented:**
- Code exists in the repository
- Code is deployed to production
- Feature can be tested locally
- Feature may or may not be active in production

**Implemented but inactive:**
- Code exists and is deployed to production
- Feature is turned off via configuration (environment variable, database setting, feature flag)
- Feature can be activated without additional code deployment
- Activation is blocked by business decision, operational constraint, or dependency

**Partially implemented:**
- Core functionality exists
- Some aspects are incomplete
- Feature is not production-ready

**Deferred:**
- Feature is not yet implemented
- Feature may be planned but not started
- No code exists for this feature

### Current Examples

**Open API Payment (Implemented but inactive):**
- Status: Code fully implemented and deployed
- Local: Can test by setting `MOMO_MODE=openapi`
- Production: Inactive because `MOMO_MODE` defaults to `manual`
- Reason: Awaiting owner approval for Test B and production cutover (ADR-0096)
- Activation: Change `MOMO_MODE` environment variable (no code change needed)

**Commission (Implemented but inactive):**
- Status: Code fully implemented and deployed
- Local: Commission settings available in Ops console
- Production: Inactive because `CommissionSettings.globalEnabled` defaults to false
- Reason: Commission is tied to Open API payment flow; inactive until Open API is active
- Activation: Change `globalEnabled` to true via Ops console (no code change needed)

**Manual MoMo Payment (Implemented and active):**
- Status: Code fully implemented and deployed
- Production: Active (production default)
- Reason: Interim solution while Open API awaits approval

**Real Authentication (Deferred):**
- Status: Not implemented
- Reason: Owner tokens are interim solution (candidate #12)
- Activation: Requires full implementation

### Decision Process

Some features require business approval before production activation:
- Open API payment cutover requires owner approval (business decision, not technical)
- Commission activation follows Open API (technical dependency)
- Feature flags allow gradual rollout without code deployment

This is intentional:
- Technical implementation can be complete while business approval is pending
- Configuration switches allow activation without additional deployment
- This is not a documentation gap; it's a deliberate separation of concerns
