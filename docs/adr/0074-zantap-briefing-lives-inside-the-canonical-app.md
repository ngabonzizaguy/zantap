---
status: accepted
---

# ZanTap Briefing lives inside the canonical app

ZanTap Briefing will be a protected `/briefing` route inside the existing
`zantap.app` Next.js deployment rather than a separate Vercel project or
subdomain. This keeps Access grants, Viewing sessions, interest capture,
evidence management, audit history, Ops controls, brand assets, and motion
infrastructure within ZanTap's existing seams and operational account. A
separate deployment could offer stronger infrastructure isolation later, but it
would now duplicate security, content, analytics, deployment, and brand plumbing
without a demonstrated benefit.
