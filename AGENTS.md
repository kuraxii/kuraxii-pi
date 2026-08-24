# AGENTS.md — kuraxii-pi

个人 pi coding agent 工具集仓库。本文件定义了项目的目录结构、约定与工作流，供所有 agent 遵循。

## 设计理念

- **技能即插件**：每个技能是一个独立的 pi 插件包，通过 `discover()` 接口暴露，再经由技能选择器选择性加载
- **按需安装**：技能不自动加载到全局；由选择器根据任务复制到具体项目的 `.pi/skills/`
- **项目级技能**：技能只作用于被选择的项目，不污染全局环境
- **扫描即真理**：`scripts/install.ts` 自动扫描 `packages/` 与 `skills/`，安装/更新插件、删除已移除的插件
- **零运行时依赖**：开发脚本用内置 bun（`.bun/`）编译为 standalone 二进制运行，不依赖系统环境

## 目录结构

```
kuraxii-pi/
├── packages/                 # pi 扩展/功能插件（type: "extension"）
│   ├── pi-skill-selector/    # 核心：技能选择器（/workflow 命令 + 工具）
│   └── pi-codex-bash/        # Codex 风格 shell 适配器
├── skills/                   # 技能插件（type: "skill"）
│   ├── pi-skill-devops/      # 例：DevOps 技能
│   ├── pi-skill-template/    # 技能插件模板
│   └── pi-skill-test-*/      # 测试用技能
├── scripts/
│   ├── install.ts            # 插件安装/卸载脚本（入口）
│   ├── bootstrap.sh          # 引导脚本：下载 bun 到 .bun/ 并编译
│   └── build.ts              # 编译 install/build 为单文件二进制
├── .bun/                     # 内置 bun（bootstrap 时下载，已 gitignore）
├── package.json              # 根配置（scripts 别名）
└── .pi/settings.json         # 暂无（清单由目录扫描自动生成）
```

## 关键约定

### 1. 插件元数据契约（`package.json` 的 `kuraxii` 字段）

每个插件（无论是 `packages/` 还是 `skills/`）的 `package.json` 必须声明 `kuraxii` 元数据，`install.ts` 依靠它识别插件并校验可信性：

```json
{
  "name": "@kuraxii/pi-xxx",
  "kuraxii": {
    "type": "skill" | "extension",
    "tags": ["tag1", "tag2"]
  }
}
```

- `type: "skill"` → 属于 `skills/`，提供技能，带 `discover()` 接口
- `type: "extension"` → 属于 `packages/`，是 pi 扩展
- `tags` → 技能标签，用于选择器展示和分类
- **缺少 `kuraxii` 元数据或 type 非法 → `install.ts` 判定为不可信插件，安装终止**

### 2. 技能发现接口

每个 skill 插件的 `index.ts` 导出 `discover()`，供 `pi-skill-selector` 动态 import 调用：

```typescript
import { join } from "node:path";

export interface SkillInfo {
  name: string;         // 技能名，用作 .pi/skills/<name>/
  description: string;  // 技能描述（选择器展示、LLM 匹配）
  sourceDir: string;    // 技能目录绝对路径（SKILL.md 所在目录）
  tags: string[];       // 技能标签
}

export async function discover(): Promise<SkillInfo[]> {
  return [
    {
      name: "my-skill",
      description: "What it does",
      sourceDir: join(import.meta.dir, "skills", "my-skill"),
      tags: ["example"],
    },
  ];
}
```

### 3. 技能目录结构

遵循 Agent Skills 规范（`SKILL.md` + frontmatter）：`skills/<name>/` 下放 `SKILL.md`。

```
skills/my-skill/
├── SKILL.md       # 必须：frontmatter(name, description) + 指令
├── references/    # 可选：按需加载的详细文档
└── scripts/       # 可选：辅助脚本
```

### 4. 插件安装/卸载

插件统一通过 `pi install <插件目录绝对路径>` 安装，不引入网络依赖。核心入口是 `scripts/install.ts`：

```bash
bun scripts/install.ts              # 同步：扫描并安装/更新/删除
bun scripts/install.ts uninstall    # 卸载本仓库全部插件
```

`install.ts` 流程：
1. 扫描 `packages/` + `skills/` 下的所有子目录
2. 用 `kuraxii` 元数据校验身份与可信度
3. 对每个有效插件的绝对路径执行 `pi install`
4. 删除已安装但目录已不存在的插件

`package.json` 根脚本别名：
```bash
bun run install      # = bun scripts/install.ts
bun run uninstall    # = bun scripts/install.ts uninstall
bun run bootstrap    # = bash scripts/bootstrap.sh
bun run build        # = bun scripts/build.ts
```

### 5. 内置 bun 与引导

`scripts/bootstrap.sh`：
- 检测系统 bun，不存在则下载到 `.bun/`
- 用 bun 把 `install.ts`、`build.ts` 编译为单文件二进制（`scripts/install`、`scripts/build`）
- 编译产物已 gitignore，日常用 `bun run install` 更方便

`.bun/` 目录已 gitignore。

### 6. 技能选择器（`packages/pi-skill-selector`）

- 扫描全局 `~/.pi/agent/settings.json` 中的已安装包，定位 `keywords` 含 `pi-skill-plugin` 的插件
- 动态 `import` 其 `discover()`，汇总 `SkillInfo`
- 提供：
  - `/workflow` 命令：交互式列出技能与标签，用户选择后复制到 `.pi/skills/`
  - `list_skills` 工具：列出所有可用技能（LLM 驱动）
  - `install_skill` 工具：按名称安装指定技能

## 新增技能/插件的步骤

1. **复制模板**：技能 → `cp -r skills/pi-skill-template skills/pi-skill-<name>`；扩展 → 参考 `packages/pi-skill-selector`
2. **改 package.json**：`name`、`description`、`kuraxii.type`、`keywords`
3. **改 index.ts**：更新 `discover()` 返回的 `SkillInfo[]`（名称、描述、路径、标签）
4. **写 SKILL.md**：在 `skills/<name>/SKILL.md` 填写 frontmatter + 指令
5. **安装**：`bun run install`（自动扫描并安装）
6. **在项目中使用**：`/workflow` 选择技能，复制到该项目 `.pi/skills/`

## 常用命令

```bash
bun run install            # 同步插件（扫描安装/更新/删除）
bun run uninstall          # 卸载本仓库全部插件
bun run bootstrap          # 引导：下载 bun(如缺) + 编译脚本
bun run build              # 编译脚本为二进制
```

## 注意

- 本地已安装的 `pi-codex-bash` 由 `kuraxii` 元数据 `type: "extension"` 标记，安装后通过 `pi install ./` 引入（jiti 直接加载 `index.ts`，无 tsc 编译）
- 不要在网络不可用时尝试 npm 源安装；所有插件均本地管理