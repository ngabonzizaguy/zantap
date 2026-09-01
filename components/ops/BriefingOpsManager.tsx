"use client";

import { useMemo, useState, useTransition } from "react";

import type { BriefingDocument } from "@/lib/briefing/content";
import { briefingDocumentFromJson } from "@/lib/briefing/content";
import type { BriefingInterest } from "@/lib/briefing/interest";
import type { BriefingSecretResult } from "@/lib/briefing/ops-types";
import type { BriefingWorkspace } from "@/lib/briefing/types";
import {
  createBriefingGrantAction,
  publishBriefingDraftAction,
  resetBriefingGrantSecretAction,
  revokeBriefingSessionAction,
  saveBriefingDraftAction,
  updateBriefingGrantAction,
} from "@/lib/ops-actions/briefing-actions";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";

type Tab = "access" | "content" | "activity" | "interests";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "access", label: "Access" },
  { id: "content", label: "Content" },
  { id: "activity", label: "Activity" },
  { id: "interests", label: "Interests" },
];

const dateInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const briefingDate = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Kigali",
});
const briefingDateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Kigali",
});

export function BriefingOpsManager({
  workspace,
  interests,
}: {
  workspace: BriefingWorkspace;
  interests: BriefingInterest[];
}) {
  const [tab, setTab] = useState<Tab>("access");
  const [document, setDocument] = useState<BriefingDocument>(() => briefingDocumentFromJson(workspace.draft));
  const [secretResult, setSecretResult] = useState<BriefingSecretResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [defaultExpiry] = useState(() =>
    dateInput(new Date(Date.now() + 72 * 60 * 60 * 1000)),
  );
  const [pending, startTransition] = useTransition();
  const latestVersion = workspace.publishedVersions[0];
  const grantsById = useMemo(() => new Map(workspace.grants.map((grant) => [grant.id, grant])), [workspace.grants]);

  function run(task: () => Promise<void>, success: string) {
    setNotice(null);
    startTransition(async () => {
      try {
        await task();
        setNotice(success);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "The operation failed");
      }
    });
  }

  function setSection<K extends keyof BriefingDocument>(section: K, patch: Partial<BriefingDocument[K]>) {
    setDocument((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted">Private presentation</p>
          <h1 className="mt-2 font-display text-display-sm font-light tracking-tight text-ink">ZanTap Briefing</h1>
          <p className="mt-1 text-sm text-muted">Publish content, issue recipient access, and follow up from one place.</p>
        </div>
        <a href="/briefing" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-pill border border-hairline-strong px-5 text-sm font-medium text-ink">Open viewer</a>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-hairline pb-3">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`min-h-10 rounded-pill px-4 text-sm ${tab === item.id ? "bg-ink text-white" : "bg-surface-card text-body"}`}>
            {item.label}{item.id === "interests" ? ` · ${interests.length}` : ""}
          </button>
        ))}
      </div>

      {notice ? <p role="status" className="rounded-xl border border-hairline bg-surface-card px-4 py-3 text-sm text-body">{notice}</p> : null}

      {tab === "access" ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="p-5">
            <h2 className="font-display text-display-sm font-light">Create recipient Access</h2>
            <p className="mt-2 text-sm text-muted">A unique four-digit PIN is shown once. Copy the Share kit before closing it.</p>
            <form className="mt-5 space-y-4" onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  const created = await createBriefingGrantAction({
                    recipientLabel: String(data.get("recipientLabel") ?? ""),
                    recipientEmail: String(data.get("recipientEmail") ?? "") || undefined,
                    expiresAt: String(data.get("expiresAt") ?? ""),
                    versionId: String(data.get("versionId") ?? ""),
                  });
                  setSecretResult(created);
                  setNotice("Access created. Copy the one-time secret now.");
                } catch (error) { setNotice(error instanceof Error ? error.message : "Could not create Access"); }
              });
            }}>
              <Input name="recipientLabel" required aria-label="Recipient label" placeholder="Recipient or organization" />
              <Input name="recipientEmail" type="email" aria-label="Recipient email" placeholder="Email (optional)" />
              <Input name="expiresAt" type="datetime-local" required aria-label="Access expiry" defaultValue={defaultExpiry} />
              <label className="block text-xs text-muted">Published version
                <select name="versionId" defaultValue={latestVersion?.id} className="mt-2 min-h-11 w-full rounded-lg border border-hairline-strong bg-white px-3 text-sm text-ink">
                  {workspace.publishedVersions.map((version) => <option key={version.id} value={version.id}>Version {version.number} · {briefingDate.format(new Date(version.publishedAt))}</option>)}
                </select>
              </label>
              <Button disabled={pending || !latestVersion} type="submit" className="w-full">Generate PIN</Button>
            </form>
            {secretResult ? (
              <div className="mt-5 rounded-xl bg-canvas-soft p-4">
                <p className="text-xs uppercase tracking-wider text-muted">One-time PIN</p>
                <code className="mt-2 block break-all text-sm text-ink">{secretResult.secret}</code>
                <textarea readOnly value={secretResult.shareText} className="mt-3 min-h-32 w-full rounded-lg border border-hairline bg-white p-3 text-xs text-body" />
                <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => navigator.clipboard.writeText(secretResult.shareText)}>Copy Share kit</Button>
              </div>
            ) : null}
          </Card>

          <div className="space-y-3">
            {workspace.grants.length === 0 ? <Card className="p-8 text-center text-sm text-muted">No recipient Access grants yet.</Card> : workspace.grants.map((grant) => {
              const activeSessions = workspace.sessions.filter((session) => session.grantId === grant.id && !session.revokedAt && new Date(session.expiresAt) > new Date());
              const expired = new Date(grant.expiresAt) <= new Date();
              return (
                <Card key={grant.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-medium text-ink">{grant.recipientLabel}</h3><p className="mt-1 text-xs text-muted">{grant.recipientEmail || "No recipient email"} · Code {grant.shortCode}</p></div>
                    <Badge variant={grant.revokedAt || expired ? "muted" : "success"}>{grant.revokedAt ? "Revoked" : expired ? "Expired" : "Active"}</Badge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><dt className="text-xs text-muted">Version</dt><dd>v{grant.versionNumber}</dd></div><div><dt className="text-xs text-muted">Expires</dt><dd>{briefingDateTime.format(new Date(grant.expiresAt))}</dd></div><div><dt className="text-xs text-muted">Active sessions</dt><dd>{activeSessions.length}</dd></div><div><dt className="text-xs text-muted">Created</dt><dd>{briefingDate.format(new Date(grant.createdAt))}</dd></div></dl>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(async () => { const result = await resetBriefingGrantSecretAction(grant.id); setSecretResult(result); setNotice("PIN reset. Existing sessions were revoked."); })}>Reset PIN</Button>
                    <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => updateBriefingGrantAction({ grantId: grant.id, action: grant.revokedAt ? "restore" : "revoke" }), grant.revokedAt ? "Access restored." : "Access revoked.")}>{grant.revokedAt ? "Restore" : "Revoke"}</Button>
                    <select aria-label={`Version for ${grant.recipientLabel}`} defaultValue={grant.versionId} onChange={(event) => run(() => updateBriefingGrantAction({ grantId: grant.id, action: "version", versionId: event.target.value }), "Pinned version updated.")} className="min-h-10 rounded-pill border border-hairline-strong bg-white px-3 text-sm">
                      {workspace.publishedVersions.map((version) => <option key={version.id} value={version.id}>v{version.number}</option>)}
                    </select>
                  </div>
                  {activeSessions.length ? <div className="mt-4 border-t border-hairline pt-3">{activeSessions.map((session) => <div key={session.id} className="flex items-center justify-between gap-3 py-2 text-xs"><span className="text-muted">{session.userAgent?.slice(0, 55) || "Unknown browser"} · seen {briefingDateTime.format(new Date(session.lastSeenAt))}</span><button type="button" className="font-medium text-ink underline" onClick={() => run(() => revokeBriefingSessionAction(session.id), "Viewing session revoked.")}>Revoke session</button></div>)}</div> : null}
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "content" ? (
        <div className="space-y-5">
          <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-display-sm font-light">Structured draft</h2><p className="text-sm text-muted">Publishing creates an immutable version. Existing grants stay pinned.</p></div><div className="flex gap-2"><Button variant="outline" disabled={pending} onClick={() => run(() => saveBriefingDraftAction(document), "Draft saved.")}>Save draft</Button><Button disabled={pending} onClick={() => run(async () => { const version = await publishBriefingDraftAction(); setNotice(`Version ${version.number} published.`); }, "Published.")}>Publish version</Button></div></div></Card>
          <Card className="p-5">
            <h3 className="font-display text-2xl font-light">Media</h3>
            <p className="mt-2 text-sm text-muted">Use public asset paths. Publishing preserves these exact screens in the new version.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Object.entries(document.media).map(([key, value]) => (
                <label key={key} className={key === "hero" ? "sm:col-span-2" : ""}>
                  <span className="mb-1 block text-xs capitalize text-muted">{key}</span>
                  <Input
                    aria-label={`${key} media path`}
                    value={value}
                    onChange={(event) =>
                      setDocument((current) => ({
                        ...current,
                        media: { ...current.media, [key]: event.target.value },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </Card>
          {(["hero", "opportunity", "product", "journey", "proof", "future", "closing"] as const).map((section) => {
            const value = document[section] as unknown as Record<string, unknown>;
            return <Card key={section} className="p-5"><h3 className="mb-4 font-display text-2xl font-light capitalize">{section}</h3><div className="grid gap-4 sm:grid-cols-2">{Object.entries(value).filter(([, field]) => typeof field === "string").map(([key, field]) => <label key={key} className={key === "body" || key === "summary" || key === "includes" ? "sm:col-span-2" : ""}><span className="mb-1 block text-xs capitalize text-muted">{key}</span><textarea rows={key === "body" || key === "summary" || key === "includes" ? 4 : 2} value={String(field)} onChange={(event) => setSection(section, { [key]: event.target.value } as never)} className="w-full rounded-lg border border-hairline-strong bg-white p-3 text-sm text-ink" /></label>)}</div></Card>;
          })}
          <Card className="p-5"><h3 className="font-display text-2xl font-light">Structured lists</h3><p className="mt-2 text-sm text-muted">Journey steps, evidence cards, documentation panels, and opportunity cards remain code-governed in this release; their current published text is shown in Preview and version snapshots.</p></Card>
        </div>
      ) : null}

      {tab === "activity" ? <div className="space-y-2">{workspace.activities.length === 0 ? <Card className="p-8 text-center text-sm text-muted">No Briefing activity yet.</Card> : workspace.activities.map((activity) => <Card key={activity.id} className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-medium text-ink">{activity.type.replaceAll("_", " ")}</p><p className="text-xs text-muted">{activity.grantId ? grantsById.get(activity.grantId)?.recipientLabel || activity.grantId : "Unattributed"}</p></div><time className="text-xs text-muted">{briefingDateTime.format(new Date(activity.at))}</time></Card>)}</div> : null}

      {tab === "interests" ? <div className="space-y-3">{interests.length === 0 ? <Card className="p-8 text-center text-sm text-muted">No Briefing interests submitted yet.</Card> : interests.map((interest) => <Card key={interest.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-medium text-ink">{interest.name}</h3><p className="text-sm text-muted">{interest.contact} · {interest.interestType}</p></div><Badge variant="success">Recorded in Ops</Badge></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-body">{interest.message}</p><p className="mt-3 text-xs text-muted">{briefingDateTime.format(new Date(interest.createdAt))}</p></Card>)}</div> : null}
    </div>
  );
}
