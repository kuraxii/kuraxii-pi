import type { CodexConversionConfig } from "./config.ts";
import {
	CORE_ADAPTER_TOOL_NAMES,
	SHELL_ADAPTER_TOOL_NAMES,
} from "./tool-set.ts";

interface RuntimePlanBase {
	kind: "inactive" | "normal";
	toolNames: string[];
	ownedToolNames: string[];
}

export interface InactiveRuntimePlan extends RuntimePlanBase {
	kind: "inactive";
	toolNames: [];
	prompt: undefined;
}

export interface NormalRuntimePlan extends RuntimePlanBase {
	kind: "normal";
	prompt: "normal";
}

export type CodexRuntimePlan = InactiveRuntimePlan | NormalRuntimePlan;

const ALL_ADAPTER_TOOL_NAMES = [
	...CORE_ADAPTER_TOOL_NAMES,
];

export const ALL_CODEX_ADAPTER_TOOL_NAMES = [
	...ALL_ADAPTER_TOOL_NAMES,
];

export function isAdapterRuntime(plan: CodexRuntimePlan): plan is NormalRuntimePlan {
	return plan.kind === "normal";
}

function normalToolNames(): string[] {
	return [...CORE_ADAPTER_TOOL_NAMES];
}

export function resolveCodexRuntimePlan(config: CodexConversionConfig): CodexRuntimePlan {
	const ownedToolNames = [
		...SHELL_ADAPTER_TOOL_NAMES,
	];
	const base = {
		ownedToolNames,
	};
	if (!config.scope.enabled) return { ...base, kind: "inactive", toolNames: [], prompt: undefined };
	return {
		...base,
		kind: "normal",
		toolNames: normalToolNames(),
		prompt: "normal",
	};
}
