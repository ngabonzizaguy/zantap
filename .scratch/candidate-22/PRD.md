# PRD: Candidate #22 — Storefront share + menu lightbox + KDS drivers

Status: feature-complete · build green 2026-07-05 · deploy + prod smoke pending
Feature slug: candidate-22

## Locked decisions (owner 2026-07-05)

| Topic | Decision |
|-------|----------|
| Setup guide cap | **(A)** Auto-open `SetupDrawer` only — max **2×** per vendor slug per browser when checklist incomplete; manual hamburger open never increments; coachmarks unchanged |
| Assign → stage | Order stays **READY** on driver assign; does **not** auto-advance to `OUT_FOR_DELIVERY` |
| Bulk assign | **One driver** for all selected READY orders (per-order picker deferred) |
| Driver fields | **Name + phone** (E.164 normalize on write, display via `formatPhoneDisplay`) |
| WhatsApp scope | Remove WhatsApp from **driver dispatch** path only; keep **Notify vendor on WhatsApp** on PAID tickets (candidate #9) |
| Assignment purpose | Persist `order → driver` so vendor can see which orders went to which driver (History + ticket UI) |
| Drivers tab UI | Owner mockups in `.scratch/candidate-22/ui-spec.md`; status filter **Soon** v1 |

## Issues

| Issue | Status | Delivers |
|-------|--------|----------|
| 22-01 | ✅ Done | Storefront Hero share |
| 22-02 | ✅ Done | Menu image lightbox |
| 22-03 | ✅ Done | Setup drawer auto-open cap (2×) |
| 22-04 | ✅ Done | Drivers tab + Store CRUD |
| 22-05 | ✅ Done | `Order.driverId` + AssignDriverModal |

**Next:** `db:deploy` migration `20260705180000_order_driver_assignment` → deploy → Playwright prod smoke.
