"use client";

import { useEffect } from "react";
import { Button, GradientOrbs } from "@/components/ui/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-6 text-center">
      <GradientOrbs />
      <div className="relative z-10">
        <h1 className="font-display text-display-md text-ink">Something went wrong</h1>
        <p className="mt-3 font-body text-body-md text-muted">
          We hit a snag loading this page. Please try again.
        </p>
        <Button type="button" onClick={() => reset()} className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
