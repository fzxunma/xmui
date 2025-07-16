import { FileSystemRouter } from "bun";
import { watch } from "fs/promises";
import { XmProject } from "./XmProject.js";
import { XmDb } from "./XmDb.js";
import { XmStaticFs } from "./XmStaticFs.js"; // 导入静态文件服务模块

export class XmRouter {
  static router = new FileSystemRouter({
    style: "nextjs",
    dir: XmProject.serverPath,
    fileExtensions: [".ts", ".js"],
  });
  static async setup(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const match = XmRouter.router.match(pathname);
    if (match) {
      return await XmRouter.routerMatch(req, match);
    }
    return await XmStaticFs.serve(pathname);
  }
  static async routerMatch(req, match) {
    try {
      const file = Bun.file(match.filePath);
      if (!(await file.exists())) {
        return new Response("Route file not found", { status: 404 });
      }
      delete require.cache[match.filePath];
      // 添加调试信息
      const handler = await import(`file://${match.filePath}`);
      console.log(`Imported ${match.filePath} successfully`);
      if (typeof handler.default !== "function") {
        return new Response("Invalid route handler", { status: 500 });
      }
      return await handler.default(req, XmDb.db);
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  static async setupHotReload() {
    if (process.env.NODE_ENV !== "production") {
      const watcher = watch(XmProject.serverPath, { recursive: true });
      for await (const event of watcher) {
        console.log(`File changed: ${event.filename}, reloading router...`);
        // 添加延迟，确保文件写入完成
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          XmRouter.router.reload();
        } catch (error) {
          console.error("Error reloading router:", error);
        }
      }
    }
  }
}
