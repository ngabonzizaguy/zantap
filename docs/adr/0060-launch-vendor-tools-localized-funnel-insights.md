# ADR-0060: Universal vendor tools and localized funnel insights

Status: Accepted — 2026-08-16

## Decision

Stock management and complete profit insights are included for every vendor;
legacy flags no longer gate them. Setup Guide cards navigate to their real KDS
destination. Marketing renders English, Kinyarwanda, French, and Kiswahili from
repository baselines plus Store-backed Ops overrides.

Funnel analytics use a first-party Store model and allow-listed events. They may
contain a random session ID, locale, path, referrer host and UTM fields, but
never form values, contact data, raw IP addresses, or fingerprints. Ops receives
an authenticated aggregate Insights screen.

The exact legacy host `zantap-psi.vercel.app` permanently redirects to
`zantap.app`; preview and local hosts do not redirect.

## Consequences

- Numeric stock is finite inventory; null means unlimited.
- Deleting a translation override restores its baseline.
- Old-origin PWAs require one uninstall/reinstall after this cutover.
- Payments and footer social destinations remain unchanged.
