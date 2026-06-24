import Link from "next/link";
import { GradientOrbs } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6 text-center">
      <GradientOrbs />
      <div className="relative z-10">
        <h1 className="font-display text-display-md text-ink">Page not found</h1>
        <p className="mt-3 font-body text-body-md text-muted">
          This link doesn&apos;t exist or the address may be wrong.
        </p>
        <Link
          href="/inka-steakhouse"
          className="mt-6 inline-flex h-10 min-h-10 items-center justify-center rounded-pill bg-primary px-5 font-body text-button font-medium text-on-primary transition-colors hover:bg-primary-active"
        >
          View demo storefront
        </Link>
      </div>
    </div>
  );
}
