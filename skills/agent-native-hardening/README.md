# agent-native-hardening

架构加固技能。

来源：[howaboua-pi-stuff](https://github.com/IgorWarzocha/howaboua-pi-stuff)（MIT）

架构审查与加固：所有权、边界、契约、状态安全、重复、执行/导入拓扑、可遍历性、反馈循环、测试适配、变更分解。用于结构性审查、记分卡、重构计划，而非普通修复或微优化。

## 安装

```bash
bun run install
```

## 内容

- `skills/agent-native-hardening/SKILL.md` — 技能主文件
- `references/` — 各语言/领域参考（go, js-ts, python, rust, dependency-safety, execution-topology, scoring-rubric, work-lanes）
- `agents/openai.yaml` — OpenAI Codex agent 配置