import { redirect } from "next/navigation";
import { OpsShell } from "@/components/ops/OpsShell";
import { isOpsSessionValid } from "@/lib/ops-auth/session";

export const dynamic = "force-dynamic";

export default async function OpsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isOpsSessionValid())) {
    redirect("/ops/login");
  }

  return <OpsShell>{children}</OpsShell>;
}
