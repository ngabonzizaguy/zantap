"use client";

import { useMemo, useState } from "react";
import type { MenuItem, MomoMode, Vendor } from "@/lib/types";
import { GradientOrbs } from "@/components/ui/primitives";
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

interface StorefrontProps {
  vendor: Vendor;
  menu: MenuItem[];
  categories: string[];
  fromKds?: boolean;
  momoMode?: MomoMode;
}

function StorefrontInner({
  vendor,
  menu,
  categories,
  fromKds = false,
  momoMode = "simulate",
}: StorefrontProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sectorOpen, setSectorOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const { cart, itemNotes, addItem, addFromCustomization, removeItem, resetCart } =
    useCart();
  const checkout = useCheckout(vendor, menu, { momoMode });

  const activeItem = useMemo(
    () => menu.find((item) => item.id === activeItemId) ?? null,
    [menu, activeItemId]
  );

  /**
   * The single chokepoint where the customize modal touches the cart. Persists
   * qty + special-instructions notes (one per menuItemId, last-write-wins).
   */
  const handleAddToOrder = (selection: CustomizationSelection) => {
    addFromCustomization(selection);
    setActiveItemId(null);
  };

  const availableMenu = useMemo(
    () => menu.filter((item) => item.isAvailable),
    [menu]
  );

  const filteredMenu = useMemo(
    () =>
      activeCategory === "All"
        ? availableMenu
        : availableMenu.filter((item) => item.category === activeCategory),
    [availableMenu, activeCategory]
  );

  const handleReset = () => {
    checkout.reset();
    resetCart();
  };

  return (
    <div className="storefront-dark relative min-h-screen w-full overflow-x-hidden bg-canvas text-ink">
      <GradientOrbs className="opacity-25" />
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

        <div className="mt-8">
          <div className="mb-4 flex items-baseline justify-between px-0.5">
            <h2 className="font-display text-display-sm font-light text-ink">Menu</h2>
            <span className="font-body text-caption-uppercase uppercase text-muted">
              {filteredMenu.length}{" "}
              {filteredMenu.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          <CategoryChips
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
          />

          <div className="mt-5">
            <MenuList
              items={filteredMenu}
              cart={cart}
              onAdd={addItem}
              onOpen={(item) => setActiveItemId(item.id)}
            />
          </div>
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
        onOpen={() => checkout.applyStage("open_cart")}
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
