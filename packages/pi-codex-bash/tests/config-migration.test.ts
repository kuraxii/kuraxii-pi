import test from "node:test";
import assert from "node:assert/strict";
import { migrateCodexConversionConfigIfNeeded } from "../src/adapter/activation/config-migration.ts";
import { normalizeCodexConversionConfig } from "../src/adapter/activation/config.ts";
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CODEX_CONVERSION_CONFIG_BASENAME, readCodexConversionConfig } from "../src/adapter/activation/config-store.ts";

test("old flat config migrates to grouped config and respects disabled provider gate", () => {
	const migration = migrateCodexConversionConfigIfNeeded({
		useOnAllModels: true,
		useAdapterProviders: false,
		adapterProviders: [" My-Provider "],
		webSearch: false,
		adapterProviderCodexTools: false,
		backgroundShellWidget: false,
	});
	assert.equal(migration.migrated, true);
	const config = normalizeCodexConversionConfig(migration.config);
	assert.deepEqual(config.scope, { enabled: true });
	assert.deepEqual(config.tools, { customRustBinariesDir: "" });
	assert.equal(config.ui.toolRenaming, true);
	assert.equal(config.ui.backgroundShellWidget, false);
});

test("legacy grouped beta fields are ignored", () => {
	const migration = migrateCodexConversionConfigIfNeeded({
		beta: { codeMode: true, responsesLite: true },
	});
	assert.equal(migration.migrated, false);
	const config = normalizeCodexConversionConfig(migration.config);
	assert.deepEqual(config.scope, { enabled: false });
});

test("legacy PATH mode and unknown fields normalize as ordinary structured-tool config", () => {
	const config = normalizeCodexConversionConfig({
		mode: "path",
		unknownOldField: true,
	});
	assert.equal("mode" in config, false);
	assert.equal(CODEX_CONVERSION_CONFIG_BASENAME, "pi-codex-bash.json");
});

test("read migrates the legacy config name to the new one", () => {
	const dir = mkdtempSync(join(tmpdir(), "pi-codex-bash-migrate-"));
	try {
		const legacyPath = join(dir, "pi-codex-conversion.json");
		writeFileSync(legacyPath, JSON.stringify({ scope: { allProviders: "on" } }));
		const newPath = join(dir, "pi-codex-bash.json");
		assert.equal(existsSync(newPath), false);

		const config = readCodexConversionConfig(newPath);

		assert.equal(config.scope.enabled, true);
		assert.equal(existsSync(newPath), true);
		assert.equal(JSON.parse(readFileSync(newPath, "utf-8")).scope.enabled, true);
		assert.equal(existsSync(legacyPath), true, "legacy file is kept as backup");
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
