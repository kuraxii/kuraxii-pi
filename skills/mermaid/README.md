# pi-skill-mermaid

Mermaid 图表技能插件。

来源：[Agents365-ai/mermaid-skill](https://github.com/Agents365-ai/mermaid-skill)（MIT）

生成 `.mmd` 文本（仅写源码，不导出/渲染），支持 17+ 图表类型与全自动布局。

## 安装

```bash
bun run install
```

## 使用

在项目中使用 `/skill-selector` 选择技能，或在对话中描述画图/流程图需求，由 LLM 调用 `install_skill` 加载。

## 内容

- `skills/mermaid/SKILL.md` — 技能主文件（只写 `.mmd` 源码；渲染走 beautiful-mermaid 技能）
- `skills/mermaid/reference/` — 各图表类型详细参考（flowchart、sequence、class、ER、state、usecase、architecture）