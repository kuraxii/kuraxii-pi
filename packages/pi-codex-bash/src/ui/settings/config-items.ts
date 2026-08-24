import type { Theme } from "@earendil-works/pi-coding-agent";
import type { CodexConversionConfig } from "../../adapter/activation/config.ts";
import { buildAdapterSettings } from "./config-items-adapter.ts";
import { buildDisplaySettings } from "./config-items-display.ts";
import type { ConfigSetting } from "./config-items-shared.ts";
import type { SettingsTab } from "./tabs.ts";

export type { ConfigSetting } from "./config-items-shared.ts";

export function buildConfigSettings(
	tab: SettingsTab,
	config: CodexConversionConfig,
	theme: Theme,
): ConfigSetting[] {
	if (tab === "adapter") return buildAdapterSettings(config, theme);
	if (tab === "display") return buildDisplaySettings(config);
	return [];
}
