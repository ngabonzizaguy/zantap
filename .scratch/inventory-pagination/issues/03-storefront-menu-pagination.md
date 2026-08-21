# Issue 03 — Storefront menu pagination

Status: ✅ DONE · deployed 2026-08-20 · prod-smoked 2026-08-21

## What to build

Show at most ten available dishes per storefront page after category and search
filtering. URL-backed Previous/Page/Next navigation must preserve the cart,
support refresh/back/share, and return focus/scroll to the menu without making
customers lose their current selections.

## Acceptance criteria

- [x] At most ten available matching dishes render per page; unavailable dishes
      are excluded before counting.
- [x] Category, search and page are URL-backed; changes reset page to 1 and
      invalid pages clamp safely.
- [x] Previous/Page/Next controls work with browser Back, refresh and shared URLs.
- [x] Page changes preserve cart/customization state and scroll/focus to Menu.
- [x] Empty results, one-page menus, mobile and desktop layouts remain clear and
      accessible.
- [x] Focused URL/filter/pagination tests plus the full verification gate pass.

## Blocked by

None — can start independently of Issues 01 and 02.

## Verification

- Focused storefront URL/filter/pagination tests: 4 passed.
- TypeScript and ESLint: clean.
- Full Vitest: 362 passed / 109 expected skips.
- Production Turbopack build: clean.
- Local webpack browser smoke: 32/32 checks passed at 390×844 and 1280×900.
  It covered ten-card paging, shared/direct URLs, invalid-page clamping,
  category/search reset, browser Back, cart persistence, Menu focus/scroll,
  unavailable exclusion, empty results, accessible controls, zero horizontal
  overflow, zero framework overlays and zero console errors.
- Production, Vercel and migration `20260820183000_real_vendor_inventory` were
  not touched.
- Combined release 2026-08-20: deployed once as
  `dpl_7X7XC38sJrWhoXtwTvo68ACKRjAi` on `zantap.app`. Storefront paging URLs
  return HTTP 200; release-window error/fatal/5xx scans are empty. The full
  cart-preserving browser interaction smoke remains pending because the shared
  disposable-fixture harness stopped earlier at an Inventory render-timing
  assertion before reaching this surface; no storefront product error was
  observed.
- Final-smoke attempt 2026-08-20 again stopped at the preceding Inventory
  refresh assertion, so page-two/cart/Back/search production interactions
  remain pending. The fixture cleanup is zero and deployment error/fatal/5xx
  scans are empty; no migration or redeploy occurred.
- Follow-up single run 2026-08-20 passed Inventory but stopped at the preceding
  KDS Orders harness selector before storefront execution. Page-two/cart/Back/
  search production interactions therefore remain pending. The selector was
  corrected without rerunning; cleanup is zero and deployment error/fatal/5xx
  scans are empty.
- Ticket-selector follow-up 2026-08-20 reached the storefront and confirmed page
  two contains one dish, then added that dish to the cart. After clicking
  Previous, the URL still contained a `page` parameter after 30 seconds, so the run stopped
  before page-one/cart, browser Back and search assertions. The harness now
  reports both URL and card count at this boundary and was not rerun. Direct
  cleanup is zero and deployment error/fatal/5xx scans are empty.
- Diagnosis 2026-08-20: this is a harness hydration race, not evidence of a
  storefront defect. The local smoke waits for `networkidle`; the production
  harness stopped at `domcontentloaded`, where the server-rendered controls are
  visible before React handlers attach. A read-only production probe against
  `inka-steakhouse` reproduced the same URL-handler boundary 5/5 times when
  interaction was immediate and passed 5/5 after `networkidle`. No owner action
  is required. Add an explicit hydration-ready wait before storefront actions,
  then run the full production harness once.
- Final combined production smoke 2026-08-21: after adding the explicit
  `networkidle` hydration boundary, the single authorized harness run passed
  page two, Previous/default-URL omission, ten-card page one, cart persistence,
  browser Back and URL-backed search on mobile, plus desktop pagination and
  overflow checks. The complete harness passed 27 checks with zero browser
  errors or framework overlays. Independent cleanup found zero `release-25-*`
  fixtures, and the exact deployment's 48-hour error/fatal/5xx scans were empty.
  No product change, migration repeat or redeploy was required.
