# pi-skill-patent

中国专利技能插件。

来源：[handsomestWei/patent-disclosure-skill](https://github.com/handsomestWei/patent-disclosure-skill)（MIT）v3.6.2

专利点挖掘与交底书（发明/实用/外观）编写，通俗解读专利，政策动向嗅探，辅助审查答复。

## 安装

```bash
bun run install
```

## 使用

在项目中使用 `/skill-selector` 选择技能，或在对话中描述专利相关需求，由 LLM 调用 `install_skill` 加载。

## 内容

- `skills/patent/SKILL.md` — 路由主文件，4 种模式入口
- `prompts/` — 分步指令（disclosure/ 交底编写、reader/ 通俗解读、evolution/ 技能进化、oa/ 审查答复）
- `references/` — 参考数据（schemas/ 结构模式、formulas/ 范式、domain/yaml 规则库）
- `tools/` — 工具脚本（patent_reader/ 解读、oa/ 审查答复、shared/ 通用）
- `docs/` — 文档与使用说明
- `assets/` — 模板文件
- `examples/` — 使用示例