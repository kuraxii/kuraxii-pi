# pi-codex-bash

基于 [@howaboua/pi-codex-conversion](https://github.com/IgorWarzocha/howaboua-pi-stuff/tree/main/packages/pi-codex-conversion) 改造，原作者 [IgorWarzocha](https://github.com/IgorWarzocha)。

If you're expecting details about the code, you've come to the wrong place. Clone it and ask your Clanka.

Pi already runs GPT models. This extension gives Codex-like models Codex-shaped shell tools and prompt handling on top of Pi's native `read`, `edit` and `write` tools. Transport stays on Pi's built-in OpenAI Codex provider.

## Install

```bash
# git 安装（推荐，dist/ 已预编译）
pi install git:github.com/kuraxii/pi-codex-bash

# npm 安装
pi install npm:@kuraxii/pi-codex-bash
```

Requires Pi 0.82 or newer and Node.js 22.19 or newer. Native helpers for macOS, Linux and Windows are bundled for x64 and arm64.

Open `/codex` after installation. Turn **Enabled** on to activate the shell adapter globally; heavy prompt overwrite remains opt-in.

## Contents

- [What you get](#what-you-get)
- [Modes](#modes)
- [Settings](#settings)
- [Models and providers](#models-and-providers)
- [Migrating from Lite](#migrating-from-lite)
- [Troubleshooting](#troubleshooting)

## What you get

- Codex-shaped `exec_command` and `write_stdin` shell tools on top of Pi's native `read`, `edit` and `write`
- foreground, background and interactive shell sessions with resumable output
- compact Pi-native rendering, status and background-shell controls

Pi keeps its sessions, project context, skills, UI and model transport. The model gets the dialect it already knows.

## Modes

| Mode | Behaviour |
| --- | --- |
| **Structured adapter** | Replaces Pi's `bash` tool with the shell adapter set while `read`, `edit` and `write` stay active. Enabled by the global `Enabled` switch. |
| **Off** | The adapter stays inactive and the model keeps Pi's ordinary tools. |

Structured mode replaces only Pi's `bash` tool with the shell adapter tools; `read`, `edit` and `write` stay active. The model inspects files with `read` or the shell and edits with Pi's native `edit` / `write`.

The **Enabled** switch in `/codex` → General turns the adapter on for all models or off globally. It no longer inspects the active model or provider.

## Settings

`/codex` opens the settings UI:

| Tab | Covers |
| --- | --- |
| General | Global enabled switch and heavy prompt overwrite |
| Display | Tool rendering and background shells |

Open the display tab directly with `/codex display`.

Settings live in `~/.pi/agent/pi-codex-bash.json`. **Edit config** opens the file for provider IDs, custom binaries and keybinds. Run `/reload` after changing keybinds by hand.

`tools.customRustBinariesDir` can override the bundled `exec_bridge` helper by filename. Build it on the target machine, put the binary in one directory, set that directory in the config, then run `/reload`.

The optional **Heavy system prompt overwrite** removes roughly 40% of Pi's known default scaffold while preserving additions from other extensions. It is off by default.

## Models and providers

The adapter is model-agnostic: `scope.enabled` in the config is the single global switch. When on, every model gets the shell adapter tools and the Codex-shaped prompt; when off, everything stays on Pi's ordinary tools.

## Renaming and migrating from Lite

The package was renamed from `@howaboua/pi-codex-conversion`. The legacy `~/.pi/agent/pi-codex-conversion.json` is read once and migrated to `pi-codex-bash.json` automatically.

This is also a major change for users of the old canonical package. Legacy PATH mode and its package binaries are gone. Old PATH-mode settings normalize to the structured adapter. Use structured tools instead.

## Troubleshooting

- **A helper cannot run on this system:** build it from a checkout on the target machine, put it in `tools.customRustBinariesDir`, then run `/reload`. Do not replace system glibc for this.

For anything stranger, clone the repository and ask your Clanka:

```bash
git clone https://github.com/kuraxii/pi-codex-bash.git
cd pi-codex-bash
npm install
pi --no-extensions --no-skills -e .
```

See [`CHANGELOG.md`](./CHANGELOG.md).

## License

MIT. Bundled and vendored third-party components retain their own licences and notices.
