# Candidate #22 — UI spec (owner mockups 2026-07-05)

Reference images (workspace):
- Drivers tab: `assets/...image-45a02e6a...png`
- Assign modal: `assets/...image-7ab043ce...png`

## Drivers tab (`?tab=drivers`)

Replaces bottom-nav **Setup**. Hamburger still opens `SetupDrawer`.

### Chrome (unchanged from current KDS)

- `MetricsBanner` (vendor name, Live, OPEN toggle, hamburger)
- Summary cards: Today's gross, Active orders
- Bottom tabs: Orders | Menu | History | **Drivers** (active = orange primary pill + delivery icon)

### Drivers panel content

| Element | Mockup | Implementation |
|---------|--------|----------------|
| Sub-header row | ← back, "Drivers", ⚙ gear | Title **Drivers** only (no back — tab context). Gear **deferred** (Soon) unless wired to nothing |
| Search | "Search drivers" full-width-ish | Client-side filter on name + phone |
| Status filter | "All status" dropdown | **Deferred** — disabled + "Soon" badge (no fake Online/Busy/Offline without presence API) |
| Driver row | Avatar, name, `+250 …` phone, status dot, Active tag, ✎ edit, ⋮ menu | Avatar = initials + `hue` circle (existing seed pattern). **No status dot/tag v1.** Edit opens modal. ⋮ → Delete |
| Empty state | — | "No drivers yet" + prompt to add |
| FAB | Purple **+ Add driver** bottom-right | Opens add-driver sheet/modal (name + phone fields) |

### Add / edit driver sheet

- Fields: **Name**, **Phone** (dial-code aware like Setup payments)
- Save owner-token guarded
- Delete from edit flow or row ⋮ menu (confirm)

---

## Assign driver modal (order dispatch)

Triggered from expanded **READY** ticket (replaces / refactors current `DispatchModal` dispatch path).

### Layout (match mockup shell)

- Bottom sheet (`Modal` primitive): drag handle, `z-[70]`
- Title: `Assign driver to order #{displayId}` (bulk variant: `Assign driver to {n} orders`)
- Search drivers (client filter)
- Status filter: **deferred** (Soon) — same as Drivers tab
- Scrollable radio list:
  - Purple filled radio when selected
  - Initials avatar, name, formatted phone
  - **No Online/Busy/Offline v1**
- Primary CTA: orange full-width **`Assign to {selectedName}`**
- On success: close modal; ticket shows assigned driver + **Call** (`tel:`)

### Footer — deviation from mockup

| Mockup | Locked decision | Ship |
|--------|-----------------|------|
| WhatsApp icon + "Driver will receive a WhatsApp notification" | **No WhatsApp to drivers** | Phone icon + **"Call the driver after assigning"** (or omit footer) |

### Post-assign on ticket

- Show `Assigned: {driverName}` + Call chip
- Order stays **READY** (no stage advance)
- Separate action later for OUT_FOR_DELIVERY if needed

### Bulk assign

- Bulk-select READY orders → **Assign driver** in bulk bar
- Same modal; title `Assign driver to {n} orders`; one driver → all selected

---

## Explicit non-goals (v1)

- Driver presence / Online / Busy / Offline (no schema, no fake data)
- WhatsApp to driver
- Driver profile photos (initials only)
- Per-order driver in bulk modal
