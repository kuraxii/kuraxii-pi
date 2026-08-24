/**
 * model-facing-api-design
 *
 * Tool contract design skill (from https://github.com/IgorWarzocha/howaboua-pi-stuff)
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
      name: "model-facing-api-design",
      description:
        "Model-facing Pi tool contracts: names, descriptions, schemas, prompt metadata, results, errors, truncation, recovery, token cost. Use for tool design, review, or selection/call failures.",
      sourceDir: join(__dirname, "skills", "model-facing-api-design"),
      tags: ["api-design", "tool-contract", "prompt"],
    },
  ];
}