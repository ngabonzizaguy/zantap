import type { Metadata } from "next";
import { MenuIntakeWizard } from "@/components/menu-intake/MenuIntakeWizard";

export const metadata: Metadata = {
  title: "Create your menu | ZanTap",
  description: "Build your digital menu or send ZanTap what you already have.",
};

export default async function MenuIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ intake?: string; token?: string }>;
}) {
  const access = await searchParams;
  return (
    <MenuIntakeWizard
      oneTimeAccess={
        access.intake && access.token
          ? { intakeId: access.intake, token: access.token }
          : undefined
      }
    />
  );
}
