import { normalizePhone } from "@/lib/format";

export function canProceedToPay(
  count: number,
  phone: string,
  sector: string,
  landmark: string
): boolean {
  return (
    count > 0 &&
    normalizePhone(phone).length >= 10 &&
    !!sector &&
    !!landmark.trim()
  );
}
