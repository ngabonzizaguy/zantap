"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  FileText,
  ImageIcon,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  buildMenuIntakePhone,
  buildMenuIntakeWhatsAppUrl,
  formatMenuIntakePhone,
  getMenuIntakeDishIssues,
  MENU_INTAKE_DISHES_PER_PAGE,
  paginateMenuIntakeDishes,
  removeSelectedFile,
} from "@/lib/menu-intake/presentation";
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
} from "@/lib/vendor/onboard-options";
import { splitPhoneForDisplay } from "@/lib/format";

const DRAFT_KEY = "zantap:menu-intake:draft:v1";
const RESUME_KEY = "zantap:menu-intake:resume:v1";

const COPY = {
  en: {
    title: "Let’s make your menu.",
    intro: "Add your dishes, or send photos of your menu. We’ll help with the rest.",
    build: "Add my dishes",
    assist: "Send my menu photos",
    continue: "Next",
    submit: "Send menu",
    question: "Any question?",
    sent: "Your menu was sent.",
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
  phoneDialCode: string;
  phone: string;
  alreadyOnZantap: boolean;
  storefrontHint: string;
  path?: MenuIntakePath;
  dishes: MenuIntakeDishDraft[];
  assistedNotes: string;
  helpNeeded: string[];
  question: string;
};

type PendingSubmission = {
  intakeId: string;
  resumeToken: string;
  reference: string;
  status: "SUBMITTED";
};

type IntakeUpload = {
  file: File;
  kind: "SOURCE" | "DISH_IMAGE";
  dishClientId?: string;
};

function intakeUploadKey(upload: IntakeUpload): string {
  return [
    upload.kind,
    upload.dishClientId || "",
    upload.file.name,
    upload.file.size,
    upload.file.lastModified,
  ].join(":");
}

const EMPTY: Draft = {
  locale: "en",
  businessName: "",
  contactName: "",
  phoneDialCode: DEFAULT_COUNTRY.dialCode,
  phone: "",
  alreadyOnZantap: false,
  storefrontHint: "",
  dishes: [],
  assistedNotes: "",
  helpNeeded: [],
  question: "",
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-white/[0.045] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#f4a623] focus:bg-white/[0.07]";

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
  showLanguageChoices,
}: {
  oneTimeAccess?: { intakeId: string; token: string };
  showLanguageChoices: boolean;
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
  const [advancedDishIds, setAdvancedDishIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmission, setPendingSubmission] =
    useState<PendingSubmission | null>(null);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    Record<string, { attachmentId: string; dishClientId?: string }>
  >({});
  const submittingRef = useRef(false);
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<MenuIntakeStatus>("SUBMITTED");
  const [error, setError] = useState("");
  const activeLocale: MenuIntakeLocale = showLanguageChoices
    ? draft.locale
    : "en";
  const t = COPY[activeLocale];
  const stepNumber =
    step === "DETAILS" ? 1 : step === "MENU" ? 2 : step === "REVIEW" ? 3 : 0;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const storedDraft = JSON.parse(stored) as Partial<Draft>;
        const saved = { ...EMPTY, ...storedDraft } as Draft;
        const displayed = splitPhoneForDisplay(
          saved.phone,
          storedDraft.phoneDialCode || DEFAULT_COUNTRY.dialCode,
        );
        setDraft({
          ...saved,
          phoneDialCode: storedDraft.phoneDialCode || displayed.dialCode,
          phone: displayed.local,
        });
      }
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

  useEffect(() => {
    if (!ready) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [ready, step]);

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
  const reviewIssues = useMemo(
    () => getMenuIntakeDishIssues(draft.dishes),
    [draft.dishes],
  );
  const canonicalPhone = buildMenuIntakePhone(
    draft.phoneDialCode,
    draft.phone,
  );
  const detailsComplete = Boolean(
    draft.businessName.trim() &&
      draft.contactName.trim() &&
      /^\d{8,15}$/.test(canonicalPhone),
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

  function editDish(clientId: string) {
    const index = draft.dishes.findIndex((dish) => dish.clientId === clientId);
    if (index < 0) return;
    setDishPage(Math.floor(index / MENU_INTAKE_DISHES_PER_PAGE));
    setOpenDishIds([clientId]);
    setStep("MENU");
  }

  function addDish() {
    const dish = newDish();
    const dishes = [...draft.dishes, dish];
    setDraft({ ...draft, dishes });
    setDishPage(
      Math.floor((dishes.length - 1) / MENU_INTAKE_DISHES_PER_PAGE),
    );
    setOpenDishIds([dish.clientId]);
    setStep("MENU");
  }

  async function finish() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    setProgress(0);
    let submission = pendingSubmission;
    try {
      if (!submission) {
        const result = await submitMenuIntake({
          businessName: draft.businessName,
          contactName: draft.contactName,
          phone: canonicalPhone,
          locale: activeLocale,
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
          setError(result.message || "We could not send your menu. Please try again.");
          return;
        }
        submission = result;
        setPendingSubmission(result);
        localStorage.setItem(
          RESUME_KEY,
          JSON.stringify({
            intakeId: result.intakeId,
            resumeToken: result.resumeToken,
            reference: result.reference,
          }),
        );
      }

      const uploads: IntakeUpload[] = [
        ...sourceFiles.map((file) => ({ file, kind: "SOURCE" as const })),
        ...Object.entries(dishFiles).flatMap(([dishClientId, files]) =>
          files.map((file) => ({
            file,
            kind: "DISH_IMAGE" as const,
            dishClientId,
          })),
        ),
      ];
      const completedUploads = { ...uploadedAttachments };
      let completed = uploads.filter(
        (upload) => completedUploads[intakeUploadKey(upload)],
      ).length;

      for (const upload of uploads) {
        const key = intakeUploadKey(upload);
        if (completedUploads[key]) continue;
        const data = new FormData();
        data.set("intakeId", submission.intakeId);
        data.set("resumeToken", submission.resumeToken);
        data.set("kind", upload.kind);
        if (upload.dishClientId)
          data.set("dishClientId", upload.dishClientId);
        data.set("file", upload.file);
        const uploaded = await uploadMenuIntakeAttachment(data);
        if (!uploaded.ok) {
          setError(
            uploaded.message ||
              `Your menu was saved, but ${upload.file.name} did not upload. Please tap Send menu again.`,
          );
          return;
        }
        completedUploads[key] = {
          attachmentId: uploaded.attachmentId,
          dishClientId: upload.dishClientId,
        };
        setUploadedAttachments({ ...completedUploads });
        completed += 1;
        setProgress(
          Math.round((completed / Math.max(uploads.length, 1)) * 100),
        );
      }

      const uploadedDishImages: Record<string, string[]> = {};
      for (const upload of uploads) {
        if (!upload.dishClientId) continue;
        const attachment = completedUploads[intakeUploadKey(upload)];
        if (!attachment) continue;
        uploadedDishImages[upload.dishClientId] = [
          ...(uploadedDishImages[upload.dishClientId] || []),
          attachment.attachmentId,
        ];
      }
      if (Object.keys(uploadedDishImages).length) {
        const revision = await submitMenuIntakeRevision(
          submission.intakeId,
          submission.resumeToken,
          {
            path: draft.path || "SELF_BUILD",
            dishes: draft.dishes.map((dish) => ({
              ...dish,
              imageAttachmentIds:
                uploadedDishImages[dish.clientId] || dish.imageAttachmentIds,
            })),
            assistedNotes: draft.assistedNotes,
            helpNeeded: draft.helpNeeded,
            question: undefined,
          },
        );
        if (!revision.ok) {
          setError("Your photos uploaded, but we could not finish. Please tap Send menu again.");
          return;
        }
      }
      if (uploads.length) {
        const persisted = await getMenuIntakeStatus(
          submission.intakeId,
          submission.resumeToken,
        );
        const persistedIds = new Set(
          persisted.ok
            ? persisted.attachments.map((attachment) => attachment.id)
            : [],
        );
        const everyUploadPersisted = Object.values(completedUploads).every(
          (attachment) => persistedIds.has(attachment.attachmentId),
        );
        if (!persisted.ok || !everyUploadPersisted) {
          setError(
            "Your menu was saved, but we could not confirm every file. Please tap Send menu again.",
          );
          return;
        }
      }
      localStorage.removeItem(DRAFT_KEY);
      setReference(submission.reference);
      setStatus(submission.status);
      setStep("SENT");
    } catch {
      setError(
        submission
          ? "Your menu was saved, but the upload stopped. Please tap Send menu again."
          : "We could not send your menu. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (!ready) return <main className="min-h-screen bg-[#0b0908]" />;

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0b0c] text-[#f8f2e8]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(244,166,35,.085),transparent_36%),linear-gradient(115deg,rgba(255,255,255,.018),transparent_40%)]" />
      <div className="relative mx-auto min-h-screen w-full max-w-2xl px-5 pb-16 pt-6 sm:px-8 lg:pt-8">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
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
              loading="eager"
            />
            <span className="font-display text-2xl font-light">ZanTap</span>
          </Link>
          <div className="flex items-center gap-2">
            {showLanguageChoices ? (
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
            ) : null}
            <a
              href="https://zantap.app"
              className="inline-flex min-h-10 items-center gap-1.5 px-1 text-[11px] font-medium text-[#f4a623] transition hover:text-[#ffc35a] focus-visible:rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a623] sm:text-sm"
            >
              Visit zantap.app <ArrowUpRight size={15} aria-hidden />
            </a>
          </div>
        </header>

        {stepNumber ? (
          <div className="mt-8 flex items-center gap-5" aria-label={`Step ${stepNumber} of 3`}>
            <span className="shrink-0 text-sm font-medium text-[#f4a623]">
              {stepNumber} of 3
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#f4a623] transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${(stepNumber / 3) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {step === "START" ? (
          <section className="zt-list-in flex min-h-[78vh] flex-col justify-center py-12">
            <p className="mb-5 text-xs uppercase tracking-[.3em] text-[#f4a623]">
              Create your menu
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
                      ? "Add dishes, prices and photos."
                      : "Send photos, pages or a PDF."}
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
          <section className="zt-list-in py-10 sm:py-12">
            <h1 className="font-display text-4xl font-light leading-tight sm:text-5xl">
              Tell us about your business
            </h1>
            <p className="mt-3 text-base text-white/60">
              We’ll use this to contact you about your menu.
            </p>
            <div className="mt-8 space-y-5">
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
              <Field label="Phone number">
                <div className="mt-2 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
                  <select
                    aria-label="Country code"
                    value={draft.phoneDialCode}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        phoneDialCode: event.target.value,
                      })
                    }
                    className="min-h-12 min-w-0 rounded-xl border border-white/15 bg-[#141415] px-3 text-white outline-none transition focus:border-[#f4a623]"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.dialCode}>
                        {country.flag} {country.dialCode}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={draft.phone}
                    onChange={(event) =>
                      setDraft({ ...draft, phone: event.target.value })
                    }
                    className="min-h-12 min-w-0 rounded-xl border border-white/15 bg-white/[0.045] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#f4a623] focus:bg-white/[0.07]"
                    placeholder="788 123 456"
                  />
                </div>
              </Field>
              <Field label="Already on ZanTap?">
                <div className="mt-2 grid grid-cols-2 rounded-xl border border-white/15 bg-white/[0.03] p-1">
                  {([
                    [false, "Not yet"],
                    [true, "Yes"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={draft.alreadyOnZantap === value}
                      onClick={() =>
                        setDraft({ ...draft, alreadyOnZantap: value })
                      }
                      className={`min-h-11 rounded-lg text-sm transition ${draft.alreadyOnZantap === value ? "border border-[#f4a623]/60 bg-[#f4a623]/[0.07] text-[#f4a623]" : "text-white/70 hover:text-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
              nextDisabled={!detailsComplete}
            />
          </section>
        ) : null}

        {step === "MENU" && draft.path === "SELF_BUILD" ? (
          <section className="zt-list-in py-10 sm:py-12">
            <h1 className="font-display text-4xl font-light leading-tight sm:text-5xl">
              Add your dishes
            </h1>
            <p className="mt-3 text-sm text-white/55">
              You can change anything before you send.
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
                    <button
                      type="button"
                      aria-label={`Remove ${dish.name.trim() || `dish ${dishNumber}`}`}
                      onClick={() => removeDish(dish.clientId)}
                      className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4a623]"
                    >
                      <X size={18} aria-hidden />
                    </button>
                  </div>
                  {isOpen ? (
                    <div
                      id={`dish-${dish.clientId}`}
                      className="zt-list-in border-t border-white/10 px-5 pb-6 pt-1 sm:px-7"
                    >
                  <div className="mt-4 space-y-4">
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
                    <div className="grid grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)] gap-3">
                    <Field label="Price">
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
                  </div>
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
                    <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#f4a623]/70 text-sm text-[#f4a623] transition hover:bg-[#f4a623] hover:text-black focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#f4a623]">
                      <ImageIcon size={18} aria-hidden /> Add photos
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
                  <button
                    type="button"
                    aria-expanded={advancedDishIds.includes(dish.clientId)}
                    onClick={() =>
                      setAdvancedDishIds((value) =>
                        value.includes(dish.clientId)
                          ? value.filter((id) => id !== dish.clientId)
                          : [dish.clientId],
                      )
                    }
                    className="mt-5 flex min-h-12 w-full items-center justify-between rounded-xl border border-white/15 px-4 text-left text-sm text-white/75 transition hover:border-white/30 hover:text-white"
                  >
                    <span>Sizes &amp; extras</span>
                    <ChevronDown
                      size={17}
                      aria-hidden
                      className={`transition-transform ${advancedDishIds.includes(dish.clientId) ? "rotate-180" : ""}`}
                    />
                  </button>
                  {advancedDishIds.includes(dish.clientId) ? (
                  <div className="zt-list-in mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap gap-2">
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
                  </div>
                  ) : null}
                    </div>
                  ) : null}
                </article>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addDish}
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
          <section className="zt-list-in py-14">
            <p className="text-xs uppercase tracking-[.3em] text-[#f4a623]">
              02 · Send what you have
            </p>
            <h1 className="mt-4 font-display text-4xl font-light">
              Send photos, pages or a PDF.
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
          <section className="zt-list-in py-10 sm:py-12">
            <h1 className="font-display text-4xl font-light leading-tight sm:text-5xl">
              Review your menu
            </h1>
            <p className="mt-3 text-sm text-white/55">
              Check your dishes before you send.
            </p>
            {draft.path === "SELF_BUILD" && reviewIssues.length ? (
              <div className="mt-7 flex items-center gap-4 rounded-2xl border border-[#f4a623]/35 bg-[#f4a623]/[0.055] p-4" role="alert">
                <AlertCircle className="shrink-0 text-white/75" size={22} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">
                    {reviewIssues.length} {reviewIssues.length === 1 ? "thing" : "things"} to fix
                  </p>
                  <p className="mt-1 truncate text-sm text-white/55">
                    {reviewIssues[0]?.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => editDish(reviewIssues[0]!.clientId)}
                  className="min-h-11 shrink-0 text-sm font-medium text-[#f4a623]"
                >
                  Fix dish →
                </button>
              </div>
            ) : null}
            {draft.path === "SELF_BUILD" ? (
              <div className="mt-8 space-y-3">
                {paginatedDishes.items.map((dish, pageIndex) => {
                  const dishNumber = paginatedDishes.startIndex + pageIndex + 1;
                  return (
                    <article
                      key={dish.clientId}
                      className="flex items-center gap-4 rounded-[24px] border border-white/15 bg-white/[0.04] p-4"
                    >
                      <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[.18em] text-[#f4a623]">
                            Dish {dishNumber}
                          </p>
                          <h2 className="mt-1 truncate font-display text-2xl">
                            {dish.name || `Dish ${dishNumber}`}
                          </h2>
                          <p className="mt-1 text-xs text-white/45">
                            {[dish.category, dish.priceRwf ? `${dish.priceRwf.toLocaleString("en-RW")} RWF` : "No price"]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <div className="flex flex-none gap-1 max-sm:hidden">
                          <button
                            type="button"
                            onClick={() => editDish(dish.clientId)}
                            className="min-h-11 rounded-xl border border-white/15 px-3 text-xs text-[#f4a623]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Remove this dish?"))
                                removeDish(dish.clientId);
                            }}
                            className="min-h-11 rounded-xl px-3 text-xs text-white/50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 sm:hidden">
                        <button
                          type="button"
                          onClick={() => editDish(dish.clientId)}
                          className="min-h-10 text-sm text-[#f4a623]"
                        >
                          Edit
                        </button>
                        <span className="h-4 w-px bg-white/15" aria-hidden />
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Remove this dish?"))
                              removeDish(dish.clientId);
                          }}
                          className="min-h-10 text-sm text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                      </div>
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
                        variant="review"
                      />
                    </article>
                  );
                })}
                <button
                  type="button"
                  onClick={addDish}
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[#f4a623] text-sm text-[#f4a623]"
                >
                  <Plus size={18} aria-hidden /> Add another dish
                </button>
                {paginatedDishes.pageCount > 1 ? (
                  <ReviewPagination
                    page={paginatedDishes.page}
                    pageCount={paginatedDishes.pageCount}
                    onPage={setDishPage}
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-8 rounded-[24px] border border-white/15 bg-white/[0.04] p-5">
                <p className="font-display text-2xl">
                  {sourceFiles.length} {sourceFiles.length === 1 ? "file" : "files"} ready
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
                <button
                  type="button"
                  onClick={() => setStep("MENU")}
                  className="mt-4 min-h-11 text-sm text-[#f4a623]"
                >
                  Change files
                </button>
              </div>
            )}
            <p className="mt-6 text-sm text-white/55">
              We’ll contact {draft.contactName || "you"} at {canonicalPhone ? formatMenuIntakePhone(canonicalPhone) : "your number"}.
            </p>
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
              nextLabel={isSubmitting ? "Sending…" : t.submit}
              nextDisabled={
                isSubmitting ||
                (draft.path === "SELF_BUILD" && reviewIssues.length > 0)
              }
            />
          </section>
        ) : null}

        {step === "SENT" ? (
          <section className="zt-list-in flex min-h-[78vh] flex-col justify-center py-12">
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
                  Save this number: <strong className="text-white">{reference}</strong>.
                </p>
                <div className="mt-8 rounded-[24px] border border-white/15 bg-white/[0.04] p-5">
                  <p className="text-sm text-white/45">Current status</p>
                  <p className="mt-2 font-display text-2xl">
                    {vendorStatus(status)}
                  </p>
                </div>
                <a
                  href={buildMenuIntakeWhatsAppUrl(reference, draft.businessName)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] px-5 font-medium text-white transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
                >
                  <WhatsAppIcon /> Tell ZanTap
                </a>
                <p className="mt-2 text-center text-xs text-white/45">
                  Open the message, then tap Send.
                </p>
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

function ReviewPagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Review dish pages"
      className="grid min-h-14 grid-cols-[1fr_auto_1fr] items-center rounded-2xl border border-white/15 px-3 text-sm"
    >
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        className="min-h-11 justify-self-start px-2 text-[#f4a623] disabled:text-white/25"
      >
        Previous
      </button>
      <span className="px-2 text-white/55">
        Page {page + 1} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page === pageCount - 1}
        onClick={() => onPage(page + 1)}
        className="min-h-11 justify-self-end px-2 text-[#f4a623] disabled:text-white/25"
      >
        Next
      </button>
    </nav>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-6 w-6 text-[#25D366]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.4 11.8a8.4 8.4 0 0 1-12.5 7.3L3.6 20.4l1.3-4.2a8.4 8.4 0 1 1 15.5-4.4Z" />
      <path d="M8.2 7.8c.3-.3.7-.2.9.1l1.1 2c.1.3.1.6-.1.8l-.7.8c.7 1.5 1.8 2.6 3.3 3.3l.8-.7c.2-.2.6-.3.8-.1l2 1.1c.3.2.4.6.1.9-.7.9-1.8 1.3-2.9 1-3.3-.8-5.9-3.4-6.7-6.7-.3-1.1.1-2.2 1.4-2.5Z" />
    </svg>
  );
}

function FilePreviewGrid({
  files,
  onRemove,
  variant,
}: {
  files: File[];
  onRemove: (index: number) => void;
  variant: "dish" | "source" | "review";
}) {
  const [previews, setPreviews] = useState<
    { file: File; url?: string }[]
  >([]);

  useEffect(() => {
    const next = files.map((file) => ({
      file,
      url:
        file.type === "application/pdf"
          ? undefined
          : URL.createObjectURL(file),
    }));
    const publish = window.setTimeout(() => setPreviews(next), 0);
    return () => {
      window.clearTimeout(publish);
      next.forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [files]);

  if (!previews.length) return null;

  const visiblePreviews = variant === "review" ? previews.slice(0, 1) : previews;

  return (
    <div
      className={
        variant === "review"
          ? "order-first w-28 shrink-0"
          : `mt-3 grid gap-3 ${variant === "dish" ? "grid-cols-3" : "grid-cols-2"}`
      }
    >
      {visiblePreviews.map(({ file, url }, index) =>
        url ? (
          <div
            key={`${file.name}-${file.lastModified}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-black/30"
          >
            <Image
              src={url}
              alt={file.name}
              fill
              unoptimized
              sizes={variant === "dish" ? "120px" : "180px"}
              className="object-cover"
            />
            {variant !== "review" ? <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => onRemove(index)}
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/75 text-white shadow-lg transition hover:border-[#f4a623] hover:text-[#f4a623] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4a623]"
            >
              <X size={17} aria-hidden />
            </button> : null}
            {variant !== "review" ? <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-6 text-[11px] text-white/80">
              {file.name}
            </span> : null}
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
  nextDisabled = false,
}: {
  back: () => void;
  next: () => void | Promise<void>;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-10 grid grid-cols-[minmax(7rem,.75fr)_minmax(0,1.25fr)] gap-4 border-t border-white/[0.06] pt-7">
      <button
        type="button"
        onClick={back}
        className="min-h-14 rounded-xl border border-white/15 px-4 text-sm text-white transition hover:border-white/30 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => void next()}
        disabled={nextDisabled}
        className="min-h-14 rounded-xl bg-[#f4a623] px-5 font-medium text-black transition hover:bg-[#ffb52f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4a623] disabled:cursor-not-allowed disabled:bg-[#694915] disabled:text-white/45"
      >
        {nextLabel}
      </button>
    </div>
  );
}
