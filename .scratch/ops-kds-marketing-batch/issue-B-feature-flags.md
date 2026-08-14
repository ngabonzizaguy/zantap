# Issue B — Per-vendor feature flags

**Status:** Done (code on `feat/ops-kds-marketing-batch`; not deployed)  
**Branch:** `feat/ops-kds-marketing-batch`  
**ADR:** 0056

## Goal

One shared per-vendor feature-flag mechanism for WhatsApp notify, Stock, and Know Your Profit.

## Checklist

- [x] Boolean flags on Vendor: `featureWhatsappNotify` (default false), `featureStockTracking` (default false), `featureProfitInsights` (default false)
- [x] Ops toggles on vendor detail
- [x] KDS reads flags; hide surfaces cleanly when off
- [x] Operator API patch path

## Locked decisions

- Per-vendor (not global)
- WhatsApp notify defaults OFF until staff-member support exists
