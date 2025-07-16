import { FileSystemRouter } from "bun";
import { Project } from "./project.js";
// 初始化路由
export const router = new FileSystemRouter({
  style: "nextjs",
  dir: Project.serverPath,
  fileExtensions: [".ts", ".js"],
});

export async function routerMatch(req, match) {
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
    return await handler.default(req);
  } catch (error) {
    return new Response("Internal Server Error", { status: 500 });
  }
}
// 打印初始路由
console.log("Initial routes:", router.routes);
