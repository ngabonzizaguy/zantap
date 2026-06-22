"use client";

import { useMemo, useState } from "react";
import type { MenuItem, Vendor } from "@/lib/types";
import { Orbs } from "@/components/ui/Orbs";
import { TopBar } from "@/components/customer/TopBar";
import { Hero } from "@/components/customer/Hero";
import { CategoryChips } from "@/components/customer/CategoryChips";
import { MenuList } from "@/components/customer/MenuItemCard";
import { StickyCartBar } from "@/components/customer/StickyCartBar";
import { CheckoutSheet } from "@/components/customer/CheckoutSheet";
import { useCheckout } from "@/lib/checkout/useCheckout";
import { UssdModal } from "@/components/customer/UssdModal";
import { SuccessReceipt } from "@/components/customer/SuccessReceipt";
import { CartProvider, useCart } from "@/components/customer/CartContext";

interface StorefrontProps {
  vendor: Vendor;
  menu: MenuItem[];
  categories: string[];
}

function StorefrontInner({ vendor, menu, categories }: StorefrontProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sectorOpen, setSectorOpen] = useState(false);
  const { cart, addItem, removeItem, resetCart } = useCart();
  const checkout = useCheckout(vendor, menu);

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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-zt-blush-50 via-zt-blush-100 to-zt-blush-200">
      <Orbs />
      <div className="zt-hidescroll relative z-[1] mx-auto min-h-screen w-full max-w-customer px-5 pb-40 pt-4">
        <TopBar location={vendor.location ?? "Kigali, Rwanda"} />

        <div className="mt-5">
          <Hero
            tagline={vendor.tagline ?? "Premium grills"}
            restaurantName={vendor.name}
            deliveryTime={vendor.deliveryTime ?? "30–40 min"}
            rating={vendor.rating}
          />
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-baseline justify-between px-0.5">
            <h2 className="font-serif text-[24px] leading-none text-zt-brown">Menu</h2>
            <span className="text-[12px] font-semibold uppercase tracking-[0.8px] text-zt-warm">
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
            />
          </div>
        </div>
      </div>

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
        open={checkout.stage === "ussd"}
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
