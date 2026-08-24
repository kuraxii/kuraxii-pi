import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { CodexConversionConfig } from "../adapter/activation/config.ts";
import { registerExecCommandTool } from "../tools/exec/command-tool.ts";
import { registerWriteStdinTool } from "../tools/exec/write-stdin-tool.ts";
import type { CodexExtensionRuntime } from "./runtime.ts";

export interface CodexToolRegistration {
	applyConfig(config: CodexConversionConfig): void;
	ensureOptionalTools(config?: CodexConversionConfig): void;
}

export function registerCodexTools(pi: ExtensionAPI, runtime: CodexExtensionRuntime): CodexToolRegistration {
	const renderOptions = (config: CodexConversionConfig) => ({ customRendering: config.ui.toolRenaming });
	const registerCore = (config: CodexConversionConfig) => {
		registerExecCommandTool(pi, runtime.tracker, runtime.sessions, {
			...renderOptions(config),
			showOutputWhenCollapsed: true,
		});
		registerWriteStdinTool(pi, runtime.sessions, { showOutputWhenCollapsed: true });
	};
	const ensureOptionalTools = () => {
		// No optional tools remain; kept as a no-op for the registration contract.
	};
	registerCore(runtime.state.config);
	ensureOptionalTools();
	return {
		ensureOptionalTools,
		applyConfig(config) {
			registerCore(config);
			ensureOptionalTools();
			runtime.sessions.setBaseEnv(runtime.execEnv());
		},
	};
}
