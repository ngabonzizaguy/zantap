"use client";

import Image from "next/image";
import { Button } from "@/components/ui/primitives";

interface SplashStepProps {
  onGetStarted: () => void;
  onRecoverAccess: () => void;
}

interface Role {
  icon: string;
  title: string;
  subtitle: string;
}

const ROLES: Role[] = [
  {
    icon: "/brand/roles/restaurant.png",
    title: "Restaurant",
    subtitle: "You prepare delicious food",
  },
  {
    icon: "/brand/roles/customer.png",
    title: "Customer",
    subtitle: "They place an order",
  },
  {
    icon: "/brand/roles/kitchen.png",
    title: "Kitchen",
    subtitle: "You cook with ease",
  },
  {
    icon: "/brand/roles/mobile-money.png",
    title: "Mobile Money",
    subtitle: "Get paid instantly",
  },
  {
    icon: "/brand/roles/delivery.png",
    title: "Delivery",
    subtitle: "Orders get to your customers",
  },
];

export function SplashStep({ onGetStarted, onRecoverAccess }: SplashStepProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <Image
          src="/brand/zantap-logo.png"
          alt="ZanTap"
          width={56}
          height={56}
          priority
          className="h-14 w-14 flex-none"
        />
        <p className="font-display text-display-sm leading-none text-ink">
          ZanTap{" "}
          <span className="font-body text-body-sm font-semibold text-primary">
            Kitchen
          </span>
        </p>
      </div>

      <div>
        <h1 className="font-display text-display-lg leading-tight text-ink">
          Start accepting orders in under{" "}
          <span className="text-primary">one minute.</span>
        </h1>
        <p className="mt-3 font-body text-body-md text-muted">
          Everything else can be completed later.
        </p>
      </div>

      <ol className="relative flex flex-col gap-3 pl-6">
        <span
          className="absolute bottom-6 left-[5px] top-6 w-px bg-hairline-strong"
          aria-hidden="true"
        />
        {ROLES.map((role) => (
          <li key={role.title} className="relative">
            <span
              className="absolute -left-6 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3 rounded-brand-lg border border-hairline bg-surface-card px-4 py-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-brand-lg border border-hairline-strong bg-surface-strong p-1.5">
                <Image
                  src={role.icon}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </span>
              <div>
                <p className="font-body text-body-md font-semibold text-ink">
                  {role.title}
                </p>
                <p className="font-body text-caption text-muted">
                  {role.subtitle}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-4">
        <Button
          type="button"
          size="kds"
          radius="lg"
          className="w-full"
          onClick={onGetStarted}
        >
          Get Started →
        </Button>
        <button
          type="button"
          onClick={onRecoverAccess}
          className="font-body text-body-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Already have a store? Recover access
        </button>
      </div>
    </div>
  );
}
