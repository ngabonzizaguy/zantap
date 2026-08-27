---
status: accepted
---

# Briefing product proof uses owner-approved current screens

The ZanTap Briefing product composition uses `storefront-3.png` for the
customer view and `kds-dashboard-2.png` for the kitchen view. These captures
replace the older storefront and Inventory-focused pair, which did not
represent the product story the owner intends to show recipients.

Media paths are editable in the authenticated structured Briefing draft and
become part of each immutable published version. Publishing a replacement
therefore creates a new version; it does not rewrite the media pinned to an
existing recipient Access grant. This preserves ADR-0076 while allowing Ops to
select current, owner-approved product evidence for future grants.
