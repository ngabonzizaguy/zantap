"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBrowserSavedRestaurantRepository } from "@/lib/customer-restaurants/browser";
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
    <ul className="grid gap-3 sm:grid-cols-2" aria-label="Saved restaurants">
      {restaurants.map((restaurant) => {
        const available = restaurant.isAvailable !== false;
        const content = (
          <>
            <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-strong font-display text-title-md font-light text-ink">
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
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-body text-title-sm font-medium text-ink">
                  {restaurant.name}
                </h2>
                {!available ? (
                  <span className="rounded-pill bg-surface-strong px-2.5 py-1 font-body text-caption-uppercase uppercase text-muted">
                    Unavailable
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate font-body text-body-sm text-muted">
                {restaurant.location || restaurant.tagline || "Saved restaurant"}
              </p>
              <p className="mt-2 font-body text-caption text-muted-soft">
                Last visited {formatInteraction(restaurant.lastInteractedAt)}
              </p>
            </div>
          </>
        );

        return (
          <li
            key={restaurant.vendorId}
            className="rounded-brand-xl border border-hairline bg-surface-card p-4 shadow-brand-soft"
          >
            {available ? (
              <Link
                href={`/${encodeURIComponent(restaurant.slug)}`}
                className="flex min-h-20 items-center gap-4 rounded-brand-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                aria-label={`Open ${restaurant.name}`}
              >
                {content}
              </Link>
            ) : (
              <div className="flex min-h-20 items-center gap-4" aria-disabled="true">
                {content}
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(restaurant)}
              className="mt-3 min-h-11 rounded-pill px-3 font-body text-caption font-medium text-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              aria-label={`Remove ${restaurant.name} from saved restaurants`}
            >
              Remove
            </button>
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
    <main className="relative min-h-screen overflow-x-hidden bg-canvas px-5 pb-16 pt-[max(24px,env(safe-area-inset-top))] text-ink sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
        <div className="absolute -left-24 -top-28 h-72 w-72 rounded-full bg-gradient-mint/35 blur-3xl" />
        <div className="absolute -right-24 -top-20 h-64 w-64 rounded-full bg-gradient-peach/40 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-4xl">
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
          <span className="rounded-pill bg-surface-card/80 px-3 py-1.5 font-body text-caption text-muted backdrop-blur">
            On this device
          </span>
        </header>

        <section className="pb-8 pt-14 sm:pt-20" aria-labelledby="restaurants-heading">
          <p className="font-body text-caption-uppercase uppercase text-muted">
            Your private collection
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1
              id="restaurants-heading"
              className="font-display text-display-lg font-light text-ink sm:text-[48px]"
            >
              Your restaurants
            </h1>
            <p className="font-body text-body-sm text-muted" aria-live="polite">
              {restaurants.length} saved
            </p>
          </div>
          <p className="mt-4 max-w-xl font-body text-body-md text-body">
            Restaurants appear here after you save one, add a dish, or start an order.
            This list stays on this device and is not a ZanTap account.
          </p>
        </section>

        {restaurants.length > 0 ? (
          <div className="mb-5">
            <label htmlFor="saved-restaurant-search" className="sr-only">
              Search your saved restaurants
            </label>
            <input
              id="saved-restaurant-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your restaurants"
              className="h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink outline-none placeholder:text-muted-soft focus:border-2 focus:border-ink"
            />
          </div>
        ) : null}

        {loading ? (
          <p role="status" className="rounded-brand-xl border border-hairline bg-surface-card p-6 font-body text-body-md text-muted">
            Loading your restaurants…
          </p>
        ) : restaurants.length === 0 ? (
          <section className="rounded-brand-xxl border border-hairline bg-surface-card p-7 sm:p-10">
            <h2 className="font-display text-display-sm font-light text-ink">
              No saved restaurants yet
            </h2>
            <p className="mt-3 max-w-lg font-body text-body-md text-muted">
              Open a restaurant link or scan its QR code. A passive visit will not add it here.
            </p>
          </section>
        ) : visibleRestaurants.length === 0 ? (
          <p role="status" className="rounded-brand-xl border border-hairline bg-surface-card p-6 font-body text-body-md text-muted">
            No saved restaurants match “{query}”.
          </p>
        ) : (
          <SavedRestaurantList
            restaurants={visibleRestaurants}
            onRemove={(restaurant) => void removeRestaurant(restaurant)}
          />
        )}
      </div>
    </main>
  );
}
