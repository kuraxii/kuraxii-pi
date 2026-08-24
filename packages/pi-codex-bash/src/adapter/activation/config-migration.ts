import {
	DEFAULT_CODEX_CONVERSION_CONFIG,
	isObject,
	type CodexConversionConfig,
} from "./config.ts";

export function migrateCodexConversionConfigIfNeeded(value: unknown): { migrated: boolean; config: unknown } {
	if (!isObject(value)) return { migrated: false, config: value };
	if (isObject(value["scope"]) || isObject(value["tools"]) || isObject(value["ui"]) || isObject(value["compaction"]) || isObject(value["beta"]) || isObject(value["openai"])) {
		return { migrated: false, config: value };
	}
	const config: CodexConversionConfig = {
		...structuredClone(DEFAULT_CODEX_CONVERSION_CONFIG),
	scope: {
			enabled: value["useOnAllModels"] === true,
		},
		tools: {
			customRustBinariesDir: DEFAULT_CODEX_CONVERSION_CONFIG.tools["customRustBinariesDir"],
		},
		ui: {
			toolRenaming: DEFAULT_CODEX_CONVERSION_CONFIG.ui["toolRenaming"],
			backgroundShellWidget: typeof value["backgroundShellWidget"] === "boolean" ? value["backgroundShellWidget"] : DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellWidget"],
			backgroundShellToggleShortcut: stringValue(value["backgroundShellToggleShortcut"], DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellToggleShortcut"]),
			backgroundShellPrevShortcut: stringValue(value["backgroundShellPrevShortcut"], DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellPrevShortcut"]),
			backgroundShellNextShortcut: stringValue(value["backgroundShellNextShortcut"], DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellNextShortcut"]),
			backgroundShellCloseShortcut: stringValue(value["backgroundShellCloseShortcut"], DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellCloseShortcut"]),
		},
	};
	return { migrated: true, config };
}

function stringValue(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
