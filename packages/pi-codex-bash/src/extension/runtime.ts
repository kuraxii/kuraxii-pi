import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AdapterState } from "../adapter/activation/state.ts";
import { readCodexConversionConfig } from "../adapter/activation/config-store.ts";
import { getDefaultCodexRuntimeShell } from "../adapter/prompt/runtime-shell.ts";
import { buildCodexSystemPrompt, type PiSystemPromptOptions } from "../prompt/build-system-prompt.ts";
import { createExecCommandTracker } from "../tools/exec/command-state.ts";
import { createExecSessionManager } from "../tools/exec/session-manager.ts";
import { getBundledToolBinaryPath } from "../tools/native/binary.ts";
import type { BackgroundBashWidgetState } from "../ui/background-bash-widget.ts";

export type CodexContext = ExtensionContext;

export interface CodexExtensionRuntime {
	state: AdapterState;
	tracker: ReturnType<typeof createExecCommandTracker>;
	sessions: ReturnType<typeof createExecSessionManager>;
	backgroundWidget: BackgroundBashWidgetState;
	execEnv(): NodeJS.ProcessEnv;
	codexSystemPrompt(basePrompt: string, ctx: CodexContext, skills?: AdapterState["promptSkills"], systemPromptOptions?: PiSystemPromptOptions): string;
}

export function createCodexExtensionRuntime(): CodexExtensionRuntime {
	const state: AdapterState = {
		enabled: false,
		cwd: process.cwd(),
		promptSkills: [],
		config: readCodexConversionConfig(),
	};
	const tracker = createExecCommandTracker();
	const sessions = createExecSessionManager({
		env: { ...process.env },
		bridgeBinaryPath: () => getBundledToolBinaryPath("exec_bridge", {}, state.config.tools.customRustBinariesDir),
	});

	const runtime: CodexExtensionRuntime = {
		state,
		tracker,
		sessions,
		backgroundWidget: { folded: true },
		execEnv() {
			return { ...process.env };
		},
		codexSystemPrompt(basePrompt, _ctx, skills = state.promptSkills, systemPromptOptions) {
			return buildCodexSystemPrompt(basePrompt, {
				skills,
				shell: getDefaultCodexRuntimeShell(),
				heavySystemPromptOverwrite: state.config.prompt.heavySystemPromptOverwrite,
				systemPromptOptions,
			});
		},
	};
	return runtime;
}
