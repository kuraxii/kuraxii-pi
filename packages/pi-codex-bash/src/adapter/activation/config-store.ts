import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { migrateCodexConversionConfigIfNeeded } from "./config-migration.ts";
import { DEFAULT_CODEX_CONVERSION_CONFIG, normalizeCodexConversionConfig, type CodexConversionConfig } from "./config.ts";

export const CODEX_CONVERSION_CONFIG_BASENAME = "pi-codex-bash.json";
// The pre-rename package wrote pi-codex-conversion.json. Read falls back to it
// and migrates the document to the new name so existing users keep settings.
export const LEGACY_CODEX_CONVERSION_CONFIG_BASENAME = "pi-codex-conversion.json";
export const PACKAGE_LOG_PREFIX = "[pi-codex-bash]";

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeConfigDocument(existing: Record<string, unknown>, owned: Record<string, unknown>): Record<string, unknown> {
	const merged = { ...existing };
	for (const [key, value] of Object.entries(owned)) {
		const previous = merged[key];
		merged[key] = isRecord(previous) && isRecord(value)
			? mergeConfigDocument(previous, value)
			: value;
	}
	return merged;
}

export function getCodexConversionConfigPath(agentDir: string = getAgentDir()): string {
	return join(agentDir, CODEX_CONVERSION_CONFIG_BASENAME);
}

function getLegacyCodexConversionConfigPath(agentDir: string): string {
	return join(agentDir, LEGACY_CODEX_CONVERSION_CONFIG_BASENAME);
}

export function readCodexConversionConfig(configPath: string = getCodexConversionConfigPath()): CodexConversionConfig {
	const legacyPath = getLegacyCodexConversionConfigPath(dirname(configPath));
	if (!existsSync(configPath) && existsSync(legacyPath)) {
		try {
			const parsed = JSON.parse(readFileSync(legacyPath, "utf-8")) as unknown;
			const migration = migrateCodexConversionConfigIfNeeded(parsed);
			const config = normalizeCodexConversionConfig(migration.config);
			writeCodexConversionConfig(config, configPath);
			return config;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.warn(`${PACKAGE_LOG_PREFIX} Failed to migrate ${legacyPath}: ${message}`);
		}
	}
	if (!existsSync(configPath)) return structuredClone(DEFAULT_CODEX_CONVERSION_CONFIG);
	try {
		const parsed = JSON.parse(readFileSync(configPath, "utf-8")) as unknown;
		const migration = migrateCodexConversionConfigIfNeeded(parsed);
		return normalizeCodexConversionConfig(migration.config);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`${PACKAGE_LOG_PREFIX} Failed to read ${configPath}: ${message}`);
		return structuredClone(DEFAULT_CODEX_CONVERSION_CONFIG);
	}
}

export function writeCodexConversionConfig(
	config: CodexConversionConfig,
	configPath: string = getCodexConversionConfigPath(),
): { ok: true } | { ok: false; error: string } {
	const temporaryPath = `${configPath}.${process.pid}.${Date.now()}.tmp`;
	try {
		mkdirSync(dirname(configPath), { recursive: true });
		const normalized = normalizeCodexConversionConfig(config) as unknown as Record<string, unknown>;
		let document = normalized;
		if (existsSync(configPath)) {
			try {
				const existing = JSON.parse(readFileSync(configPath, "utf-8")) as unknown;
				if (isRecord(existing)) document = mergeConfigDocument(existing, normalized);
			} catch {
				// A valid explicit settings write replaces an unreadable document.
			}
		}
		writeFileSync(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, {
			encoding: "utf-8",
			mode: 0o600,
		});
		renameSync(temporaryPath, configPath);
		return { ok: true };
	} catch (error) {
		try {
			rmSync(temporaryPath, { force: true });
		} catch {
			// Keep the original write error.
		}
		const message = error instanceof Error ? error.message : String(error);
		console.warn(`${PACKAGE_LOG_PREFIX} Failed to write ${configPath}: ${message}`);
		return { ok: false, error: message };
	}
}
