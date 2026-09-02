/**
 * pi-skill-template
 *
 * Skill plugin template.
 * 导出 discover() 接口供 pi-skill-selector 发现。
 *
 * 使用方式：
 * 1. 复制此目录: cp -r packages/pi-skill-template packages/pi-skill-your-name
 * 2. 修改 package.json 中的 name、description、keywords
 * 3. 修改 index.ts 中的 discover() 返回信息
 * 4. 在 skills/your-skill/ 下编写 SKILL.md
 * 5. 安装: pi install ./packages/pi-skill-your-name
 * 6. 在项目中使用 /skill-selector 选择安装
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
      name: "your-skill",
      description: "Describe what this skill does and when to use it",
      sourceDir: join(__dirname, "skills", "your-skill"),
      tags: ["template"],
    },
  ];
}