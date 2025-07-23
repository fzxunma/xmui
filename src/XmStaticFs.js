import {
  join,
  resolve,
  normalize,
  extname,
  basename,
  dirname,
  sep,
} from "path";
import { stat } from "fs/promises";
import { XmProject } from "./XmProject.js";
import { XmCacheFs } from "./XmCacheFs.js";

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
  static async serveStaticFile(finalFilePath) {
    const absoluteFilePath = resolve(finalFilePath);

    // 确保路径在 public 目录内，防止路径遍历
    if (!absoluteFilePath.startsWith(resolve(XmProject.appPath))) {
      console.log(`Invalid path attempt: ${absoluteFilePath}`);
      return new Response("Forbidden", { status: 403 });
    }

    const stats = await stat(absoluteFilePath);

    if (stats.isFile()) {
      // 是文件，直接提供
      const file = Bun.file(absoluteFilePath);
      const ext = absoluteFilePath
        .slice(absoluteFilePath.lastIndexOf("."))
        .toLowerCase();
      const contentType =
        XmStaticFs.mimeTypes[ext] || "application/octet-stream";

      if (ext === ".js" && absoluteFilePath.endsWith("index.js")) {
        const dir = dirname(absoluteFilePath);
        const parts = dir.split(sep);
        if (parts.length > 2) {
          const dirName = parts[parts.length - 2];
          const specialDirs = ["pages", "components", "views", "layouts"];

          if (specialDirs.includes(dirName)) {
            const htmlPath = join(dir, "index.html");

            const htmlFile = Bun.file(htmlPath);
            if (await htmlFile.exists()) {
              const htmlContent = await htmlFile.text();
              let jsContent = await file.text();
              // Replace }; (with optional whitespace) at the end with , template: html };
              jsContent = jsContent.replace(
                /\s*}\s*(;)?\s*$/,
                `, \ntemplate: \`${htmlContent.replace(/`/g, "\\`")}\` };`
              );
              return new Response(jsContent, {
                headers: { "Content-Type": contentType },
              });
            }
          }
        }
      }
      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    } else if (stats.isDirectory()) {
      // 是目录，尝试提供 index.html
      const indexPath = join(absoluteFilePath, "index.js");
      const indexFile = Bun.file(indexPath);
      if (await indexFile.exists()) {
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
      return new Response("Not Found", { status: 404 });
    }
  }
  static async serve(pathname) {
    // 过滤 .well-known 请求（可选，根据需求）
    if (pathname.startsWith("/.well-known")) {
      //console.log(`Ignoring .well-known request: ${pathname}`);
      return new Response("Not Found", { status: 404 });
    }

    // 构建文件路径
    const filePath = join(
      XmProject.appPath,
      normalize(pathname === "/" ? "index.html" : pathname)
    );
    let finalFilePath = filePath;
    const ext = extname(filePath).toLowerCase();
    if (ext === "") {
      const name = basename(filePath);
      const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
      const newFileName = `Xm${capitalizedName}Page.js`;

      finalFilePath = join(dirname(filePath), newFileName);
    } else if (ext === ".vue") {
      return await XmCacheFs.buildVue(filePath);
    }

    try {
      // 获取路径的元数据
      return await XmStaticFs.serveStaticFile(finalFilePath);
    } catch (error) {
      return new Response("Not Found", { status: 404 });
    }
  }
}
