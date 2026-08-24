import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerCodexCommand } from "../ui/settings/command.ts";
import { registerCodexEvents } from "./events.ts";
import { createCodexExtensionRuntime } from "./runtime.ts";
import { registerCodexTools } from "./tools.ts";
import { registerCodexUi } from "./ui.ts";

export async function registerCodexConversion(pi: ExtensionAPI): Promise<void> {
	const runtime = createCodexExtensionRuntime();
	const tools = registerCodexTools(pi, runtime);
	const ui = registerCodexUi(pi, runtime);
	registerCodexCommand(pi, runtime.state, (config, _ctx) => {
		tools.applyConfig(config);
		ui.applyConfig(config);
	});
	registerCodexEvents(pi, runtime, tools, ui);
}
