/**
 * pi-skill-selector
 *
 * 技能选择器插件。职责：
 * 1. 发现已安装的 skill 插件（通过动态 import discover() 接口）
 * 2. 提供交互式命令 /skill 供用户选择
 * 3. 提供工具供 LLM 驱动选择和安装
 * 4. 将选中的技能复制到项目 .pi/skills/ 目录
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { cp, mkdir, readFile } from "node:fs/promises";
import { join, dirname, isAbsolute, resolve } from "node:path";
import { homedir } from "node:os";
import { existsSync, readFileSync } from "node:fs";

// ── 类型 ────────────────────────────────────────────────

interface SkillMeta {
  name: string;
  description: string;
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
  // ── 命令: /skill 交互式选择 ──

  pi.registerCommand("workflow", {
    description: "发现可用技能，选择并安装到项目 .pi/skills/",
    handler: async (_args, ctx) => {
      const skills = await discoverAllSkills();
      if (skills.length === 0) {
        ctx.ui.notify("未发现任何技能插件 (需要先 pi install 技能插件)", "warning");
        return;
      }

      const labels = skills.map(
        (s) => {
          const tagStr = s.tags.length > 0 ? ` [${s.tags.join(", ")}]` : "";
          return `${s.pluginName} › ${s.name}${tagStr}: ${s.description}`;
        },
      );
      const selected = await ctx.ui.select("选择要安装的技能:", labels);
      if (!selected) return;

      const index = labels.indexOf(selected);
      const skill = skills[index];
      if (!skill) return;

      await installSkill(skill, ctx.cwd);
      ctx.ui.notify(
        `技能 "${skill.name}" 已安装到 ${join(".pi", "skills", skill.name)}`,
        "success",
      );
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
          details: {},
        };
      }

      const list = skills
        .map((s) => `- **${s.name}** (${s.pluginName}): ${s.description}`)
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `可用技能列表：\n\n${list}\n\n使用 \`/skill\` 交互选择，或调用 \`install_skill\` 直接安装。`,
          },
        ],
        details: {
          skills: skills.map((s) => ({
            name: s.name,
            description: s.description,
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
    description: "安装指定的技能到项目 .pi/skills/",
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
            text: `技能 "${match.name}" 已安装到 .pi/skills/${match.name}/`,
          },
        ],
        details: {
          name: match.name,
          description: match.description,
          path: join(".pi", "skills", match.name),
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
                description: pkg.overview || skill.description,
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

async function installSkill(skill: SkillMeta, cwd: string) {
  const targetDir = join(cwd, ".pi", "skills", skill.name);
  await mkdir(targetDir, { recursive: true });
  await cp(skill.sourceDir, targetDir, { recursive: true });
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
  // local path: ./packages/xxx or /absolute/path
  if (source.startsWith("./") || source.startsWith("../") || source.startsWith("/")) {
    const pkgDir = isAbsolute(source) ? source : resolve(settingsDir, source);
    return resolveLocalPackage(pkgDir);
  }

  // npm: npm:@scope/name@version
  if (source.startsWith("npm:")) {
    const name = source.replace(/^npm:/, "").replace(/@[\d.]+$/, "");
    return resolveNpmPackage(name);
  }

  return null;
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