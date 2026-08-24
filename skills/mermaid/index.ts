/**
 * pi-skill-mermaid
 *
 * Mermaid diagram skill (from https://github.com/Agents365-ai/mermaid-skill)
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
      name: "mermaid",
      description:
        "Generate Mermaid diagrams (.mmd) and export to PNG/SVG/PDF using mmdc CLI or Kroki API. Use when user mentions diagram, flowchart, sequence diagram, class diagram, ER diagram, state machine, architecture, visualize, 画图, 架构图, 流程图, 时序图. Supports 17+ diagram types with fully automatic layout.",
      sourceDir: join(__dirname, "skills", "mermaid"),
      tags: ["mermaid", "diagram", "flowchart", "sequence", "visualization"],
    },
  ];
}