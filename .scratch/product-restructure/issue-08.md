# Issue 08 — DESIGN.md rewrite (single design authority)

Status: **ready-for-agent** · Track 3 · ADR-0046 §10

Docs-only. Rewrite `DESIGN.md` to codify the LIVE system; do not repaint any
surface.

- [ ] One brand foundation: approved Z mark + wordmark, amber `#F5A623`, typography, spacing/radius/shadow tokens as they exist in `tailwind.config.ts` + `globals.css`.
- [ ] Documented per-surface treatments: marketing page (from Issue 03), dark liquid-glass storefront (ADR-0043), dark KDS/onboarding (`.kds-dark`, `.kds-surface`, ADR-0017/0025/0027), ops console.
- [ ] Component inventory: buttons, inputs, cards, sheets/modals, chips, empty/loading/error/success states — pointing at real primitives.
- [ ] Accessibility guidance (touch targets, contrast on dark, reduced motion) and the descendant-only `.kds-dark` gotcha.
- [ ] Terminology rule: "Kitchen Dashboard" in public copy, "KDS" internally — with rationale.
- [ ] Supersede stale light-editorial claims explicitly (note ADR-0005 → ADR-0043/0046 lineage); update `.cursorrules` UI section if it contradicts.
- [ ] Handoff per protocol (ADR if any new visual decision is made — target none).
