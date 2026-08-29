"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, FileText, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getMenuIntakeStatus,
  exchangeMenuIntakeResume,
  submitMenuIntake,
  submitMenuIntakeRevision,
  uploadMenuIntakeAttachment,
} from "@/lib/actions/menu-intake-public";
import type {
  MenuIntakeDishDraft,
  MenuIntakeLocale,
  MenuIntakePath,
  MenuIntakeStatus,
} from "@/lib/menu-intake/types";
import {
  appendSelectedFiles,
  MENU_INTAKE_DISHES_PER_PAGE,
  paginateMenuIntakeDishes,
  removeSelectedFile,
} from "@/lib/menu-intake/presentation";

const DRAFT_KEY = "zantap:menu-intake:draft:v1";
const RESUME_KEY = "zantap:menu-intake:resume:v1";

const COPY = {
  en: {
    title: "Turn what you know into a menu customers can order from.",
    intro:
      "Build it dish by dish, or send us your menu pages and photos. Nothing goes live until ZanTap reviews it with you.",
    build: "Build my menu",
    assist: "Help me create it",
    continue: "Continue",
    submit: "Send to ZanTap",
    question: "Ask ZanTap a question",
    sent: "Your menu is safely with us.",
  },
  rw: {
    title: "Hindura ibyo uzi ube menu abakiriya bashobora gukoresha.",
    intro:
      "Yubake ifunguro ku ifunguro, cyangwa utwoherereze amafoto na menu yawe. Nta kintu kijya hanze ZanTap itarakigenzura.",
    build: "Niyubakire menu",
    assist: "Mumfashe kuyikora",
    continue: "Komeza",
    submit: "Ohereza kuri ZanTap",
    question: "Baza ZanTap ikibazo",
    sent: "Menu yawe twayakiriye neza.",
  },
  fr: {
    title: "Transformez vos plats en menu prêt à commander.",
    intro:
      "Créez-le plat par plat, ou envoyez vos pages et photos. Rien ne sera publié avant la vérification de ZanTap.",
    build: "Créer mon menu",
    assist: "Aidez-moi à le créer",
    continue: "Continuer",
    submit: "Envoyer à ZanTap",
    question: "Poser une question à ZanTap",
    sent: "Votre menu est bien arrivé.",
  },
  sw: {
    title: "Geuza unachojua kuwa menyu ambayo wateja wanaweza kuagiza.",
    intro:
      "Jenga sahani moja baada ya nyingine, au tutumie kurasa na picha zako. Hakuna kinachoenda hewani kabla ZanTap haijakagua.",
    build: "Jenga menyu yangu",
    assist: "Nisaidie kuitengeneza",
    continue: "Endelea",
    submit: "Tuma kwa ZanTap",
    question: "Uliza ZanTap swali",
    sent: "Tumepokea menyu yako salama.",
  },
} satisfies Record<MenuIntakeLocale, Record<string, string>>;

type Draft = {
  locale: MenuIntakeLocale;
  businessName: string;
  contactName: string;
  phone: string;
  alreadyOnZantap: boolean;
  storefrontHint: string;
  path?: MenuIntakePath;
  dishes: MenuIntakeDishDraft[];
  assistedNotes: string;
  helpNeeded: string[];
  question: string;
};

const EMPTY: Draft = {
  locale: "en",
  businessName: "",
  contactName: "",
  phone: "",
  alreadyOnZantap: false,
  storefrontHint: "",
  dishes: [],
  assistedNotes: "",
  helpNeeded: [],
  question: "",
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-white outline-none transition focus:border-[#f4a623]";

function newDish(): MenuIntakeDishDraft {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    category: "",
    description: "",
    priceRwf: 0,
  };
}

function vendorStatus(status: MenuIntakeStatus): string {
  return (
    {
      SUBMITTED: "Sent",
      IN_REVIEW: "Being reviewed",
      NEEDS_INFORMATION: "We need more information",
      READY_TO_IMPORT: "Ready to add",
      IMPORTING: "Ready to add",
      IMPORTED: "Added to your KDS",
      CANCELLED: "Closed",
    } as const
  )[status];
}

export function MenuIntakeWizard({
  oneTimeAccess,
}: {
  oneTimeAccess?: { intakeId: string; token: string };
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<
    "START" | "DETAILS" | "MENU" | "REVIEW" | "SENT"
  >("START");
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [dishFiles, setDishFiles] = useState<Record<string, File[]>>({});
  const [dishPage, setDishPage] = useState(0);
  const [openDishIds, setOpenDishIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<MenuIntakeStatus>("SUBMITTED");
  const [error, setError] = useState("");
  const t = COPY[draft.locale];

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) setDraft({ ...EMPTY, ...JSON.parse(stored) });
      if (oneTimeAccess) {
        exchangeMenuIntakeResume(
          oneTimeAccess.intakeId,
          oneTimeAccess.token,
        ).then((result) => {
          if (result.ok) {
            localStorage.setItem(
              RESUME_KEY,
              JSON.stringify({
                intakeId: oneTimeAccess.intakeId,
                resumeToken: result.resumeToken,
                reference: result.reference,
              }),
            );
            setReference(result.reference);
            setStatus(result.status);
            setStep("SENT");
            history.replaceState(null, "", "/menu-intake");
          } else
            setError(
              "This private resume link is invalid or has already been used.",
            );
        });
      }
      const resume = JSON.parse(
        localStorage.getItem(RESUME_KEY) || "null",
      ) as null | { intakeId: string; resumeToken: string; reference: string };
      if (resume?.intakeId && resume.resumeToken) {
        getMenuIntakeStatus(resume.intakeId, resume.resumeToken).then(
          (result) => {
            if (result.ok) {
              setReference(resume.reference);
              setStatus(result.intake.status);
              setStep("SENT");
            }
          },
        );
      }
    } finally {
      setReady(true);
    }
  }, [oneTimeAccess]);

  useEffect(() => {
    if (ready && step !== "SENT")
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, ready, step]);

  const totalFiles =
    sourceFiles.length +
    Object.values(dishFiles).reduce((sum, files) => sum + files.length, 0);
  const totalBytes = useMemo(
    () => sourceFiles.reduce((sum, file) => sum + file.size, 0),
    [sourceFiles],
  );
  const paginatedDishes = useMemo(
    () => paginateMenuIntakeDishes(draft.dishes, dishPage),
    [dishPage, draft.dishes],
  );

  function patchDish(clientId: string, patch: Partial<MenuIntakeDishDraft>) {
    setDraft((value) => ({
      ...value,
      dishes: value.dishes.map((dish) =>
        dish.clientId === clientId ? { ...dish, ...patch } : dish,
      ),
    }));
  }

  function removeDish(clientId: string) {
    const dishes = draft.dishes.filter((dish) => dish.clientId !== clientId);
    const nextPage = Math.min(
      paginatedDishes.page,
      Math.max(0, Math.ceil(dishes.length / MENU_INTAKE_DISHES_PER_PAGE) - 1),
    );
    setDraft({ ...draft, dishes });
    setDishPage(nextPage);
    setDishFiles((value) => {
      const next = { ...value };
      delete next[clientId];
      return next;
    });
    setOpenDishIds((value) => {
      const remainingOpen = value.filter((id) => id !== clientId);
      if (remainingOpen.length) return remainingOpen;
      return dishes[nextPage * MENU_INTAKE_DISHES_PER_PAGE]
        ? [dishes[nextPage * MENU_INTAKE_DISHES_PER_PAGE].clientId]
        : [];
    });
  }

  function toggleDish(clientId: string) {
    setOpenDishIds((value) =>
      value.includes(clientId) ? [] : [clientId],
    );
  }

  async function finish() {
    setError("");
    const result = await submitMenuIntake({
      businessName: draft.businessName,
      contactName: draft.contactName,
      phone: draft.phone,
      locale: draft.locale,
      alreadyOnZantap: draft.alreadyOnZantap,
      storefrontHint: draft.storefrontHint,
      content: {
        path: draft.path || "ASSISTED",
        dishes: draft.dishes,
        assistedNotes: draft.assistedNotes,
        helpNeeded: draft.helpNeeded,
        question: draft.question,
      },
    });
    if (!result.ok) {
      setError(result.message || "Please check the details and try again.");
      return;
    }
    const uploads = [
      ...sourceFiles.map((file) => ({ file, kind: "SOURCE" as const })),
      ...Object.entries(dishFiles).flatMap(([dishClientId, files]) =>
        files.map((file) => ({
          file,
          kind: "DISH_IMAGE" as const,
          dishClientId,
        })),
      ),
    ];
    let completed = 0;
    const uploadedDishImages: Record<string, string[]> = {};
    for (const upload of uploads) {
      const data = new FormData();
      data.set("intakeId", result.intakeId);
      data.set("resumeToken", result.resumeToken);
      data.set("kind", upload.kind);
      if ("dishClientId" in upload && upload.dishClientId)
        data.set("dishClientId", upload.dishClientId);
      data.set("file", upload.file);
      const uploaded = await uploadMenuIntakeAttachment(data);
      if (!uploaded.ok) {
        setError(
          uploaded.message ||
            `Could not upload ${upload.file.name}. Your intake was saved; retry from this browser.`,
        );
        break;
      }
      if ("dishClientId" in upload && upload.dishClientId) {
        uploadedDishImages[upload.dishClientId] = [
          ...(uploadedDishImages[upload.dishClientId] || []),
          uploaded.attachmentId,
        ];
      }
      completed += 1;
      setProgress(Math.round((completed / Math.max(uploads.length, 1)) * 100));
    }
    if (Object.keys(uploadedDishImages).length) {
      await submitMenuIntakeRevision(result.intakeId, result.resumeToken, {
        path: draft.path || "SELF_BUILD",
        dishes: draft.dishes.map((dish) => ({
          ...dish,
          imageAttachmentIds:
            uploadedDishImages[dish.clientId] || dish.imageAttachmentIds,
        })),
        assistedNotes: draft.assistedNotes,
        helpNeeded: draft.helpNeeded,
        question: undefined,
      });
    }
    localStorage.setItem(
      RESUME_KEY,
      JSON.stringify({
        intakeId: result.intakeId,
        resumeToken: result.resumeToken,
        reference: result.reference,
      }),
    );
    localStorage.removeItem(DRAFT_KEY);
    setReference(result.reference);
    setStatus(result.status);
    setStep("SENT");
  }

  if (!ready) return <main className="min-h-screen bg-[#0b0908]" />;

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0908] text-[#f8f2e8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(160,77,25,.3),transparent_38%),radial-gradient(circle_at_90%_70%,rgba(244,166,35,.12),transparent_32%)]" />
      <div className="relative mx-auto min-h-screen w-full max-w-3xl px-5 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="ZanTap home"
          >
            <Image
              src="/brand/approved-z/zantap-z-mark-1024.png"
              alt=""
              width={38}
              height={38}
            />
            <span className="font-display text-xl">ZanTap</span>
          </Link>
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-[.18em] text-white/55">
              <span className="sr-only">Language</span>
              <select
                value={draft.locale}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    locale: event.target.value as MenuIntakeLocale,
                  })
                }
                className="min-h-10 rounded-xl border border-white/15 bg-black px-2 text-white sm:px-3"
              >
                <option value="en">EN</option>
                <option value="rw">RW</option>
                <option value="fr">FR</option>
                <option value="sw">SW</option>
              </select>
            </label>
            <a
              href="https://zantap.app"
              className="inline-flex min-h-10 items-center rounded-xl border border-[#f4a623] px-3 text-[11px] font-medium text-[#f4a623] transition hover:bg-[#f4a623] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a623] sm:px-4 sm:text-xs"
            >
              Visit zantap.app
            </a>
          </div>
        </header>

        {step === "START" ? (
          <section className="flex min-h-[78vh] flex-col justify-center py-12">
            <p className="mb-5 text-xs uppercase tracking-[.3em] text-[#f4a623]">
              Vendor menu intake
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-light leading-[1.05] sm:text-6xl">
              {t.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/65">
              {t.intro}
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {(["SELF_BUILD", "ASSISTED"] as const).map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => {
                    const dishes =
                      path === "SELF_BUILD" && !draft.dishes.length
                        ? [newDish()]
                        : draft.dishes;
                    setDraft({
                      ...draft,
                      path,
                      dishes,
                    });
                    setDishPage(0);
                    setOpenDishIds(dishes[0] ? [dishes[0].clientId] : []);
                    setStep("DETAILS");
                  }}
                  className="group min-h-40 rounded-[28px] border border-white/15 bg-white/[0.05] p-6 text-left transition hover:-translate-y-1 hover:border-[#f4a623]/60"
                >
                  <span className="text-2xl text-[#f4a623]">
                    {path === "SELF_BUILD" ? "01" : "02"}
                  </span>
                  <span className="mt-8 block font-display text-2xl">
                    {path === "SELF_BUILD" ? t.build : t.assist}
                  </span>
                  <span className="mt-2 block text-sm text-white/50">
                    {path === "SELF_BUILD"
                      ? "Add dishes, prices, photos and extras."
                      : "Send menu pages, photos, prices and notes."}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="mt-8 w-fit text-sm text-white/55 underline underline-offset-4"
              onClick={() => setStep("SENT")}
            >
              Return to a submitted menu on this browser
            </button>
          </section>
        ) : null}

        {step === "DETAILS" ? (
          <section className="py-14">
            <p className="text-xs uppercase tracking-[.3em] text-[#f4a623]">
              01 · Your business
            </p>
            <h1 className="mt-4 font-display text-4xl font-light">
              Who should we build this with?
            </h1>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <Field label="Business name">
                <input
                  required
                  value={draft.businessName}
                  onChange={(e) =>
                    setDraft({ ...draft, businessName: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Your name">
                <input
                  required
                  value={draft.contactName}
                  onChange={(e) =>
                    setDraft({ ...draft, contactName: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp or phone">
                <input
                  required
                  inputMode="tel"
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft({ ...draft, phone: e.target.value })
                  }
                  className={inputClass}
                  placeholder="+250 78…"
                />
              </Field>
              <Field label="Already on ZanTap?">
                <select
                  value={draft.alreadyOnZantap ? "yes" : "no"}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      alreadyOnZantap: e.target.value === "yes",
                    })
                  }
                  className={inputClass}
                >
                  <option value="no">No / Not yet</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            </div>
            {draft.alreadyOnZantap ? (
              <Field label="Storefront link or slug (matching hint only)">
                <input
                  value={draft.storefrontHint}
                  onChange={(e) =>
                    setDraft({ ...draft, storefrontHint: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
            ) : null}
            <Actions
              back={() => setStep("START")}
              next={() => setStep("MENU")}
              nextLabel={t.continue}
            />
          </section>
        ) : null}

        {step === "MENU" && draft.path === "SELF_BUILD" ? (
          <section className="py-14">
            <p className="text-xs uppercase tracking-[.3em] text-[#f4a623]">
              02 · Build your menu
            </p>
            <h1 className="mt-4 font-display text-4xl font-light">
              Add the dishes customers should see.
            </h1>
            <p className="mt-3 text-sm text-white/55">
              Availability, dish count, stock rules and cost stay in your
              KDS—not here.
            </p>
            <div className="mt-8 space-y-3">
              {paginatedDishes.items.map((dish, pageIndex) => {
                const dishNumber = paginatedDishes.startIndex + pageIndex + 1;
                const isOpen = openDishIds.includes(dish.clientId);

                return (
                <article
                  key={dish.clientId}
                  className="overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.04]"
                >
                  <div className="flex min-h-16 items-center gap-2 px-5 py-3 sm:px-7">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`dish-${dish.clientId}`}
                      onClick={() => toggleDish(dish.clientId)}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-[11px] uppercase tracking-[.18em] text-[#f4a623]">
                          Dish {dishNumber}
                        </span>
                        <span className="mt-1 block truncate font-display text-xl">
                          {dish.name.trim() || `Dish ${dishNumber}`}
                        </span>
                        {!isOpen && (dish.category || dish.priceRwf) ? (
                          <span className="mt-0.5 block truncate text-xs text-white/45">
                            {[dish.category, dish.priceRwf ? `${dish.priceRwf.toLocaleString("en-RW")} RWF` : ""]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        ) : null}
                      </span>
                      <ChevronDown
                        size={19}
                        aria-hidden
                        className={`flex-none text-[#f4a623] transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {draft.dishes.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Remove ${dish.name.trim() || `dish ${dishNumber}`}`}
                        onClick={() => removeDish(dish.clientId)}
                        className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4a623]"
                      >
                        <X size={18} aria-hidden />
                      </button>
                    ) : null}
                  </div>
                  {isOpen ? (
                    <div
                      id={`dish-${dish.clientId}`}
                      className="border-t border-white/10 px-5 pb-6 pt-1 sm:px-7"
                    >
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Dish name">
                      <input
                        value={dish.name}
                        onChange={(e) =>
                          patchDish(dish.clientId, { name: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Category">
                      <input
                        value={dish.category}
                        onChange={(e) =>
                          patchDish(dish.clientId, { category: e.target.value })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Price (RWF)">
                      <input
                        type="number"
                        min="0"
                        value={dish.priceRwf || ""}
                        onChange={(e) =>
                          patchDish(dish.clientId, {
                            priceRwf: Number(e.target.value),
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Description (optional)">
                      <input
                        value={dish.description || ""}
                        onChange={(e) =>
                          patchDish(dish.clientId, {
                            description: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/15 px-3 py-2 text-xs"
                      onClick={() =>
                        patchDish(dish.clientId, {
                          sizeOptions: dish.sizeOptions?.length
                            ? undefined
                            : [
                                {
                                  id: "small",
                                  label: "Small",
                                  priceRwf: dish.priceRwf,
                                  isAvailable: true,
                                },
                                {
                                  id: "large",
                                  label: "Large",
                                  priceRwf: dish.priceRwf,
                                  isAvailable: true,
                                },
                              ],
                        })
                      }
                    >
                      {dish.sizeOptions?.length
                        ? "Use one price"
                        : "+ Add size prices"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/15 px-3 py-2 text-xs"
                      onClick={() =>
                        patchDish(dish.clientId, {
                          addOnGroups: [
                            ...(dish.addOnGroups || []),
                            {
                              id: `group-${(dish.addOnGroups?.length || 0) + 1}`,
                              name: "Extras",
                              required: false,
                              selection: "MULTIPLE",
                              maxSelections: 1,
                              choices: [
                                {
                                  id: `choice-${crypto.randomUUID().slice(0, 8)}`,
                                  label: "Extra",
                                  priceRwf: 0,
                                  isAvailable: true,
                                },
                              ],
                            },
                          ],
                        })
                      }
                    >
                      + Add extras
                    </button>
                  </div>
                  {dish.sizeOptions?.length ? (
                    <div className="mt-4 rounded-2xl bg-black/25 p-4">
                      <p className="text-xs uppercase tracking-widest text-white/45">
                        Size prices
                      </p>
                      {dish.sizeOptions.map((size, sizeIndex) => (
                        <div
                          key={size.id}
                          className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"
                        >
                          <input
                            aria-label="Size label"
                            className={inputClass}
                            value={size.label}
                            onChange={(e) =>
                              patchDish(dish.clientId, {
                                sizeOptions: dish.sizeOptions?.map((row, i) =>
                                  i === sizeIndex
                                    ? { ...row, label: e.target.value }
                                    : row,
                                ),
                              })
                            }
                          />
                          <input
                            aria-label="Size price"
                            type="number"
                            min="0"
                            className={inputClass}
                            value={size.priceRwf || ""}
                            onChange={(e) =>
                              patchDish(dish.clientId, {
                                sizeOptions: dish.sizeOptions?.map((row, i) =>
                                  i === sizeIndex
                                    ? {
                                        ...row,
                                        priceRwf: Number(e.target.value),
                                      }
                                    : row,
                                ),
                              })
                            }
                          />
                          {dish.sizeOptions!.length > 2 ? (
                            <button
                              type="button"
                              className="mt-2 px-2 text-white/45"
                              onClick={() =>
                                patchDish(dish.clientId, {
                                  sizeOptions: dish.sizeOptions?.filter(
                                    (_, i) => i !== sizeIndex,
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="mt-3 text-xs text-[#f4a623]"
                        onClick={() =>
                          patchDish(dish.clientId, {
                            sizeOptions: [
                              ...dish.sizeOptions!,
                              {
                                id: `size-${crypto.randomUUID().slice(0, 8)}`,
                                label: "Size",
                                priceRwf: dish.priceRwf,
                                isAvailable: true,
                              },
                            ],
                          })
                        }
                      >
                        + Another size
                      </button>
                    </div>
                  ) : null}
                  {dish.addOnGroups?.map((group, groupIndex) => (
                    <div
                      key={group.id}
                      className="mt-4 rounded-2xl bg-black/25 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          aria-label="Extras group name"
                          className={inputClass}
                          value={group.name}
                          onChange={(e) =>
                            patchDish(dish.clientId, {
                              addOnGroups: dish.addOnGroups?.map((row, i) =>
                                i === groupIndex
                                  ? { ...row, name: e.target.value }
                                  : row,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="mt-2 px-2 text-white/45"
                          onClick={() =>
                            patchDish(dish.clientId, {
                              addOnGroups: dish.addOnGroups?.filter(
                                (_, i) => i !== groupIndex,
                              ),
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                      {group.choices.map((choice, choiceIndex) => (
                        <div
                          key={choice.id}
                          className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"
                        >
                          <input
                            aria-label="Extra name"
                            className={inputClass}
                            value={choice.label}
                            onChange={(e) =>
                              patchDish(dish.clientId, {
                                addOnGroups: dish.addOnGroups?.map((row, i) =>
                                  i === groupIndex
                                    ? {
                                        ...row,
                                        choices: row.choices.map((item, j) =>
                                          j === choiceIndex
                                            ? { ...item, label: e.target.value }
                                            : item,
                                        ),
                                      }
                                    : row,
                                ),
                              })
                            }
                          />
                          <input
                            aria-label="Extra price"
                            type="number"
                            min="0"
                            className={inputClass}
                            value={choice.priceRwf || ""}
                            onChange={(e) =>
                              patchDish(dish.clientId, {
                                addOnGroups: dish.addOnGroups?.map((row, i) =>
                                  i === groupIndex
                                    ? {
                                        ...row,
                                        choices: row.choices.map((item, j) =>
                                          j === choiceIndex
                                            ? {
                                                ...item,
                                                priceRwf: Number(
                                                  e.target.value,
                                                ),
                                              }
                                            : item,
                                        ),
                                      }
                                    : row,
                                ),
                              })
                            }
                          />
                          {group.choices.length > 1 ? (
                            <button
                              type="button"
                              className="mt-2 px-2 text-white/45"
                              onClick={() =>
                                patchDish(dish.clientId, {
                                  addOnGroups: dish.addOnGroups?.map(
                                    (row, i) =>
                                      i === groupIndex
                                        ? {
                                            ...row,
                                            choices: row.choices.filter(
                                              (_, j) => j !== choiceIndex,
                                            ),
                                          }
                                        : row,
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="mt-3 text-xs text-[#f4a623]"
                        onClick={() =>
                          patchDish(dish.clientId, {
                            addOnGroups: dish.addOnGroups?.map((row, i) =>
                              i === groupIndex
                                ? {
                                    ...row,
                                    maxSelections: row.choices.length + 1,
                                    choices: [
                                      ...row.choices,
                                      {
                                        id: `choice-${crypto.randomUUID().slice(0, 8)}`,
                                        label: "Extra",
                                        priceRwf: 0,
                                        isAvailable: true,
                                      },
                                    ],
                                  }
                                : row,
                            ),
                          })
                        }
                      >
                        + Another choice
                      </button>
                    </div>
                  ))}
                  <div className="mt-5">
                    <p className="text-sm text-white/65">
                      Photos · {(dishFiles[dish.clientId] || []).length}/6
                    </p>
                    <FilePreviewGrid
                      files={dishFiles[dish.clientId] || []}
                      onRemove={(fileIndex) =>
                        setDishFiles((value) => ({
                          ...value,
                          [dish.clientId]: removeSelectedFile(
                            value[dish.clientId] || [],
                            fileIndex,
                          ),
                        }))
                      }
                      variant="dish"
                    />
                    <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#f4a623] text-sm text-[#f4a623] transition hover:bg-[#f4a623] hover:text-black focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#f4a623]">
                      <Plus size={18} aria-hidden /> Add photos
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(event) => {
                          const incoming = Array.from(
                            event.target.files || [],
                          );
                          setDishFiles((value) => ({
                            ...value,
                            [dish.clientId]: appendSelectedFiles(
                              value[dish.clientId] || [],
                              incoming,
                              6,
                            ),
                          }));
                          event.currentTarget.value = "";
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                    </div>
                  ) : null}
                </article>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const dish = newDish();
                const nextDishes = [...draft.dishes, dish];
                setDraft({ ...draft, dishes: nextDishes });
                setDishPage(
                  Math.floor(
                    (nextDishes.length - 1) / MENU_INTAKE_DISHES_PER_PAGE,
                  ),
                );
                setOpenDishIds([dish.clientId]);
              }}
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#f4a623] px-5 text-sm text-[#f4a623] transition hover:bg-[#f4a623] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a623]"
            >
              <Plus size={18} aria-hidden /> Add another dish
            </button>
            {paginatedDishes.pageCount > 1 ? (
              <nav
                aria-label="Menu dish pages"
                className="mt-5 grid min-h-14 grid-cols-[1fr_auto_1fr] items-center rounded-2xl border border-white/15 px-3 text-sm"
              >
                <button
                  type="button"
                  disabled={paginatedDishes.page === 0}
                  onClick={() => {
                    const page = paginatedDishes.page - 1;
                    setDishPage(page);
                    const firstDish =
                      draft.dishes[page * MENU_INTAKE_DISHES_PER_PAGE];
                    setOpenDishIds(firstDish ? [firstDish.clientId] : []);
                  }}
                  className="min-h-11 justify-self-start px-2 text-[#f4a623] disabled:text-white/25"
                >
                  Previous
                </button>
                <span className="px-2 text-white/55">
                  Page {paginatedDishes.page + 1} of {paginatedDishes.pageCount}
                </span>
                <button
                  type="button"
                  disabled={
                    paginatedDishes.page === paginatedDishes.pageCount - 1
                  }
                  onClick={() => {
                    const page = paginatedDishes.page + 1;
                    setDishPage(page);
                    const firstDish =
                      draft.dishes[page * MENU_INTAKE_DISHES_PER_PAGE];
                    setOpenDishIds(firstDish ? [firstDish.clientId] : []);
                  }}
                  className="min-h-11 justify-self-end px-2 text-[#f4a623] disabled:text-white/25"
                >
                  Next
                </button>
              </nav>
            ) : null}
            <Field label={t.question}>
              <textarea
                value={draft.question}
                onChange={(e) =>
                  setDraft({ ...draft, question: e.target.value })
                }
                className={`${inputClass} min-h-24 py-3`}
              />
            </Field>
            <Actions
              back={() => setStep("DETAILS")}
              next={() => setStep("REVIEW")}
              nextLabel={t.continue}
            />
          </section>
        ) : null}

        {step === "MENU" && draft.path === "ASSISTED" ? (
          <section className="py-14">
            <p className="text-xs uppercase tracking-[.3em] text-[#f4a623]">
              02 · Send what you have
            </p>
            <h1 className="mt-4 font-display text-4xl font-light">
              Photos, pages, prices—even handwritten notes.
            </h1>
            <div className="mt-8 rounded-[28px] border border-dashed border-[#f4a623]/50 bg-[#f4a623]/[0.06] p-6">
              <div>
                <p className="text-sm text-white/65">
                  Source files · JPEG, PNG, WebP or PDF
                </p>
                <FilePreviewGrid
                  files={sourceFiles}
                  onRemove={(fileIndex) =>
                    setSourceFiles((files) =>
                      removeSelectedFile(files, fileIndex),
                    )
                  }
                  variant="source"
                />
                <label className="mt-4 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#f4a623] text-sm text-[#f4a623] transition hover:bg-[#f4a623] hover:text-black focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#f4a623]">
                  <Plus size={18} aria-hidden /> Add more files
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    multiple
                    onChange={(event) => {
                      const incoming = Array.from(event.target.files || []);
                      setSourceFiles((files) =>
                        appendSelectedFiles(files, incoming, 30),
                      );
                      event.currentTarget.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
              <p className="mt-3 text-xs text-white/45">
                {sourceFiles.length}/30 files ·{" "}
                {(totalBytes / 1024 / 1024).toFixed(1)}/75 MB. Images 5 MB max;
                PDFs 15 MB max.
              </p>
            </div>
            <Field label="What should we help with?">
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Type my dishes",
                  "Organize categories",
                  "Set up sizes",
                  "Add extras",
                  "Improve descriptions",
                ].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        helpNeeded: draft.helpNeeded.includes(value)
                          ? draft.helpNeeded.filter((item) => item !== value)
                          : [...draft.helpNeeded, value],
                      })
                    }
                    className={`rounded-full border px-4 py-2 text-sm ${draft.helpNeeded.includes(value) ? "border-[#f4a623] bg-[#f4a623] text-black" : "border-white/15 text-white/65"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Notes for ZanTap">
              <textarea
                value={draft.assistedNotes}
                onChange={(e) =>
                  setDraft({ ...draft, assistedNotes: e.target.value })
                }
                className={`${inputClass} min-h-28 py-3`}
              />
            </Field>
            <Field label={t.question}>
              <textarea
                value={draft.question}
                onChange={(e) =>
                  setDraft({ ...draft, question: e.target.value })
                }
                className={`${inputClass} min-h-24 py-3`}
              />
            </Field>
            <Actions
              back={() => setStep("DETAILS")}
              next={() => setStep("REVIEW")}
              nextLabel={t.continue}
            />
          </section>
        ) : null}

        {step === "REVIEW" ? (
          <section className="py-14">
            <p className="text-xs uppercase tracking-[.3em] text-[#f4a623]">
              03 · Review & send
            </p>
            <h1 className="mt-4 font-display text-4xl font-light">
              Nothing publishes yet.
            </h1>
            <p className="mt-4 max-w-xl text-white/60">
              ZanTap Ops will review this private intake, answer your question,
              resolve the right business and show every possible menu match
              before importing.
            </p>
            <div className="mt-8 rounded-[28px] border border-white/15 bg-white/[0.04] p-6">
              <p className="font-display text-2xl">
                {draft.businessName || "Your business"}
              </p>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-white/40">Path</dt>
                  <dd>{draft.path === "SELF_BUILD" ? t.build : t.assist}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Menu material</dt>
                  <dd>
                    {draft.path === "SELF_BUILD"
                      ? `${draft.dishes.length} dishes · ${totalFiles} photos`
                      : `${sourceFiles.length} private files`}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Contact</dt>
                  <dd>
                    {draft.contactName} · {draft.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-white/40">Language</dt>
                  <dd>{draft.locale.toUpperCase()}</dd>
                </div>
              </dl>
            </div>
            {progress ? (
              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#f4a623]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/50">
                  Uploading private files · {progress}%
                </p>
              </div>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-xl bg-red-950/60 p-4 text-sm text-red-100"
              >
                {error}
              </p>
            ) : null}
            <Actions
              back={() => setStep("MENU")}
              next={finish}
              nextLabel={t.submit}
            />
          </section>
        ) : null}

        {step === "SENT" ? (
          <section className="flex min-h-[78vh] flex-col justify-center py-12">
            <div className="h-14 w-14 rounded-full bg-[#f4a623] text-center text-3xl leading-[56px] text-black">
              ✓
            </div>
            <p className="mt-8 text-xs uppercase tracking-[.3em] text-[#f4a623]">
              {vendorStatus(status)}
            </p>
            <h1 className="mt-4 font-display text-5xl font-light">
              {reference ? t.sent : "No saved submission found."}
            </h1>
            {reference ? (
              <>
                <p className="mt-5 text-white/60">
                  Reference <strong className="text-white">{reference}</strong>.
                  This browser holds the private resume access—your reference
                  alone cannot open the intake.
                </p>
                <div className="mt-8 rounded-[24px] border border-white/15 bg-white/[0.04] p-5">
                  <p className="text-sm text-white/45">Current status</p>
                  <p className="mt-2 font-display text-2xl">
                    {vendorStatus(status)}
                  </p>
                </div>
              </>
            ) : (
              <button
                className="mt-8 w-fit rounded-full bg-[#f4a623] px-6 py-3 text-black"
                onClick={() => setStep("START")}
              >
                Start a menu
              </button>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function FilePreviewGrid({
  files,
  onRemove,
  variant,
}: {
  files: File[];
  onRemove: (index: number) => void;
  variant: "dish" | "source";
}) {
  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: file.type === "application/pdf" ? undefined : URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    },
    [previews],
  );

  if (!previews.length) return null;

  return (
    <div
      className={`mt-3 grid gap-3 ${variant === "dish" ? "grid-cols-3" : "grid-cols-2"}`}
    >
      {previews.map(({ file, url }, index) =>
        url ? (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-white/15 bg-black/30"
          >
            <Image
              src={url}
              alt={file.name}
              fill
              unoptimized
              sizes={variant === "dish" ? "120px" : "180px"}
              className="object-cover"
            />
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(index)}
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/75 text-white shadow-lg transition hover:border-[#f4a623] hover:text-[#f4a623] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4a623]"
            >
              <X size={17} aria-hidden />
            </button>
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-6 text-[11px] text-white/80">
              {file.name}
            </span>
          </div>
        ) : (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="col-span-full flex min-h-20 items-center gap-3 rounded-2xl border border-white/15 bg-black/25 p-3"
          >
            <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-[#f4a623]/50 text-[#f4a623]">
              <FileText size={21} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-white">
                {file.name}
              </span>
              <span className="mt-1 block text-xs text-white/45">
                {formatFileSize(file.size)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="min-h-11 flex-none px-2 text-xs text-[#f4a623]"
            >
              Remove
            </button>
          </div>
        ),
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-5 block text-sm text-white/65">
      {label}
      {children}
    </label>
  );
}
function Actions({
  back,
  next,
  nextLabel,
}: {
  back: () => void;
  next: () => void | Promise<void>;
  nextLabel: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={back}
        className="min-h-12 px-2 text-sm text-white/50"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={() => void next()}
        className="min-h-12 rounded-full bg-[#f4a623] px-7 font-medium text-black"
      >
        {nextLabel} →
      </button>
    </div>
  );
}
