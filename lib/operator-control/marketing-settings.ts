import { getStore } from "@/lib/store";
import type {
  MarketingSiteSettings,
  UpdateMarketingSiteSettingsInput,
} from "@/lib/vendor/feature-and-profit-types";
import { auditOperatorAction } from "@/lib/operator-control/audit";

export async function getOperatorMarketingSiteSettings(): Promise<MarketingSiteSettings> {
  return getStore().getMarketingSiteSettings();
}

export async function updateOperatorMarketingSiteSettings(
  input: UpdateMarketingSiteSettingsInput
): Promise<MarketingSiteSettings> {
  const settings = await getStore().updateMarketingSiteSettings(input);
  await auditOperatorAction({
    action: "MARKETING_SETTINGS_UPDATE",
    detail: { fields: Object.keys(input) },
  });
  return settings;
}
