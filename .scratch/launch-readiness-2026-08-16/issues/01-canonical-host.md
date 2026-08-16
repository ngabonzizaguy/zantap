# Issue 01 — Canonical production host

Status: **done · deployed · production-smoked**

- [x] Permanently redirect exact host `zantap-psi.vercel.app` to
  `https://zantap.app`, preserving path and query.
- [x] Do not redirect preview deployments or localhost.
- [x] Add configuration-level coverage.
- [ ] Production-smoke the old KDS URL and confirm the final install origin is
  `zantap.app`.
- [ ] Document that an already-installed old-origin PWA must be uninstalled and
  reinstalled once.
