import { MenuIntakeReview } from "@/components/ops/MenuIntakeReview";
import { suggestMenuIntakeMatches } from "@/lib/menu-intake/matching";
import { getStore } from "@/lib/store";

export default async function OpsMenuIntakesPage({
  searchParams,
}: {
  searchParams: Promise<{ intake?: string }>;
}) {
  const store = getStore();
  const intakes = await store.listMenuIntakes();
  const requested = (await searchParams).intake;
  const selected = requested || intakes[0]?.id;
  const detail = selected ? await store.getMenuIntake(selected) : null;
  const vendors = await store.listVendors();
  const menu = detail?.intake.destinationVendorSlug
    ? await store.getMenu(detail.intake.destinationVendorSlug)
    : [];
  const latest = detail?.revisions.at(-1)?.content;
  const suggestions = latest ? suggestMenuIntakeMatches(latest.dishes, menu) : [];
  return (
    <MenuIntakeReview
      intakes={intakes}
      detail={detail}
      vendors={vendors}
      suggestions={suggestions}
    />
  );
}
