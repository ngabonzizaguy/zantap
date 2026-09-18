"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/ui/Icon";
import { Badge, Card, Input, Select } from "@/components/ui/primitives";
import { formatRelativeTime } from "@/lib/format";
import { formatStoredLeadPhone } from "@/lib/leads/phone";
import { nextLeadStatuses } from "@/lib/leads/status";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import { patchLeadStatusAction } from "@/lib/ops-actions/lead-actions";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ONBOARDED: "Onboarded",
  CLOSED: "Closed",
};

const FILTER_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
] as { value: LeadStatus | "ALL"; label: string }[];

function statusBadge(status: LeadStatus) {
  if (status === "ONBOARDED") return "success" as const;
  if (status === "CLOSED") return "muted" as const;
  return "default" as const;
}

function whatsappFollowUpUrl(lead: Lead): string {
  return buildWhatsAppUrl(
    `Hello ${lead.contactName}, this is ZanTap following up on your setup request for ${lead.businessName}.`,
    lead.phone
  );
}

interface LeadInboxProps {
  leads: Lead[];
}

export function LeadInbox({ leads: initialLeads }: LeadInboxProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = leads.filter((lead) => {
    if (statusFilter !== "ALL" && lead.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      lead.businessName,
      lead.businessType,
      lead.contactName,
      lead.phone,
      lead.area,
    ].some((value) => value.toLowerCase().includes(query));
  });

  function updateStatus(leadId: string, status: LeadStatus) {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await patchLeadStatusAction(leadId, status);
        setLeads((current) =>
          current.map((lead) => (lead.id === leadId ? updated : lead))
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not update this Lead"
        );
      }
    });
  }

  function statusControl(lead: Lead) {
    const next = nextLeadStatuses(lead.status);
    if (next.length === 0) {
      return (
        <Badge variant={statusBadge(lead.status)}>
          {STATUS_LABELS[lead.status]}
        </Badge>
      );
    }
    return (
      <Select<LeadStatus>
        value={lead.status}
        onChange={(status) => updateStatus(lead.id, status)}
        options={[lead.status, ...next].map((status) => ({
          value: status,
          label: STATUS_LABELS[status],
        }))}
        disabled={pending}
        ariaLabel={`Status for ${lead.businessName}`}
        triggerClassName="min-w-36"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
            Partner leads
          </h1>
          <p className="mt-1 text-sm text-muted">
            {leads.length} setup request{leads.length === 1 ? "" : "s"} captured
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
          <Input
            aria-label="Search partner leads"
            placeholder="Search business, contact, phone…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select<LeadStatus | "ALL">
            value={statusFilter}
            onChange={setStatusFilter}
            options={FILTER_OPTIONS}
            ariaLabel="Filter leads by status"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-brand-md bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-ink">No matching Leads</p>
          <p className="mt-1 text-sm text-muted">
            New partner requests will appear here after the public form is submitted.
          </p>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-surface-card lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hairline bg-canvas-soft text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Received</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned to</th>
                  <th className="px-4 py-3 font-medium">Follow up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-hairline-soft last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{lead.businessName}</p>
                      <p className="text-xs text-muted">{lead.businessType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-body">{lead.contactName}</p>
                      <p className="text-xs text-muted">
                        {formatStoredLeadPhone(lead.phone)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-body">{lead.area}</td>
                    <td className="px-4 py-3 text-muted">
                      <time
                        dateTime={new Date(lead.createdAt).toISOString()}
                        suppressHydrationWarning
                      >
                        {formatRelativeTime(new Date(lead.createdAt))}
                      </time>
                    </td>
                    <td className="px-4 py-3">{statusControl(lead)}</td>
                    <td className="px-4 py-3">
                      {lead.routingAssignment ? (
                        <>
                          <p className="font-medium text-ink">
                            {lead.routingAssignment.recipientName}
                          </p>
                          <p className="text-xs text-muted">
                            WhatsApp …{lead.routingAssignment.recipientPhone.slice(-4)}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={whatsappFollowUpUrl(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-hairline-strong px-4 font-medium text-ink transition-colors hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        <Icon name="phone" size={17} />
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filtered.map((lead) => (
              <Card key={lead.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{lead.businessName}</p>
                    <p className="text-xs text-muted">{lead.businessType}</p>
                  </div>
                  <Badge variant={statusBadge(lead.status)}>
                    {STATUS_LABELS[lead.status]}
                  </Badge>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted">Contact</dt>
                    <dd className="mt-0.5 text-body">{lead.contactName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Area</dt>
                    <dd className="mt-0.5 text-body">{lead.area}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Phone</dt>
                    <dd className="mt-0.5 text-body">
                      {formatStoredLeadPhone(lead.phone)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Received</dt>
                    <dd className="mt-0.5 text-body">
                      <time
                        dateTime={new Date(lead.createdAt).toISOString()}
                        suppressHydrationWarning
                      >
                        {formatRelativeTime(new Date(lead.createdAt))}
                      </time>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted">Assigned to</dt>
                    <dd className="mt-0.5 text-body">
                      {lead.routingAssignment
                        ? `${lead.routingAssignment.recipientName} · WhatsApp …${lead.routingAssignment.recipientPhone.slice(-4)}`
                        : "Unassigned"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {statusControl(lead)}
                  <a
                    href={whatsappFollowUpUrl(lead)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-hairline-strong px-4 font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <Icon name="phone" size={17} />
                    WhatsApp
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
