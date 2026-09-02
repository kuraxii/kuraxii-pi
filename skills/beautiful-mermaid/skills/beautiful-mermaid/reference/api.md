# beautiful-mermaid API Reference

Condensed from the upstream README. Source: <https://github.com/lukilabs/beautiful-mermaid>

## Exports

```ts
import {
  renderMermaidSVG,        // (text: string, options?: RenderOptions) => string
  renderMermaidSVGAsync,   // (text, options?) => Promise<string>
  renderMermaidASCII,      // (text: string, options?: AsciiRenderOptions) => string
  renderMermaidAscii,      // deprecated alias of renderMermaidASCII
  renderMermaid,           // deprecated alias of renderMermaidSVGAsync
  renderMermaidSync,       // deprecated alias of renderMermaidSVG
  parseMermaid,            // (text) => MermaidGraph
  THEMES,                  // Record<string, DiagramColors>
  DEFAULTS,                // { bg: '#FFFFFF', fg: '#27272A' }
  fromShikiTheme,          // (theme) => DiagramColors
} from 'beautiful-mermaid'
```

## RenderOptions (SVG)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bg` | `string` | `#FFFFFF` | background color (or CSS variable) |
| `fg` | `string` | `#27272A` | foreground color (or CSS variable) |
| `line` | `string?` | — | edge/connector color |
| `accent` | `string?` | — | arrow heads, highlights |
| `muted` | `string?` | — | secondary text, edge labels |
| `surface` | `string?` | — | node fill tint |
| `border` | `string?` | — | node stroke color |
| `font` | `string` | `Inter` | font family |
| `transparent` | `boolean` | `false` | transparent background |
| `padding` | `number` | `40` | canvas padding px |
| `nodeSpacing` | `number` | `24` | horizontal sibling spacing |
| `layerSpacing` | `number` | `40` | vertical layer spacing |
| `componentSpacing` | `number` | `24` | spacing between disconnected components |
| `thoroughness` | `number` | `3` | crossing minimization trials (1-7) |
| `interactive` | `boolean` | `false` | hover tooltips (xychart only) |

## AsciiRenderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useAscii` | `boolean` | `false` | true = ASCII (`+`,`-`,`|`,`>`), false = Unicode (`┌`,`─`,`│`,`►`) |
| `paddingX` | `number` | `5` | horizontal node spacing |
| `paddingY` | `number` | `5` | vertical node spacing |
| `boxBorderPadding` | `number` | `1` | inner box padding |
| `colorMode` | `string` | `'auto'` | `'none'`, `'auto'`, `'ansi16'`, `'ansi256'`, `'truecolor'`, `'html'` |
| `theme` | `Partial<AsciiTheme>` | — | override default ASCII colors |

## Built-in themes (THEMES keys)

| Theme | Type | Background | Accent |
|-------|------|------------|--------|
| `zinc-light` | Light | `#FFFFFF` | derived |
| `zinc-dark` | Dark | `#18181B` | derived |
| `tokyo-night` | Dark | `#1a1b26` | `#7aa2f7` |
| `tokyo-night-storm` | Dark | `#24283b` | `#7aa2f7` |
| `tokyo-night-light` | Light | `#d5d6db` | `#34548a` |
| `catppuccin-mocha` | Dark | `#1e1e2e` | `#cba6f7` |
| `catppuccin-latte` | Light | `#eff1f5` | `#8839ef` |
| `nord` | Dark | `#2e3440` | `#88c0d0` |
| `nord-light` | Light | `#eceff4` | `#5e81ac` |
| `dracula` | Dark | `#282a36` | `#bd93f9` |
| `github-light` | Light | `#ffffff` | `#0969da` |
| `github-dark` | Dark | `#0d1117` | `#4493f8` |
| `solarized-light` | Light | `#fdf6e3` | `#268bd2` |
| `solarized-dark` | Dark | `#002b36` | `#268bd2` |
| `one-dark` | Dark | `#282c34` | `#c678dd` |

## Supported Mermaid syntax highlights

- **Flowchart/State**: `linkStyle 0 stroke:#ff0000,stroke-width:2px`, `linkStyle default stroke:#888`, `classDef`, `class A,B cls`, `style A fill:#f00`, subgraphs with `direction` overrides.
- **Sequence**: `participant A as Alias`, `->>`, `-->>`, `Note over A,B`, self-messages.
- **Class**: `<|--`, `*--`, `o--`, `-->`, `..>`, fields `+int age`, methods `+isMammal() bool`.
- **ER**: `||--o{`, `||--|{`, identifying/non-identifying relationships, attributes.
- **XY Chart**:
  ```
  xychart-beta
      title "Monthly Revenue"
      x-axis [Jan, Feb, Mar, Apr, May, Jun]
      y-axis "Revenue ($K)" 0 --> 500
      bar [180, 250, 310, 280, 350, 420]
      line [300, 330, 320, 353, 352, 395]
  ```
  Also supports `horizontal`, numeric x-axis (`x-axis 0 --> 100`), axis titles, and multiple `bar`/`line` series (monochromatic palette derived from `accent`).
