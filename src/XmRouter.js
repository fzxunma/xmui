import { FileSystemRouter } from "bun";
import { watch } from "fs/promises";
import { XmProject } from "./XmProject.js";
import { XmDb } from "./XmDb.js";
import { XmStaticFs } from "./XmStaticFs.js";

export class XmRouter {
  static router = new FileSystemRouter({
    style: "nextjs",
    dir: XmProject.serverPath,
    fileExtensions: [".ts", ".js"],
  });

  static gzipResponse(obj, status = 200, headers = {}) {
    const jsonStr = JSON.stringify(obj);
    const encoded = new TextEncoder().encode(jsonStr);
    const gzipped = Bun.gzipSync(encoded);
    return new Response(gzipped, {
      status,
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        "Content-Length": gzipped.byteLength.toString(),
        Vary: "Accept-Encoding",
        ...headers,
      },
    });
  }

  static async setup(req) {
    try {
      const url = new URL(req.url);
      const pathname = url.pathname;
      const dbName = url.searchParams.get("db") || "xm1";
      const acceptEncoding = req.headers.get("Accept-Encoding") || "";

      const validDbs = ["xm1", "xm2"];
      if (!validDbs.includes(dbName)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: `Invalid database name: ${dbName}` },
          400
        );
      }

      if (pathname === "/api/tree" && req.method === "POST") {
        return await XmRouter.handleTreeActions(req, dbName, acceptEncoding);
      }
      if (pathname === "/api/list" && req.method === "POST") {
        return await XmRouter.handleListActions(req, dbName, acceptEncoding);
      }
      const match = XmRouter.router.match(pathname);
      if (match) {
        return await XmRouter.routerMatch(req, match, acceptEncoding);
      }

      return await XmStaticFs.serve(pathname);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] Setup error:", error);
      }
      return XmRouter.gzipResponse(
        { code: 500, msg: `Internal server error: ${error.message}` },
        500
      );
    }
  }

  static async handleTreeActions(req, dbName, acceptEncoding) {
    try {
      const base64Str = await req.text();

      // 解 Base64
      const jsonStr = Buffer.from(base64Str, "base64").toString("utf-8");

      // 解析 JSON
      let payload;
      try {
        payload = JSON.parse(jsonStr);
      } catch (e) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid JSON after Base64 decode" },
          400
        );
      }

      const { action, data } = payload;

      switch (action) {
        case "get":
          return await XmRouter.handleTree(req, dbName, acceptEncoding);
        case "add":
          return await XmRouter.handleCreateTreeNode(
            req,
            data,
            dbName,
            acceptEncoding
          );
        case "edit":
          return await XmRouter.handleUpdateTreeNode(
            req,
            data,
            dbName,
            acceptEncoding
          );
        case "delete":
          return await XmRouter.handleDeleteTreeNode(
            req,
            data,
            dbName,
            acceptEncoding
          );
        default:
          return XmRouter.gzipResponse(
            { code: 400, msg: `Invalid action: ${action}` },
            400
          );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleTreeActions error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        { code: 400, msg: `Invalid JSON payload: ${error.message}` },
        400
      );
    }
  }
  static async handleListActions(req, dbName, acceptEncoding) {
    try {
      const base64Str = await req.text();

      // 解 Base64
      const jsonStr = Buffer.from(base64Str, "base64").toString("utf-8");

      // 解析 JSON
      let payload;
      try {
        payload = JSON.parse(jsonStr);
      } catch (e) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid JSON after Base64 decode" },
          400
        );
      }

      const { action, data } = payload;

      switch (action) {
        case "get":
          return await XmRouter.handleList(req, dbName, acceptEncoding);
        case "add":
          return await XmRouter.handleCreateListNode(
            req,
            data,
            dbName,
            acceptEncoding
          );
        case "edit":
          return await XmRouter.handleUpdateListNode(
            req,
            data,
            dbName,
            acceptEncoding
          );
        case "delete":
          return await XmRouter.handleDeleteListNode(
            req,
            data,
            dbName,
            acceptEncoding
          );
        default:
          return XmRouter.gzipResponse(
            { code: 400, msg: `Invalid action: ${action}` },
            400
          );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleTreeActions error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        { code: 400, msg: `Invalid JSON payload: ${error.message}` },
        400
      );
    }
  }
  static async handleTree(req, dbName, acceptEncoding) {
    try {
      const trees = await XmDb.buildTree(0, dbName);
      if (!trees || !trees.length) {
        return XmRouter.gzipResponse(
          { code: 404, msg: `No root nodes found in ${dbName}` },
          404
        );
      }
      return XmRouter.gzipResponse(
        { code: 0, msg: "Success", data: trees },
        200
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[XmRouter] handleTree error for ${dbName}:`, error);
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to fetch trees in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async handleCreateTreeNode(req, data, dbName, acceptEncoding) {
    try {
      if (!data.name || typeof data.name !== "string") {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Name is required and must be a string" },
          400
        );
      }
      const { pid, name, key } = data;
      const treeNode = await XmDb.createTreeNode(pid, name, key, dbName);
      return XmRouter.gzipResponse(
        {
          code: 0,
          msg: "Node created successfully",
          data: {
            id: treeNode.id,
            pid: treeNode.pid,
            name: treeNode.name,
          },
        },
        201
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleCreateTreeNode error for ${dbName}:`,
          error
        );
      }
      const code =
        error.message.includes("Unique constraint violation") ||
        error.message.includes("Invalid")
          ? 400
          : 500;
      return XmRouter.gzipResponse(
        {
          code,
          msg: `Failed to create tree node in ${dbName}: ${error.message}`,
        },
        code
      );
    }
  }

  static async handleUpdateTreeNode(req, data, dbName, acceptEncoding) {
    try {
      console.log(data);
      const id = data.id;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid tree node ID" },
          400
        );
      }
      const updates = {};
      if (data.name) updates.name = data.name;
      if (data.pid !== undefined) updates.pid = data.pid;
      if (data.update_time !== undefined)
        updates.update_time = data.update_time;

      const updated = await XmDb.updateTreeNode(id, updates, dbName);
      if (!updated) {
        return XmRouter.gzipResponse(
          { code: 404, msg: `Tree node not found in ${dbName}` },
          404
        );
      }
      return XmRouter.gzipResponse(
        {
          code: 0,
          msg: "Node updated successfully",
          data: {
            id: updated.id,
            pid: updated.pid,
            name: updated.name,
            key: updated.key,
          },
        },
        200
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleUpdateTreeNode error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to update tree node in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async handleDeleteTreeNode(req, data, dbName, acceptEncoding) {
    try {
      console.log(data);
      const id = data.id;
      const update_time = data.update_time;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid tree node ID" },
          400
        );
      }
      const result = await XmDb.deleteTreeNode(id, update_time, true, dbName);
      if (!result) {
        return XmRouter.gzipResponse(
          { code: 404, msg: `Tree node not found in ${dbName}` },
          404
        );
      }
      return XmRouter.gzipResponse(
        { code: 0, msg: "Node deleted successfully" },
        200
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleDeleteTreeNode error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to delete tree node in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async routerMatch(req, match, acceptEncoding) {
    try {
      const file = Bun.file(match.filePath);
      if (!(await file.exists())) {
        return XmRouter.gzipResponse(
          { code: 404, msg: "Route file not found" },
          404
        );
      }
      delete require.cache[match.filePath];
      const handler = await import(`file://${match.filePath}`);
      if (typeof handler.default !== "function") {
        return XmRouter.gzipResponse(
          { code: 500, msg: "Invalid route handler" },
          500
        );
      }
      return await handler.default(req, XmDb.dbs);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] Router match error:", error);
      }
      return XmRouter.gzipResponse(
        { code: 500, msg: `Internal server error: ${error.message}` },
        500
      );
    }
  }

  static async setupHotReload() {
    if (process.env.NODE_ENV !== "production") {
      const watcher = watch(XmProject.serverPath, { recursive: true });
      for await (const event of watcher) {
        console.log(`File changed: ${event.filename}, reloading router...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          XmRouter.router.reload();
        } catch (error) {
          console.error("[XmRouter] Error reloading router:", error);
        }
      }
    }
  }
}
