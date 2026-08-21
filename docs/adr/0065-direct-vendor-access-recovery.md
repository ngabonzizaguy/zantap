# ADR-0065 — Direct, plain-language Vendor access recovery

Date: 2026-08-21
Status: Accepted · implementation assigned to Candidate #26 Issue 02

## Context

Some KDS actions currently respond to missing per-Vendor owner access by telling
the Vendor to use Setup Guide. That makes a simple recovery task depend on
finding and opening another surface. Some notices also expose implementation
language such as `owner token`, which is harder than the Vendor needs.

Candidate #26 Issue 02 adds more owner-guarded Vendor controls. It must not
repeat that interaction or wording.

## Decision

When an action discovers that this device lacks owner access, its notice will
include a direct button that opens the recovery input dialog in the current KDS
experience. The Vendor will not be required to pass through Setup Guide or
navigate to another page first.

The shared recovery entry point will also be available to existing Menu,
Inventory and History missing-access notices while implementing Issue 02.
Setup Guide may keep a secondary recovery entry, but it is not the mandatory
route.

Vendor-facing copy will be short and use everyday language such as `Unlock
editing`, `store link`, and `signup phone`. It will not mention owner tokens,
capabilities, guards, or browser storage unless a technical diagnostic surface
specifically requires those terms.

## Consequences

- Recovery becomes one action from the notice that explains the problem.
- One reusable dialog/controller should prevent each KDS panel from inventing
  a separate recovery flow.
- Successful recovery must refresh the cached access state so the Vendor can
  retry without reopening the KDS.
- This decision changes no access rules, token storage, owner verification, or
  Server Action guard. It only changes the entry point and Vendor-facing copy.
- Implementation belongs to Candidate #26 Issue 02. This closeout does not
  authorize Issue 03 or 04, migration, deployment, push, or production smoke.
