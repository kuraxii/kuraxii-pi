import {
	type ExtensionContext,
	getSettingsListTheme,
	type Theme,
} from "@earendil-works/pi-coding-agent";
import { SettingsList, truncateToWidth } from "@earendil-works/pi-tui";
import type { CodexConversionConfig } from "../../adapter/activation/config.ts";
import { readCodexConversionConfig } from "../../adapter/activation/config-store.ts";
import { openCodexConfigInExternalEditor } from "./config-editor.ts";
import { buildConfigSettings, type ConfigSetting } from "./config-items.ts";
import { SETTINGS_TABS, type SettingsTab } from "./tabs.ts";

export interface CodexSettingsScreenOptions {
	initialConfig: CodexConversionConfig;
	onChange: (nextConfig: CodexConversionConfig) => boolean;
	initialTab?: SettingsTab | undefined;
}

export async function openCodexSettingsScreen(
	ctx: ExtensionContext,
	options: CodexSettingsScreenOptions,
): Promise<void> {
	let draft = options.initialConfig;
	let activeTab: SettingsTab = options.initialTab ?? "adapter";

	await ctx.ui.custom<void>((tui, theme, _kb, done) => {
		let settingsList: SettingsList;

		const runEditConfig = async () => {
			if (!options.onChange(draft)) {
				ctx.ui.notify(
					"Could not save settings before opening editor",
					"warning",
				);
				return;
			}
			const result = await openCodexConfigInExternalEditor(
				() => tui.stop(),
				() => tui.start(),
				(full) => tui.requestRender(full),
			);
			if (!result.ok) {
				ctx.ui.notify(result.error, "warning");
				return;
			}
			draft = readCodexConversionConfig();
			options.onChange(draft);
			settingsList = createSettingsList();
			tui.requestRender(true);
		};

		const createSettingsList = () => {
			let list: SettingsList;
			const buildSettings = (): ConfigSetting[] => [
				...buildConfigSettings(activeTab, draft, theme),
			];
			list = new SettingsList(
				buildSettings().map(({ item }) => item),
				8,
				getSettingsListTheme(),
				(id, value) => {
					const definition = buildSettings().find(({ item }) => item.id === id);
					if (definition?.action === "edit-config") {
						void runEditConfig();
						return;
					}
					if (!definition?.update) return;
					const previousValue = definition.item.currentValue;
					const nextDraft = definition.update(value, draft);
					if (options.onChange(nextDraft)) {
						draft = nextDraft;
						const nextValue = buildSettings().find(({ item }) => item.id === id)
							?.item.currentValue;
						if (nextValue !== undefined) list.updateValue(id, nextValue);
					} else {
						list.updateValue(id, previousValue);
					}
					tui.requestRender();
				},
				() => done(undefined),
			);
			return list;
		};

		const activateTab = (tab: SettingsTab) => {
			activeTab = tab;
			settingsList = createSettingsList();
			tui.requestRender();
		};

		settingsList = createSettingsList();

		return {
			render: (width: number) => {
				const settingsLines = settingsList.render(width);
				return [
					rule(width, theme, "accent"),
					formatTabs(activeTab, theme),
					rule(width, theme, "borderMuted"),
					"",
					...withSettingsFooter(settingsLines, theme),
					rule(width, theme, "accent"),
				].map((line) => truncateToWidth(line, width, ""));
			},
			invalidate: () => settingsList.invalidate(),
			handleInput: (data: string) => {
				if (data === "\t") {
					const currentIndex = SETTINGS_TABS.findIndex(
						({ id }) => id === activeTab,
					);
					activateTab(
						SETTINGS_TABS[(currentIndex + 1) % SETTINGS_TABS.length]?.id ??
							"adapter",
					);
					return;
				}
				settingsList.handleInput?.(data);
				tui.requestRender();
			},
		};
	});
}

function rule(
	width: number,
	theme: Theme,
	color: "accent" | "borderMuted",
): string {
	return theme.fg(color, "─".repeat(Math.max(0, width)));
}

function formatTabs(activeTab: SettingsTab, theme: Theme): string {
	return `  ${SETTINGS_TABS.map(({ id, label }) => (id === activeTab ? theme.bold(label) : theme.fg("dim", label))).join(`  ${theme.fg("dim", "/")}  `)}`;
}

function withSettingsFooter(lines: string[], theme: Theme): string[] {
	const next = [...lines];
	for (let index = next.length - 1; index >= 0; index -= 1) {
		if (next[index]?.includes("Enter/Space")) {
			next[index] = theme.fg(
				"dim",
				"  Enter/Space to change · Esc to close · Tab to switch sections",
			);
			break;
		}
	}
	return next;
}
