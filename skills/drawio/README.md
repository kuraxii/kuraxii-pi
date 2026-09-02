# pi-skill-drawio

Draw.io 图表技能插件。

来源：[Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill)（MIT）v2.1.0

生成 `.drawio` XML 并导出为 PNG/SVG/PDF/JPG（draw.io desktop CLI，无需浏览器自动化）。适用于需要自定义样式、丰富形状库（10k+ shapes）、泳道图、可编辑导出的精确图表。

## 安装

```bash
bun run install
```

## 前置依赖

- draw.io desktop app CLI（`drawio` 在 PATH）
- 可选 autolayout.py：需 Graphviz（`dot`）

## 使用

在项目中使用 `/skill-selector` 选择技能，或在对话中描述画图/流程图/架构图需求，由 LLM 调用 `install_skill` 加载。

## 内容

- `skills/drawio/SKILL.md` — 技能主文件
- `references/` — 各场景参考（toolbox 脚本地图、XML/Mermaid 编写、diagram-types、shapes、style-presets 等 14 篇）
- `scripts/` — 31 个辅助脚本（author / import 代码 / import IaC / import API spec / live infra / compare / annotate / reverse-export）
- `data/` — shapes 索引
- `styles/` — 内置样式预设