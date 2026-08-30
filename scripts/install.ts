/**
 * pi 插件安装/卸载脚本
 *
 * 自动扫描 packages/ 和 skills/ 目录，安装/更新插件，删除不再存在的插件
 *
 * 用法:
 *   bun scripts/install.ts              # 同步插件
 *   bun scripts/install.ts uninstall    # 卸载全部
 */

import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, dirname, resolve, basename, isAbsolute } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";

const REPO_ROOT = dirname(import.meta.dir);
const GLOBAL_SETTINGS_PATH = join(homedir(), ".pi", "agent", "settings.json");
const SETTINGS_DIR = dirname(GLOBAL_SETTINGS_PATH);
const INSTALL_ROOT = join(homedir(), ".pi", "agent", "kuraxii");

/** 将 settings.json 中记录的相对路径（相对 ~/.pi/agent/）解析为绝对路径 */
function resolveSource(source: string): string {
  if (source.startsWith("npm:") || source.startsWith("git:")) return source;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(source)) return source; // http(s):// 等 URL
  if (isAbsolute(source)) return source;
  return resolve(SETTINGS_DIR, source);
}

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

function copyDir(src: string, dst: string) {
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dirname(dst), { recursive: true });
  const result = spawnSync("cp", ["-a", src, dst], { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n❌ 复制失败: ${src} → ${dst}`);
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
  dir: string;        // 插件目录绝对路径（仓库源码）
  dirName: string;    // 目录名
  category: "packages" | "skills"; // 所属子目录
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
  const scanDirs = ["packages", "skills"] as const;

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
        category: subDir,
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

// ── 包元数据校验与 skill 过滤 ──────────────────────────

/**
 * 遍历全局 settings.json 中的已安装包：
 * 对 skill 类型插件改写为对象形式 {source, skills: []}，使其不自动加载，
 * 但仍保持在 settings 中供 selector 通过 discover() 发现。
 * 非本仓库插件或目录已失效的条目保持不变（失效目录交由清理处理）。
 */
function validateAndFilterPackages(): void {
  const settings = readJson(GLOBAL_SETTINGS_PATH);
  if (!settings || !Array.isArray(settings.packages)) return;

  let changed = false;
  const nextPackages = settings.packages.map((entry: any) => {
    const source = typeof entry === "string" ? entry : entry?.source;
    if (!source) return entry;

    // 解析为绝对路径
    const absSrc = resolveSource(source);

    const meta = existsSync(absSrc) ? validateMeta(absSrc) : null;
    if (!meta) return entry; // 非本仓库插件或目录已失效（交由清理处理）
    if (meta.type !== "skill") return entry; // extension 类型，保持原样

    changed = true;
    if (typeof entry === "string") return { source, skills: [] };
    return { ...entry, skills: [] };
  });

  if (!changed) return;
  settings.packages = nextPackages;
  writeFileSync(GLOBAL_SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

// ── 清理安装副本目录 ────────────────────────────────────

async function pruneInstallRoot(plugins: PluginEntry[]) {
  for (const category of ["packages", "skills"] as const) {
    const dir = join(INSTALL_ROOT, category);
    if (!existsSync(dir)) continue;

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const stillCurrent = plugins.some(
        (p) => p.category === category && p.dirName === entry.name,
      );
      if (!stillCurrent) {
        console.log(`🗑️  删除已移除插件的副本: ${join(dir, entry.name)}`);
        rmSync(join(dir, entry.name), { recursive: true, force: true });
      }
    }
  }
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

  // 安装/更新：先复制到 ~/.pi/agent/kuraxii/，再安装副本（不引用仓库源码）
  console.log(`📦 安装/更新插件 (→ ${INSTALL_ROOT}):\n`);
  for (const p of plugins) {
    const targetDir = join(INSTALL_ROOT, p.category, p.dirName);
    console.log(`  • ${p.name}`);
    copyDir(p.dir, targetDir);
    runPi(["install", targetDir]);
    console.log();
  }

  // 技能包过滤：已安装但默认不自动加载，仅供选择器按需发现
  validateAndFilterPackages();

  // 清理安装副本目录中已不在仓库的插件
  await pruneInstallRoot(plugins);

  console.log("🔍 检查已移除/失效的插件...");
  const toRemove = installed
    .map((src) => resolveSource(src))
    .filter((absSrc) => {
      const dirName = basename(absSrc);
      const current = plugins.find((p) => p.dirName === dirName);
      if (current) {
        // 仍在仓库中：仅当指向的不是新安装副本时移除（旧位置残留，如仓库源码）
        return absSrc !== join(INSTALL_ROOT, current.category, current.dirName);
      }
      // 已不在仓库中：仅当还能读到 kuraxii 元数据时移除（确认是本仓库插件）
      return validateMeta(absSrc) !== null;
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

  // 扫描已安装的包，找出属于本项目的（有 kuraxii 元数据）
  console.log("🔍 扫描已安装插件中的本项目插件...");
  const toRemove: string[] = [];

  for (const src of installed) {
    const absSrc = resolveSource(src);

    // 只处理有 kuraxii 元数据的 skill/extension 插件
    const meta = validateMeta(absSrc);
    if (meta) {
      toRemove.push(absSrc);
    }
  }

  if (toRemove.length > 0) {
    console.log(`   发现 ${toRemove.length} 个\n`);
    console.log("🗑️  卸载中...\n");

    for (const src of toRemove) {
      console.log(`  → ${basename(src)}`);
      runPi(["remove", src]);
      console.log();
    }
  } else {
    console.log("没有属于本项目的已安装插件");
  }

  // 删除安装副本目录
  if (existsSync(INSTALL_ROOT)) {
    console.log(`🗑️  删除安装副本目录 ${INSTALL_ROOT}`);
    rmSync(INSTALL_ROOT, { recursive: true, force: true });
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