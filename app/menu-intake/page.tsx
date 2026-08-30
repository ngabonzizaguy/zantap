import type { Metadata } from "next";
import { MenuIntakeWizard } from "@/components/menu-intake/MenuIntakeWizard";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Create your menu | ZanTap",
  description: "Build your digital menu or send ZanTap what you already have.",
};

export default async function MenuIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ intake?: string; token?: string }>;
}) {
  const [access, settings] = await Promise.all([
    searchParams,
    getStore().getMarketingSiteSettings(),
  ]);
  return (
    <MenuIntakeWizard
      showLanguageChoices={settings.showMenuIntakeLanguageChoices}
      oneTimeAccess={
        access.intake && access.token
          ? { intakeId: access.intake, token: access.token }
          : undefined
      }
    />
  );
}
