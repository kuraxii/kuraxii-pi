/**
 * pi 插件安装/卸载脚本
 *
 * 自动扫描 packages/ 和 skills/ 目录，安装/更新插件，删除不再存在的插件
 *
 * 用法:
 *   bun scripts/install.ts              # 同步插件
 *   bun scripts/install.ts uninstall    # 卸载全部
 */

import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, dirname, resolve, basename } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

const REPO_ROOT = dirname(import.meta.dir);
const GLOBAL_SETTINGS_PATH = join(homedir(), ".pi", "agent", "settings.json");

// ── 工具 ────────────────────────────────────────────────

function runPi(args: string[], cwd = REPO_ROOT) {
  const result = spawnSync("pi", args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env },
  });
  if (result.status !== 0) {
    console.error(`\n❌ pi ${args.join(" ")} 失败`);
    process.exit(result.status ?? 1);
  }
}

function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

// ── 元数据 ──────────────────────────────────────────────

interface KuraxiiMeta {
  type: "skill" | "extension";
  tags?: string[];
}

interface PluginEntry {
  name: string;       // 包名
  dir: string;        // 插件目录绝对路径
  dirName: string;    // 目录名
  meta: KuraxiiMeta;
}

function validateMeta(pkgDir: string): KuraxiiMeta | null {
  const pkgJson = readJson(join(pkgDir, "package.json"));
  if (!pkgJson) return null;

  const meta = pkgJson.kuraxii as KuraxiiMeta | undefined;
  if (!meta || !meta.type) return null;
  if (meta.type !== "skill" && meta.type !== "extension") return null;

  return meta;
}

// ── 扫描目录 ────────────────────────────────────────────

async function scanPlugins(): Promise<PluginEntry[]> {
  const plugins: PluginEntry[] = [];
  const scanDirs = ["packages", "skills"];

  for (const subDir of scanDirs) {
    const dir = join(REPO_ROOT, subDir);
    if (!existsSync(dir)) continue;

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pkgDir = join(dir, entry.name);
      const meta = validateMeta(pkgDir);
      if (!meta) continue;

      const pkgJson = readJson(join(pkgDir, "package.json"));
      plugins.push({
        name: pkgJson?.name || entry.name,
        dir: pkgDir,
        dirName: entry.name,
        meta,
      });
    }
  }

  return plugins;
}

// ── 获取已安装的包 ──────────────────────────────────────

function getInstalledSources(): string[] {
  const settings = readJson(GLOBAL_SETTINGS_PATH);
  if (!settings?.packages) return [];
  return settings.packages.map((p: any) => (typeof p === "string" ? p : p.source));
}

// ── 同步主流程 ──────────────────────────────────────────

async function cmdSync() {
  console.log("🔍 扫描 packages/ 和 skills/ ...");
  const plugins = await scanPlugins();
  const installed = getInstalledSources();

  console.log(`   发现: ${plugins.length} 个插件`);
  console.log(`   已安装: ${installed.length} 个\n`);

  // 第一遍：校验
  console.log("🔒 校验插件可信性...");
  const failed = plugins.filter((p) => !validateMeta(p.dir));
  if (failed.length > 0) {
    console.log(`\n❌ 发现 ${failed.length} 个不可信插件，安装终止`);
    console.log(`   原因: 缺少元数据，不是本仓库的插件\n`);
    process.exit(1);
  }
  console.log(" ✓ 全部通过\n");

  // 安装/更新
  console.log("📦 安装/更新插件:\n");
  for (const p of plugins) {
    console.log(`  • ${p.name}`);
    runPi(["install", p.dir]);
    console.log();
  }

  // 删除已卸载的（已安装、属于本仓库、但目录不再存在）
  const toRemove = installed
    .map((src) =>
      src.startsWith("./") || src.startsWith("../")
        ? resolve(dirname(GLOBAL_SETTINGS_PATH), src)
        : src
    )
    .filter((absSrc) => {
      // 只处理有 kuraxii 元数据的 skill/extension 插件
      if (!validateMeta(absSrc)) return false;
      const dirName = basename(absSrc);
      return !plugins.some((p) => p.dirName === dirName);
    });

  if (toRemove.length > 0) {
    console.log("🗑️  删除已移除的插件:\n");
    for (const src of toRemove) {
      console.log(`  → ${src}`);
      runPi(["remove", src]);
      console.log();
    }
  } else {
    console.log("✅ 没有多余的插件\n");
  }

  console.log("🎉 同步完成！");
}

// ── 卸载全部 ────────────────────────────────────────────

async function cmdUninstall() {
  const installed = getInstalledSources();
  if (installed.length === 0) {
    console.log("没有已安装的插件");
    return;
  }

  // 扫描已安装的包，找出属于本项目的（有 kuraxii 元数据）
  console.log("🔍 扫描已安装插件中的本项目插件...");
  const toRemove: string[] = [];

  for (const src of installed) {
    const absSrc = src.startsWith("./") || src.startsWith("../")
      ? resolve(dirname(GLOBAL_SETTINGS_PATH), src)
      : src;

    // 只处理有 kuraxii 元数据的 skill/extension 插件
    const meta = validateMeta(absSrc);
    if (meta) {
      toRemove.push(absSrc);
    }
  }

  if (toRemove.length === 0) {
    console.log("没有属于本项目的已安装插件");
    return;
  }

  console.log(`   发现 ${toRemove.length} 个\n`);
  console.log("🗑️  卸载中...\n");

  for (const src of toRemove) {
    const name = basename(src);
    console.log(`  → ${name}`);
    runPi(["remove", src]);
    console.log();
  }

  console.log(`🎉 已卸载全部 ${toRemove.length} 个本项目插件`);
}

// ── 入口 ────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0) {
  cmdSync();
} else if (args[0] === "uninstall") {
  cmdUninstall();
} else {
  console.error(`❌ 未知的子命令: "${args[0]}"`);
  console.log(`   用法: bun scripts/install.ts        # 同步插件`);
  console.log(`         bun scripts/install.ts uninstall  # 卸载全部`);
  process.exit(1);
}