/**
 * pi-skill-devops
 *
 * Skill plugin: DevOps workflows.
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
      name: "devops",
      description:
        "DevOps workflows: deployment, CI/CD pipeline management, Docker/K8s operations, infrastructure as code, and server maintenance",
      sourceDir: join(__dirname, "skills", "devops"),
      tags: ["devops", "deploy", "infra"],
    },
  ];
}