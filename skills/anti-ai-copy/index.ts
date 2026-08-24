/**
 * anti-ai-copy
 *
 * Voice-preserving prose skill (from https://github.com/IgorWarzocha/howaboua-pi-stuff)
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
      name: "anti-ai-copy",
      description:
        "Voice-preserving prose drafting, rewriting, and review. Use for product copy, docs, READMEs, emails, posts, bios, essays, UI text, or removing AI/SaaS/corporate tells. Not detector analysis or mechanical proofreading.",
      sourceDir: join(__dirname, "skills", "anti-ai-copy"),
      tags: ["writing", "copy", "prose", "anti-ai"],
    },
  ];
}