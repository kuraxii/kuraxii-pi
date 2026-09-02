# skill-creator

技能设计与维护技能。

来源：[howaboua-pi-stuff/packages/pi-skill-skill-creator](https://github.com/IgorWarzocha/howaboua-pi-stuff)（MIT）

可复用的技能设计工作流：SKILL.md 创建、触发词设计、正文结构、辅助文件、验证、合并、跨平台移植。

## 安装

```bash
bun run install
```

## 使用

在项目中使用 `/skill-selector` 选择技能，或在对话中描述创建/修改技能的需求，由 LLM 加载。

## 内容

- `skills/skill-creator/SKILL.md` — 技能主文件（8 步工作流 + 验证清单 + 恢复指南）
- `references/skills-reference-guide-for-agents.md` — 技能参考指南
- `scripts/skill-efficiency-check.py` — 技能效率检查脚本