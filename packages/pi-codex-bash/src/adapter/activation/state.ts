import type { PromptSkill } from "../../prompt/build-system-prompt.ts";
import type { CodexConversionConfig } from "./config.ts";

export interface AdapterState {
	enabled: boolean;
	cwd: string;
	adapterOwnedToolNames?: string[] | undefined;
	previousToolNames?: string[] | undefined;
	promptSkills: PromptSkill[];
	config: CodexConversionConfig;
}
