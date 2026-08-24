import type { CodexConversionConfig } from "../../adapter/activation/config.ts";
import { type ConfigSetting, toggle } from "./config-items-shared.ts";

export function buildDisplaySettings(
	config: CodexConversionConfig,
): ConfigSetting[] {
	return [
		toggle(
			"toolRenaming",
			"Tool naming",
			config.ui.toolRenaming,
			(enabled, current) => ({
				...current,
				ui: { ...current.ui, toolRenaming: enabled },
			}),
		),
		toggle(
			"backgroundShellWidget",
			"Background shells widget",
			config.ui.backgroundShellWidget,
			(enabled, current) => ({
				...current,
				ui: { ...current.ui, backgroundShellWidget: enabled },
			}),
		),
	];
}
