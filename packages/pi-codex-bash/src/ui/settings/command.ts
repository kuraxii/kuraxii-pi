import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { CodexConversionConfig } from "../../adapter/activation/config.ts";
import { readCodexConversionConfig, writeCodexConversionConfig } from "../../adapter/activation/config-store.ts";
import { syncAdapter } from "../../adapter/activation/activation.ts";
import type { AdapterState } from "../../adapter/activation/state.ts";
import { ROUTABLE_SETTINGS_TABS, parseSettingsTab, type SettingsTab } from "./tabs.ts";
import { openCodexSettingsScreen } from "./screen.ts";

const CODEX_COMMAND_COMPLETIONS = ROUTABLE_SETTINGS_TABS.map(({ id }) => id);
const CODEX_USAGE = "Usage: /codex [display]";

export function registerCodexCommand(
	pi: ExtensionAPI,
	state: AdapterState,
	onConfigApplied?: (config: CodexConversionConfig, ctx: ExtensionContext, previousConfig: CodexConversionConfig) => void,
): void {
	function saveAndApply(ctx: ExtensionContext, nextConfig: CodexConversionConfig): boolean {
		const writeResult = writeCodexConversionConfig(nextConfig);
		if (!writeResult.ok) {
			ctx.ui.notify(`Failed to save Codex settings: ${writeResult.error}`, "error");
			return false;
		}
		const previousConfig = state.config;
		state.config = nextConfig;
		onConfigApplied?.(nextConfig, ctx, previousConfig);
		syncAdapter(pi, ctx, state);
		return true;
	}

	async function openSettings(ctx: ExtensionContext, tab: SettingsTab): Promise<void> {
		if (!ctx.hasUI) {
			ctx.ui.notify(formatCodexSettings(state.config), "info");
			return;
		}
		await openCodexSettingsScreen(ctx, {
			initialConfig: state.config,
			initialTab: tab,
			onChange: (config) => saveAndApply(ctx, config),
		});
	}

	pi.registerCommand("codex", {
		description: "Configure Codex adapter settings",
		getArgumentCompletions: (prefix) =>
			CODEX_COMMAND_COMPLETIONS.filter((item) => item.startsWith(prefix.trim().toLowerCase())).map((value) => ({ label: value, value })),
		handler: async (args, ctx) => {
			state.config = readCodexConversionConfig();
			const arg = args.trim().toLowerCase();

			const tab = arg ? parseSettingsTab(arg) : "adapter";
			if (tab) {
				await openSettings(ctx, tab);
				return;
			}
			ctx.ui.notify(CODEX_USAGE, "warning");
		},
	});
}

function formatAllProvidersMode(value: CodexConversionConfig["scope"]["enabled"]): string {
	return value ? "on" : "off";
}

function formatCodexSettings(config: CodexConversionConfig): string {
	return `Codex settings: adapter ${formatAllProvidersMode(config.scope.enabled)}, Rust binaries ${config.tools.customRustBinariesDir || "bundled"}, heavy prompt overwrite ${config.prompt.heavySystemPromptOverwrite ? "on" : "off"}`;
}
