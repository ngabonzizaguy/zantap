"use client";

import { useState } from "react";
import { getStorefrontUrl } from "@/lib/base-url";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const OWNER_SUPPORT_PHONE = "250784928786";

interface HelpSection {
  id: string;
  title: string;
  body: string[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: "orders-queue",
    title: "Orders queue",
    body: [
      "NEW — a customer has paid; the ticket just arrived.",
      "ACCEPTED — you saw it and are about to start.",
      "PREPARING — food is actively being made.",
      "READY — packed and waiting for pickup or dispatch.",
      "Tap a ticket to expand it, then use the stage chips to move it along.",
    ],
  },
  {
    id: "dispatch-delivery",
    title: "Dispatch & delivery",
    body: [
      "When an order is READY, tap Dispatch to share a delivery slip with your driver.",
      "The slip opens in WhatsApp with order details and a link the driver can follow.",
      "You can also notify yourself on WhatsApp from a paid ticket before dispatch.",
      "After sharing, the order moves to OUT FOR DELIVERY, then Mark completed when done.",
    ],
  },
  {
    id: "kitchen-toggle",
    title: "Opening & closing the kitchen",
    body: [
      "Use the OPEN / CLOSED pill in the header to control whether you accept new orders.",
      "When CLOSED, customers still browse your menu but cannot place new orders.",
      "The Live / Off label next to your name reflects the same status.",
    ],
  },
  {
    id: "menu-management",
    title: "Menu management",
    body: [
      "Open the Menu tab to add dishes, set prices, and mark items available or sold out.",
      "Upload photos so customers see what they are ordering.",
      "Categories can be presets or your own labels — they appear as filters on your storefront.",
    ],
  },
  {
    id: "payments-momo",
    title: "Payments & MoMo",
    body: [
      "Customers pay with MTN MoMo at checkout. You only see PAID orders in the queue.",
      "In the simulator, enter PIN 12345 to complete a test payment.",
      "Today's gross in the header is real paid revenue for today (Africa/Kigali day).",
      "Payouts land on the MoMo number you set during signup.",
    ],
  },
  {
    id: "history-receipts",
    title: "History & receipts",
    body: [
      "The History tab lists past orders with date and status filters.",
      "Export a CSV for your records, or open a receipt for any completed order.",
      "Receipts use the same dark theme as the kitchen dashboard.",
    ],
  },
];

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  vendorSlug: string;
}

export function HelpModal({ open, onClose, vendorSlug }: HelpModalProps) {
  const [expandedId, setExpandedId] = useState<string>(HELP_SECTIONS[0]!.id);
  const [question, setQuestion] = useState("");

  const handleAsk = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const storefrontUrl = getStorefrontUrl(vendorSlug);
    const text = [
      trimmed,
      "",
      `Storefront: ${storefrontUrl}`,
      `Slug: ${vendorSlug}`,
    ].join("\n");

    window.open(buildWhatsAppUrl(text, OWNER_SUPPORT_PHONE), "_blank", "noopener");
  };

  return (
    <Modal open={open} onClose={onClose} title="Kitchen help" className="max-w-lg">
      <div className="flex flex-col gap-4">
        <p className="font-body text-body-sm text-muted">
          Quick guides for the most important parts of your dashboard.
        </p>

        <div className="flex flex-col gap-2">
          {HELP_SECTIONS.map((section) => {
            const expanded = expandedId === section.id;
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-brand-lg border border-hairline bg-surface-card"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((prev) => (prev === section.id ? "" : section.id))
                  }
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={expanded}
                >
                  <span className="font-body text-body-md font-medium text-ink">
                    {section.title}
                  </span>
                  <span
                    className={cn(
                      "text-muted transition-transform",
                      expanded && "rotate-180"
                    )}
                    aria-hidden
                  >
                    ▾
                  </span>
                </button>
                {expanded ? (
                  <div className="border-t border-hairline px-4 py-3">
                    <ul className="flex list-disc flex-col gap-2 pl-4">
                      {section.body.map((line) => (
                        <li key={line} className="font-body text-body-sm text-muted">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-brand-lg border border-hairline bg-surface-card p-4">
          <label
            htmlFor="help-question"
            className="font-body text-body-sm font-medium text-ink"
          >
            Ask a question
          </label>
          <textarea
            id="help-question"
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What do you need help with?"
            className="w-full resize-none rounded-brand-md border border-hairline-strong bg-canvas px-3 py-2 font-body text-body-sm text-ink placeholder:text-muted-soft focus:border-ink focus:outline-none"
          />
          <Button
            type="button"
            size="kds"
            className="w-full"
            disabled={!question.trim()}
            onClick={handleAsk}
          >
            Send on WhatsApp
          </Button>
          <p className="font-body text-caption text-muted">
            Opens WhatsApp to the ZanTap team with your message and storefront link.
          </p>
        </div>
      </div>
    </Modal>
  );
}
