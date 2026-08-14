import { LeadRoutingSettingsForm } from "@/components/ops/LeadRoutingSettingsForm";
import { MarketingSiteSettingsForm } from "@/components/ops/MarketingSiteSettingsForm";
import {
  getMarketingSiteSettings,
  listLeadRoutingRecipients,
} from "@/lib/operator-client";

export default async function OpsSettingsPage() {
  const [recipients, marketingSettings] = await Promise.all([
    listLeadRoutingRecipients(),
    getMarketingSiteSettings(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Lead routing, marketing site, and platform configuration.
        </p>
      </div>
      <LeadRoutingSettingsForm recipients={recipients} />
      <MarketingSiteSettingsForm settings={marketingSettings} />
    </div>
  );
}
