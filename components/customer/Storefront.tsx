"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { MenuItem, MomoMode, Vendor } from "@/lib/types";
import { TopBar } from "@/components/customer/TopBar";
import { Hero } from "@/components/customer/Hero";
import { CategoryChips } from "@/components/customer/CategoryChips";
import { MenuList } from "@/components/customer/MenuItemCard";
import { MenuItemCustomizeSheet } from "@/components/customer/MenuItemCustomizeSheet";
import { StickyCartBar } from "@/components/customer/StickyCartBar";
import { CheckoutSheet } from "@/components/customer/CheckoutSheet";
import type { CustomizationSelection } from "@/lib/menu/customization";
import { useCheckout } from "@/lib/checkout/useCheckout";
import { UssdModal } from "@/components/customer/UssdModal";
import { ManualMomoSheet } from "@/components/customer/ManualMomoSheet";
import { SuccessReceipt } from "@/components/customer/SuccessReceipt";
import { CartProvider, useCart } from "@/components/customer/CartContext";
import { Button } from "@/components/ui/primitives/Button";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { placeOrder } from "@/lib/actions/customer";
import { getBrowserSavedRestaurantRepository } from "@/lib/customer-restaurants/browser";
import { createCustomerEngagementController } from "@/lib/customer-restaurants/engagement";
import {
  buildStorefrontMenuHref,
  paginateStorefrontMenu,
  parseStorefrontMenuQuery,
  type StorefrontMenuQuery,
} from "@/lib/menu/storefront-pagination";

interface StorefrontProps {
  vendor: Vendor;
  menu: MenuItem[];
  categories: string[];
  initialMenuQuery: StorefrontMenuQuery;
  fromKds?: boolean;
  momoMode?: MomoMode;
}

function StorefrontInner({
  vendor,
  menu,
  categories,
  initialMenuQuery,
  fromKds = false,
  momoMode = "simulate",
}: StorefrontProps) {
  const [menuQuery, setMenuQuery] = useState(() => ({
    ...initialMenuQuery,
    page: paginateStorefrontMenu(menu, initialMenuQuery).page,
  }));
  const [sectorOpen, setSectorOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const menuHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousPageRef = useRef<number | null>(null);
  const initialMenuQueryRef = useRef(menuQuery);
  const initialUrlCanonicalizedRef = useRef(false);
  const [restaurantSaved, setRestaurantSaved] = useState(false);
  const [installUnlocked, setInstallUnlocked] = useState(false);
  const { cart, itemNotes, addItem, addFromCustomization, removeItem, resetCart } =
    useCart();
  const savedRestaurantRepository = useMemo(
    () => getBrowserSavedRestaurantRepository(),
    []
  );
  const savedRestaurantIdentity = useMemo(
    () => ({
      vendorId: vendor.id,
      slug: vendor.slug,
      name: vendor.name,
      logoUrl: vendor.logoUrl,
      location: vendor.location,
      tagline: vendor.tagline,
    }),
    [
      vendor.id,
      vendor.location,
      vendor.logoUrl,
      vendor.name,
      vendor.slug,
      vendor.tagline,
    ]
  );
  const engagement = useMemo(
    () =>
      createCustomerEngagementController({
        repository: savedRestaurantRepository,
        restaurant: savedRestaurantIdentity,
        onSaved: () => {
          setRestaurantSaved(true);
          setInstallUnlocked(true);
        },
      }),
    [savedRestaurantIdentity, savedRestaurantRepository]
  );
  const checkout = useCheckout(vendor, menu, {
    momoMode,
    deps: {
      placeOrder: async (input) => {
        const order = await placeOrder(input);
        await engagement.record("order-place");
        return order;
      },
    },
  });

  useEffect(() => {
    let cancelled = false;
    void savedRestaurantRepository.list().then((restaurants) => {
      if (cancelled) return;
      const alreadySaved = restaurants.some(
        (restaurant) => restaurant.vendorId === vendor.id
      );
      setRestaurantSaved(alreadySaved);
      setInstallUnlocked(alreadySaved);
    });
    return () => {
      cancelled = true;
    };
  }, [savedRestaurantRepository, vendor.id]);

  const recordEngagement = useCallback(
    (reason: Parameters<typeof engagement.record>[0]) => {
      void engagement.record(reason).catch(() => undefined);
    },
    [engagement]
  );

  const handleAddItem = useCallback(
    (itemId: string) => {
      const item = menu.find((candidate) => candidate.id === itemId);
      if (item?.sizeOptions?.length) {
        setActiveItemId(itemId);
        return;
      }
      addItem(itemId);
      recordEngagement("cart-add");
    },
    [addItem, menu, recordEngagement]
  );

  const activeItem = useMemo(
    () => menu.find((item) => item.id === activeItemId) ?? null,
    [menu, activeItemId]
  );

  // Stable reference so memoized menu cards don't re-render on cart changes.
  const handleOpenItem = useCallback(
    (item: MenuItem) => setActiveItemId(item.id),
    []
  );

  /**
   * The single chokepoint where the customize modal touches the cart. Persists
   * qty + special-instructions notes (one per menuItemId, last-write-wins).
   */
  const handleAddToOrder = (selection: CustomizationSelection) => {
    addFromCustomization(selection);
    recordEngagement("cart-add");
    setActiveItemId(null);
  };

  const menuPage = useMemo(
    () => paginateStorefrontMenu(menu, menuQuery),
    [menu, menuQuery]
  );

  const updateMenuQuery = useCallback(
    (nextQuery: StorefrontMenuQuery, mode: "push" | "replace" = "push") => {
      const safeQuery = {
        ...nextQuery,
        page: paginateStorefrontMenu(menu, nextQuery).page,
      };
      const href = buildStorefrontMenuHref(
        window.location.pathname,
        new URLSearchParams(window.location.search),
        safeQuery
      );
      window.history[mode === "push" ? "pushState" : "replaceState"](
        null,
        "",
        href
      );
      setMenuQuery(safeQuery);
    },
    [menu]
  );

  useEffect(() => {
    const canonicalize = (query: StorefrontMenuQuery) => {
      const href = buildStorefrontMenuHref(
        window.location.pathname,
        new URLSearchParams(window.location.search),
        query
      );
      const currentHref = `${window.location.pathname}${window.location.search}`;
      if (href !== currentHref) window.history.replaceState(null, "", href);
    };
    const handlePopState = () => {
      const parsedQuery = parseStorefrontMenuQuery(
        Object.fromEntries(new URLSearchParams(window.location.search)),
        categories
      );
      const safeQuery = {
        ...parsedQuery,
        page: paginateStorefrontMenu(menu, parsedQuery).page,
      };
      canonicalize(safeQuery);
      setMenuQuery(safeQuery);
    };
    if (!initialUrlCanonicalizedRef.current) {
      canonicalize(initialMenuQueryRef.current);
      initialUrlCanonicalizedRef.current = true;
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [categories, menu]);

  useEffect(() => {
    if (previousPageRef.current === null) {
      previousPageRef.current = menuPage.page;
      return;
    }
    if (previousPageRef.current === menuPage.page) return;
    previousPageRef.current = menuPage.page;
    window.requestAnimationFrame(() => {
      menuHeadingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      menuHeadingRef.current?.focus({ preventScroll: true });
    });
  }, [menuPage.page]);

  const handleReset = () => {
    checkout.reset();
    resetCart();
  };

  return (
    <div className="storefront-dark relative min-h-screen w-full overflow-x-hidden bg-canvas text-ink">
      <InstallHintBanner
        variant="light"
        surface="customer"
        appName="ZanTap"
        unlocked={installUnlocked}
      />
      <div className="zt-hidescroll relative z-[1] mx-auto min-h-screen w-full max-w-customer px-5 pb-40">
        <Hero
          vendorSlug={vendor.slug}
          tagline={vendor.tagline ?? "Premium grills"}
          restaurantName={vendor.name}
          deliveryTime={vendor.deliveryTime ?? "30–40 min"}
          rating={vendor.rating}
          logoUrl={vendor.logoUrl}
          coverImageUrl={vendor.coverImageUrl}
          description={vendor.description}
          phoneNumber={vendor.phoneNumber}
          header={
            <TopBar
              location={vendor.location ?? "Kigali, Rwanda"}
              kdsBackHref={
                fromKds ? `/vendor/${vendor.slug}?tab=orders` : undefined
              }
            />
          }
        />

        <nav
          aria-label="Saved restaurants"
          className="mt-5 flex flex-wrap items-center gap-2"
        >
          <Button
            variant="outline"
            disabled={restaurantSaved}
            onClick={() => recordEngagement("explicit-save")}
            className="min-h-11"
          >
            {restaurantSaved ? "Restaurant saved" : "Save restaurant"}
          </Button>
          <Link
            href="/restaurants"
            className="inline-flex min-h-11 items-center justify-center rounded-pill px-5 font-body text-button font-medium text-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Your restaurants
          </Link>
        </nav>

        <div className="mt-8">
          <div className="mb-4 flex items-baseline justify-between gap-4 px-0.5">
            <h2
              id="menu"
              ref={menuHeadingRef}
              tabIndex={-1}
              className="scroll-mt-6 font-display text-display-sm font-light text-ink focus:outline-none"
            >
              Menu
            </h2>
            <span
              className="font-body text-caption-uppercase uppercase text-muted"
              aria-live="polite"
            >
              {menuPage.total}{" "}
              {menuPage.total === 1 ? "dish" : "dishes"}
            </span>
          </div>

          <label htmlFor="menu-search" className="sr-only">
            Search menu
          </label>
          <input
            id="menu-search"
            type="search"
            value={menuQuery.search}
            onChange={(event) =>
              updateMenuQuery(
                { ...menuQuery, search: event.target.value, page: 1 },
                "replace"
              )
            }
            placeholder="Search dishes"
            className="glass-liquid-pill mb-3 h-11 w-full px-4 font-body text-body-md text-ink outline-none placeholder:text-muted-soft focus-visible:ring-2 focus-visible:ring-ink/70"
          />

          <CategoryChips
            categories={categories}
            active={menuQuery.category}
            onSelect={(category) =>
              updateMenuQuery({ ...menuQuery, category, page: 1 })
            }
          />

          {/* Keyed by category so switching chips replays the rise-in, making
              the filter swap feel fluid instead of an instant list swap. */}
          <div
            key={`${menuQuery.category}:${menuQuery.search}:${menuPage.page}`}
            className="zt-list-in mt-5"
          >
            {menuPage.items.length > 0 ? (
              <MenuList
                items={menuPage.items}
                cart={cart}
                onAdd={handleAddItem}
                onOpen={handleOpenItem}
              />
            ) : (
              <div className="glass-liquid px-5 py-8 text-center">
                <p className="font-display text-display-sm font-light text-ink">
                  No dishes found
                </p>
                <p className="mt-2 font-body text-body-sm text-muted">
                  Try another search or category.
                </p>
              </div>
            )}
          </div>

          <nav
            className="mt-5 flex items-center justify-between gap-3"
            aria-label="Menu pages"
          >
            <Button
              variant="outline"
              disabled={menuPage.page <= 1}
              onClick={() =>
                updateMenuQuery({ ...menuQuery, page: menuPage.page - 1 })
              }
              className="h-12 min-h-12 px-4"
            >
              Previous
            </Button>
            <span className="text-center font-body text-body-sm text-muted">
              Page {menuPage.page} of {menuPage.pageCount}
            </span>
            <Button
              variant="outline"
              disabled={menuPage.page >= menuPage.pageCount}
              onClick={() =>
                updateMenuQuery({ ...menuQuery, page: menuPage.page + 1 })
              }
              className="h-12 min-h-12 px-4"
            >
              Next
            </Button>
          </nav>
        </div>
      </div>

      <MenuItemCustomizeSheet
        item={activeItem}
        onClose={() => setActiveItemId(null)}
        onAddToOrder={handleAddToOrder}
      />

      <StickyCartBar
        count={checkout.count}
        total={checkout.total}
        onOpen={() => {
          recordEngagement("checkout-start");
          checkout.applyStage("open_cart");
        }}
      />

      <CheckoutSheet
        open={checkout.stage === "cart"}
        showLoading={checkout.stage === "loading"}
        lines={checkout.lines}
        total={checkout.total}
        phone={checkout.phone}
        sector={checkout.sector}
        landmark={checkout.landmark}
        sectorOpen={sectorOpen}
        canPay={checkout.canPay}
        payError={checkout.payError}
        onClose={() => checkout.applyStage("close_cart")}
        onPhoneChange={checkout.setPhone}
        onSectorToggle={() => setSectorOpen(!sectorOpen)}
        onSectorPick={(sector) => {
          checkout.setSector(sector);
          setSectorOpen(false);
        }}
        onLandmarkChange={checkout.setLandmark}
        onPay={() => {
          setSectorOpen(false);
          checkout.pay();
        }}
        onInc={addItem}
        onDec={removeItem}
      />

      <UssdModal
        open={!checkout.isManualFlow && checkout.stage === "ussd"}
        amount={checkout.total}
        vendorName={vendor.name}
        pin={checkout.pin}
        onPinChange={checkout.setPin}
        onCancel={() => {
          checkout.setPin("");
          checkout.applyStage("cancel_ussd");
        }}
        onSend={checkout.confirmPin}
      />

      <ManualMomoSheet
        open={
          checkout.isManualFlow &&
          (checkout.stage === "momo_dial" ||
            checkout.stage === "awaiting_confirmation")
        }
        stage={
          checkout.stage === "momo_dial"
            ? "momo_dial"
            : "awaiting_confirmation"
        }
        amount={checkout.total}
        vendorName={vendor.name}
        orderId={checkout.orderId}
        ussdDial={checkout.ussdDial}
        countdownLabel={checkout.countdownLabel}
        busy={checkout.manualBusy}
        error={checkout.manualError}
        onOpenMomo={checkout.openMomoDialer}
        onConfirmPaid={checkout.confirmManualPaid}
        onDidntPay={checkout.abandonManual}
      />

      <SuccessReceipt
        open={checkout.stage === "success"}
        amount={checkout.total}
        orderId={checkout.orderId}
        sector={checkout.sector}
        landmark={checkout.landmark}
        restaurantName={vendor.name}
        onReset={handleReset}
      />
    </div>
  );
}

export function Storefront(props: StorefrontProps) {
  return (
    <CartProvider>
      <StorefrontInner {...props} />
    </CartProvider>
  );
}
