/**
 * pi-skill-patent
 *
 * China patents skill (from https://github.com/handsomestWei/patent-disclosure-skill)
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
      name: "patent",
      description:
        "中国专利技能：专利点挖掘与交底书（发明/实用/外观）编写，通俗解读专利，政策动向嗅探，辅助审查答复。单包模块化：SKILL.md 路由，prompts/ 分步指令，references/ 参考数据，tools/ 工具脚本。",
      sourceDir: join(__dirname, "skills", "patent"),
      tags: ["patent", "disclosure", "patent-analysis", "office-action"],
    },
  ];
}