import { join, resolve, normalize } from "path";
import { stat } from "fs/promises";
import { XmProject } from "./XmProject.js";

export class XmStaticFs {
  static mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  static async serve(pathname) {
    // 过滤 .well-known 请求（可选，根据需求）
    if (pathname.startsWith("/.well-known")) {
      console.log(`Ignoring .well-known request: ${pathname}`);
      return new Response("Not Found", { status: 404 });
    }

    // 构建文件路径
    const filePath = join(
      XmProject.appPath,
      normalize(pathname === "/" ? "index.html" : pathname)
    );
    const absoluteFilePath = resolve(filePath);

    // 确保路径在 public 目录内，防止路径遍历
    if (!absoluteFilePath.startsWith(resolve(XmProject.appPath))) {
      console.log(`Invalid path attempt: ${absoluteFilePath}`);
      return new Response("Forbidden", { status: 403 });
    }

    try {
      // 获取路径的元数据
      const stats = await stat(absoluteFilePath);

      if (stats.isFile()) {
        // 是文件，直接提供
        const file = Bun.file(absoluteFilePath);
        const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
        const contentType =
          XmStaticFs.mimeTypes[ext] || "application/octet-stream";

        console.log(`Serving file: ${absoluteFilePath}`);
        return new Response(file, {
          headers: { "Content-Type": contentType },
        });
      } else if (stats.isDirectory()) {
        // 是目录，尝试提供 index.html
        const indexPath = join(absoluteFilePath, "index.js");
        const indexFile = Bun.file(indexPath);
        if (await indexFile.exists()) {
          console.log(`Serving directory index: ${indexPath}`);
          return new Response(indexFile, {
            headers: { "Content-Type": "text/javascript" },
          });
        } else {
          console.log(`No index.html in directory: ${absoluteFilePath}`);
          return new Response(
            "Directory access forbidden or no index.html found",
            { status: 403 }
          );
        }
      } else {
        // 不是文件也不是目录（例如符号链接等）
        console.log(
          `Serving no static file: ${absoluteFilePath} (not a file or directory)`
        );
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      // 文件或目录不存在，或其他错误
      console.log(
        `Serving no static file: ${absoluteFilePath}, Error: ${error.message}`
      );
      return new Response("Not Found", { status: 404 });
    }
  }
}
