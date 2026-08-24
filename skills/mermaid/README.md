# pi-skill-mermaid

Mermaid 图表技能插件。

来源：[Agents365-ai/mermaid-skill](https://github.com/Agents365-ai/mermaid-skill)（MIT）

生成 `.mmd` 文本并导出为 PNG/SVG/PDF，支持 17+ 图表类型与全自动布局。

## 安装

```bash
bun run install
```

## 使用

在项目中使用 `/workflow` 选择技能，或在对话中描述画图/流程图需求，由 LLM 调用 `install_skill` 加载。

## 内容

- `skills/mermaid/SKILL.md` — 技能主文件（支持 mmdc / Kroki 两种后端）
- `skills/mermaid/reference/` — 各图表类型详细参考（flowchart、sequence、class、ER、state、usecase、architecture）