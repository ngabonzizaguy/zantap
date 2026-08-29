import { canonicalizePhone } from "@/lib/format";
import { validateCreateMenuItemInput } from "@/lib/menu/validation";
import type {
  MenuIntakeDishDraft,
  MenuIntakeLocale,
  MenuIntakeRevisionContent,
  SubmitMenuIntakeInput,
} from "@/lib/menu-intake/types";

export type MenuIntakeSubmissionError =
  "INVALID_IDENTITY" | "INVALID_PHONE" | "INVALID_LOCALE" | "INVALID_CONTENT";

export type MenuIntakeSubmissionValidation =
  | { ok: true; value: Omit<SubmitMenuIntakeInput, "website"> }
  | { ok: false; error: MenuIntakeSubmissionError; message: string };

const LOCALES = new Set<MenuIntakeLocale>(["en", "rw", "fr", "sw"]);

function requiredText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned && cleaned.length <= maxLength ? cleaned : null;
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function normalizeDish(dish: MenuIntakeDishDraft): MenuIntakeDishDraft | null {
  const clientId = requiredText(dish?.clientId, 80);
  const name = requiredText(dish?.name, 120);
  const category = requiredText(dish?.category, 80);
  if (!clientId || !name || !category) return null;

  const normalized: MenuIntakeDishDraft = {
    clientId,
    name,
    category,
    description: optionalText(dish.description, 500),
    priceRwf: dish.priceRwf,
    sizeOptions: dish.sizeOptions,
    addOnGroups: dish.addOnGroups,
    imageAttachmentIds: dish.imageAttachmentIds?.slice(0, 6),
  };
  const validationError = validateCreateMenuItemInput(normalized);
  return validationError ? null : normalized;
}

export function validateMenuIntakeContent(
  content: MenuIntakeRevisionContent,
):
  | { ok: true; value: MenuIntakeRevisionContent }
  | { ok: false; error: "INVALID_CONTENT"; message: string } {
  const path = content?.path;
  if (path !== "SELF_BUILD" && path !== "ASSISTED") {
    return {
      ok: false,
      error: "INVALID_CONTENT",
      message: "Choose how to create the menu",
    };
  }
  const dishes = (content.dishes ?? []).map(normalizeDish);
  if (
    dishes.some((dish) => !dish) ||
    (path === "SELF_BUILD" && dishes.length === 0)
  ) {
    return {
      ok: false,
      error: "INVALID_CONTENT",
      message: "Check the menu items and prices",
    };
  }
  const assistedNotes = optionalText(content.assistedNotes, 2_000);
  const helpNeeded = content.helpNeeded
    ?.map((value) => optionalText(value, 100))
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);
  if (
    path === "ASSISTED" &&
    !assistedNotes &&
    !helpNeeded?.length &&
    dishes.length === 0
  ) {
    return {
      ok: false,
      error: "INVALID_CONTENT",
      message: "Tell us what help you need",
    };
  }
  return {
    ok: true,
    value: {
      path,
      dishes: dishes as MenuIntakeDishDraft[],
      assistedNotes,
      helpNeeded,
      question: optionalText(content.question, 1_000),
    },
  };
}

export function validateMenuIntakeSubmission(
  input: SubmitMenuIntakeInput,
): MenuIntakeSubmissionValidation {
  const businessName = requiredText(input?.businessName, 120);
  const contactName = requiredText(input?.contactName, 100);
  if (!businessName || !contactName) {
    return {
      ok: false,
      error: "INVALID_IDENTITY",
      message: "Business and contact names are required",
    };
  }

  const phone = canonicalizePhone(
    typeof input?.phone === "string" ? input.phone : "",
  );
  if (!/^\d{8,15}$/.test(phone)) {
    return {
      ok: false,
      error: "INVALID_PHONE",
      message: "Enter a valid phone number",
    };
  }
  if (!LOCALES.has(input.locale)) {
    return {
      ok: false,
      error: "INVALID_LOCALE",
      message: "Choose a supported language",
    };
  }

  const content = validateMenuIntakeContent(input.content);
  if (!content.ok) return content;

  return {
    ok: true,
    value: {
      businessName,
      contactName,
      phone,
      locale: input.locale,
      alreadyOnZantap: Boolean(input.alreadyOnZantap),
      storefrontHint: optionalText(input.storefrontHint, 200),
      content: content.value,
    },
  };
}
