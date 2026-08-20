# Issue 03 — Storefront menu pagination

Status: ready-for-agent

## What to build

Show at most ten available dishes per storefront page after category and search
filtering. URL-backed Previous/Page/Next navigation must preserve the cart,
support refresh/back/share, and return focus/scroll to the menu without making
customers lose their current selections.

## Acceptance criteria

- [ ] At most ten available matching dishes render per page; unavailable dishes
      are excluded before counting.
- [ ] Category, search and page are URL-backed; changes reset page to 1 and
      invalid pages clamp safely.
- [ ] Previous/Page/Next controls work with browser Back, refresh and shared URLs.
- [ ] Page changes preserve cart/customization state and scroll/focus to Menu.
- [ ] Empty results, one-page menus, mobile and desktop layouts remain clear and
      accessible.
- [ ] Focused URL/filter/pagination tests plus the full verification gate pass.

## Blocked by

None — can start independently of Issues 01 and 02.
