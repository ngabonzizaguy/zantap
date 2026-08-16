# Issue 04 — Privacy-minimal marketing funnel insights

Status: **done · deployed · analytics/Ops API smoke passed**

- [ ] Record anonymous `landing_view`, `lead_form_view`, `lead_form_start`,
  `cta_click`, and `lead_submit_success` events.
- [ ] Store only allow-listed event/target/attribution fields; never store form
  values, raw IP, phone, email, contact name, or browser fingerprint.
- [ ] Add Store verbs, in-memory/Prisma adapters, migration, validation, rate
  limiting, and contract tests.
- [ ] Add an authenticated Ops Insights surface showing visitors/sessions,
  form views, starts, completed leads, conversion rates, top CTA targets,
  locale breakdown, and attribution.
- [ ] Add API/control/UI tests and desktop/mobile browser smoke.
- [ ] Update privacy copy to describe anonymous first-party product analytics.
