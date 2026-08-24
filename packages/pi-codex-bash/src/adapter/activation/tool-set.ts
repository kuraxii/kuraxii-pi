// Pi default tools the adapter replaces. read/edit/write stay active for the
// model; only bash is substituted by the shell adapter tools.
export const DEFAULT_TOOL_NAMES = ["bash"];

export const SHELL_ADAPTER_TOOL_NAMES = ["exec_command", "write_stdin"];
export const CORE_ADAPTER_TOOL_NAMES = [...SHELL_ADAPTER_TOOL_NAMES];
