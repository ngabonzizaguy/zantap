"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  MapPin,
  Search,
  Smartphone,
  Trash2,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSavedRestaurantRepository } from "@/lib/customer-restaurants/browser";
import { RestaurantUpdates } from "@/components/customer/RestaurantUpdates";
import {
  filterSavedRestaurants,
  reconcileSavedRestaurants,
  removeSavedRestaurant,
} from "@/lib/customer-restaurants/hub";
import type { PublicRestaurantResult } from "@/lib/customer-restaurants/public-resolver";
import type { SavedRestaurant } from "@/lib/customer-restaurants/types";

interface PublicRestaurantResponse {
  restaurants: PublicRestaurantResult[];
}

function restaurantInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatInteraction(iso: string) {
  return new Intl.DateTimeFormat("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function SavedRestaurantList({
  restaurants,
  onRemove,
}: {
  restaurants: SavedRestaurant[];
  onRemove: (restaurant: SavedRestaurant) => void;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-label="Saved restaurants">
      {restaurants.map((restaurant) => {
        const available = restaurant.isAvailable !== false;
        return (
          <li
            key={restaurant.vendorId}
            className="group relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-brand-xl border border-hairline bg-surface-card p-4 text-ink shadow-brand-soft"
          >
            {available ? (
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -right-14 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-110 motion-reduce:transform-none" />
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div
                className="flex h-[52px] w-[52px] flex-none items-center justify-center overflow-hidden rounded-brand-lg border border-primary/40 bg-primary/10 font-display text-title-sm text-ink"
              >
              {restaurant.logoUrl ? (
                // Public Vendor branding can be remote; the fixed shell prevents layout shift.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                restaurantInitials(restaurant.name)
              )}
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-primary/10 px-3 py-1.5 font-body text-caption text-primary">
                  <Smartphone size={14} aria-hidden />
                  Saved
                </span>
              </div>
            </div>

            <div className="mt-3 flex-1">
              {!available ? (
                <p className="mb-2 inline-flex rounded-pill bg-surface-strong px-3 py-1 font-body text-caption font-medium text-muted">
                  Temporarily unavailable
                </p>
              ) : null}
              <h2 className="max-w-[18ch] font-display text-[27px] font-light leading-[1.05] text-ink">
                {restaurant.name}
              </h2>
              <p className="mt-1.5 flex items-center gap-1.5 font-body text-caption text-muted">
                <MapPin size={14} aria-hidden />
                <span className="truncate">
                  {restaurant.location || restaurant.tagline || "Your saved restaurant"}
                </span>
              </p>
            </div>

            <div className="mt-3 flex items-start justify-between gap-4 border-t border-hairline pt-3">
              <p className="pt-1 font-body text-[12px] leading-[1.45] text-muted-soft">
                Opened<br />
                <span className="text-muted">{formatInteraction(restaurant.lastInteractedAt)}</span>
              </p>
              <div className="flex items-center gap-2">
                {available ? (
                  <Link
                    href={`/${encodeURIComponent(restaurant.slug)}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-brand-lg bg-primary px-4 font-body text-button font-medium text-on-primary transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink motion-reduce:transform-none"
                    aria-label={`Open ${restaurant.name}`}
                  >
                    Open menu
                    <ArrowUpRight size={16} aria-hidden />
                  </Link>
                ) : (
                  <span className="inline-flex min-h-11 items-center rounded-brand-lg bg-surface-strong px-4 font-body text-button text-muted" aria-disabled="true">
                    Menu offline
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(restaurant)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  aria-label={`Remove ${restaurant.name} from saved restaurants`}
                  title="Remove restaurant"
                >
                  <Trash2 size={17} aria-hidden />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function RestaurantHub() {
  const repository = useMemo(() => getBrowserSavedRestaurantRepository(), []);
  const [restaurants, setRestaurants] = useState<SavedRestaurant[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void repository.list().then(async (local) => {
      if (cancelled) return;
      setRestaurants(local);
      setLoading(false);
      if (local.length === 0) return;

      try {
        const ids = local.map((restaurant) => restaurant.vendorId).join(",");
        const response = await fetch(
          `/api/customer/restaurants?ids=${encodeURIComponent(ids)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Unable to refresh restaurants");
        const body = (await response.json()) as PublicRestaurantResponse;
        const reconciled = reconcileSavedRestaurants(local, body.restaurants);
        await Promise.all(
          reconciled.map((restaurant) => repository.save(restaurant))
        );
        if (!cancelled) setRestaurants(reconciled);
      } catch {
        if (!cancelled) {
          setRestaurants(
            local.map((restaurant) => ({ ...restaurant, isAvailable: false }))
          );
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  const visibleRestaurants = useMemo(
    () => filterSavedRestaurants(restaurants, query),
    [restaurants, query]
  );
  const savedVendorIds = useMemo(
    () => restaurants.map((restaurant) => restaurant.vendorId),
    [restaurants]
  );

  const removeRestaurant = async (restaurant: SavedRestaurant) => {
    const removed = await removeSavedRestaurant(
      repository,
      restaurant.vendorId,
      () => window.confirm(`Remove ${restaurant.name} from Your restaurants?`)
    );
    if (!removed) return;
    setRestaurants((current) =>
      current.filter((saved) => saved.vendorId !== restaurant.vendorId)
    );
  };

  return (
    <main className="kds-dark relative min-h-screen overflow-x-hidden bg-canvas p-1 pb-[max(4px,env(safe-area-inset-bottom))] pt-[max(4px,env(safe-area-inset-top))] text-ink sm:p-6 lg:p-8">
      <div className="kds-surface relative mx-auto min-h-[calc(100svh-8px)] w-full max-w-6xl rounded-[20px] border border-primary/25 px-4 pb-4 pt-3 sm:min-h-[calc(100vh-3rem)] sm:px-6 sm:pb-6 sm:pt-4 lg:px-8">
        <header className="flex min-h-11 items-center justify-between gap-4">
          <Link href="/" aria-label="ZanTap home" className="flex items-center gap-2.5">
            <Image
              src="/brand/approved-z/zantap-z-mark-2048-remove-bg-io.png"
              alt=""
              width={2048}
              height={2048}
              priority
              className="h-8 w-8"
            />
            <span className="font-body text-body-md font-medium">ZanTap</span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-pill border border-hairline-strong bg-surface-card px-3 py-1.5 font-body text-[12px] text-muted shadow-brand-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            On this phone
          </span>
        </header>

        <div className="grid gap-4 pb-1 pt-5 sm:gap-7 sm:pt-9 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)] lg:gap-14 lg:pt-16">
          <section className="lg:sticky lg:top-10 lg:self-start" aria-labelledby="restaurants-heading">
            <div className="flex items-center justify-between gap-4 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              <span>Your restaurants</span>
              <span className="normal-case tracking-normal text-muted" aria-live="polite">
                {restaurants.length} saved
              </span>
            </div>
            <h1
              id="restaurants-heading"
              className="mt-2 font-display text-[36px] font-light leading-none tracking-[-0.02em] text-ink sm:text-[48px] lg:max-w-[11ch] lg:text-[60px]"
            >
              Your restaurants.
            </h1>
            <p className="mt-2 max-w-sm font-body text-body-sm leading-relaxed text-body sm:mt-4">
              Your saved menus, ready when you are.
            </p>

            <div className="mt-7 hidden max-w-sm items-start gap-3 border-t border-hairline pt-4 text-muted lg:flex">
              <Smartphone size={19} className="mt-0.5 flex-none" aria-hidden />
              <p className="font-body text-caption leading-relaxed">
                This list stays on this phone.
              </p>
            </div>
          </section>

          <section aria-label="Your restaurants" className="min-w-0">
            {!loading && restaurants.length > 0 ? (
              <RestaurantUpdates vendorIds={savedVendorIds} repository={repository} />
            ) : null}
            {restaurants.length > 1 ? (
              <div className="relative mb-3">
                <label htmlFor="saved-restaurant-search" className="sr-only">
                  Search your saved restaurants
                </label>
                <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  id="saved-restaurant-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a saved restaurant"
                  className="h-12 w-full rounded-pill border border-hairline-strong bg-surface-card/85 py-3 pl-12 pr-5 font-body text-body-md text-ink shadow-brand-soft outline-none backdrop-blur placeholder:text-muted-soft focus:border-2 focus:border-ink"
                />
              </div>
            ) : null}

            {loading ? (
              <div role="status" className="min-h-[220px] animate-pulse rounded-brand-xl bg-surface-card p-5 shadow-brand-soft motion-reduce:animate-none">
                <span className="sr-only">Loading your restaurants…</span>
                <div className="h-16 w-16 rounded-brand-xl bg-surface-strong" />
                <div className="mt-12 h-8 w-2/3 rounded-pill bg-surface-strong" />
                <div className="mt-4 h-4 w-1/2 rounded-pill bg-surface-strong" />
              </div>
            ) : restaurants.length === 0 ? (
              <section className="relative min-h-[240px] overflow-hidden rounded-brand-xl border border-hairline bg-surface-card p-6 shadow-brand-soft sm:p-8">
                <div aria-hidden className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-gradient-peach/35 blur-3xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-brand-xl bg-primary text-on-primary">
                  <Utensils size={24} aria-hidden />
                </div>
                <h2 className="relative mt-8 max-w-sm font-display text-display-md text-ink">
                  No saved restaurants yet.
                </h2>
                <p className="relative mt-3 max-w-md font-body text-body-md text-muted">
                  Open a restaurant menu and tap Save.
                </p>
              </section>
            ) : visibleRestaurants.length === 0 ? (
              <div role="status" className="rounded-brand-xl border border-hairline bg-surface-card p-8 text-center shadow-brand-soft">
                <Search size={24} className="mx-auto text-muted-soft" aria-hidden />
                <p className="mt-4 font-body text-body-md text-muted">
                  No saved restaurant matches “{query}”.
                </p>
                <button type="button" onClick={() => setQuery("")} className="mt-4 min-h-11 rounded-pill bg-primary px-5 font-body text-button text-on-primary">
                  Clear search
                </button>
              </div>
            ) : (
              <SavedRestaurantList
                restaurants={visibleRestaurants}
                onRemove={(restaurant) => void removeRestaurant(restaurant)}
              />
            )}

            <div className="mt-4 flex items-start gap-3 border-t border-hairline pt-4 text-muted lg:hidden">
              <Smartphone size={17} className="mt-0.5 flex-none" aria-hidden />
              <p className="font-body text-[12px] leading-relaxed">
                This list stays on this phone.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
