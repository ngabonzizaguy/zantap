"use client";

import { useState, useTransition } from "react";

import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { LeadRoutingRecipient } from "@/lib/leads/types";
import {
  createLeadRoutingRecipientAction,
  patchLeadRoutingRecipientAction,
  removeLeadRoutingRecipientAction,
} from "@/lib/ops-actions/lead-actions";

interface LeadRoutingSettingsFormProps {
  recipients: LeadRoutingRecipient[];
}

interface RecipientDraft {
  name: string;
  phone: string;
}

function draftsFromRecipients(
  recipients: LeadRoutingRecipient[]
): Record<string, RecipientDraft> {
  return Object.fromEntries(
    recipients.map((recipient) => [
      recipient.id,
      { name: recipient.name, phone: recipient.phone },
    ])
  );
}

export function LeadRoutingSettingsForm({
  recipients: initialRecipients,
}: LeadRoutingSettingsFormProps) {
  const [recipients, setRecipients] = useState(initialRecipients);
  const [drafts, setDrafts] = useState(() =>
    draftsFromRecipients(initialRecipients)
  );
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function beginMutation(task: () => Promise<void>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await task();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not update lead routing"
        );
      }
    });
  }

  function updateDraft(
    recipientId: string,
    patch: Partial<RecipientDraft>
  ) {
    setDrafts((current) => ({
      ...current,
      [recipientId]: { ...current[recipientId], ...patch },
    }));
  }

  function replaceRecipient(updated: LeadRoutingRecipient) {
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === updated.id ? updated : recipient
      )
    );
    setDrafts((current) => ({
      ...current,
      [updated.id]: { name: updated.name, phone: updated.phone },
    }));
  }

  function save(recipient: LeadRoutingRecipient) {
    const draft = drafts[recipient.id];
    if (!draft) return;
    beginMutation(async () => {
      const updated = await patchLeadRoutingRecipientAction(recipient.id, draft);
      replaceRecipient(updated);
      setNotice(`${updated.name} saved.`);
    });
  }

  function toggle(recipient: LeadRoutingRecipient) {
    beginMutation(async () => {
      const updated = await patchLeadRoutingRecipientAction(recipient.id, {
        enabled: !recipient.enabled,
      });
      replaceRecipient(updated);
      setNotice(
        `${updated.name} ${updated.enabled ? "enabled" : "disabled"}.`
      );
    });
  }

  function remove(recipient: LeadRoutingRecipient) {
    if (!window.confirm(`Remove ${recipient.name} from lead routing?`)) return;
    beginMutation(async () => {
      await removeLeadRoutingRecipientAction(recipient.id);
      setRecipients((current) =>
        current.filter((row) => row.id !== recipient.id)
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[recipient.id];
        return next;
      });
      setNotice(`${recipient.name} removed.`);
    });
  }

  function addRecipient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    beginMutation(async () => {
      const created = await createLeadRoutingRecipientAction({
        name: newName,
        phone: newPhone,
        enabled: newEnabled,
      });
      setRecipients((current) => [...current, created]);
      setDrafts((current) => ({
        ...current,
        [created.id]: { name: created.name, phone: created.phone },
      }));
      setNewName("");
      setNewPhone("");
      setNewEnabled(true);
      setNotice(`${created.name} added.`);
    });
  }

  const enabledCount = recipients.filter((recipient) => recipient.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
          Lead routing
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
          ZanTap saves every Lead first, then assigns it to one enabled recipient
          in round-robin order. The partner sees one WhatsApp action.
        </p>
      </div>

      <Card className="max-w-3xl">
        <div className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-body text-body-strong text-ink">
              WhatsApp recipients
            </h2>
            <p className="mt-1 text-sm text-muted">
              {enabledCount} of {recipients.length} enabled for new Leads
            </p>
          </div>
          <Badge variant={enabledCount > 0 ? "success" : "muted"}>
            {enabledCount > 0 ? "Routing active" : "Routing paused"}
          </Badge>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-brand-md bg-error/10 px-4 py-3 text-sm text-error"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            className="mt-5 rounded-brand-md bg-success/10 px-4 py-3 text-sm text-success"
          >
            {notice}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          {recipients.length === 0 ? (
            <div className="rounded-brand-xl border border-dashed border-hairline-strong bg-canvas-soft px-5 py-8 text-center">
              <p className="font-medium text-ink">No routing recipients</p>
              <p className="mt-1 text-sm text-muted">
                Leads will still be saved in Ops without a WhatsApp handoff.
              </p>
            </div>
          ) : null}

          {recipients.map((recipient) => {
            const draft = drafts[recipient.id] ?? {
              name: recipient.name,
              phone: recipient.phone,
            };
            return (
              <section
                key={recipient.id}
                className="rounded-brand-xl border border-hairline bg-canvas-soft p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-medium text-ink">
                      {recipient.name}
                    </p>
                    <Badge variant={recipient.enabled ? "success" : "muted"}>
                      {recipient.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="min-h-11 flex-none"
                    disabled={pending}
                    onClick={() => toggle(recipient)}
                  >
                    {recipient.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Recipient name"
                    value={draft.name}
                    onChange={(event) =>
                      updateDraft(recipient.id, { name: event.target.value })
                    }
                  />
                  <Input
                    label="WhatsApp number"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={draft.phone}
                    onChange={(event) =>
                      updateDraft(recipient.id, { phone: event.target.value })
                    }
                  />
                </div>

                <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="min-h-11 text-error"
                    disabled={pending}
                    onClick={() => remove(recipient)}
                  >
                    Remove
                  </Button>
                  <Button
                    className="min-h-11"
                    disabled={pending || !draft.name.trim() || !draft.phone.trim()}
                    onClick={() => save(recipient)}
                  >
                    Save changes
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      </Card>

      <Card className="max-w-3xl">
        <div>
          <h2 className="font-body text-body-strong text-ink">Add recipient</h2>
          <p className="mt-1 text-sm text-muted">
            Enabled recipients join the next round-robin assignment.
          </p>
        </div>
        <form onSubmit={addRecipient} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Recipient name"
              placeholder="e.g. Kigali operator"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <Input
              label="WhatsApp number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+250 7XX XXX XXX"
              value={newPhone}
              onChange={(event) => setNewPhone(event.target.value)}
            />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
            <input
              type="checkbox"
              checked={newEnabled}
              onChange={(event) => setNewEnabled(event.target.checked)}
              className="h-5 w-5 accent-ink"
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Enable for new Leads
              </span>
              <span className="block text-xs text-muted">
                Leave off when this recipient is temporarily unavailable.
              </span>
            </span>
          </label>
          <div className="flex justify-end">
            <Button
              type="submit"
              className="min-h-11 w-full sm:w-auto"
              disabled={pending || !newName.trim() || !newPhone.trim()}
            >
              {pending ? "Saving…" : "Add recipient"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
