"use client";

import { Button } from "@/components/ui/primitives";

export function PrintReceiptButton() {
  return (
    <Button
      type="button"
      variant="primary"
      size="default"
      className="no-print"
      onClick={() => window.print()}
    >
      Print receipt
    </Button>
  );
}
