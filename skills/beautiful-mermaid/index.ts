/**
 * pi-skill-beautiful-mermaid
 *
 * Skill plugin: render Mermaid diagrams directly to SVG or ASCII/Unicode
 * using the beautiful-mermaid library (no browser, no network, synchronous).
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
      name: "beautiful-mermaid",
      description:
        "Render Mermaid diagrams directly to beautiful SVG or ASCII/Unicode text using the beautiful-mermaid library — no browser, no network, synchronous, fully themeable (15 built-in themes + Shiki). Use when the user wants SVG files or terminal/ASCII diagram output without mmdc/Kroki.",
      sourceDir: join(__dirname, "skills", "beautiful-mermaid"),
      tags: ["mermaid", "diagram", "svg", "ascii", "visualization"],
    },
  ];
}
