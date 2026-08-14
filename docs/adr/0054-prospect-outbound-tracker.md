# ADR-0054: Prospect outbound tracker (separate from Lead)

Outbound businesses ZanTap finds and contacts (Google Maps, Instagram, referrals) are a **Prospect**, not a Lead. A Lead is inbound — the business filled the marketing form. Mixing them would confuse the Lead inbox and WhatsApp routing already shipped in ADR-0053.

Prospect stages: `FOUND → CONTACTED → IN_TALKS → CONVERTED`, with exits `DECLINED` and `UNREACHABLE`. Every Prospect has a `nextFollowUpAt`; Ops sorts by follow-ups due. Entry is manual (quick-add + bulk paste); each touch is an immutable `ProspectInteraction` (date, channel, note). On conversion the operator manually links the Prospect to the Vendor it became (optionally a Lead). No Maps/social integrations in v1.