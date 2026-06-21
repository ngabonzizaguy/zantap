"use client";

import { useMemo, useState } from "react";
import type { MenuItem, Vendor } from "@/lib/types";
import { createOrder } from "@/lib/data";
import { normalizePhone } from "@/lib/format";
import { Orbs } from "@/components/ui/Orbs";
import { TopBar } from "@/components/customer/TopBar";
import { Hero } from "@/components/customer/Hero";
import { CategoryChips } from "@/components/customer/CategoryChips";
import { MenuList } from "@/components/customer/MenuItemCard";
import { StickyCartBar } from "@/components/customer/StickyCartBar";
import {
  canProceedToPay,
  CheckoutSheet,
} from "@/components/customer/CheckoutSheet";
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
  const cart = useCart();

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

  const count = cart.getCount();
  const total = cart.getTotal(availableMenu);
  const lines = cart.getLines(availableMenu);
  const canPay = canProceedToPay(count, cart.phone, cart.sector, cart.landmark);

  const handlePay = async () => {
    if (!canPay) return;

    cart.setStage("loading");
    cart.setSectorOpen(false);

    try {
      const order = await createOrder({
        vendorSlug: vendor.slug,
        customerPhone: normalizePhone(cart.phone),
        deliverySector: cart.sector,
        landmark: cart.landmark,
        items: lines.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.qty,
        })),
      });

      cart.setOrderId(order.id);

      const response = await fetch("/api/momo/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phone: normalizePhone(cart.phone),
          amount: order.totalAmount,
          vendorName: vendor.name,
        }),
      });

      const data = await response.json();
      if (data.status === "FAILED") {
        cart.setStage("cart");
        return;
      }

      cart.setStkToken(data.token);
      cart.setStage("ussd");
    } catch {
      cart.setStage("cart");
    }
  };

  const handleConfirmPin = async () => {
    if (cart.pin.length < 5) return;

    const response = await fetch("/api/momo/stk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "confirm",
        token: cart.stkToken,
        pin: cart.pin,
      }),
    });

    const data = await response.json();
    if (data.status === "SUCCESS") {
      cart.setStage("success");
    }
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
              cart={cart.cart}
              onAdd={cart.addItem}
            />
          </div>
        </div>
      </div>

      <StickyCartBar
        count={count}
        total={total}
        onOpen={() => cart.setStage("cart")}
      />

      <CheckoutSheet
        open={cart.stage === "cart"}
        showLoading={cart.stage === "loading"}
        lines={lines}
        total={total}
        phone={cart.phone}
        sector={cart.sector}
        landmark={cart.landmark}
        sectorOpen={cart.sectorOpen}
        canPay={canPay}
        onClose={() => cart.setStage("menu")}
        onPhoneChange={cart.setPhone}
        onSectorToggle={() => cart.setSectorOpen(!cart.sectorOpen)}
        onSectorPick={(sector) => {
          cart.setSector(sector);
          cart.setSectorOpen(false);
        }}
        onLandmarkChange={cart.setLandmark}
        onPay={handlePay}
        onInc={cart.addItem}
        onDec={cart.removeItem}
      />

      <UssdModal
        open={cart.stage === "ussd"}
        amount={total}
        vendorName={vendor.name}
        pin={cart.pin}
        onPinChange={cart.setPin}
        onCancel={() => {
          cart.setPin("");
          cart.setStage("cart");
        }}
        onSend={handleConfirmPin}
      />

      <SuccessReceipt
        open={cart.stage === "success"}
        amount={total}
        orderId={cart.orderId}
        sector={cart.sector}
        landmark={cart.landmark}
        restaurantName={vendor.name}
        onReset={cart.reset}
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
