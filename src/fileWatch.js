import { watch } from "fs/promises";
import { Project } from "./project.js";
// 监听文件变化以实现热重载
export async function setupHotReload(router) {
  if (process.env.NODE_ENV !== "production") {
    const watcher = watch(Project.serverPath, { recursive: true });
    for await (const event of watcher) {
      console.log(`File changed: ${event.filename}, reloading router...`);
      // 添加延迟，确保文件写入完成
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        router.reload();
      } catch (error) {
        console.error("Error reloading router:", error);
      }
    }
  }
}
