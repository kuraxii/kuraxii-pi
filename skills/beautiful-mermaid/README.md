# pi-skill-beautiful-mermaid

把 Mermaid 图**直接**渲染为精美 SVG 或 ASCII/Unicode 文本的技能插件，基于 [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid)（MIT，Craft Docs）。

与已有 `mermaid` 技能（mmdc/Kroki 导出 PNG/SVG/PDF）互补：本技能**不需要浏览器、不需要网络、同步渲染**，擅长产出 SVG 文件和终端 ASCII 图。

## 安装

```bash
bun run install
```

## 使用

在项目中使用 `/skill-selector` 选择技能，或在对话中描述「画图 / 流程图 / 时序图 / 终端图」需求，由 LLM 调用 `install_skill` 加载。

## 内容

- `skills/beautiful-mermaid/SKILL.md` — 技能主文件（安装、API、主题、工作流）
- `skills/beautiful-mermaid/reference/api.md` — API 与主题速查
- `skills/beautiful-mermaid/scripts/render.ts` — 一键渲染 `.mmd` 到 SVG/ASCII 的辅助脚本
