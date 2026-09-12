import { LeadRoutingSettingsForm } from "@/components/ops/LeadRoutingSettingsForm";
import { MarketingSiteSettingsForm } from "@/components/ops/MarketingSiteSettingsForm";
import { SiteTranslationsEditor } from "@/components/ops/SiteTranslationsEditor";
import {
  getMarketingSiteSettings,
  listLeadRoutingRecipients,
  listSiteTranslations,
} from "@/lib/operator-client";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { flattenCopy } from "@/lib/i18n/localize";
import { BASELINE_TRANSLATIONS } from "@/lib/i18n/baselines";
import { KDS_COPY } from "@/lib/i18n/kds-copy";

export default async function OpsSettingsPage() {
  const [recipients, marketingSettings, translations] = await Promise.all([
    listLeadRoutingRecipients(),
    getMarketingSiteSettings(),
    listSiteTranslations(),
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
      <SiteTranslationsEditor
        surface="kds"
        englishSource={KDS_COPY}
        baselines={{}}
        overrides={translations}
      />
      <SiteTranslationsEditor
        englishSource={flattenCopy(MARKETING_COPY)}
        baselines={BASELINE_TRANSLATIONS}
        overrides={translations}
      />
    </div>
  );
}
