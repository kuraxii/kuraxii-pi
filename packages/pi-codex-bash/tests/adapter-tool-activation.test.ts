import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_CODEX_CONVERSION_CONFIG, normalizeCodexConversionConfig } from "../src/adapter/activation/config.ts";
import { migrateCodexConversionConfigIfNeeded } from "../src/adapter/activation/config-migration.ts";
import { syncAdapter } from "../src/adapter/activation/activation.ts";
import { resolveCodexRuntimePlan } from "../src/adapter/activation/runtime-plan.ts";
import type { AdapterState } from "../src/adapter/activation/state.ts";

function createToolHarness(activeTools: string[]) {
	const registeredTools = new Set(activeTools);
	return {
		getActiveTools: () => activeTools,
		setActiveTools: (nextTools: string[]) => {
			activeTools = nextTools;
		},
		on: () => undefined,
		registerTool: (tool: { name: string }) => registeredTools.add(tool.name),
		activeTools: () => activeTools,
		registeredTools: () => registeredTools,
	};
}

function createAdapterState(overrides: Partial<AdapterState["config"]> = {}): AdapterState {
	return {
		enabled: false,
		cwd: process.cwd(),
		promptSkills: [],
		config: {
			...DEFAULT_CODEX_CONVERSION_CONFIG,
			...overrides,
			scope: { ...DEFAULT_CODEX_CONVERSION_CONFIG.scope, ...overrides.scope },
			tools: { ...DEFAULT_CODEX_CONVERSION_CONFIG.tools, ...overrides.tools },
		},
	};
}

function createContext(model: { provider: string; api: string; id: string; input?: string[] }) {
	return {
		hasUI: false,
		model,
	};
}

test("enabled activates the adapter for any model; disabled keeps Pi defaults", () => {
	const models = [
		{ provider: "openai-codex", api: "openai-codex-responses", id: "gpt-5.6-luna" },
		{ provider: "openai-codex", api: "openai-codex-responses", id: "gpt-5.5" },
		{ provider: "openai", api: "openai-responses", id: "gpt-5.6-luna" },
		{ provider: "litellm", api: "openai-responses", id: "gpt-5.6" },
		{ provider: "litellm", api: "openai-completions", id: "gpt-5.6" },
		{ provider: "anthropic", api: "anthropic", id: "claude-sonnet" },
	];

	for (const model of models) {
		const onPi = createToolHarness(["read", "bash", "edit", "write", "exec_command", "write_stdin", "parallel"]);
		const onState = createAdapterState({ scope: { enabled: true } });
		syncAdapter(onPi as never, createContext(model) as never, onState);

		assert.equal(onPi.activeTools().includes("exec_command"), true, JSON.stringify(model));
		assert.equal(onPi.activeTools().includes("write_stdin"), true, JSON.stringify(model));
		// Pi's read/edit/write stay active; only bash is replaced by the shell adapter tools.
		assert.equal(onPi.activeTools().includes("read"), true, JSON.stringify(model));
		assert.equal(onPi.activeTools().includes("edit"), true, JSON.stringify(model));
		assert.equal(onPi.activeTools().includes("write"), true, JSON.stringify(model));
		assert.equal(onPi.activeTools().includes("bash"), false, JSON.stringify(model));

		const offPi = createToolHarness(["read", "bash", "edit", "write", "exec_command", "write_stdin", "parallel"]);
		const offState = createAdapterState({ scope: { enabled: false } });
		syncAdapter(offPi as never, createContext(model) as never, offState);

		assert.equal(offPi.activeTools().includes("exec_command"), false, JSON.stringify(model));
		assert.equal(offPi.activeTools().includes("bash"), true, JSON.stringify(model));
	}
});

test("runtime plan is a pure global switch", () => {
	const on = createAdapterState({ scope: { enabled: true } }).config;
	const off = createAdapterState({ scope: { enabled: false } }).config;

	const onPlan = resolveCodexRuntimePlan(on);
	assert.equal(onPlan.kind, "normal");
	if (onPlan.kind === "normal") {
		assert.ok(onPlan.toolNames.includes("exec_command"));
		assert.ok(onPlan.toolNames.includes("write_stdin"));
	}

	const offPlan = resolveCodexRuntimePlan(off);
	assert.deepEqual({ kind: offPlan.kind }, { kind: "inactive" });
	assert.deepEqual(offPlan.toolNames, []);
});

test("disabling restores Pi's original tools including bash", () => {
	const pi = createToolHarness(["read", "bash", "edit", "write", "exec_command", "write_stdin", "parallel"]);
	const state = createAdapterState({ scope: { enabled: true } });
	syncAdapter(pi as never, createContext({ provider: "openai-codex", api: "openai-codex-responses", id: "gpt-5.6" }) as never, state);
	assert.equal(pi.activeTools().includes("bash"), false);

	state.config.scope.enabled = false;
	syncAdapter(pi as never, createContext({ provider: "openai-codex", api: "openai-codex-responses", id: "gpt-5.6" }) as never, state);
	assert.equal(pi.activeTools().includes("bash"), true);
	assert.equal(pi.activeTools().includes("exec_command"), false);
});

test("legacy scope.allProviders and useOnAllModels normalize to scope.enabled", () => {
	assert.equal(normalizeCodexConversionConfig({ scope: { allProviders: "on" } }).scope.enabled, true);
	assert.equal(normalizeCodexConversionConfig({ scope: { allProviders: "off" } }).scope.enabled, false);
	assert.equal(normalizeCodexConversionConfig({ scope: { enabled: true } }).scope.enabled, true);
	// Legacy flat config with useOnAllModels migrates to the grouped shape.
	const migration = migrateCodexConversionConfigIfNeeded({ useOnAllModels: true });
	assert.equal(migration.migrated, true);
	assert.equal((migration.config as { scope: { enabled: boolean } }).scope.enabled, true);
});
