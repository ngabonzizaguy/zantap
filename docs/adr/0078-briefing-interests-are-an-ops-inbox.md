---
status: accepted
---

# Briefing interests are recorded in the Ops inbox without email delivery

The ZanTap Briefing interest form records each valid submission durably and
makes it available to authenticated Operators under `/ops/briefing`. The
viewer receives success only after the record is stored. This release does not
send an email, depend on Resend, or maintain queued/sent/failed delivery state.

This keeps the first operational workflow simple and truthful: ZanTap Ops is
the source of record and Operators follow up using the contact details supplied
by the viewer. A later email notification may be added as a convenience, but it
must remain secondary to durable capture and requires a separate provider and
notification-policy decision.
