// server.js
import { XmRouter } from "./XmRouter.js"; // 导入路由模块
import { XmDb } from "./XmDb.js";

// Hook process events to close databases on exit
process.on('SIGINT', () => {
  XmDb.closeAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  XmDb.closeAll();
  process.exit(0);
});

process.on('beforeExit', () => {
  XmDb.closeAll();
});
// MIME 类型映射
export class XmApp {
  static server = null;
  static async init() {
    // 初始化数据库
    await XmDb.init();
    console.log("XmApp initialized.");
  }
  static async run() {
    // 创建 Bun 服务器
    XmApp.server = Bun.serve({
      port: 3000,
      async fetch(req) {
        return await XmRouter.setup(req);
      },
    });
    XmRouter.setupHotReload();
    console.log(`Server running at http://localhost:${XmApp.server.port}`);
  }
}
