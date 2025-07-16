// server.js
import { setupHotReload } from "./src/filewatch.js"; // 导入热重载模块
import { router, routerMatch } from "./src/router.js"; // 导入路由模块
import { staticFs } from "./src/staticFs.js"; // 导入静态文件服务模块
// MIME 类型映射

// 创建 Bun 服务器
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const match = router.match(pathname);
    if (match) {
      return await routerMatch(req, match);
    }
    return await staticFs(pathname);
  },
});
setupHotReload(router);
console.log(`Server running at http://localhost:${server.port}`);
