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
      if (
        !pathname ||
        typeof pathname !== "string" ||
        pathname.includes("[object Object]") ||
        /[^a-zA-Z0-9\-_/\.]/.test(pathname) // 非法字符
      ) {
        console.warn("Blocked invalid pathname:", pathname);
        return new Response("Invalid request path", { status: 400 });
      }

      const validDbs = ["xm1", "xm2"];
      if (!validDbs.includes(dbName)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: `Invalid database name: ${dbName}` },
          400
        );
      }

      if (pathname === "/api/tree" && req.method === "POST") {
        return await XmRouter.handleTreeActions(req, dbName);
      }
      if (pathname === "/api/list" && req.method === "POST") {
        return await XmRouter.handleListActions(req, dbName);
      }
      if (pathname === "/api/list/keys" && req.method === "GET") {
        return await XmRouter.handleListKeys(req, dbName);
      }
      if (pathname.startsWith("/api")) {
        console.warn("Invalid API path:", pathname);
        return XmRouter.gzipResponse(
          { code: 404, msg: "Invalid API path" },
          404
        );
      }
      if (req.method === "GET") {
        const match = XmRouter.router.match(pathname);
        if (match) {
          return await XmRouter.routerMatch(req, match);
        }
        return await XmStaticFs.serve(pathname);
      } else {
        return XmRouter.gzipResponse(
          { code: 404, msg: "Invalid API path" },
          404
        );
      }
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

  static async handleTreeActions(req, dbName) {
    try {
      const base64Str = await req.text();
      const jsonStr = Buffer.from(base64Str, "base64").toString("utf-8");
      let payload;
      try {
        payload = JSON.parse(jsonStr);
      } catch (e) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid JSON after Base64 decode" },
          400
        );
      }

      const { action, data, table } = payload;

      switch (action) {
        case "get":
          return await XmRouter.handleTree(req, dbName, table);
        case "add":
          return await XmRouter.handleCreateTreeNode(req, data, dbName, table);
        case "edit":
          return await XmRouter.handleUpdateTreeNode(req, data, dbName, table);
        case "delete":
          return await XmRouter.handleDeleteTreeNode(req, data, dbName, table);
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

  static async handleListActions(req, dbName) {
    try {
      const base64Str = await req.text();
      const jsonStr = Buffer.from(base64Str, "base64").toString("utf-8");
      let payload;
      try {
        payload = JSON.parse(jsonStr);
      } catch (e) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid JSON after Base64 decode" },
          400
        );
      }

      const { action, table, data } = payload;
      console.log("handleListActions", payload);
      switch (action) {
        case "get":
          return await XmRouter.handleList(req, data, dbName, table);
        case "add":
          return await XmRouter.handleCreateListNode(req, data, dbName, table);
        case "edit":
          return await XmRouter.handleUpdateListNode(req, data, dbName, table);
        case "delete":
          return await XmRouter.handleDeleteListNode(req, data, dbName, table);
        default:
          return XmRouter.gzipResponse(
            { code: 400, msg: `Invalid action: ${action}` },
            400
          );
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleListActions error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        { code: 400, msg: `Invalid JSON payload: ${error.message}` },
        400
      );
    }
  }

  static async handleTree(req, dbName) {
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

  static async handleCreateTreeNode(req, data, dbName) {
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
            key: treeNode.key,
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

  static async handleUpdateTreeNode(req, data, dbName) {
    try {
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

  static async handleDeleteTreeNode(req, data, dbName) {
    try {
      const id = data.id;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid tree node ID" },
          400
        );
      }
      const result = await XmDb.deleteTreeNode(id, true, dbName);
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

  static async handleList(req, data, dbName, table) {
    try {
      const pid = data.pid || 0;
      const page = data.page || 1;
      const limit = data.limit || 10;
      const listItems = await XmDb.getListItems(
        pid,
        page,
        limit,
        dbName,
        table
      );
 
      return XmRouter.gzipResponse(
        { code: 0, msg: "Success", data: listItems },
        200
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[XmRouter] handleList error for ${dbName}:`, error);
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to fetch list items in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async handleCreateListNode(req, data, dbName) {
    try {
      if (!data.name || typeof data.name !== "string") {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Name is required and must be a string" },
          400
        );
      }
      const { pid, name, key } = data;
      const listNode = await XmDb.createListItem(
        pid,
        name,
        key,
        [],
        [],
        dbName
      );
      return XmRouter.gzipResponse(
        {
          code: 0,
          msg: "List item created successfully",
          data: {
            id: listNode.id,
            pid: listNode.pid,
            name: listNode.name,
            key: listNode.key,
          },
        },
        201
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleCreateListNode error for ${dbName}:`,
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
          msg: `Failed to create list item in ${dbName}: ${error.message}`,
        },
        code
      );
    }
  }

  static async handleUpdateListNode(req, data, dbName) {
    try {
      const id = data.id;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid list item ID" },
          400
        );
      }
      const updates = {};
      if (data.name) updates.name = data.name;
      if (data.pid !== undefined) updates.pid = data.pid;
      if (data.key !== undefined) updates.key = data.key;
      const updated = await XmDb.updateListItem(id, updates, dbName);
      if (!updated) {
        return XmRouter.gzipResponse(
          { code: 404, msg: `List item not found in ${dbName}` },
          404
        );
      }
      return XmRouter.gzipResponse(
        {
          code: 0,
          msg: "List item updated successfully",
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
          `[XmRouter] handleUpdateListNode error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to update list item in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async handleDeleteListNode(req, data, dbName) {
    try {
      const id = data.id;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid list item ID" },
          400
        );
      }
      const result = await XmDb.deleteListItem(id, true, dbName);
      if (!result) {
        return XmRouter.gzipResponse(
          { code: 404, msg: `List item not found in ${dbName}` },
          404
        );
      }
      return XmRouter.gzipResponse(
        { code: 0, msg: "List item deleted successfully" },
        200
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleDeleteListNode error for ${dbName}:`,
          error
        );
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to delete list item in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async handleListKeys(req, dbName) {
    try {
      const keys = await XmDb.getListKeys(dbName);
      return XmRouter.gzipResponse(
        { code: 0, msg: "Success", data: keys },
        200
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[XmRouter] handleListKeys error for ${dbName}:`, error);
      }
      return XmRouter.gzipResponse(
        {
          code: 500,
          msg: `Failed to fetch list keys in ${dbName}: ${error.message}`,
        },
        500
      );
    }
  }

  static async routerMatch(req, match) {
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
