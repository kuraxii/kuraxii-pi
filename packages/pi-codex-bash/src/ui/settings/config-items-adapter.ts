import type { Theme } from "@earendil-works/pi-coding-agent";
import type { CodexConversionConfig } from "../../adapter/activation/config.ts";
import { editorCommand } from "./config-editor.ts";
import {
	type ConfigSetting,
	setting,
} from "./config-items-shared.ts";

export function buildAdapterSettings(
	config: CodexConversionConfig,
	_theme: Theme,
): ConfigSetting[] {
	return [
		setting(
			{
				id: "enabled",
				label: "Enabled",
				currentValue: config.scope.enabled ? "on" : "off",
				values: ["off", "on"],
			},
			(value, current) => ({
				...current,
				scope: {
					...current.scope,
					enabled: value === "on",
				},
			}),
		),
		setting(
			{
				id: "heavySystemPromptOverwrite",
				label: "Heavy system prompt overwrite",
				currentValue: config.prompt.heavySystemPromptOverwrite
					? "on (40% smaller)"
					: "off",
				values: ["off", "on (40% smaller)"],
			},
			(value, current) => ({
				...current,
				prompt: {
					...current.prompt,
					heavySystemPromptOverwrite: value !== "off",
				},
			}),
		),
		{
			item: {
				id: "editConfig",
				label: "Edit config",
				currentValue: editorCommand()
					? "Opens in default editor (please /reload)"
					: "Set $EDITOR",
				values: editorCommand() ? ["Open"] : ["Unavailable"],
			},
			action: "edit-config",
		},
	];
}

