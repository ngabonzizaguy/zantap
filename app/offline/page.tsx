import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Card, GradientOrbs } from "@/components/ui/primitives";

export default function OfflinePage() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas px-5 py-12 text-ink">
      <GradientOrbs />
      <Card className="relative z-10 w-full max-w-md text-center" padding="lg">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-strong text-muted">
          <Icon name="wifiOff" size={22} strokeWidth={1.9} />
        </span>
        <h1 className="mt-5 font-display text-display-md font-normal">
          You&apos;re offline
        </h1>
        <p className="mt-3 font-body text-body-md text-muted">
          ZanTap needs a connection for live orders, payments, and kitchen
          updates. Reconnect, then try again.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 min-h-10 w-full items-center justify-center rounded-pill bg-primary px-5 font-body text-button font-medium text-on-primary transition-[background-color,transform] duration-150 hover:bg-primary-active active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Try again
        </Link>
      </Card>
    </main>
  );
}
