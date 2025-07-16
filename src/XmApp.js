// server.js
import { XmRouter } from "./XmRouter.js"; // 导入路由模块
import { XmDb } from "./XmDb.js";


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
