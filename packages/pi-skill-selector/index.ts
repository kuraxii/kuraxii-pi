/**
 * pi-skill-selector
 *
 * 技能选择器插件。职责：
 * 1. 发现已安装的 skill 插件（通过动态 import discover() 接口）
 * 2. 提供交互式命令 /skill-selector：复选框勾选安装/取消技能
 * 3. 提供工具供 LLM 驱动安装/卸载技能
 * 4. 技能以软链接方式安装到项目 .pi/skills/ 目录，取消勾选即卸载
 */

import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList, Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { symlink, mkdir, readFile, readdir, lstat, rm, unlink } from "node:fs/promises";
import { join, dirname, isAbsolute, resolve } from "node:path";
import { homedir } from "node:os";
import { existsSync, readFileSync } from "node:fs";

// ── 类型 ────────────────────────────────────────────────

interface SkillMeta {
  name: string;
  overview: string;
  sourceDir: string;
  pluginName: string;
  tags: string[];
}

interface ResolvedPackage {
  name: string;
  entryPoint: string;
  overview?: string;
}

// ── 入口 ────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // ── 命令: /skill-selector 复选框交互式安装/卸载 ──

  pi.registerCommand("skill-selector", {
    description: "勾选/取消技能：软链接安装或卸载到项目 .pi/skills/",
    handler: async (_args, ctx) => {
      if (ctx.mode !== "tui") {
        ctx.ui.notify("/skill-selector 需要 TUI 模式", "error");
        return;
      }

      const skills = await discoverAllSkills();
      if (skills.length === 0) {
        ctx.ui.notify("未发现任何技能插件 (需要先 pi install 技能插件)", "warning");
        return;
      }

      const installed = await getInstalledSkillNames(ctx.cwd);

      const items: SettingItem[] = skills.map((s) => ({
        id: s.name,
        label: s.name,
        description: s.overview,
        currentValue: installed.has(s.name) ? "[x]" : "[ ]",
        values: ["[x]", "[ ]"],
      }));

      await ctx.ui.custom((tui, theme, _kb, done) => {
        const container = new Container();
        container.addChild(new Text(theme.fg("accent", theme.bold("选择要安装的技能 (Enter 切换)")), 1, 1));

        const settingsList = new SettingsList(
          items,
          Math.min(items.length + 2, 15),
          getSettingsListTheme(),
          (id, newValue) => {
            const skill = skills.find((s) => s.name === id);
            if (!skill) return;
            if (newValue === "[x]") {
              installSkill(skill, ctx.cwd)
                .then(() => ctx.ui.notify(`已安装技能 "${id}"`, "info"))
                .catch((e) => ctx.ui.notify(`安装 "${id}" 失败: ${(e as Error).message}`, "error"));
            } else {
              uninstallSkill(id, ctx.cwd)
                .then(() => ctx.ui.notify(`已卸载技能 "${id}"`, "info"))
                .catch((e) => ctx.ui.notify(`卸载 "${id}" 失败: ${(e as Error).message}`, "error"));
            }
          },
          () => done(undefined),
          { enableSearch: true },
        );

        container.addChild(settingsList);

        return {
          render: (w: number) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data: string) => {
            settingsList.handleInput?.(data);
            tui.requestRender();
          },
        };
      });
    },
  });

  // ── 工具: 列出可用技能 ──

  pi.registerTool({
    name: "list_skills",
    label: "List Skills",
    description: "列出所有已安装技能插件中的可用技能",
    parameters: Type.Object({}),
    async execute() {
      const skills = await discoverAllSkills();
      if (skills.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "未发现任何技能插件。请先安装技能插件。",
            },
          ],
          details: { skills: [] },
        };
      }

      const list = skills
        .map((s) => `- ${s.pluginName} › ${s.overview}`)
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `可用技能列表：\n\n${list}\n\n使用 \`/skill-selector\` 交互选择，或调用 \`install_skill\` 直接安装。`,
          },
        ],
        details: {
          skills: skills.map((s) => ({
            name: s.name,
            overview: s.overview,
            plugin: s.pluginName,
          })),
        },
      };
    },
  });

  // ── 工具: 安装指定技能 ──

  pi.registerTool({
    name: "install_skill",
    label: "Install Skill",
    description: "将指定的技能软链接到项目 .pi/skills/",
    parameters: Type.Object({
      skillName: Type.String({ description: "要安装的技能名称" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const skills = await discoverAllSkills();
      const match = skills.find((s) => s.name === params.skillName);
      if (!match) {
        return {
          content: [
            {
              type: "text" as const,
              text: `未找到技能 "${params.skillName}"。可用技能: ${skills.map((s) => s.name).join(", ")}`,
            },
          ],
          details: {},
          isError: true,
        };
      }

      await installSkill(match, ctx.cwd);
      return {
        content: [
          {
            type: "text" as const,
            text: `技能 "${match.name}" 已软链接到 .pi/skills/${match.name}/`,
          },
        ],
        details: {
          name: match.name,
          overview: match.overview,
          path: join(".pi", "skills", match.name),
        },
      };
    },
  });

  // ── 工具: 卸载指定技能 ──

  pi.registerTool({
    name: "uninstall_skill",
    label: "Uninstall Skill",
    description: "从项目 .pi/skills/ 卸载（移除软链接）指定的技能",
    parameters: Type.Object({
      skillName: Type.String({ description: "要卸载的技能名称" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      await uninstallSkill(params.skillName, ctx.cwd);
      return {
        content: [
          {
            type: "text" as const,
            text: `技能 "${params.skillName}" 已从 .pi/skills/ 卸载`,
          },
        ],
        details: {
          name: params.skillName,
        },
      };
    },
  });

}

// ── 核心逻辑 ────────────────────────────────────────────

async function discoverAllSkills(): Promise<SkillMeta[]> {
  const packages = await getInstalledSkillPackages();
  const skills: SkillMeta[] = [];

  for (const pkg of packages) {
    try {
      const mod = await import(pkg.entryPoint);
      if (typeof mod.discover === "function") {
        const result = await mod.discover();
        if (Array.isArray(result)) {
          for (const skill of result) {
            if (skill.name && skill.sourceDir) {
              skills.push({
                name: skill.name,
                // 优先使用元数据中的 overview，缺失时兑底用 discover() 返回的 description
                overview: pkg.overview || skill.description,
                sourceDir: skill.sourceDir,
                pluginName: pkg.name,
                tags: skill.tags ?? [],
              });
            }
          }
        }
      }
    } catch {
      // 不是 skill 插件 或 import 失败，跳过
    }
  }

  return skills;
}

/** 移除 .pi/skills/ 下的旧目标（目录、文件或软链接） */
async function removeTarget(targetDir: string) {
  try {
    const st = await lstat(targetDir);
    if (st.isSymbolicLink() || st.isFile()) {
      await unlink(targetDir);
    } else {
      await rm(targetDir, { recursive: true, force: true });
    }
  } catch {
    // 目标不存在，跳过
  }
}

async function installSkill(skill: SkillMeta, cwd: string) {
  const skillsDir = join(cwd, ".pi", "skills");
  const targetDir = join(skillsDir, skill.name);
  await mkdir(skillsDir, { recursive: true });
  await removeTarget(targetDir);
  // 软链接到插件源码目录（绝对路径），技能更新即时生效、不占额外空间
  await symlink(skill.sourceDir, targetDir, "dir");
}

/** 读取项目 .pi/skills/ 下已安装（软链接）的技能名 */
async function getInstalledSkillNames(cwd: string): Promise<Set<string>> {
  const skillsDir = join(cwd, ".pi", "skills");
  const names = new Set<string>();
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) names.add(entry.name);
  } catch {
    // 无 .pi/skills 目录
  }
  return names;
}

async function uninstallSkill(name: string, cwd: string) {
  await removeTarget(join(cwd, ".pi", "skills", name));
}

// ── 包发现 ──────────────────────────────────────────────

async function getInstalledSkillPackages(): Promise<ResolvedPackage[]> {
  const homes = homedir();
  const results: ResolvedPackage[] = [];
  const seen = new Set<string>();

  // 1. 全局 settings
  const globalSettingsPath = join(homes, ".pi", "agent", "settings.json");
  if (existsSync(globalSettingsPath)) {
    try {
      const raw = await readFile(globalSettingsPath, "utf-8");
      const settings = JSON.parse(raw);
      const entries = resolvePackages(settings.packages ?? [], dirname(globalSettingsPath));
      for (const e of entries) {
        if (!seen.has(e.name)) {
          seen.add(e.name);
          results.push(e);
        }
      }
    } catch {
      // 忽略
    }
  }

  return results;
}

function resolvePackages(
  entries: (string | { source: string })[],
  settingsDir: string,
): ResolvedPackage[] {
  const result: ResolvedPackage[] = [];

  for (const entry of entries) {
    const source = typeof entry === "string" ? entry : entry.source;
    try {
      const pkg = resolvePackage(source, settingsDir);
      if (pkg) result.push(pkg);
    } catch {
      // 跳过无法解析的包
    }
  }

  return result;
}

function resolvePackage(source: string, settingsDir: string): ResolvedPackage | null {
  // npm: npm:@scope/name@version
  if (source.startsWith("npm:")) {
    const name = source.replace(/^npm:/, "").replace(/@[\d.]+$/, "");
    return resolveNpmPackage(name);
  }

  // git:/http(s): 等远程源不是本地包，跳过
  if (source.startsWith("git:") || /^[a-z][a-z0-9+.-]*:\/\//i.test(source)) {
    return null;
  }

  // 本地路径：绝对路径，或相对 settingsDir 的路径（含 ./、../ 以及
  // install.ts 记录的无前缀相对路径，如 kuraxii/skills/xxx）
  const pkgDir = isAbsolute(source) ? source : resolve(settingsDir, source);
  return resolveLocalPackage(pkgDir);
}

function resolveLocalPackage(pkgDir: string): ResolvedPackage | null {
  const pkgJsonPath = join(pkgDir, "package.json");
  if (!existsSync(pkgJsonPath)) return null;

  try {
    const raw = readFileSync(pkgJsonPath, "utf-8");
    const pkgJson = JSON.parse(raw);
    const keywords: string[] = pkgJson.keywords ?? [];

    // 只处理 skill 插件
    if (!keywords.includes("pi-skill-plugin")) return null;

    const entry = pkgJson.main || "./index.ts";
    const entryPath = resolve(pkgDir, entry);

    return {
      name: pkgJson.name || pkgDir.split("/").pop()!,
      entryPoint: entryPath,
      overview: pkgJson.kuraxii?.overview,
    };
  } catch {
    return null;
  }
}

function resolveNpmPackage(name: string): ResolvedPackage | null {
  const homes = homedir();
  const npmBase = join(homes, ".pi", "agent", "npm");

  const possibleDirs = name.startsWith("@")
    ? [join(npmBase, name)]
    : [join(npmBase, name), join(npmBase, "node_modules", name)];

  for (const dir of possibleDirs) {
    if (existsSync(dir)) {
      const result = resolveLocalPackage(dir);
      if (result) return result;
    }
  }

  return null;
}