export interface CodexConversionConfig {
	prompt: { heavySystemPromptOverwrite: boolean };
	scope: { enabled: boolean };
	tools: {
		customRustBinariesDir: string;
	};
	ui: {
		toolRenaming: boolean;
		backgroundShellWidget: boolean;
		backgroundShellToggleShortcut: string;
		backgroundShellPrevShortcut: string;
		backgroundShellNextShortcut: string;
		backgroundShellCloseShortcut: string;
	};
}

export const DEFAULT_CODEX_CONVERSION_CONFIG: CodexConversionConfig = {
	prompt: { heavySystemPromptOverwrite: false },
	scope: { enabled: false },
	tools: {
		customRustBinariesDir: "",
	},
	ui: {
		toolRenaming: true,
		backgroundShellWidget: true,
		backgroundShellToggleShortcut: "alt+w",
		backgroundShellPrevShortcut: "alt+q",
		backgroundShellNextShortcut: "alt+e",
		backgroundShellCloseShortcut: "alt+r",
	},
};

export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bool(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback;
}

function stringValue(value: unknown, fallback: string): string {
	return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function optionalString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const normalized = value.trim();
	return normalized && Buffer.byteLength(normalized) <= 512
		? normalized
		: undefined;
}

export function normalizeCustomRustBinariesDir(value: unknown): string {
	return optionalString(value) ?? "";
}

// The pre-rename `scope.allProviders` ("off"/"on") and the even older
// `additionalProviders` allowlist no longer exist; "on" maps to enabled.
function normalizeScopeEnabled(scope: Record<string, unknown>): boolean {
	const allProviders = scope["allProviders"];
	if (allProviders === "on" || allProviders === true) return true;
	if (allProviders === "off" || allProviders === false) return false;
	return bool(scope["enabled"], DEFAULT_CODEX_CONVERSION_CONFIG.scope.enabled);
}

export function normalizeCodexConversionConfig(
	value: unknown,
): CodexConversionConfig {
	if (!isObject(value)) return structuredClone(DEFAULT_CODEX_CONVERSION_CONFIG);
	const prompt = isObject(value["prompt"]) ? value["prompt"] : {};
	const scope = isObject(value["scope"]) ? value["scope"] : {};
	const tools = isObject(value["tools"]) ? value["tools"] : {};
	const ui = isObject(value["ui"]) ? value["ui"] : {};
	return {
		prompt: {
			heavySystemPromptOverwrite: bool(
				prompt["heavySystemPromptOverwrite"],
				DEFAULT_CODEX_CONVERSION_CONFIG.prompt.heavySystemPromptOverwrite,
			),
		},
		scope: {
			enabled: normalizeScopeEnabled(scope),
		},
		tools: {
			customRustBinariesDir: normalizeCustomRustBinariesDir(
				tools["customRustBinariesDir"],
			),
		},
		ui: {
			toolRenaming: bool(
				ui["toolRenaming"],
				bool(
					ui["toolRendering"],
					DEFAULT_CODEX_CONVERSION_CONFIG.ui["toolRenaming"],
				),
			),
			backgroundShellWidget: bool(
				ui["backgroundShellWidget"],
				DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellWidget"],
			),
			backgroundShellToggleShortcut: stringValue(
				ui["backgroundShellToggleShortcut"],
				DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellToggleShortcut"],
			),
			backgroundShellPrevShortcut: stringValue(
				ui["backgroundShellPrevShortcut"],
				DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellPrevShortcut"],
			),
			backgroundShellNextShortcut: stringValue(
				ui["backgroundShellNextShortcut"],
				DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellNextShortcut"],
			),
			backgroundShellCloseShortcut: stringValue(
				ui["backgroundShellCloseShortcut"],
				DEFAULT_CODEX_CONVERSION_CONFIG.ui["backgroundShellCloseShortcut"],
			),
		},
	};
}
