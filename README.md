# kuraxii-pi

个人 pi coding agent 工具集。

## 设计理念

- **技能即插件**：每个技能是一个独立的 pi 插件包，通过 `discover()` 接口暴露
- **按需安装**：技能不自动加载到全局，通过选择器复制到项目 `.pi/skills/`
- **项目级技能**：技能仅作用于当前项目，不污染全局
- **扫描即真理**：`scripts/install.ts` 自动扫描 `packages/` 与 `skills/`，安装/更新/删除
- **本地安装**：插件复制到 `~/.pi/agent/kuraxii/` 后安装，不依赖仓库源码、不引入网络依赖

## 前置依赖

- **pi** CLI
- **bun**：运行 `install.ts` / `build.ts`；缺省时 `bootstrap` 会自动下载到 `.bun/`

## 目录结构

```
kuraxii-pi/
├── packages/                 # pi 扩展插件（type: "extension"）
│   ├── pi-skill-selector/    # 核心：技能选择器（/workflow + 工具）
│   ├── pi-ask/               # 交互决策
│   ├── pi-vent/              # 工作流摩擦上报
│   ├── pi-smart-btw/         # 异步 follow-up
│   └── pi-codex-bash/        # shell 工具适配器
├── skills/                   # 技能插件（type: "skill"）
│   ├── anti-ai-copy/
│   ├── devops/
│   └── ...
├── scripts/
│   ├── install.ts            # 插件安装/卸载脚本（入口）
│   ├── bootstrap.sh          # 引导：下载 bun(如缺) + 编译脚本
│   └── build.ts              # 编译脚本为单文件二进制
└── package.json              # 根配置（scripts 别名）
```

## 安装/同步

```bash
bun scripts/install.ts              # 同步：扫描并安装/更新/删除
bun scripts/install.ts uninstall    # 卸载本仓库全部插件
```

脚本会把每个插件复制到 `~/.pi/agent/kuraxii/{packages,skills}/<name>/`，再对该副本执行 `pi install`，因此仓库可自由移动或删除，不影响已安装的插件。

## 架构流程

```
1. 运行 bun scripts/install.ts
   → 扫描 packages/ + skills/
   → 复制到 ~/.pi/agent/kuraxii/
   → pi install 副本

2. 在项目中使用 /workflow 命令（或 list_skills 工具）
   → 选择器扫描全局 settings 中的已安装包
   → 动态 import 每个 skill 插件的 discover() 接口
   → 获取技能列表

3. 用户/LLM 选择技能
   → 复制 skills/xxx 到项目 .pi/skills/xxx/
   → pi 在项目级自动发现技能
```

## 新增技能/插件

1. 复制模板：技能 `cp -r skills/template skills/<name>`；扩展参考 `packages/pi-skill-selector`
2. 改 `package.json`：`name`、`description`、`kuraxii.type`、`keywords`
3. 改 `index.ts`：更新 `discover()` 返回的 `SkillInfo[]`
4. 写 `SKILL.md`：`skills/<name>/SKILL.md`（frontmatter + 指令）
5. 生成 `overview`：在 `kuraxii.overview` 写入英文概述
6. 安装：`bun run install`

## 重新编译

```bash
bun run build        # 编译 install.ts 为单文件二进制（目标为当前主机平台）
```

## Skill 插件接口规范

每个 skill 插件必须：

1. `package.json` 声明 `kuraxii` 元数据（`type: "skill"`）
2. 导出 `discover()` 异步函数，返回 `SkillInfo[]`

```typescript
// index.ts
export interface SkillInfo {
  name: string;         // 技能名，用作 .pi/skills/<name>/
  description: string;  // 技能描述
  sourceDir: string;    // 技能目录绝对路径（SKILL.md 所在目录）
  tags: string[];       // 技能标签
}

export async function discover(): Promise<SkillInfo[]> {
  return [
    {
      name: "my-skill",
      description: "What this skill does",
      sourceDir: join(import.meta.dir, "skills", "my-skill"),
      tags: ["example"],
    },
  ];
}
```

详细约定见 `AGENTS.md`。
