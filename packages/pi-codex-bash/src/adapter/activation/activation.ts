import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AdapterState } from "./state.ts";
import { ALL_CODEX_ADAPTER_TOOL_NAMES, isAdapterRuntime, resolveCodexRuntimePlan, type CodexRuntimePlan } from "./runtime-plan.ts";
import { DEFAULT_TOOL_NAMES } from "./tool-set.ts";

export function syncAdapter(pi: ExtensionAPI, _ctx: ExtensionContext, state: AdapterState): CodexRuntimePlan {
	const plan = resolveCodexRuntimePlan(state.config);
	if (isAdapterRuntime(plan)) enableAdapter(pi, state, plan);
	else disableAdapter(pi, state, plan);
	return plan;
}

function enableAdapter(pi: ExtensionAPI, state: AdapterState, plan: Extract<CodexRuntimePlan, { kind: "normal" }>): void {
	const owned = state.enabled ? [...new Set([...(state.adapterOwnedToolNames ?? plan.ownedToolNames), ...plan.ownedToolNames])] : plan.ownedToolNames;
	const tools = mergeAdapterTools(pi.getActiveTools(), plan.toolNames, owned);
	if (!state.enabled) {
		state.previousToolNames = stripAdapterTools(pi.getActiveTools(), owned);
		state.enabled = true;
	}
	state.adapterOwnedToolNames = plan.ownedToolNames;
	pi.setActiveTools(tools);
}

function disableAdapter(pi: ExtensionAPI, state: AdapterState, plan: CodexRuntimePlan): void {
	const previous = state.previousToolNames?.length ? state.previousToolNames : DEFAULT_TOOL_NAMES;
	const owned = state.adapterOwnedToolNames ?? plan.ownedToolNames;
	if (state.enabled || pi.getActiveTools().some((name) => owned.includes(name))) {
		pi.setActiveTools(restoreTools(previous, pi.getActiveTools(), owned));
	}
	state.enabled = false;
	delete state.adapterOwnedToolNames;
}

export function mergeAdapterTools(activeTools: string[], adapterTools: string[], adapterOwnedTools: string[] = adapterTools): string[] {
	const owned = new Set([...adapterTools, ...adapterOwnedTools]);
	const preserved = activeTools.filter((name) => !DEFAULT_TOOL_NAMES.includes(name) && !owned.has(name));
	return [...adapterTools, ...preserved];
}

export function restoreTools(previousTools: string[], activeTools: string[], adapterOwnedTools: string[] = ALL_CODEX_ADAPTER_TOOL_NAMES): string[] {
	const restored = stripAdapterTools(previousTools, adapterOwnedTools);
	for (const name of activeTools) if (!adapterOwnedTools.includes(name) && !restored.includes(name)) restored.push(name);
	return restored;
}

export function stripAdapterTools(toolNames: string[], adapterOwnedTools: string[] = ALL_CODEX_ADAPTER_TOOL_NAMES): string[] {
	return toolNames.filter((name) => !adapterOwnedTools.includes(name));
}
