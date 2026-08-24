# pi-skill-template

pi coding agent 技能插件模板。

## 使用方式

1. 复制此目录:
   ```bash
   cp -r packages/pi-skill-template packages/pi-skill-your-name
   ```

2. 修改 `package.json`:
   - `name`: `@kuraxii/pi-skill-your-name`
   - `description`: 插件描述
   - `keywords`: 添加 `pi-skill-plugin`

3. 修改 `index.ts` 中的 `discover()` 返回信息

4. 在 `skills/your-skill/` 下编写 `SKILL.md`

5. 安装:
   ```bash
   pi install ./packages/pi-skill-your-name
   ```

6. 在项目中使用 `/skill` 选择安装技能