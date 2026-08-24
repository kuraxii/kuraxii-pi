/**
 * 编译所有非 pi 脚本为单文件二进制
 *
 * 用法: bun scripts/build.ts
 */

import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";

const ROOT = import.meta.dir;

const targets: { name: string; source: string }[] = [
  { name: "sync", source: "scripts/sync.ts" },
];

for (const t of targets) {
  console.log(`▶ 编译 ${t.name}...`);
  const result = spawnSync(
    "bun",
    [
      "build",
      "--compile",
      "--target=bun-darwin-arm64",
      t.source,
      `--outfile=${join(ROOT, t.name)}`,
    ],
    { cwd: join(ROOT, ".."), stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`  ✓ ${join(ROOT, t.name)}`);
}

console.log("\n✓ 全部编译完成");