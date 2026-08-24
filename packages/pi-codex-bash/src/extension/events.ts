import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readCodexConversionConfig } from "../adapter/activation/config-store.ts";
import { syncAdapter } from "../adapter/activation/activation.ts";
import { isAdapterRuntime, resolveCodexRuntimePlan } from "../adapter/activation/runtime-plan.ts";
import { isAdapterContextExcludedCustomMessage } from "../adapter/prompt/context-filter.ts";
import { hasNoSkillsFlag } from "../adapter/prompt/skills.ts";
import { extractPiPromptSkills, resolvePromptSkills } from "../prompt/build-system-prompt.ts";
import { maybeWarnLocalCheckoutVersion } from "../adapter/local-version-warning.ts";
import { initializeBashParser } from "../shell/bash.ts";
import type { CodexExtensionRuntime } from "./runtime.ts";
import type { CodexToolRegistration } from "./tools.ts";
import type { CodexUiController } from "./ui.ts";

function commandArg(args: unknown): string | undefined {
	if (!args || typeof args !== "object" || !("cmd" in args) || typeof args.cmd !== "string") return undefined;
	return args.cmd;
}

function isToolCallOnlyAssistantMessage(message: unknown): boolean {
	if (!message || typeof message !== "object" || !("role" in message) || message.role !== "assistant") return false;
	if (!("content" in message) || !Array.isArray(message.content) || message.content.length === 0) return false;
	return message.content.every((item) => typeof item === "object" && item !== null && "type" in item && item.type === "toolCall");
}

export function registerCodexEvents(
	pi: ExtensionAPI,
	runtime: CodexExtensionRuntime,
	tools: CodexToolRegistration,
	ui: CodexUiController,
): void {
	const { state, tracker, sessions } = runtime;
	sessions.onSessionExit((sessionId) => tracker.recordSessionFinished(sessionId));

	pi.on("session_start", async (event, ctx) => {
		initializeBashParser();
		runtime.backgroundWidget.ctx = ctx;
		state.cwd = ctx.cwd;
		state.config = readCodexConversionConfig();
		state.promptSkills = extractPiPromptSkills(ctx.getSystemPrompt());
		sessions.setBaseEnv(runtime.execEnv());
		tracker.clear();
		tools.ensureOptionalTools();
		ui.renderBackgroundWidget();
		syncAdapter(pi, ctx, state);
		if (event.reason === "startup") await maybeWarnLocalCheckoutVersion(ctx);
	});

	pi.on("model_select", async (_event, ctx) => {
		state.cwd = ctx.cwd;
		state.promptSkills = extractPiPromptSkills(ctx.getSystemPrompt());
		tools.ensureOptionalTools();
		syncAdapter(pi, ctx, state);
	});

	pi.on("message_start", async (event) => {
		if (event.message.role !== "toolResult" && !isToolCallOnlyAssistantMessage(event.message)) tracker.resetExplorationGroup();
	});
	pi.on("tool_execution_start", async (event) => {
		if (event.toolName !== "exec_command") {
			tracker.resetExplorationGroup();
			return;
		}
		const command = commandArg(event.args);
		if (command) tracker.recordStart(event.toolCallId, command);
	});
	pi.on("tool_execution_end", async (event) => {
		if (event.toolName === "exec_command") tracker.recordEnd(event.toolCallId);
	});

	pi.on("session_shutdown", async (_event, _ctx) => {
		const failures: unknown[] = [];
		await runShutdownStep(failures, () => ui.clearBackgroundWidget());
		runtime.backgroundWidget.ctx = undefined;
		await runShutdownStep(failures, () => sessions.shutdown());
		if (failures.length === 1) throw failures[0];
		if (failures.length > 1) throw new AggregateError(failures, "Codex extension shutdown failed");
	});
	pi.on("before_agent_start", async (event, ctx) => {
		const systemPrompt = event.systemPrompt;
		if (!isAdapterRuntime(resolveCodexRuntimePlan(state.config))) {
			return undefined;
		}
		const skills = resolvePromptSkills(event.systemPromptOptions?.skills, hasNoSkillsFlag() ? [] : state.promptSkills);
		return { systemPrompt: runtime.codexSystemPrompt(systemPrompt, ctx, skills, event.systemPromptOptions) };
	});
	pi.on("context", async (event) => {
		const messages = event.messages.filter((message) => !isAdapterContextExcludedCustomMessage(message));
		return { messages };
	});
}

async function runShutdownStep(failures: unknown[], action: () => unknown): Promise<void> {
	try {
		await action();
	} catch (error) {
		failures.push(error);
	}
}
