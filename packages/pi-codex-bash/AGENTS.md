# pi-codex-bash — Git-Form Pi Package

Install via git（推荐）或 npm：

```bash
pi install git:github.com/kuraxii/pi-codex-bash
pi install npm:@kuraxii/pi-codex-bash
```

## Development

```bash
npm install
npm run build
npm test
```

## npm publish

通过 GitHub Actions 发布：
- 创建 GitHub Release 自动触发
- 或手动运行 `workflow_dispatch` 选择版本类型

需要先在 GitHub 仓库设置中添加 `NPM_TOKEN` secret。

## Guidelines

- Keep Pi behavior as close as practical to the Codex toolkit; document intentional differences.
- The extension does not replace Pi's model transport: Codex model traffic stays on Pi's stock `openai-codex` provider. Never re-add a provider overlay without a documented transport contract.
- Structured mode uses flat TypeScript tools over standard Responses.
- Keep prompt guidance short and argv-shaped.
- Native runners execute bundled helpers directly. Rebuild for the local platform and use the checkout; never patch installed npm files.
- For native GitHub builds, run `gh run watch <id> --exit-status` directly and wait near the expected 10–15 minutes. Never wrap it in polling loops, background shells, or temporary log redirection.
- `tools.customRustBinariesDir` is the shared filename-based override for tool helpers; native startup incompatibilities point there without dumping loader noise.
- Vendored pty sources track upstream Codex commits; Pi-owned changes belong only in the standalone executables and the `pi-*` adapters.
- Do not accept review-driven drift from stock Pi behavior unless backend-verified or intentional.
- After TypeScript topology changes, run `npm run typecheck`; export-surface debt is reported separately by `npm run check`.
