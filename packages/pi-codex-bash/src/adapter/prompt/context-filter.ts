import type { AgentMessage } from "@earendil-works/pi-agent-core";
import type { CustomMessageEntry } from "@earendil-works/pi-coding-agent";

// No adapter-owned custom message types remain; kept as an empty boundary so
// future adapter display messages opt out of model context explicitly.
const ADAPTER_CONTEXT_EXCLUDED_CUSTOM_MESSAGE_TYPES = new Set<string>();

export function isAdapterContextExcludedCustomMessage(message: Pick<AgentMessage, "role"> & { customType?: string | undefined }): boolean {
	return message.role === "custom" && typeof message.customType === "string" && ADAPTER_CONTEXT_EXCLUDED_CUSTOM_MESSAGE_TYPES.has(message.customType);
}

export function isAdapterContextExcludedCustomMessageEntry(entry: CustomMessageEntry): boolean {
	return ADAPTER_CONTEXT_EXCLUDED_CUSTOM_MESSAGE_TYPES.has(entry.customType);
}
