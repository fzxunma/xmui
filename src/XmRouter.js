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

  static async setup(req) {
    try {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // RESTful API 端点
      if (pathname === "/api/tree" && req.method === "GET") {
        return await XmRouter.handleTree(req);
      }
      if (pathname === "/api/tree/nodes" && req.method === "GET") {
        return await XmRouter.handleTreeNodes(req);
      }
      if (pathname === "/api/tree" && req.method === "POST") {
        return await XmRouter.handleCreateTreeNode(req);
      }
      if (pathname.startsWith("/api/tree/") && req.method === "PUT") {
        return await XmRouter.handleUpdateTreeNode(req);
      }
      if (pathname.startsWith("/api/tree/") && req.method === "DELETE") {
        return await XmRouter.handleDeleteTreeNode(req);
      }

      // 文件系统路由
      const match = XmRouter.router.match(pathname);
      if (match) {
        return await XmRouter.routerMatch(req, match);
      }

      // 静态文件服务
      return await XmStaticFs.serve(pathname);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] Setup error:", error);
      }
      return new Response(
        JSON.stringify({ code: 500, msg: `Internal server error: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  static async handleTree(req) {
    try {
      const tree = await XmDb.buildTree();
      if (!tree) {
        return new Response(
          JSON.stringify({ code: 404, msg: "No root node found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ code: 0, msg: "Success", data: tree }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] handleTree error:", error);
      }
      return new Response(
        JSON.stringify({ code: 500, msg: `Failed to fetch tree: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  static async handleTreeNodes(req) {
    try {
      const nodes = await XmDb.buildTree();
      if (!nodes) {
        return new Response(
          JSON.stringify({ code: 404, msg: "No root node found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      // 展平树形结构为节点列表
      const flattenNodes = (nodes, result = []) => {
        nodes.forEach(node => {
          result.push({
            id: node.id,
            pid: node.pid,
            name: node.name,
            key: node.key,
          });
          if (node.children) {
            flattenNodes(node.children, result);
          }
        });
        return result;
      };
      const flatNodes = flattenNodes([nodes]);
      return new Response(
        JSON.stringify({ code: 0, msg: "Success", data: flatNodes }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] handleTreeNodes error:", error);
      }
      return new Response(
        JSON.stringify({ code: 500, msg: `Failed to fetch tree nodes: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  static async handleCreateTreeNode(req) {
    try {
      const input = await req.json();
      if (!input.name || typeof input.name !== "string") {
        return new Response(
          JSON.stringify({ code: 400, msg: "Name is required and must be a string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const { pid, name, key } = input;
      const treeNode = await XmDb.createTreeNode(pid, name, key);
      return new Response(
        JSON.stringify({
          code: 0,
          msg: "Node created successfully",
          data: {
            id: treeNode.id,
            pid: treeNode.pid,
            name: treeNode.name,
            key: treeNode.key,
          }
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      // if (process.env.NODE_ENV !== "production") {
      //   console.error("[XmRouter] handleCreateTreeNode error:", error);
      // }
      const code = error.message.includes("Unique constraint violation") || error.message.includes("Invalid") ? 400 : 500;
      return new Response(
        JSON.stringify({ code, msg: `Failed to create tree node: ${error.message}` }),
        { status: code, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  static async handleUpdateTreeNode(req) {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split("/").pop();
      if (!id || !/^\d+$/.test(id)) {
        return new Response(
          JSON.stringify({ code: 400, msg: "Invalid tree node ID" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const input = await req.json();
      const updates = {};
      if (input.name) updates.name = input.name;
      if (input.key !== undefined) updates.key = input.key;
      if (input.pid !== undefined) updates.pid = input.pid;
      const updated = await XmDb.updateTreeNode(id, updates);
      if (!updated) {
        return new Response(
          JSON.stringify({ code: 404, msg: "Tree node not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          code: 0,
          msg: "Node updated successfully",
          data: {
            id: updated.id,
            pid: updated.pid,
            name: updated.name,
            key: updated.key,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] handleUpdateTreeNode error:", error);
      }
      return new Response(
        JSON.stringify({ code: 500, msg: `Failed to update tree node: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  static async handleDeleteTreeNode(req) {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split("/").pop();
      if (!id || !/^\d+$/.test(id)) {
        return new Response(
          JSON.stringify({ code: 400, msg: "Invalid tree node ID" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const result = await XmDb.deleteTreeNode(id);
      if (!result) {
        return new Response(
          JSON.stringify({ code: 404, msg: "Tree node not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ code: 0, msg: "Node deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] handleDeleteTreeNode error:", error);
      }
      return new Response(
        JSON.stringify({ code: 500, msg: `Failed to delete tree node: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  static async routerMatch(req, match) {
    try {
      const file = Bun.file(match.filePath);
      if (!(await file.exists())) {
        return new Response(
          JSON.stringify({ code: 404, msg: "Route file not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      delete require.cache[match.filePath];
      const handler = await import(`file://${match.filePath}`);
      if (typeof handler.default !== "function") {
        return new Response(
          JSON.stringify({ code: 500, msg: "Invalid route handler" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      return await handler.default(req, XmDb.db);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[XmRouter] Router match error:", error);
      }
      return new Response(
        JSON.stringify({ code: 500, msg: `Internal server error: ${error.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
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