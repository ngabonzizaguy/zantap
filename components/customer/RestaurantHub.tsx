"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
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
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-label="Saved restaurants">
      {restaurants.map((restaurant) => {
        const available = restaurant.isAvailable !== false;
        return (
          <li
            key={restaurant.vendorId}
            className={
              available
                ? "group relative isolate flex min-h-[280px] flex-col overflow-hidden rounded-brand-xxl bg-primary p-5 text-on-primary shadow-[0_20px_50px_rgba(12,10,9,0.16)] sm:p-6"
                : "relative flex min-h-[280px] flex-col overflow-hidden rounded-brand-xxl border border-hairline bg-surface-card p-5 text-ink shadow-brand-soft sm:p-6"
            }
          >
            {available ? (
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-peach/35 blur-3xl transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-gradient-mint/20 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(125deg,transparent_30%,rgba(255,255,255,0.035)_30%,rgba(255,255,255,0.035)_50%,transparent_50%)]" />
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-4">
              <div
                className={
                  available
                    ? "flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-brand-xl border border-white/15 bg-white/10 font-display text-title-md text-white shadow-inner"
                    : "flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-brand-xl border border-hairline bg-surface-strong font-display text-title-md text-ink"
                }
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
              <div className="flex flex-col items-end gap-2">
                <span
                  className={
                    available
                      ? "inline-flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/10 px-3 py-1.5 font-body text-caption text-white/80"
                      : "inline-flex items-center gap-1.5 rounded-pill bg-surface-strong px-3 py-1.5 font-body text-caption text-muted"
                  }
                >
                  <Smartphone size={14} aria-hidden />
                  Saved on this phone
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(restaurant)}
                  className={
                    available
                      ? "inline-flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      : "inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  }
                  aria-label={`Remove ${restaurant.name} from saved restaurants`}
                  title="Remove restaurant"
                >
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-8 flex-1">
              {!available ? (
                <p className="mb-3 inline-flex rounded-pill bg-surface-strong px-3 py-1 font-body text-caption font-medium text-muted">
                  Temporarily unavailable
                </p>
              ) : null}
              <h2
                className={
                  available
                    ? "max-w-[14ch] font-display text-[34px] leading-[1.05] text-white"
                    : "max-w-[14ch] font-display text-[34px] leading-[1.05] text-ink"
                }
              >
                {restaurant.name}
              </h2>
              <p
                className={
                  available
                    ? "mt-3 flex items-center gap-2 font-body text-body-sm text-white/65"
                    : "mt-3 flex items-center gap-2 font-body text-body-sm text-muted"
                }
              >
                <MapPin size={16} aria-hidden />
                <span className="truncate">
                  {restaurant.location || restaurant.tagline || "Your saved restaurant"}
                </span>
              </p>
            </div>

            <div className="mt-7 flex items-end justify-between gap-4">
              <p
                className={
                  available
                    ? "font-body text-caption text-white/50"
                    : "font-body text-caption text-muted-soft"
                }
              >
                Last opened<br />
                <span className={available ? "text-white/80" : "text-muted"}>
                  {formatInteraction(restaurant.lastInteractedAt)}
                </span>
              </p>
              {available ? (
                <Link
                  href={`/${encodeURIComponent(restaurant.slug)}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-pill bg-white px-5 font-body text-button font-medium text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transform-none"
                  aria-label={`Open ${restaurant.name}`}
                >
                  Open menu
                  <ArrowUpRight size={17} aria-hidden />
                </Link>
              ) : (
                <span className="inline-flex min-h-12 items-center rounded-pill bg-surface-strong px-5 font-body text-button text-muted" aria-disabled="true">
                  Menu offline
                </span>
              )}
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
    <main className="relative min-h-screen overflow-x-hidden bg-canvas px-5 pb-[max(48px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))] text-ink sm:px-8 lg:pt-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div className="absolute -left-32 -top-44 h-96 w-96 rounded-full bg-gradient-mint/30 blur-3xl" />
        <div className="absolute -right-40 top-12 h-80 w-80 rounded-full bg-gradient-peach/35 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="ZanTap home" className="flex items-center gap-2.5">
            <Image
              src="/brand/approved-z/zantap-z-mark-2048-remove-bg-io.png"
              alt=""
              width={2048}
              height={2048}
              priority
              className="h-9 w-9"
            />
            <span className="font-body text-title-sm font-medium">ZanTap</span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/60 bg-surface-card/70 px-3 py-2 font-body text-caption text-muted shadow-brand-soft backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Private to this device
          </span>
        </header>

        <div className="grid gap-10 pb-8 pt-12 sm:pt-16 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)] lg:gap-16 lg:pt-24">
          <section className="lg:sticky lg:top-10 lg:self-start" aria-labelledby="restaurants-heading">
            <div className="inline-flex items-center gap-2 font-body text-caption-uppercase uppercase text-muted">
              <Bookmark size={15} aria-hidden />
              Your places
            </div>
            <h1
              id="restaurants-heading"
              className="mt-4 max-w-[11ch] font-display text-[46px] leading-[0.98] tracking-[-0.02em] text-ink sm:text-[60px] lg:text-[68px]"
            >
              Good food, remembered.
            </h1>
            <p className="mt-6 max-w-sm font-body text-body-md leading-relaxed text-body">
              Save a restaurant once. Come back whenever you&apos;re hungry—no account needed.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-12 min-w-12 items-center justify-center rounded-full bg-primary px-4 font-display text-title-sm text-on-primary" aria-live="polite">
                {restaurants.length}
              </span>
              <p className="font-body text-body-sm text-muted">
                {restaurants.length === 1 ? "restaurant saved" : "restaurants saved"}<br />
                on this phone
              </p>
            </div>

            <div className="mt-10 hidden max-w-sm items-start gap-3 border-t border-hairline pt-5 text-muted lg:flex">
              <Smartphone size={19} className="mt-0.5 flex-none" aria-hidden />
              <p className="font-body text-caption leading-relaxed">
                Your list lives only on this device. Clearing browser data removes it.
              </p>
            </div>
          </section>

          <section aria-label="Your restaurants" className="min-w-0">
            {!loading && restaurants.length > 0 ? (
              <RestaurantUpdates vendorIds={savedVendorIds} repository={repository} />
            ) : null}
            {restaurants.length > 1 ? (
              <div className="relative mb-5">
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
              <div role="status" className="min-h-[280px] animate-pulse rounded-brand-xxl bg-surface-card p-6 shadow-brand-soft motion-reduce:animate-none">
                <span className="sr-only">Loading your restaurants…</span>
                <div className="h-16 w-16 rounded-brand-xl bg-surface-strong" />
                <div className="mt-12 h-8 w-2/3 rounded-pill bg-surface-strong" />
                <div className="mt-4 h-4 w-1/2 rounded-pill bg-surface-strong" />
              </div>
            ) : restaurants.length === 0 ? (
              <section className="relative min-h-[320px] overflow-hidden rounded-brand-xxl border border-hairline bg-surface-card p-7 shadow-brand-soft sm:p-10">
                <div aria-hidden className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-gradient-peach/35 blur-3xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-brand-xl bg-primary text-on-primary">
                  <Utensils size={24} aria-hidden />
                </div>
                <h2 className="relative mt-12 max-w-sm font-display text-display-md text-ink">
                  Your first favorite starts with a tap.
                </h2>
                <p className="relative mt-3 max-w-md font-body text-body-md text-muted">
                  Open a restaurant from its link or QR code, then save it or add your first dish.
                </p>
              </section>
            ) : visibleRestaurants.length === 0 ? (
              <div role="status" className="rounded-brand-xxl border border-hairline bg-surface-card p-8 text-center shadow-brand-soft">
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

            <div className="mt-7 flex items-start gap-3 border-t border-hairline pt-5 text-muted lg:hidden">
              <Smartphone size={19} className="mt-0.5 flex-none" aria-hidden />
              <p className="font-body text-caption leading-relaxed">
                Your list lives only on this device. Clearing browser data removes it.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
