import { mimeTypes } from "./mimeTypes.js";
import { join, resolve } from "path";
import { Project } from "./project.js";

export async function staticFs(pathname) {
  // 静态文件服务
  const filePath = join(Project.publicPath, pathname === "/" ? "index.html" : pathname);

  const absoluteFilePath = resolve(filePath);
  const file = Bun.file(absoluteFilePath);
  const fileExists = await file.exists();
  if (fileExists) {
     const ext = filePath.slice(filePath.lastIndexOf("."));
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
   
  }else{
       console.log(`Serving no static file: ${absoluteFilePath}`);
  }

  return new Response("Not Found", { status: 404 });
}
