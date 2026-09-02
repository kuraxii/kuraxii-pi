#!/usr/bin/env bun
/**
 * Render a Mermaid (.mmd) source to SVG or ASCII/Unicode using beautiful-mermaid.
 *
 * Run from the project root (so `beautiful-mermaid` resolves from node_modules):
 *
 *   bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd
 *   bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd --theme tokyo-night
 *   bun .pi/skills/beautiful-mermaid/scripts/render.ts diagram.mmd --ascii --stdout
 *   echo 'graph TD; A-->B' | bun .pi/skills/beautiful-mermaid/scripts/render.ts --stdin
 *
 * Outputs to <input>.svg (default), <input>.txt (ascii/unicode), or --out path.
 */

import { renderMermaidSVG, renderMermaidASCII, THEMES } from "beautiful-mermaid";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";

// ── Argument parsing ────────────────────────────────────────────────

const args = process.argv.slice(2);

interface Cli {
  input?: string;
  out?: string;
  format: "svg" | "ascii" | "unicode";
  theme?: string;
  bg?: string;
  fg?: string;
  accent?: string;
  line?: string;
  muted?: string;
  surface?: string;
  border?: string;
  font?: string;
  transparent: boolean;
  interactive: boolean;
  stdin: boolean;
  stdout: boolean;
  colorMode?: string;
}

function parseArgs(argv: string[]): Cli {
  const cli: Cli = {
    format: "svg",
    transparent: false,
    interactive: false,
    stdin: false,
    stdout: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const next = argv[i + 1];

    switch (a) {
      case "--ascii": cli.format = "ascii"; break;
      case "--unicode": cli.format = "unicode"; break;
      case "--svg": cli.format = "svg"; break;
      case "--stdin": cli.stdin = true; break;
      case "--stdout": cli.stdout = true; break;
      case "--transparent": cli.transparent = true; break;
      case "--interactive": cli.interactive = true; break;
      case "--out": if (next) { cli.out = next; i++; } break;
      case "--theme": if (next) { cli.theme = next; i++; } break;
      case "--bg": if (next) { cli.bg = next; i++; } break;
      case "--fg": if (next) { cli.fg = next; i++; } break;
      case "--accent": if (next) { cli.accent = next; i++; } break;
      case "--line": if (next) { cli.line = next; i++; } break;
      case "--muted": if (next) { cli.muted = next; i++; } break;
      case "--surface": if (next) { cli.surface = next; i++; } break;
      case "--border": if (next) { cli.border = next; i++; } break;
      case "--font": if (next) { cli.font = next; i++; } break;
      case "--color": if (next) { cli.colorMode = next; i++; } break;
      default:
        if (a.startsWith("--")) {
          console.error(`未知参数: ${a}`);
          process.exit(2);
        }
        cli.input = a;
    }
  }

  return cli;
}

function usage(): never {
  console.error(`用法: bun render.ts [input.mmd] [options]

选项:
  --ascii            输出纯 ASCII (+,-,|,>)
  --unicode          输出 Unicode 框线字符 (┌,─,│,►)  [默认, 当 format 非 svg]
  --svg              输出 SVG [默认]
  --theme <name>     内置主题: ${Object.keys(THEMES).join(", ")}
  --bg/--fg <color>  基础两色
  --accent/--line/--muted/--surface/--border <color>  可选增强色
  --font <name>      字体族
  --transparent      透明背景 (SVG)
  --interactive      悬停提示 (仅 xychart)
  --color <mode>     ASCII 颜色: none|auto|ansi16|ansi256|truecolor|html
  --out <path>       输出文件路径
  --stdout           打印到标准输出而非写文件
  --stdin            从标准输入读取 (缺省 input 时自动启用)`);
  process.exit(2);
}

// ── Main ────────────────────────────────────────────────────────────

const cli = parseArgs(args);

let source: string;
if (cli.input) {
  source = readFileSync(resolve(cli.input), "utf-8");
} else if (!process.stdin.isTTY || cli.stdin) {
  source = readFileSync(0, "utf-8"); // stdin
} else {
  usage();
}

// Resolve theme
const themeColors = cli.theme ? THEMES[cli.theme] : undefined;
if (cli.theme && !themeColors) {
  console.error(`未知主题 "${cli.theme}"。可用: ${Object.keys(THEMES).join(", ")}`);
  process.exit(2);
}

// Build SVG options (only set provided colors)
const svgOptions: Record<string, unknown> = {};
if (themeColors) Object.assign(svgOptions, themeColors);
for (const [flag, key] of [
  ["bg", "bg"], ["fg", "fg"], ["accent", "accent"], ["line", "line"],
  ["muted", "muted"], ["surface", "surface"], ["border", "border"], ["font", "font"],
] as const) {
  const v = (cli as any)[flag];
  if (v !== undefined) svgOptions[key] = v;
}
svgOptions.transparent = cli.transparent;
svgOptions.interactive = cli.interactive;

let output: string;
let defaultExt: string;

if (cli.format === "svg") {
  output = renderMermaidSVG(source, svgOptions as any);
  defaultExt = ".svg";
} else {
  output = renderMermaidASCII(source, {
    useAscii: cli.format === "ascii",
    colorMode: (cli.colorMode as any) ?? "auto",
  });
  defaultExt = ".txt";
}

// Emit
if (cli.stdout || !cli.input) {
  process.stdout.write(output + "\n");
} else {
  const outPath = cli.out ?? join(dirname(resolve(cli.input)), basename(cli.input).replace(/\.[^.]+$/, "") + defaultExt);
  writeFileSync(outPath, output + "\n");
  console.error(`✓ 已写入 ${outPath} (${output.length} 字符)`);
}
