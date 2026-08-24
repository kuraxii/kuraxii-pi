/**
 * pi-skill-drawio
 *
 * Draw.io diagram skill (from https://github.com/Agents365-ai/drawio-skill)
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
      name: "drawio",
      description:
        "Generate .drawio XML diagrams and export to PNG/SVG/PDF/JPG using the draw.io desktop CLI. Use when user requests diagrams, flowcharts, architecture diagrams, ER diagrams, UML/sequence/class diagrams, SysML/MBSE, BPMN, swimlanes, network topology, cloud architecture, or any visualization needing custom styling, rich shapes, or exportable images.",
      sourceDir: join(__dirname, "skills", "drawio"),
      tags: ["drawio", "diagram", "flowchart", "architecture", "uml", "er"],
    },
  ];
}