---
name: beautiful-mermaid
description: >-
  Render Mermaid diagrams directly to beautiful SVG or ASCII/Unicode text using
  the beautiful-mermaid library — no browser, no network, synchronous, fully
  themeable. USE THIS SKILL when the user wants a diagram rendered to an SVG
  file or to terminal/ASCII text WITHOUT installing Chrome or calling Kroki,
  and when they mention flowchart, sequence diagram, class diagram, ER diagram,
  state machine, xy chart, 流程图, 时序图, 架构图, or 终端图/ASCII 图.
  PROACTIVELY USE to visualize systems with 3+ components as SVG files or
  in-terminal ASCII. For .mmd + PNG/PDF export via mmdc/Kroki with 17+ diagram
  types use the mermaid skill instead; for pixel-precise/branded diagrams use
  drawio.
---

# Beautiful Mermaid — Direct SVG / ASCII Rendering

Render Mermaid diagrams to **SVG** (rich UIs, files, Markdown embeds) or **ASCII/Unicode** (terminals, CLI tools, chat) using the [`beautiful-mermaid`](https://github.com/lukilabs/beautiful-mermaid) library.

**Key advantage vs mmdc/Kroki:** pure TypeScript, **no headless Chrome, no network, fully synchronous**, and produces polished, fully themeable output. Also renders directly to **ASCII/Unicode** for terminal use — something mmdc/Kroki cannot do.

## When to use / when NOT to use

**Use this skill for:**

- Rendering a diagram to an **`.svg` file** (self-contained, themeable, no browser/network)
- Rendering to **ASCII/Unicode text** for terminals, CLI output, or chat
- Synchronous in-process rendering (e.g. inside a script, build step, or agent tool) where you don't want to shell out to `mmdc`
- Programmatic theming (two-color `bg`/`fg`, 15 built-in themes, or any Shiki/VS Code theme)

**Do NOT use it — route elsewhere — for:**

- `.mmd` → **PNG/PDF** export, or diagram types beyond the 6 below (gantt, pie, mindmap, gitGraph, C4, usecase, …) → use the **mermaid** skill (mmdc/Kroki)
- Pixel-precise placement, branded icons, custom layout → **drawio**
- Hand-drawn/sketchy aesthetic → **excalidraw** / **tldraw**

## Install

```bash
bun add beautiful-mermaid
# or: npm install beautiful-mermaid   |   pnpm add beautiful-mermaid
```

Verify it's usable (Bun resolves the TS source directly):

```bash
bun -e "import('./node_modules/beautiful-mermaid/src/index.ts').then(m => console.log(Object.keys(m).join(', ')))"
```

> Only 2 runtime deps are pulled in: `elkjs` (layout engine) and `entities`. No DOM, no browser.

## Core API

```ts
import {
  renderMermaidSVG,        // string — synchronous SVG
  renderMermaidSVGAsync,   // Promise<string> — same output
  renderMermaidASCII,      // string — ASCII/Unicode text
  parseMermaid,            // structured graph (custom processing)
  THEMES,                  // 15 built-in themes
  DEFAULTS,                // { bg, fg }
  fromShikiTheme,          // extract DiagramColors from a Shiki theme
} from 'beautiful-mermaid'

const svg = renderMermaidSVG(`graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]`)

const ascii = renderMermaidASCII(`graph LR; A --> B --> C`)
```

Auto-detects diagram type from the first line — no separate function needed per type.

## Supported diagram types (6)

| Type | Header keyword | Notes |
|------|----------------|-------|
| Flowchart | `graph TD/LR/BT/RL` or `flowchart ...` | incl. subgraphs, `classDef`, `style`, `linkStyle` |
| State | `stateDiagram-v2` | incl. `[*]` start/end pseudostates |
| Sequence | `sequenceDiagram` | `->>`, `-->>`, participants, notes |
| Class | `classDiagram` | UML: inheritance, association, dependency, methods/fields |
| ER | `erDiagram` | crow's foot notation |
| XY Chart | `xychart-beta` | bar, line, combined; `horizontal`; multi-series |

## Theming

Every diagram needs just **`bg` + `fg`**; all other colors are derived with CSS `color-mix()` inside the SVG. Optional enrichments override specific roles.

```ts
renderMermaidSVG(code, { bg: '#1a1b26', fg: '#a9b1d6' })                       // mono
renderMermaidSVG(code, THEMES['tokyo-night'])                                 // built-in
renderMermaidSVG(code, { ...THEMES['github-dark'], accent: '#ff6b6b' })       // tweak
```

| Option | Role | Derivation (when unset) |
|--------|------|-------------------------|
| `bg` / `fg` | background / foreground | required |
| `line` | edges/connectors | fg @50% into bg |
| `accent` | arrow heads, highlights | fg @85% |
| `muted` | secondary text, edge labels | fg @40% |
| `surface` | node fill tint | fg @3% |
| `border` | node stroke | fg @20% |

Built-in themes: `zinc-light/dark`, `tokyo-night(/storm/light)`, `catppuccin-mocha/latte`, `nord(/light)`, `dracula`, `github-light/dark`, `solarized-light/dark`, `one-dark`.

**Shiki / VS Code themes:**

```ts
import { getSingletonHighlighter } from 'shiki'
import { renderMermaidSVG, fromShikiTheme } from 'beautiful-mermaid'

const hl = await getSingletonHighlighter({ themes: ['vitesse-dark'] })
const svg = renderMermaidSVG(code, fromShikiTheme(hl.getTheme('vitesse-dark')))
```

**Live theme switching:** pass CSS variables (`bg: 'var(--background)'`, `fg: 'var(--foreground)'`, `transparent: true`) so the SVG re-themes via CSS cascade without re-rendering.

Full option reference: see `reference/api.md`.

## Workflow

1. **Write the `.mmd` source** to disk (keeps it versioned/embeddable in Markdown)
2. **Render** using the helper script (preferred) or a small inline snippet (below)
3. **Output** an `.svg` (default) or `.txt` ASCII/Unicode file
4. **Verify** — for SVG, confirm the file is non-trivial and well-formed; for ASCII, confirm labels/edges read correctly. Fix source and re-render on failure (the library throws a descriptive error on bad syntax)

### Helper script (preferred)

The skill ships `scripts/render.ts` — run it from the project root:

```bash
# SVG (default), theme applied
bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd --theme tokyo-night

# ASCII / Unicode to terminal or file
bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd --ascii
bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd --unicode --out diagram.txt

# Colors + stdout
bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd --bg '#1a1b26' --fg '#a9b1d6' --stdout
```

### Inline snippet

```ts
import { renderMermaidSVG } from 'beautiful-mermaid'
import { writeFileSync } from 'node:fs'

const code = `graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action]
  B -->|No| D[End]`

writeFileSync('diagram.svg', renderMermaidSVG(code, { bg: '#1a1b26', fg: '#a9b1d6' }))
```

For ASCII output:

```ts
import { renderMermaidASCII } from 'beautiful-mermaid'
const ascii = renderMermaidASCII(code, { useAscii: false })  // false = Unicode, true = ASCII
console.log(ascii)
```

## Examples

### Example 1 — API auth sequence → SVG file

**Prompt:** "把 JWT 登录流程画成时序图 SVG"

Write `auth.mmd`, then:

```bash
bun .pi/skills/beautiful-mermaid/scripts/render.ts auth.mmd --theme github-dark
# → auth.svg
```

### Example 2 — Terminal flowchart → ASCII

**Prompt:** "在终端里画一个部署流程图"

```bash
bun .pi/skills/beautiful-mermaid/scripts/render.ts deploy.mmd --ascii --stdout
```

Output:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Build   │────►│  Test    │────►│  Deploy  │
└──────────┘     └──────────┘     └──────────┘
```

### Example 3 — XY chart SVG

`xychart-beta` source rendered with `--interactive` enables hover tooltips:

```bash
bun .pi/skills/beautiful-mermaid/scripts/render.ts revenue.mmd --interactive
```

## Reference

See `reference/api.md` for the complete `RenderOptions` / `AsciiRenderOptions` tables and theme list.
