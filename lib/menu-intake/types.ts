import type {
  CreateVendorInput,
  MenuItemAddOnGroup,
  MenuItemSizeOption,
} from "@/lib/types";

export type MenuIntakeLocale = "en" | "rw" | "fr" | "sw";
export type MenuIntakePath = "SELF_BUILD" | "ASSISTED";
export type MenuIntakeStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "NEEDS_INFORMATION"
  | "READY_TO_IMPORT"
  | "IMPORTING"
  | "IMPORTED"
  | "CANCELLED";

export type MenuIntakeQuestionStatus =
  "UNANSWERED" | "ANSWERED" | "NEEDS_FOLLOW_UP";

export interface MenuIntakeDishDraft {
  clientId: string;
  name: string;
  category: string;
  description?: string;
  priceRwf: number;
  sizeOptions?: MenuItemSizeOption[];
  addOnGroups?: MenuItemAddOnGroup[];
  imageAttachmentIds?: string[];
}

export interface MenuIntakeRevisionContent {
  path: MenuIntakePath;
  dishes: MenuIntakeDishDraft[];
  assistedNotes?: string;
  helpNeeded?: string[];
  question?: string;
}

export interface SubmitMenuIntakeInput {
  businessName: string;
  contactName: string;
  phone: string;
  locale: MenuIntakeLocale;
  alreadyOnZantap: boolean;
  storefrontHint?: string;
  website?: string;
  content: MenuIntakeRevisionContent;
}

export interface CreateMenuIntakeInput extends Omit<
  SubmitMenuIntakeInput,
  "website"
> {
  reference: string;
  resumeTokenHash: string;
  resumeExpiresAt: Date;
}

export interface MenuIntakeRevision {
  id: string;
  intakeId: string;
  sequence: number;
  source: "VENDOR" | "OPERATOR";
  content: MenuIntakeRevisionContent;
  createdAt: Date;
}

export interface MenuIntakeAccess {
  id: string;
  intakeId: string;
  tokenHash: string;
  kind: "BROWSER" | "ONE_TIME";
  expiresAt: Date;
  lastActiveAt: Date;
  consumedAt?: Date;
  revokedAt?: Date;
}

export interface MenuIntakeAttachment {
  id: string;
  intakeId: string;
  revisionId?: string;
  kind: "DISH_IMAGE" | "SOURCE";
  dishClientId?: string;
  fileName: string;
  mime: string;
  byteLength: number;
  blobPath: string;
  createdAt: Date;
}

export interface MenuIntake {
  id: string;
  reference: string;
  status: MenuIntakeStatus;
  businessName: string;
  contactName: string;
  phone: string;
  locale: MenuIntakeLocale;
  alreadyOnZantap: boolean;
  storefrontHint?: string;
  destinationVendorId?: string;
  destinationVendorSlug?: string;
  currentRevision: number;
  createdAt: Date;
  updatedAt: Date;
  importedAt?: Date;
  cancelledAt?: Date;
  deletedAt?: Date;
}

export interface MenuIntakeQuestion {
  id: string;
  intakeId: string;
  revisionId?: string;
  question: string;
  status: MenuIntakeQuestionStatus;
  answer?: string;
  answeredBy?: string;
  answeredAt?: Date;
  deliveryMethod?: "WHATSAPP" | "CALL" | "MANUAL";
  createdAt: Date;
}

export interface MenuIntakeDetail {
  intake: MenuIntake;
  revisions: MenuIntakeRevision[];
  questions: MenuIntakeQuestion[];
  attachments: MenuIntakeAttachment[];
  contactLogs: MenuIntakeContactLog[];
}

export interface MenuIntakeContactLog {
  id: string;
  intakeId: string;
  kind: "QUESTION_REPLY" | "STATUS_NOTIFICATION" | "RESUME_LINK";
  message: string;
  operatorId: string;
  method: "WHATSAPP" | "CALL" | "MANUAL";
  createdAt: Date;
}

export interface LogMenuIntakeContactInput extends Omit<
  MenuIntakeContactLog,
  "id" | "createdAt"
> {
  at: Date;
}

export interface AddMenuIntakeAttachmentInput {
  intakeId: string;
  resumeTokenHash: string;
  kind: MenuIntakeAttachment["kind"];
  dishClientId?: string;
  fileName: string;
  mime: string;
  byteLength: number;
  blobPath: string;
  at: Date;
}

export interface CreateMenuIntakeAccessInput {
  intakeId: string;
  tokenHash: string;
  kind: MenuIntakeAccess["kind"];
  expiresAt: Date;
  at: Date;
}

export interface AddMenuIntakeRevisionInput {
  intakeId: string;
  resumeTokenHash: string;
  content: MenuIntakeRevisionContent;
  at: Date;
}

export interface AddMenuIntakeRevisionResult {
  intake: MenuIntake;
  revision: MenuIntakeRevision;
}

export interface CreateMenuIntakeResult {
  intake: MenuIntake;
  revision: MenuIntakeRevision;
  access: MenuIntakeAccess;
}

export type SubmitMenuIntakeResult =
  | {
      ok: true;
      intakeId: string;
      reference: string;
      resumeToken: string;
      status: "SUBMITTED";
    }
  | {
      ok: false;
      error:
        | "INVALID_IDENTITY"
        | "INVALID_PHONE"
        | "INVALID_LOCALE"
        | "INVALID_CONTENT"
        | "RATE_LIMITED"
        | "SUBMISSION_FAILED";
      message?: string;
    };

export type SubmitMenuIntakeRevisionResult =
  | {
      ok: true;
      intakeId: string;
      reference: string;
      revision: number;
      status: MenuIntakeStatus;
    }
  | {
      ok: false;
      error:
        | "INVALID_ACCESS"
        | "LOCKED"
        | "INVALID_CONTENT"
        | "RATE_LIMITED"
        | "SUBMISSION_FAILED";
      message?: string;
    };

export type MenuIntakeMatchDecision = "SKIP" | "ADD_NEW" | "UPDATE_EXISTING";

export interface MenuIntakeImportItem {
  intakeDishClientId: string;
  decision: MenuIntakeMatchDecision;
  existingMenuItemId?: string;
  reviewedDish: MenuIntakeDishDraft;
}

export interface MenuIntakeImportRequest {
  intakeId: string;
  idempotencyKey: string;
  destination:
    | { kind: "EXISTING"; vendorSlug: string }
    | { kind: "CREATE"; vendor: CreateVendorInput };
  items: MenuIntakeImportItem[];
}

export interface MenuIntakeImportItemResult {
  intakeDishClientId: string;
  outcome: "CREATED" | "UPDATED" | "SKIPPED";
  menuItemId?: string;
}

export interface MenuIntakeImportResult {
  intakeId: string;
  idempotencyKey: string;
  vendorSlug: string;
  status: "COMPLETED" | "FAILED";
  items: MenuIntakeImportItemResult[];
  error?: string;
}

export interface MenuIntakeMatchSuggestion {
  intakeDishClientId: string;
  kind: "NEW" | "POSSIBLE_MATCH";
  existingMenuItemId?: string;
  existingName?: string;
  reason?: "EXACT_NAME" | "CLOSE_NAME_CATEGORY";
  defaultDecision: "ADD_NEW" | "SKIP";
}

export interface UpdateMenuIntakeReviewInput {
  intakeId: string;
  status: Extract<
    MenuIntakeStatus,
    "IN_REVIEW" | "NEEDS_INFORMATION" | "READY_TO_IMPORT" | "CANCELLED"
  >;
  content?: MenuIntakeRevisionContent;
  destinationVendorSlug?: string;
  operator: string;
  at: Date;
}

export interface AnswerMenuIntakeQuestionInput {
  intakeId: string;
  questionId: string;
  answer: string;
  operator: string;
  status: Extract<MenuIntakeQuestionStatus, "ANSWERED" | "NEEDS_FOLLOW_UP">;
  deliveryMethod: "WHATSAPP" | "CALL" | "MANUAL";
  at: Date;
}
