/**
 * agents-md
 *
 * AGENTS.md authoring skill (from https://github.com/IgorWarzocha/howaboua-pi-stuff)
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
      name: "agents-md",
      description:
        "Scoped AGENTS.md authoring and maintenance. Use for repo, nested, global, or personal instructions; rule pruning; scope placement; or separating agent guidance from README/docs.",
      sourceDir: join(__dirname, "skills", "agents-md"),
      tags: ["agents-md", "context", "instructions"],
    },
  ];
}