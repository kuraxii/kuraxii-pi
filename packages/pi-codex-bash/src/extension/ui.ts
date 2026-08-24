import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { CodexConversionConfig } from "../adapter/activation/config.ts";
import { BACKGROUND_BASH_WIDGET_ID, registerBackgroundBashWidgetShortcuts, renderBackgroundBashWidget } from "../ui/background-bash-widget.ts";
import type { CodexExtensionRuntime } from "./runtime.ts";

export interface CodexUiController {
	clearBackgroundWidget(): void;
	renderBackgroundWidget(): void;
	applyConfig(config: CodexConversionConfig): void;
}

export function registerCodexUi(pi: ExtensionAPI, runtime: CodexExtensionRuntime): CodexUiController {
	let renderTimer: ReturnType<typeof setTimeout> | undefined;
	const clearBackgroundWidget = () => {
		if (renderTimer) clearTimeout(renderTimer);
		renderTimer = undefined;
		runtime.backgroundWidget.ctx?.ui.setWidget(BACKGROUND_BASH_WIDGET_ID, undefined);
	};
	const renderBackgroundWidget = () => {
		const ctx = runtime.backgroundWidget.ctx;
		if (!ctx) return;
		if (!runtime.state.config.ui.backgroundShellWidget) {
			clearBackgroundWidget();
			return;
		}
		renderBackgroundBashWidget(ctx, runtime.backgroundWidget, runtime.sessions);
	};

	registerBackgroundBashWidgetShortcuts(pi, runtime.backgroundWidget, runtime.sessions, runtime.state.config.ui, () => runtime.state.config.ui.backgroundShellWidget);
	runtime.sessions.onSessionChange((reason) => {
		if (!runtime.backgroundWidget.ctx || !runtime.state.config.ui.backgroundShellWidget) return;
		if (reason === "output") {
			if (renderTimer) return;
			renderTimer = setTimeout(() => {
				renderTimer = undefined;
				renderBackgroundWidget();
			}, 250);
			return;
		}
		if (renderTimer) clearTimeout(renderTimer);
		renderTimer = undefined;
		renderBackgroundWidget();
	});

	return {
		clearBackgroundWidget,
		renderBackgroundWidget,
		applyConfig(config) {
			if (!config.ui.backgroundShellWidget) clearBackgroundWidget();
			else renderBackgroundWidget();
		},
	};
}
