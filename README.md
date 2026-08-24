# kuraxii-pi

个人 pi coding agent 工具集。

## 设计理念

- **技能即插件**：每个技能是一个独立的 pi 插件包，通过 `discover()` 接口暴露
- **按需安装**：技能不自动加载到全局，通过选择器复制到项目 `.pi/skills/`
- **项目级技能**：技能仅作用于当前项目，不污染全局
- **清单即真理**：`.pi/settings.json` 是唯一插件清单，一键同步
- **零运行时依赖**：脚本已编译为单文件二进制，提交在仓库中

## 前置依赖

仅需 **pi** CLI（scripts 已编译为 standalone 二进制，无需 bun/node）

## 目录结构

```
kuraxii-pi/
├── scripts/
│   ├── sync          # ★ 同步脚本 (编译为单文件二进制)
│   ├── sync.ts       #   源码
│   ├── build         #   构建脚本 (编译二进制)
│   └── build.ts      #   源码
│
├── packages/
│   ├── pi-skill-selector/      # 核心：技能选择器插件
│   │   ├── package.json
│   │   └── index.ts            # 命令 /skill + 工具
│   │
│   ├── pi-skill-devops/        # 示例技能插件
│   │   ├── package.json
│   │   ├── index.ts            # 导出 discover() 接口
│   │   └── skills/devops/
│   │       ├── SKILL.md
│   │       └── scripts/
│   │
│   ├── pi-skill-template/      # 技能插件模板
│   │
│   └── pi-codex-bash/          # 已有扩展 (git submodule)
│
└── .pi/
    └── settings.json           # ★ 插件清单（唯一真理）
```

## 一键同步

```bash
# 安装/更新/删除所有插件，与清单保持一致
./scripts/sync
```

脚本会：
- **覆盖**：清单中的插件 → 全部重新安装
- **删除**：已安装但不在清单中的 → 卸载

## 架构流程

```
1. 运行同步
   ./scripts/sync

2. 在项目中使用 /skill 命令
   → 选择器扫描全局 settings 中的已安装包
   → 动态 import 每个 skill 插件的 discover() 接口
   → 获取技能列表 [{ name, description, sourceDir }]

3. 用户/LLM 选择技能
   → 复制 skills/xxx 到 project/.pi/skills/xxx/
   → pi 在项目级自动发现技能
```

## 管理插件清单

编辑 `.pi/settings.json` 的 `packages` 数组，然后运行 `./scripts/sync`：

```json
{
  "packages": [
    "../packages/pi-skill-selector",
    "../packages/pi-skill-devops",
    "../packages/pi-codex-bash"
  ]
}
```

## 创建新技能插件

```bash
# 1. 复制模板
cp -r packages/pi-skill-template packages/pi-skill-my-skill

# 2. 修改 package.json (name, description, keywords)
# 3. 修改 index.ts 中的 discover() 返回信息
# 4. 在 skills/my-skill/ 下编写 SKILL.md
# 5. 在 .pi/settings.json 中添加条目
# 6. 运行 sync 安装
./scripts/sync
```

## 重新编译

```bash
# 需要 bun 环境
./scripts/build
```

## Skill 插件接口规范

每个 skill 插件必须：

1. `package.json` 中 `keywords` 包含 `"pi-skill-plugin"`
2. 导出 `discover()` 异步函数，返回 `SkillInfo[]`

```typescript
// index.ts
export interface SkillInfo {
  name: string;        // 技能名称，用作 .pi/skills/<name>/
  description: string; // 技能描述，用于选择器展示
  sourceDir: string;   // 技能目录路径 (SKILL.md 所在目录)
}

export async function discover(): Promise<SkillInfo[]> {
  return [
    {
      name: "my-skill",
      description: "What this skill does",
      sourceDir: join(import.meta.dir, "skills", "my-skill"),
    },
  ];
}
```