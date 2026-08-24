/**
 * agent-native-hardening
 *
 * Architecture hardening skill (from https://github.com/IgorWarzocha/howaboua-pi-stuff)
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
      name: "agent-native-hardening",
      description:
        "Architecture hardening: ownership, boundaries, contracts, state safety, duplication, execution/import topology, traversability, feedback loops, test fit, change decomposition. Use for structural reviews, scorecards, plans, refactors, or startup/import-path analysis; not ordinary fixes or unmeasured micro-optimization.",
      sourceDir: join(__dirname, "skills", "agent-native-hardening"),
      tags: ["architecture", "hardening", "refactor", "review"],
    },
  ];
}