// compile.js
import { execSync } from "child_process";
import { readdirSync, copyFileSync, mkdirSync } from "fs";
import { join } from "path";

console.log("Starting compilation...");

// 确保输出目录存在
const outDir = join(process.cwd(), "dist");
try {
  mkdirSync(outDir, { recursive: true });
} catch (error) {
  console.error("Error creating dist directory:", error);
}

// 复制 routes 目录到 dist/routes
const routesDir = join(process.cwd(), "server");
const distRoutesDir = join(outDir, "server");
try {
  mkdirSync(distRoutesDir, { recursive: true });
  const files = readdirSync(routesDir);
  for (const file of files) {
    if (file.endsWith(".js") || file.endsWith(".ts")) {
      copyFileSync(join(routesDir, file), join(distRoutesDir, file));
    }
  }
  console.log("Copied routes to dist/routes");
} catch (error) {
  console.error("Error copying routes:", error);
}

// 执行编译命令
try {
  execSync(
    `bun build --compile ./index.js --outfile=${join(outDir, "xmui")}`,
    { stdio: "inherit" }
  );
  console.log("Compilation successful: a.exe generated");
} catch (error) {
  console.error("Compilation failed:", error);
}