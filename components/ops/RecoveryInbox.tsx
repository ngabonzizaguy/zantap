"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { VendorRecoveryEvent } from "@/lib/types";
import { Badge, Button, Card, Input, Modal } from "@/components/ui/primitives";
import { reviewRecoveryEventAction } from "@/lib/ops-actions/vendor-actions";

interface RecoveryInboxProps {
  events: VendorRecoveryEvent[];
}

export function RecoveryInbox({ events: initial }: RecoveryInboxProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initial);
  const [selected, setSelected] = useState<VendorRecoveryEvent | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReview() {
    if (!selected) return;
    startTransition(async () => {
      await reviewRecoveryEventAction(selected.id, note || undefined);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? { ...e, reviewedAt: new Date(), reviewNote: note || undefined }
            : e
        )
      );
      setSelected(null);
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
          Recovery inbox
        </h1>
        <p className="mt-1 text-sm text-muted">
          Phone-based owner token recoveries across all vendors.
        </p>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-surface-card lg:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-hairline bg-canvas-soft text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-hairline-soft last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{event.vendorName ?? event.vendorId}</p>
                  <p className="text-xs text-muted">{event.vendorSlug}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(event.at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={event.reviewedAt ? "success" : "muted"}>
                    {event.reviewedAt ? "Reviewed" : "Pending"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {!event.reviewedAt ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 px-3 text-sm"
                      onClick={() => {
                        setSelected(event);
                        setNote("");
                      }}
                    >
                      Review
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">{event.reviewNote ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{event.vendorName ?? event.vendorId}</p>
                <p className="text-xs text-muted">{event.vendorSlug}</p>
              </div>
              <Badge variant={event.reviewedAt ? "success" : "muted"}>
                {event.reviewedAt ? "Reviewed" : "Pending"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted">
              {new Date(event.at).toLocaleString()}
            </p>
            {!event.reviewedAt ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 min-h-11 w-full"
                onClick={() => {
                  setSelected(event);
                  setNote("");
                }}
              >
                Mark reviewed
              </Button>
            ) : null}
          </Card>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Review recovery event"
      >
        <p className="text-sm text-muted">
          Vendor recovered access via phone. Add an optional note for the audit trail.
        </p>
        <Input
          className="mt-4"
          placeholder="Review note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="mt-6 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setSelected(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className="min-h-11 flex-1"
            disabled={pending}
            onClick={handleReview}
          >
            Mark reviewed
          </Button>
        </div>
      </Modal>
    </div>
  );
}
