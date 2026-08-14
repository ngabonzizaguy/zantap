"use client";

import { useState, useTransition } from "react";

import { Icon } from "@/components/ui/Icon";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import { formatRelativeTime } from "@/lib/format";
import {
  PROSPECT_CHANNEL_LABELS,
  PROSPECT_STATUS_LABELS,
  nextProspectStatuses,
} from "@/lib/prospects/status";
import type {
  CreateProspectInput,
  Prospect,
  ProspectChannel,
  ProspectStatus,
} from "@/lib/prospects/types";
import {
  addProspectInteractionAction,
  bulkCreateProspectsAction,
  convertProspectAction,
  createProspectAction,
  patchProspectAction,
} from "@/lib/ops-actions/prospect-actions";
import type { VendorListEntry } from "@/lib/types";

const FILTER_OPTIONS: { value: ProspectStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  ...Object.entries(PROSPECT_STATUS_LABELS).map(([value, label]) => ({
    value: value as ProspectStatus,
    label: label as string,
  })),
];

const CHANNEL_OPTIONS: { value: ProspectChannel; label: string }[] = (
  Object.entries(PROSPECT_CHANNEL_LABELS) as [ProspectChannel, string][]
).map(([value, label]) => ({ value, label }));

function statusBadgeVariant(status: ProspectStatus) {
  if (status === "CONVERTED") return "success" as const;
  if (status === "DECLINED" || status === "UNREACHABLE") return "muted" as const;
  return "default" as const;
}

function isOverdue(date?: Date | string | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

function isDueToday(date?: Date | string | null): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

interface ProspectInboxProps {
  prospects: Prospect[];
  vendors: VendorListEntry[];
}

export function ProspectInbox({
  prospects: initialProspects,
  vendors,
}: ProspectInboxProps) {
  const [prospects, setProspects] = useState(initialProspects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = prospects
    .filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [p.businessName, p.contactName, p.phone, p.area, p.source].some(
        (value) => value?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aOverdue = isOverdue(a.nextFollowUpAt) ? -2 : isDueToday(a.nextFollowUpAt) ? -1 : 0;
      const bOverdue = isOverdue(b.nextFollowUpAt) ? -2 : isDueToday(b.nextFollowUpAt) ? -1 : 0;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  function updateStatus(prospectId: string, status: ProspectStatus) {
    setError(null);
    startTransition(async () => {
      try {
        const updated = await patchProspectAction(prospectId, { status });
        setProspects((c) => c.map((p) => (p.id === prospectId ? updated : p)));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update prospect");
      }
    });
  }

  function statusControl(prospect: Prospect) {
    const next = nextProspectStatuses(prospect.status);
    if (next.length === 0) {
      return (
        <Badge variant={statusBadgeVariant(prospect.status)}>
          {PROSPECT_STATUS_LABELS[prospect.status]}
        </Badge>
      );
    }
    return (
      <Select<ProspectStatus>
        value={prospect.status}
        onChange={(status) => updateStatus(prospect.id, status)}
        options={[prospect.status, ...next].map((s) => ({
          value: s,
          label: PROSPECT_STATUS_LABELS[s],
        }))}
        disabled={pending}
        ariaLabel={`Status for ${prospect.businessName}`}
        triggerClassName="min-w-36"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
            Prospects
          </h1>
          <p className="mt-1 text-sm text-muted">
            {prospects.length} outbound prospect{prospects.length === 1 ? "" : "s"} tracked
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            className="min-h-11"
            onClick={() => { setShowAdd(true); setShowBulk(false); }}
          >
            <Icon name="plus" size={16} /> Add
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => { setShowBulk(true); setShowAdd(false); }}
          >
            Bulk paste
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
        <Input
          aria-label="Search prospects"
          placeholder="Search business, phone, area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select<ProspectStatus | "ALL">
          value={statusFilter}
          onChange={setStatusFilter}
          options={FILTER_OPTIONS}
          ariaLabel="Filter prospects by status"
        />
      </div>

      {showAdd ? (
        <QuickAddForm
          pending={pending}
          onCancel={() => setShowAdd(false)}
          onSubmit={(input) => {
            setError(null);
            startTransition(async () => {
              try {
                const created = await createProspectAction(input);
                setProspects((c) => [created, ...c]);
                setShowAdd(false);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not add prospect");
              }
            });
          }}
        />
      ) : null}

      {showBulk ? (
        <BulkPasteForm
          pending={pending}
          onCancel={() => setShowBulk(false)}
          onSubmit={(rows) => {
            setError(null);
            startTransition(async () => {
              try {
                const created = await bulkCreateProspectsAction(rows);
                setProspects((c) => [...created, ...c]);
                setShowBulk(false);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Bulk create failed");
              }
            });
          }}
        />
      ) : null}

      {error ? (
        <p role="alert" className="rounded-brand-md bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-ink">No matching prospects</p>
          <p className="mt-1 text-sm text-muted">
            Add outbound prospects using the Add button above.
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-surface-card lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hairline bg-canvas-soft text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Follow-up</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prospect) => {
                  const overdue = isOverdue(prospect.nextFollowUpAt);
                  const dueToday = isDueToday(prospect.nextFollowUpAt);
                  const expanded = expandedId === prospect.id;
                  return (
                    <ProspectTableRow
                      key={prospect.id}
                      prospect={prospect}
                      overdue={overdue}
                      dueToday={dueToday}
                      expanded={expanded}
                      statusControl={statusControl(prospect)}
                      vendors={vendors}
                      pending={pending}
                      onExpand={() => setExpandedId(expanded ? null : prospect.id)}
                      onInteraction={(input) => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await addProspectInteractionAction(prospect.id, input);
                            const updated = await patchProspectAction(prospect.id, {});
                            setProspects((c) => c.map((p) => (p.id === prospect.id ? updated : p)));
                          } catch (caught) {
                            setError(caught instanceof Error ? caught.message : "Failed");
                          }
                        });
                      }}
                      onConvert={(vendorId, leadId) => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            const updated = await convertProspectAction(prospect.id, vendorId, leadId);
                            setProspects((c) => c.map((p) => (p.id === prospect.id ? updated : p)));
                          } catch (caught) {
                            setError(caught instanceof Error ? caught.message : "Failed");
                          }
                        });
                      }}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {filtered.map((prospect) => {
              const overdue = isOverdue(prospect.nextFollowUpAt);
              const dueToday = isDueToday(prospect.nextFollowUpAt);
              const expanded = expandedId === prospect.id;
              return (
                <ProspectMobileCard
                  key={prospect.id}
                  prospect={prospect}
                  overdue={overdue}
                  dueToday={dueToday}
                  expanded={expanded}
                  statusControl={statusControl(prospect)}
                  vendors={vendors}
                  pending={pending}
                  onExpand={() => setExpandedId(expanded ? null : prospect.id)}
                  onInteraction={(input) => {
                    setError(null);
                    startTransition(async () => {
                      try {
                        await addProspectInteractionAction(prospect.id, input);
                        const updated = await patchProspectAction(prospect.id, {});
                        setProspects((c) => c.map((p) => (p.id === prospect.id ? updated : p)));
                      } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Failed");
                      }
                    });
                  }}
                  onConvert={(vendorId, leadId) => {
                    setError(null);
                    startTransition(async () => {
                      try {
                        const updated = await convertProspectAction(prospect.id, vendorId, leadId);
                        setProspects((c) => c.map((p) => (p.id === prospect.id ? updated : p)));
                      } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Failed");
                      }
                    });
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// --- Sub-components ---

function QuickAddForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateProspectInput) => void;
}) {
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [source, setSource] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  return (
    <Card className="space-y-4 p-4">
      <p className="font-medium text-ink">Quick add prospect</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Business name *"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Café Kigali"
        />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0788123456"
        />
        <Input
          label="Area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Kimihurura"
        />
        <Input
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Google Maps"
        />
        <Input
          label="Maps URL"
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
        />
        <Input
          label="Instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@cafekigali"
        />
        <Input
          label="Next follow-up"
          type="date"
          value={nextFollowUp}
          onChange={(e) => setNextFollowUp(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          disabled={pending || !businessName.trim()}
          onClick={() =>
            onSubmit({
              businessName: businessName.trim(),
              phone: phone.trim() || undefined,
              area: area.trim() || undefined,
              source: source.trim() || undefined,
              mapsUrl: mapsUrl.trim() || undefined,
              instagramHandle: instagram.trim() || undefined,
              nextFollowUpAt: nextFollowUp ? new Date(nextFollowUp) : undefined,
            })
          }
        >
          Add prospect
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function BulkPasteForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (rows: CreateProspectInput[]) => void;
}) {
  const [text, setText] = useState("");

  function parse(): CreateProspectInput[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        return {
          businessName: parts[0],
          phone: parts[1] || undefined,
          area: parts[2] || undefined,
          source: parts[3] || undefined,
        };
      });
  }

  const rows = parse();

  return (
    <Card className="space-y-4 p-4">
      <p className="font-medium text-ink">Bulk paste prospects</p>
      <p className="text-xs text-muted">
        One business per line. Format: <code>name | phone | area | source</code> (pipe-separated, optional fields).
      </p>
      <textarea
        className="w-full rounded-xl border border-hairline bg-canvas-soft p-3 text-sm text-body placeholder:text-muted focus:border-ink focus:outline-none"
        rows={6}
        placeholder={"Café Kigali | 0788123456 | Kimihurura | Maps\nResto Nyamirambo"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="text-xs text-muted">{rows.length} prospect{rows.length === 1 ? "" : "s"} detected</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="primary"
          className="min-h-11"
          disabled={pending || rows.length === 0}
          onClick={() => onSubmit(rows)}
        >
          Add {rows.length} prospect{rows.length === 1 ? "" : "s"}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function InteractionForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (input: { channel: ProspectChannel; note?: string }) => void;
}) {
  const [channel, setChannel] = useState<ProspectChannel>("WHATSAPP");
  const [note, setNote] = useState("");

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-hairline-soft bg-canvas-soft p-3">
      <Select<ProspectChannel>
        value={channel}
        onChange={setChannel}
        options={CHANNEL_OPTIONS}
        ariaLabel="Channel"
        triggerClassName="min-w-32"
      />
      <Input
        aria-label="Note"
        placeholder="Quick note…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="flex-1"
      />
      <Button
        type="button"
        variant="primary"
        className="min-h-11"
        disabled={pending}
        onClick={() => {
          onSubmit({ channel, note: note.trim() || undefined });
          setNote("");
        }}
      >
        Log touch
      </Button>
    </div>
  );
}

function ConvertForm({
  vendors,
  pending,
  onConvert,
}: {
  vendors: VendorListEntry[];
  pending: boolean;
  onConvert: (vendorId: string, leadId?: string) => void;
}) {
  const [vendorId, setVendorId] = useState("");

  if (vendors.length === 0) {
    return <p className="mt-2 text-xs text-muted">No vendors available for conversion.</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-hairline-soft bg-canvas-soft p-3">
      <Select<string>
        value={vendorId}
        onChange={setVendorId}
        options={[
          { value: "", label: "Select vendor…" },
          ...vendors.map((v) => ({ value: v.id, label: `${v.name} (/${v.slug})` })),
        ]}
        ariaLabel="Vendor"
        triggerClassName="min-w-48"
      />
      <Button
        type="button"
        variant="primary"
        className="min-h-11"
        disabled={pending || !vendorId}
        onClick={() => onConvert(vendorId)}
      >
        Convert
      </Button>
    </div>
  );
}

function FollowUpBadge({ date }: { date?: Date | string | null }) {
  if (!date) return null;
  const overdue = isOverdue(date);
  const today = isDueToday(date);
  if (!overdue && !today) {
    return (
      <span className="text-xs text-muted">
        {new Date(date).toLocaleDateString()}
      </span>
    );
  }
  return (
    <span className={`text-xs font-medium ${overdue ? "text-error" : "text-amber-600"}`}>
      {overdue ? "Overdue" : "Today"}
    </span>
  );
}

function ProspectTableRow({
  prospect,
  overdue,
  dueToday,
  expanded,
  statusControl,
  vendors,
  pending,
  onExpand,
  onInteraction,
  onConvert,
}: {
  prospect: Prospect;
  overdue: boolean;
  dueToday: boolean;
  expanded: boolean;
  statusControl: React.ReactNode;
  vendors: VendorListEntry[];
  pending: boolean;
  onExpand: () => void;
  onInteraction: (input: { channel: ProspectChannel; note?: string }) => void;
  onConvert: (vendorId: string, leadId?: string) => void;
}) {
  const highlightClass = overdue
    ? "bg-error/5"
    : dueToday
      ? "bg-amber-50"
      : "";

  return (
    <>
      <tr
        className={`cursor-pointer border-b border-hairline-soft last:border-0 transition-colors hover:bg-canvas-soft ${highlightClass}`}
        onClick={onExpand}
      >
        <td className="px-4 py-3">
          <p className="font-medium text-ink">{prospect.businessName}</p>
          {prospect.phone ? <p className="text-xs text-muted">{prospect.phone}</p> : null}
        </td>
        <td className="px-4 py-3 text-body">{prospect.area ?? "—"}</td>
        <td className="px-4 py-3 text-body">{prospect.source ?? "—"}</td>
        <td className="px-4 py-3">
          <FollowUpBadge date={prospect.nextFollowUpAt} />
        </td>
        <td className="px-4 py-3">{statusControl}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            className="text-xs text-muted hover:text-ink"
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
          >
            {expanded ? "Close" : "Expand"}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-hairline-soft last:border-0">
          <td colSpan={6} className="px-4 py-4">
            <ExpandedProspect
              prospect={prospect}
              vendors={vendors}
              pending={pending}
              onInteraction={onInteraction}
              onConvert={onConvert}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ProspectMobileCard({
  prospect,
  overdue,
  dueToday,
  expanded,
  statusControl,
  vendors,
  pending,
  onExpand,
  onInteraction,
  onConvert,
}: {
  prospect: Prospect;
  overdue: boolean;
  dueToday: boolean;
  expanded: boolean;
  statusControl: React.ReactNode;
  vendors: VendorListEntry[];
  pending: boolean;
  onExpand: () => void;
  onInteraction: (input: { channel: ProspectChannel; note?: string }) => void;
  onConvert: (vendorId: string, leadId?: string) => void;
}) {
  const borderClass = overdue
    ? "border-error/40"
    : dueToday
      ? "border-amber-300"
      : "border-hairline";

  return (
    <Card className={`p-4 border ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{prospect.businessName}</p>
          {prospect.area ? <p className="text-xs text-muted">{prospect.area}</p> : null}
        </div>
        <Badge variant={statusBadgeVariant(prospect.status)}>
          {PROSPECT_STATUS_LABELS[prospect.status]}
        </Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {prospect.phone ? (
          <div>
            <dt className="text-xs text-muted">Phone</dt>
            <dd className="mt-0.5 text-body">{prospect.phone}</dd>
          </div>
        ) : null}
        {prospect.source ? (
          <div>
            <dt className="text-xs text-muted">Source</dt>
            <dd className="mt-0.5 text-body">{prospect.source}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted">Follow-up</dt>
          <dd className="mt-0.5"><FollowUpBadge date={prospect.nextFollowUpAt} /></dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {statusControl}
        <button
          type="button"
          className="ml-auto text-xs text-muted hover:text-ink"
          onClick={onExpand}
        >
          {expanded ? "Close" : "Expand"}
        </button>
      </div>
      {expanded ? (
        <div className="mt-4 border-t border-hairline-soft pt-4">
          <ExpandedProspect
            prospect={prospect}
            vendors={vendors}
            pending={pending}
            onInteraction={onInteraction}
            onConvert={onConvert}
          />
        </div>
      ) : null}
    </Card>
  );
}

function ExpandedProspect({
  prospect,
  vendors,
  pending,
  onInteraction,
  onConvert,
}: {
  prospect: Prospect;
  vendors: VendorListEntry[];
  pending: boolean;
  onInteraction: (input: { channel: ProspectChannel; note?: string }) => void;
  onConvert: (vendorId: string, leadId?: string) => void;
}) {
  const showConvert = prospect.status === "IN_TALKS" || prospect.status === "CONTACTED";
  return (
    <div className="space-y-3">
      {prospect.mapsUrl ? (
        <p className="text-xs text-muted">
          Maps:{" "}
          <a href={prospect.mapsUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
            {prospect.mapsUrl}
          </a>
        </p>
      ) : null}
      {prospect.instagramHandle ? (
        <p className="text-xs text-muted">IG: {prospect.instagramHandle}</p>
      ) : null}
      {prospect.notes ? (
        <p className="text-xs text-body">{prospect.notes}</p>
      ) : null}

      {prospect.interactions && prospect.interactions.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-medium text-muted">Interaction log</p>
          <ul className="space-y-1">
            {prospect.interactions.map((ix) => (
              <li key={ix.id} className="text-xs text-body">
                <span className="text-muted" suppressHydrationWarning>
                  {formatRelativeTime(new Date(ix.at))}
                </span>
                {" · "}
                <span className="font-medium">{PROSPECT_CHANNEL_LABELS[ix.channel] ?? ix.channel}</span>
                {ix.note ? ` — ${ix.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted">No interactions logged yet.</p>
      )}

      <InteractionForm pending={pending} onSubmit={onInteraction} />
      {showConvert ? (
        <ConvertForm vendors={vendors} pending={pending} onConvert={onConvert} />
      ) : null}
    </div>
  );
}
