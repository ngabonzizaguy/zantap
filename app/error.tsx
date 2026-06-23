"use client";

import { useEffect } from "react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-zt-blush-bg px-6 text-center">
      <h1 className="font-serif text-4xl text-zt-brown">Something went wrong</h1>
      <p className="mt-3 text-zt-warm">
        We hit a snag loading this page. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-2xl bg-zt-brown-dark px-6 py-3 text-sm font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}
