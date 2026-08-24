/**
 * skill-creator
 *
 * Skill design and maintenance skill (from https://github.com/IgorWarzocha/howaboua-pi-stuff)
 * 导出 discover() 接口供 pi-skill-selector 发现。
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface SkillInfo {
  name: string;
  description: string;
  sourceDir: string;
  tags: string[];
}

/**
 * 发现此插件提供的技能列表
 */
export async function discover(): Promise<SkillInfo[]> {
  return [
    {
      name: "skill-creator",
      description:
        "Reusable skill design and maintenance. Use for SKILL.md creation, trigger design, body structure, supporting files, validation, consolidation, or cross-agent ports. Not for one-off prompt edits or passive documentation.",
      sourceDir: join(__dirname, "skills", "skill-creator"),
      tags: ["skill", "skill-creator", "workflow"],
    },
  ];
}