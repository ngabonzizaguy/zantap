export const BRIEFING_INTEREST_TYPES = [
  "Vendor",
  "Investor",
  "Sponsor",
  "Partner",
  "Other",
] as const;

export type BriefingInterestType = (typeof BRIEFING_INTEREST_TYPES)[number];

export interface BriefingInterestInput {
  grantId?: string;
  name: string;
  contact: string;
  interestType: BriefingInterestType;
  message: string;
}

export interface BriefingInterest extends BriefingInterestInput {
  id: string;
  createdAt: Date;
}

export interface BriefingInterestActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export interface BriefingInterestRepository {
  create(input: BriefingInterestInput): Promise<BriefingInterest>;
}

function clean(value: string, max: number): string {
  return value.trim().replace(/\r\n/g, "\n").slice(0, max);
}

export async function submitBriefingInterest(
  input: BriefingInterestInput,
  repository: BriefingInterestRepository
): Promise<BriefingInterest> {
  const normalized: BriefingInterestInput = {
    grantId: input.grantId,
    name: clean(input.name, 100),
    contact: clean(input.contact, 160),
    interestType: input.interestType,
    message: clean(input.message, 2_000),
  };
  if (!normalized.name || !normalized.contact || !normalized.message) {
    throw new Error("Name, contact details, and a message are required");
  }
  if (!BRIEFING_INTEREST_TYPES.includes(normalized.interestType)) {
    throw new Error("Choose a valid interest type");
  }

  return repository.create(normalized);
}
