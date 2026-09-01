"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  answerMenuIntakeQuestionAction,
  createMenuIntakeResumeLinkAction,
  deleteMenuIntakeAction,
  importMenuIntakeAction,
  purgeMenuIntakeAction,
  reviewMenuIntakeAction,
  restoreMenuIntakeAction,
  revokeMenuIntakeAccessAction,
  logMenuIntakeNotificationAction,
} from "@/lib/actions/menu-intake-ops";
import type {
  MenuIntake,
  MenuIntakeDetail,
  MenuIntakeDishDraft,
  MenuIntakeMatchDecision,
  MenuIntakeMatchSuggestion,
} from "@/lib/menu-intake/types";
import type { VendorListEntry } from "@/lib/types";
import { canonicalizePhone } from "@/lib/format";
import { MenuIntakeDishOptions } from "@/components/ops/MenuIntakeDishOptions";
import { canPurgeMenuIntake, menuIntakePurgeAt } from "@/lib/menu-intake/retention";

const field =
  "min-h-10 w-full rounded-xl border border-hairline bg-surface-card px-3 text-sm outline-none focus:border-ink";
const intakeDate = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Africa/Kigali",
});

export function MenuIntakeReview({
  intakes,
  deletedIntakes,
  detail,
  vendors,
  suggestions,
}: {
  intakes: MenuIntake[];
  deletedIntakes: MenuIntake[];
  detail: MenuIntakeDetail | null;
  vendors: VendorListEntry[];
  suggestions: MenuIntakeMatchSuggestion[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const latest = detail?.revisions.at(-1)?.content;
  const [dishes, setDishes] = useState<MenuIntakeDishDraft[]>(
    latest?.dishes ?? [],
  );
  const [destinationMode, setDestinationMode] = useState<"EXISTING" | "CREATE">(
    "EXISTING",
  );
  const [vendorSlug, setVendorSlug] = useState(
    detail?.intake.destinationVendorSlug || "",
  );
  const [decisions, setDecisions] = useState<
    Record<string, MenuIntakeMatchDecision>
  >(
    Object.fromEntries(
      suggestions.map((row) => [row.intakeDishClientId, row.defaultDecision]),
    ),
  );
  const [message, setMessage] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const suggestionByDish = useMemo(
    () => new Map(suggestions.map((row) => [row.intakeDishClientId, row])),
    [suggestions],
  );

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage("");
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "Saved" : result.error || "Something went wrong");
      if (result.ok) router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.18em] text-muted">
            Priority #1
          </p>
          <h1 className="mt-2 font-display text-4xl font-light">
            Menu intake review
          </h1>
          <p className="mt-2 text-sm text-muted">
            Private submissions become live catalog data only after explicit
            review and import.
          </p>
        </div>
        <span className="rounded-full bg-surface-strong px-3 py-1 text-xs">
          {
            intakes.filter(
              (row) => row.status !== "IMPORTED" && row.status !== "CANCELLED",
            ).length
          }{" "}
          open
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-hairline bg-surface-card">
          <div className="border-b border-hairline px-4 py-3 text-xs uppercase tracking-widest text-muted">
            Inbox
          </div>
          {intakes.length ? (
            intakes.map((intake) => (
              <Link
                key={intake.id}
                href={`/ops/menu-intakes?intake=${intake.id}`}
                className={`block border-b border-hairline p-4 transition hover:bg-surface-strong ${detail?.intake.id === intake.id ? "bg-surface-strong" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm">
                    {intake.businessName}
                  </strong>
                  <span className="text-[10px] uppercase text-muted">
                    {intake.locale}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {intake.reference} · {intake.status.replaceAll("_", " ")}
                </p>
              </Link>
            ))
          ) : (
            <p className="p-5 text-sm text-muted">
              No menu intakes yet. Share <strong>/menu-intake</strong> with a
              Vendor.
            </p>
          )}
          <div className="border-b border-t border-hairline px-4 py-3 text-xs uppercase tracking-widest text-muted">
            Deleted · {deletedIntakes.length}
          </div>
          {deletedIntakes.map((intake) => (
            <Link
              key={intake.id}
              href={`/ops/menu-intakes?intake=${intake.id}`}
              className={`block border-b border-hairline p-4 transition hover:bg-surface-strong ${detail?.intake.id === intake.id ? "bg-surface-strong" : ""}`}
            >
              <strong className="block truncate text-sm">{intake.businessName}</strong>
              <p className="mt-1 text-xs text-muted">
                {intake.reference} · recover until{" "}
                {intakeDate.format(menuIntakePurgeAt(new Date(intake.deletedAt!)))}
              </p>
            </Link>
          ))}
        </aside>

        {detail && latest ? (
          <section className="space-y-5">
            <article className="rounded-2xl border border-hairline bg-surface-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted">
                    {detail.intake.reference}
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-light">
                    {detail.intake.businessName}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    {detail.intake.contactName} · {detail.intake.phone} ·{" "}
                    {detail.intake.alreadyOnZantap
                      ? `Existing hint: ${detail.intake.storefrontHint || "none"}`
                      : "Not yet on ZanTap"}
                  </p>
                </div>
                <span className="rounded-full bg-ink px-3 py-1.5 text-xs text-on-primary">
                  {detail.intake.deletedAt
                    ? "DELETED"
                    : detail.intake.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-surface-strong px-3 py-1">
                  {latest.path === "SELF_BUILD" ? "Vendor-built" : "Assisted"}
                </span>
                <span className="rounded-full bg-surface-strong px-3 py-1">
                  Revision {detail.intake.currentRevision}
                </span>
                <span className="rounded-full bg-surface-strong px-3 py-1">
                  {detail.attachments.length} private files
                </span>
                <span className="rounded-full bg-surface-strong px-3 py-1">
                  {
                    detail.questions.filter(
                      (row) => row.status === "UNANSWERED",
                    ).length
                  }{" "}
                  unanswered
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.intake.deletedAt ? (
                  <>
                    <button
                      className="rounded-full border border-hairline px-3 py-2 text-xs"
                      onClick={() =>
                        run(async () => {
                          const result = await restoreMenuIntakeAction(detail.intake.id);
                          if (result.ok) router.push("/ops/menu-intakes");
                          return result;
                        })
                      }
                    >
                      Restore submission
                    </button>
                    {canPurgeMenuIntake(new Date(detail.intake.deletedAt), new Date()) ? (
                      <button
                        className="rounded-full border border-red-300 px-3 py-2 text-xs text-red-700"
                        onClick={() => {
                          if (!window.confirm("Permanently delete this submission and its private files? This cannot be undone.")) return;
                          run(async () => {
                            const result = await purgeMenuIntakeAction(detail.intake.id);
                            if (result.ok) router.push("/ops/menu-intakes");
                            return result;
                          });
                        }}
                      >
                        Delete permanently
                      </button>
                    ) : (
                      <span className="rounded-full bg-surface-strong px-3 py-2 text-xs text-muted">
                        Permanent deletion available {intakeDate.format(menuIntakePurgeAt(new Date(detail.intake.deletedAt)))}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                <button
                  className="rounded-full border border-hairline px-3 py-2 text-xs"
                  onClick={() =>
                    run(async () => {
                      const result = await createMenuIntakeResumeLinkAction(
                        detail.intake.id,
                      );
                      if (result.ok) setResumeUrl(result.url);
                      return result;
                    })
                  }
                >
                  Create one-time resume link
                </button>
                <button
                  className="rounded-full border border-hairline px-3 py-2 text-xs"
                  onClick={() =>
                    run(() => revokeMenuIntakeAccessAction(detail.intake.id))
                  }
                >
                  Revoke resume access
                </button>
                {(
                  [
                    "IN_REVIEW",
                    "NEEDS_INFORMATION",
                    "READY_TO_IMPORT",
                    "CANCELLED",
                  ] as const
                ).map((nextStatus) => (
                  <button
                    key={nextStatus}
                    className="rounded-full border border-hairline px-3 py-2 text-xs"
                    onClick={() => {
                      const data = new FormData();
                      data.set("intakeId", detail.intake.id);
                      data.set("status", nextStatus);
                      run(() => reviewMenuIntakeAction(data));
                    }}
                  >
                    {nextStatus === "IN_REVIEW"
                      ? "Reviewing"
                      : nextStatus === "NEEDS_INFORMATION"
                        ? "Need info"
                        : nextStatus === "READY_TO_IMPORT"
                          ? "Ready"
                          : "Close"}
                  </button>
                ))}
                {resumeUrl ? (
                  <a
                    className="rounded-full bg-[#25D366] px-3 py-2 text-xs text-black"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/${canonicalizePhone(detail.intake.phone)}?text=${encodeURIComponent(`Continue your private ZanTap menu here (one use, 24 hours): ${resumeUrl}`)}`}
                  >
                    Send verified link on WhatsApp ↗
                  </a>
                ) : null}
                {detail.intake.status !== "IMPORTED" ? (
                  <button
                    className="rounded-full border border-red-300 px-3 py-2 text-xs text-red-700"
                    onClick={() => {
                      if (!window.confirm("Move this submission to Deleted? It can be restored for 30 days.")) return;
                      run(async () => {
                        const result = await deleteMenuIntakeAction(detail.intake.id);
                        if (result.ok) router.push("/ops/menu-intakes");
                        return result;
                      });
                    }}
                  >
                    Delete submission
                  </button>
                ) : null}
                  </>
                )}
              </div>
            </article>

            {!detail.intake.deletedAt ? (
              <>
            {detail.attachments.length ? (
              <article className="rounded-2xl border border-hairline bg-surface-card p-5">
                <h3 className="font-display text-xl">
                  Private source material
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {detail.attachments.map((file) => (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`/ops/menu-intakes/${detail.intake.id}/attachments/${file.id}`}
                      key={file.id}
                      className="rounded-xl bg-surface-strong p-3 transition hover:ring-1 hover:ring-ink"
                    >
                      <p className="truncate text-sm font-medium">
                        {file.fileName}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {file.mime} ·{" "}
                        {(file.byteLength / 1024 / 1024).toFixed(1)} MB ·
                        private · View ↗
                      </p>
                    </a>
                  ))}
                </div>
              </article>
            ) : null}

            <article className="rounded-2xl border border-hairline bg-surface-card p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl">Reviewed dishes</h3>
                  <p className="mt-1 text-sm text-muted">
                    Edit deliberately; this creates an Operator revision.
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {dishes.length} items
                </span>
              </div>
              {dishes.length ? (
                <div className="mt-5 space-y-4">
                  {dishes.map((dish, index) => (
                    <div
                      key={dish.clientId}
                      className="rounded-xl border border-hairline p-4"
                    >
                      <p className="mb-3 text-xs uppercase tracking-widest text-muted">
                        Item {index + 1}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          aria-label="Dish name"
                          className={field}
                          value={dish.name}
                          onChange={(e) =>
                            setDishes(
                              dishes.map((row) =>
                                row.clientId === dish.clientId
                                  ? { ...row, name: e.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                        <input
                          aria-label="Category"
                          className={field}
                          value={dish.category}
                          onChange={(e) =>
                            setDishes(
                              dishes.map((row) =>
                                row.clientId === dish.clientId
                                  ? { ...row, category: e.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                        <input
                          aria-label="Price RWF"
                          type="number"
                          className={field}
                          value={dish.priceRwf}
                          onChange={(e) =>
                            setDishes(
                              dishes.map((row) =>
                                row.clientId === dish.clientId
                                  ? { ...row, priceRwf: Number(e.target.value) }
                                  : row,
                              ),
                            )
                          }
                        />
                        <input
                          aria-label="Description"
                          className={field}
                          value={dish.description || ""}
                          onChange={(e) =>
                            setDishes(
                              dishes.map((row) =>
                                row.clientId === dish.clientId
                                  ? { ...row, description: e.target.value }
                                  : row,
                              ),
                            )
                          }
                        />
                      </div>
                      <MenuIntakeDishOptions
                        sizeOptions={dish.sizeOptions}
                        addOnGroups={dish.addOnGroups}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-hairline p-5 text-sm text-muted">
                  Assisted intake has no structured dishes yet. Add the first
                  item.
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() =>
                      setDishes([
                        {
                          clientId: crypto.randomUUID(),
                          name: "",
                          category: "General",
                          priceRwf: 0,
                        },
                      ])
                    }
                  >
                    Add item
                  </button>
                </div>
              )}
              <button
                type="button"
                className="mt-4 rounded-full border border-hairline px-4 py-2 text-sm"
                onClick={() =>
                  setDishes([
                    ...dishes,
                    {
                      clientId: crypto.randomUUID(),
                      name: "",
                      category: "General",
                      priceRwf: 0,
                    },
                  ])
                }
              >
                + Add structured dish
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const data = new FormData();
                  data.set("intakeId", detail.intake.id);
                  data.set("status", "IN_REVIEW");
                  data.set("content", JSON.stringify({ ...latest, dishes }));
                  run(() => reviewMenuIntakeAction(data));
                }}
                className="ml-2 mt-4 rounded-full bg-ink px-5 py-2 text-sm text-on-primary"
              >
                Save reviewed revision
              </button>
            </article>

            {detail.questions.length ? (
              <article className="rounded-2xl border border-hairline bg-surface-card p-5 sm:p-6">
                <h3 className="font-display text-2xl">Private questions</h3>
                {detail.questions.map((question) => (
                  <div
                    key={question.id}
                    className="mt-4 rounded-xl bg-surface-strong p-4"
                  >
                    <p className="text-sm font-medium">“{question.question}”</p>
                    <p className="mt-1 text-xs text-muted">
                      {question.status.replaceAll("_", " ")}
                      {question.answeredBy ? ` · ${question.answeredBy}` : ""}
                    </p>
                    <form
                      className="mt-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        run(() => answerMenuIntakeQuestionAction(data));
                      }}
                    >
                      <input
                        type="hidden"
                        name="intakeId"
                        value={detail.intake.id}
                      />
                      <input
                        type="hidden"
                        name="questionId"
                        value={question.id}
                      />
                      <textarea
                        name="answer"
                        required
                        defaultValue={question.answer}
                        className={`${field} min-h-20 py-2`}
                        placeholder="Write the exact reply…"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <select
                          name="deliveryMethod"
                          className="rounded-xl border border-hairline bg-surface-card px-3 py-2 text-sm"
                        >
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="CALL">Call</option>
                          <option value="MANUAL">Manual</option>
                        </select>
                        <label className="text-xs text-muted">
                          <input
                            type="checkbox"
                            name="needsFollowUp"
                            className="mr-1"
                          />
                          Needs follow-up
                        </label>
                        <button className="rounded-full bg-ink px-4 py-2 text-xs text-on-primary">
                          Log answer
                        </button>
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://wa.me/${canonicalizePhone(detail.intake.phone)}?text=${encodeURIComponent(question.answer || "Hello, this is ZanTap about your menu. ")}`}
                          className="rounded-full border border-hairline px-4 py-2 text-xs"
                        >
                          Open WhatsApp ↗
                        </a>
                      </div>
                    </form>
                  </div>
                ))}
              </article>
            ) : null}

            <article className="rounded-2xl border border-hairline bg-surface-card p-5 sm:p-6">
              <h3 className="font-display text-2xl">Vendor notification</h3>
              <p className="mt-1 text-sm text-muted">
                Use for Need information, Imported, or Closed. Log the exact
                message and delivery method.
              </p>
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() =>
                    logMenuIntakeNotificationAction(
                      new FormData(e.currentTarget),
                    ),
                  );
                }}
              >
                <input type="hidden" name="intakeId" value={detail.intake.id} />
                <textarea
                  name="message"
                  required
                  className={`${field} min-h-20 py-2`}
                  defaultValue={
                    detail.intake.status === "IMPORTED"
                      ? `Your ZanTap menu ${detail.intake.reference} has been added. Storefront: /${detail.intake.destinationVendorSlug || ""} · KDS: /vendor/${detail.intake.destinationVendorSlug || ""}`
                      : `Hello, ZanTap has an update about menu ${detail.intake.reference}.`
                  }
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    name="method"
                    className="rounded-xl border border-hairline bg-surface-card px-3 py-2 text-sm"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="CALL">Call</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                  <button className="rounded-full bg-ink px-4 py-2 text-xs text-on-primary">
                    Log exact message
                  </button>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/${canonicalizePhone(detail.intake.phone)}`}
                    className="rounded-full border border-hairline px-4 py-2 text-xs"
                  >
                    Open WhatsApp ↗
                  </a>
                </div>
              </form>
              {detail.contactLogs.length ? (
                <div className="mt-4 border-t border-hairline pt-3 text-xs text-muted">
                  {detail.contactLogs.slice(-3).map((log) => (
                    <p key={log.id} className="mt-1">
                      {log.method} · {log.operatorId} · {log.message}
                    </p>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="rounded-2xl border border-hairline bg-surface-card p-5 sm:p-6">
              <h3 className="font-display text-2xl">
                Destination & match review
              </h3>
              <p className="mt-1 text-sm text-muted">
                A storefront hint is never proof. Confirm one destination before
                import.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDestinationMode("EXISTING")}
                  className={`rounded-full px-4 py-2 text-sm ${destinationMode === "EXISTING" ? "bg-ink text-on-primary" : "border border-hairline"}`}
                >
                  Existing Vendor
                </button>
                <button
                  onClick={() => setDestinationMode("CREATE")}
                  className={`rounded-full px-4 py-2 text-sm ${destinationMode === "CREATE" ? "bg-ink text-on-primary" : "border border-hairline"}`}
                >
                  Create Vendor & import
                </button>
              </div>
              {destinationMode === "EXISTING" ? (
                <div className="mt-4 flex gap-2">
                  <select
                    className={field}
                    value={vendorSlug}
                    onChange={(e) => setVendorSlug(e.target.value)}
                  >
                    <option value="">Select Vendor…</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.slug}>
                        {vendor.name} · {vendor.slug}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const data = new FormData();
                      data.set("intakeId", detail.intake.id);
                      data.set("status", "IN_REVIEW");
                      data.set("destinationVendorSlug", vendorSlug);
                      run(() => reviewMenuIntakeAction(data));
                    }}
                    className="shrink-0 rounded-xl border border-hairline px-4 text-sm"
                  >
                    Load matches
                  </button>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-surface-strong p-4 text-sm text-muted">
                  Final approval will create the Vendor using the fields below
                  and mint owner access. Public submission itself never
                  provisions it.
                </p>
              )}

              <div className="mt-5 space-y-3">
                {dishes.map((dish) => {
                  const suggestion = suggestionByDish.get(dish.clientId);
                  return (
                    <div
                      key={dish.clientId}
                      className="grid gap-3 rounded-xl border border-hairline p-4 sm:grid-cols-[1fr_220px]"
                    >
                      <div>
                        <p className="font-medium">{dish.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {suggestion?.kind === "POSSIBLE_MATCH"
                            ? `Possible match: ${suggestion.existingName} · defaults to Skip`
                            : "New item · selected to add"}
                        </p>
                      </div>
                      <select
                        aria-label={`Import decision for ${dish.name}`}
                        className={field}
                        value={
                          decisions[dish.clientId] ||
                          suggestion?.defaultDecision ||
                          "ADD_NEW"
                        }
                        onChange={(e) =>
                          setDecisions({
                            ...decisions,
                            [dish.clientId]: e.target
                              .value as MenuIntakeMatchDecision,
                          })
                        }
                      >
                        <option value="SKIP">Skip</option>
                        <option value="ADD_NEW">Add as new</option>
                        {suggestion?.existingMenuItemId ? (
                          <option value="UPDATE_EXISTING">
                            Update existing
                          </option>
                        ) : null}
                      </select>
                    </div>
                  );
                })}
              </div>

              <form
                className="mt-6 border-t border-hairline pt-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const items = dishes.map((dish) => {
                    const suggestion = suggestionByDish.get(dish.clientId);
                    return {
                      intakeDishClientId: dish.clientId,
                      decision:
                        decisions[dish.clientId] ||
                        suggestion?.defaultDecision ||
                        "ADD_NEW",
                      existingMenuItemId: suggestion?.existingMenuItemId,
                      reviewedDish: dish,
                    };
                  });
                  data.set("items", JSON.stringify(items));
                  data.set("idempotencyKey", crypto.randomUUID());
                  run(async () => {
                    const result = await importMenuIntakeAction(data);
                    if (result.ok)
                      setMessage(
                        `Menu imported · ${result.result.items.length} item results`,
                      );
                    return result;
                  });
                }}
              >
                <input type="hidden" name="intakeId" value={detail.intake.id} />
                <input
                  type="hidden"
                  name="destinationMode"
                  value={destinationMode}
                />
                {destinationMode === "EXISTING" ? (
                  <input type="hidden" name="vendorSlug" value={vendorSlug} />
                ) : (
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <input
                      name="vendorName"
                      required
                      className={field}
                      defaultValue={detail.intake.businessName}
                      placeholder="Vendor name"
                    />
                    <input
                      name="vendorSlug"
                      required
                      className={field}
                      placeholder="storefront-slug"
                    />
                    <input
                      name="vendorPhone"
                      required
                      className={field}
                      defaultValue={detail.intake.phone}
                      placeholder="Phone"
                    />
                    <input
                      name="momoCode"
                      required
                      className={field}
                      placeholder="MoMo code / phone"
                    />
                  </div>
                )}
                <button
              disabled={
                pending ||
                !dishes.length ||
                detail.intake.status === "IMPORTED" ||
                (destinationMode === "EXISTING" && !vendorSlug)
              }
                  className="min-h-12 rounded-full bg-ink px-6 font-medium text-on-primary disabled:opacity-40"
                >
                  {pending ? "Working…" : "Approve & import"}
                </button>
                {detail.intake.status === "IMPORTED" &&
                detail.intake.destinationVendorSlug ? (
                  <Link
                    href={`/vendor/${detail.intake.destinationVendorSlug}?tab=menu`}
                    className="ml-3 inline-flex min-h-12 items-center rounded-full border border-hairline px-5 text-sm"
                  >
                    Open KDS menu →
                  </Link>
                ) : null}
              </form>
            </article>
            {message ? (
              <p
                role="status"
                className="sticky bottom-4 rounded-xl bg-ink px-4 py-3 text-sm text-on-primary shadow-xl"
              >
                {message}
              </p>
            ) : null}
              </>
            ) : null}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-hairline p-10 text-center text-muted">
            Choose an intake to review.
          </section>
        )}
      </div>
    </div>
  );
}
