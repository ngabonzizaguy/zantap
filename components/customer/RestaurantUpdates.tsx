"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SavedRestaurantRepository } from "@/lib/customer-restaurants/types";
import {
  buildUpdateTray,
  chooseInitialBatchIndex,
  hydratePublicUpdateFeed,
} from "@/lib/customer-restaurants/updates";
import type {
  PublicVendorUpdateBatch,
  PublicVendorUpdateFeedItem,
} from "@/lib/vendor-updates/types";

interface RestaurantUpdatesProps {
  vendorIds: string[];
  repository: SavedRestaurantRepository;
}

interface LocalBatchState {
  viewedRevision: number;
  openSentRevision: number;
  menuVisitSentRevision: number;
}

function relativeTime(value: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - value.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function summaryFor(batch: PublicVendorUpdateBatch): string {
  if (batch.entries.length === 1) return batch.entries[0].summary ?? batch.entries[0].name;
  return `${batch.entries.length} menu updates`;
}

export function RestaurantUpdates({ vendorIds, repository }: RestaurantUpdatesProps) {
  const [feed, setFeed] = useState<PublicVendorUpdateFeedItem[]>([]);
  const [states, setStates] = useState<Map<string, LocalBatchState>>(new Map());
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const sentThisMount = useRef(new Set<string>());
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (vendorIds.length === 0) {
      void Promise.resolve().then(() => {
        if (!cancelled) setFeed([]);
      });
      return () => { cancelled = true; };
    }
    void fetch(`/api/customer/updates?ids=${encodeURIComponent(vendorIds.join(","))}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load updates");
        return response.json() as Promise<{ updates: PublicVendorUpdateFeedItem[] }>;
      })
      .then(async ({ updates }) => {
        const hydrated = hydratePublicUpdateFeed(updates);
        const pairs = await Promise.all(
          hydrated.flatMap((vendor) => vendor.batches).map(async (batch) => [
            batch.id,
            await repository.getUpdateState(batch.id),
          ] as const)
        );
        if (!cancelled) {
          setFeed(hydrated);
          setStates(new Map(pairs));
        }
      })
      .catch(() => {
        if (!cancelled) setFeed([]);
      });
    return () => { cancelled = true; };
  }, [repository, vendorIds]);

  const tray = useMemo(() => buildUpdateTray(feed, states), [feed, states]);
  const newUpdateCount = tray.filter((entry) => entry.hasUnseen).length;
  const newChangeCount = tray.reduce((total, { vendor, hasUnseen }) => {
    if (!hasUnseen) return total;
    return total + vendor.batches.reduce((count, batch) => {
      const viewedRevision = states.get(batch.id)?.viewedRevision ?? 0;
      return count + (batch.revision > viewedRevision ? batch.entries.length : 0);
    }, 0);
  }, 0);
  const activeVendor = feed.find((vendor) => vendor.vendorId === activeVendorId) ?? null;
  const activeBatch = activeVendor?.batches[activeBatchIndex] ?? null;

  const reportOnce = useCallback(async (
    batch: PublicVendorUpdateBatch,
    kind: "open" | "menuVisit"
  ) => {
    const marker = `${batch.id}:${batch.revision}:${kind}`;
    if (sentThisMount.current.has(marker)) return;
    const state = await repository.getUpdateState(batch.id);
    const sentRevision = kind === "open" ? state.openSentRevision : state.menuVisitSentRevision;
    if (sentRevision >= batch.revision) return;
    sentThisMount.current.add(marker);
    const response = await fetch(`/api/customer/updates/${batch.id}/analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    }).catch(() => null);
    if (response?.ok) {
      await repository.markUpdateAnalyticsSent(batch.id, batch.vendorId, kind, batch.revision);
    } else {
      sentThisMount.current.delete(marker);
    }
  }, [repository]);

  useEffect(() => {
    if (!activeBatch) return;
    dialogRef.current?.focus();
    void repository.markUpdateViewed(activeBatch.id, activeBatch.vendorId, activeBatch.revision).then(() => {
      setStates((current) => {
        const next = new Map(current);
        const state = next.get(activeBatch.id) ?? {
          viewedRevision: 0,
          openSentRevision: 0,
          menuVisitSentRevision: 0,
        };
        next.set(activeBatch.id, {
          ...state,
          viewedRevision: Math.max(state.viewedRevision, activeBatch.revision),
        });
        return next;
      });
    });
    void reportOnce(activeBatch, "open");
  }, [activeBatch, reportOnce, repository]);

  const openVendor = (vendor: PublicVendorUpdateFeedItem) => {
    setActiveBatchIndex(chooseInitialBatchIndex(vendor.batches, states));
    setActiveVendorId(vendor.vendorId);
  };

  const move = (direction: -1 | 1) => {
    if (!activeVendor) return;
    setActiveBatchIndex((current) =>
      Math.min(activeVendor.batches.length - 1, Math.max(0, current + direction))
    );
  };

  const markAllSeen = async () => {
    await Promise.all(feed.flatMap((vendor) => vendor.batches).map((batch) =>
      repository.markUpdateViewed(batch.id, batch.vendorId, batch.revision)
    ));
    setStates((current) => {
      const next = new Map(current);
      feed.flatMap((vendor) => vendor.batches).forEach((batch) => {
        const state = next.get(batch.id) ?? { viewedRevision: 0, openSentRevision: 0, menuVisitSentRevision: 0 };
        next.set(batch.id, { ...state, viewedRevision: batch.revision });
      });
      return next;
    });
  };

  if (tray.length === 0) return null;

  return (
    <section className="mb-7 rounded-brand-xl border border-primary/40 bg-surface-card p-4 shadow-brand-soft sm:p-5" aria-labelledby="restaurant-updates-heading">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-body text-caption-uppercase uppercase text-muted">Restaurant updates</p>
          <h2 id="restaurant-updates-heading" className="mt-1 flex items-center gap-2 font-display text-display-sm font-light text-ink">
            New changes
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-momo px-1.5 font-body text-caption font-semibold text-momo-dark" aria-label={`${newChangeCount} new ${newChangeCount === 1 ? "change" : "changes"}`}>
              {newChangeCount}
            </span>
          </h2>
        </div>
        {newUpdateCount > 0 ? (
          <button type="button" onClick={() => void markAllSeen()} className="inline-flex min-h-11 items-center gap-2 rounded-pill px-3 font-body text-caption text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            <CheckCheck size={17} aria-hidden /> <span className="whitespace-nowrap">Mark all seen</span>
          </button>
        ) : null}
      </div>

      <ul className="mt-4 flex gap-4 overflow-x-auto pb-2" aria-label="Restaurant updates">
        {tray.map(({ vendor, hasUnseen }) => (
          <li key={vendor.vendorId} className="w-[76px] flex-none text-center">
            <button type="button" onClick={() => openVendor(vendor)} className="group w-full rounded-brand-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" aria-label={`View updates from ${vendor.name}`}>
              <span className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full p-[3px] ${hasUnseen ? "bg-momo" : "bg-hairline-strong"}`}>
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-canvas bg-surface-card font-display text-title-sm text-ink">
                  {vendor.logoUrl ? <Image src={vendor.logoUrl} alt="" width={64} height={64} className="h-full w-full object-cover" /> : vendor.name.slice(0, 1)}
                </span>
                {hasUnseen ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-momo px-1 font-body text-[10px] font-semibold leading-none text-momo-dark" aria-hidden>
                    {vendor.batches.reduce((count, batch) => count + ((batch.revision > (states.get(batch.id)?.viewedRevision ?? 0)) ? batch.entries.length : 0), 0)}
                  </span>
                ) : null}
              </span>
              <span className="mt-2 block truncate font-body text-caption text-body">{vendor.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {activeVendor && activeBatch ? (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${activeVendor.name} updates`} tabIndex={-1} onKeyDown={(event) => {
          if (event.key === "Escape") setActiveVendorId(null);
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }} onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
          if (touchStartX.current == null) return;
          const delta = event.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(delta) > 50) move(delta < 0 ? 1 : -1);
          touchStartX.current = null;
        }} className="fixed inset-0 z-[90] overflow-y-auto bg-canvas px-5 pb-[max(32px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-ink">
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-1" aria-label={`Update ${activeBatchIndex + 1} of ${activeVendor.batches.length}`}>
              {activeVendor.batches.map((batch, index) => <span key={batch.id} className={`h-1 flex-1 rounded-pill ${index <= activeBatchIndex ? "bg-ink" : "bg-hairline-strong"}`} />)}
            </div>
            <header className="mt-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-body text-title-sm font-medium">{activeVendor.name}</p>
                <p className="font-body text-caption text-muted">{relativeTime(activeBatch.publishedAt)}</p>
              </div>
              <button type="button" onClick={() => setActiveVendorId(null)} aria-label="Close updates" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong"><X size={20} aria-hidden /></button>
            </header>

            <h3 className="mt-10 font-display text-display-md font-light">{summaryFor(activeBatch)}</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {activeBatch.entries.map((entry) => (
                <article key={entry.id} className="overflow-hidden rounded-brand-xl border border-hairline bg-surface-card">
                  {entry.imageUrl ? <Image src={entry.imageUrl} alt="" width={720} height={420} className="aspect-[16/10] w-full object-cover" /> : null}
                  <div className="p-5">
                    <p className="font-body text-title-sm font-medium">{entry.name}</p>
                    {entry.summary ? <p className="mt-2 font-body text-body-sm text-body">{entry.summary}</p> : null}
                    {entry.oldPriceRwf != null && entry.currentPriceRwf != null ? <p className="mt-3 font-body text-body-sm"><span className="text-muted line-through">RWF {entry.oldPriceRwf.toLocaleString()}</span> <span className="ml-2 text-ink">RWF {entry.currentPriceRwf.toLocaleString()}</span></p> : null}
                    {!entry.isCurrentlyAvailable ? <p className="mt-3 inline-flex rounded-pill bg-surface-strong px-3 py-1 font-body text-caption text-muted">Currently unavailable</p> : null}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
              <div className="flex gap-2">
                <button type="button" onClick={() => move(-1)} disabled={activeBatchIndex === 0} aria-label="Previous update" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong disabled:opacity-30"><ArrowLeft size={19} aria-hidden /></button>
                <button type="button" onClick={() => move(1)} disabled={activeBatchIndex === activeVendor.batches.length - 1} aria-label="Next update" className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline-strong disabled:opacity-30"><ArrowRight size={19} aria-hidden /></button>
              </div>
              <Link href={`/${activeVendor.slug}`} onClick={() => void reportOnce(activeBatch, "menuVisit")} className="inline-flex min-h-12 items-center rounded-pill bg-primary px-6 font-body text-button text-on-primary">View menu</Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
