import { defineConfig } from "vite";
import { defineConfig } from "vitest/config";
// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom", // 模拟浏览器环境
    globals: true, // 启用全局 expect、describe 等，无需导入
    setupFiles: ["./tests/setup.js"], // 可选：测试初始化
    include: ["tests/**/*.test.js"], // 测试文件路径
  },
  build: {
    lib: {
      entry: "src/index.js", // 入口文件，导入所有 Web Components
      name: "XMUI", // 全局变量名（UMD 格式时使用，ES 模块可忽略）
      fileName: "xmui.min", // 输出文件名：xmui.min.js
      formats: ["es"], // 输出 ES 模块，适合 Web Components 和 CDN
    },
    outDir: "dist", // 输出目录，与 package.json 的 files 字段一致
    minify: "terser", // 使用 terser 压缩代码，优化 CDN 加载
    cssCodeSplit: false, // 合并所有 CSS 为单一 xmui.css 文件
    rollupOptions: {
      // 确保外部依赖（如 polyfills）不打包进 xmui.min.js
      external: [],
      output: {
        // 确保输出文件适合浏览器加载
        globals: {},
      },
    },
  },
});
