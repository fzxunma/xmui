import { XmDbCRUD, XmDb } from "./XmDbCRUD";

export default class XmDbTreeCURD {
  static async handleCreateTreeNode(req, data, dbName, treeTable, XmRouter) {
    try {
      if (!data.name || typeof data.name !== "string") {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Name is required and must be a string" },
          400
        );
      }
      const { pid = 0, name } = data;
      const treeNode = await XmDbCRUD.create({
        type: treeTable,
        pid,
        name,
        uniqueFields: [],
        uniqueValues: [],
        dbName,
        data: data.data,
        req,
        userId: 0,
      });
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

  static async getTreeNode(id, dbName = "xm1", treeTable = "tree") {
    try {
      const tree = await XmDbCRUD.read({ type: treeTable, id, dbName });
      return { tree };
    } catch (error) {
      XmDb.log(
        `Get tree node id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async handleDeleteTreeNode(req, data, dbName, treeTable, XmRouter) {
    try {
      const id = data.id;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid tree node ID" },
          400
        );
      }
      const result = await XmDbCRUD.delete({
        type: treeTable,
        id,
        soft: true,
        dbName,
        req,
        userId: 0,
      });
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
  static async getChildren(pid, dbName = "xm1", treeTable = "tree") {
    try {
      await XmDb.ensureTable(treeTable, dbName);
      const cacheKey = `${dbName}:${treeTable}`;
      return XmDb.pidCache.get(`${cacheKey}:${pid}`) || [];
    } catch (error) {
      XmDb.log(
        `Get children for pid ${pid} failed in ${dbName}: ${error.message}`,
        "error"
      );
      return [];
    }
  }

  static async buildTree(
    root_id = 0,
    dbName = "xm1",
    maxDepth = Infinity,
    page = 1,
    limit = Infinity,
    treeTable = "tree"
  ) {
    try {
      await XmDb.ensureTable(treeTable, dbName);
      const cacheKeyTree = `${dbName}:${treeTable}`;

      const build = (id, currentDepth = 1) => {
        const node = XmDb.idCache.get(`${cacheKeyTree}:${id}`);
        if (!node) {
          XmDb.log(`Node ${id} not found in ${dbName}`, "warn");
          return null;
        }
        if (currentDepth > maxDepth) {
          return {
            ...node,
            children: [],
          };
        }
        let childrenRows = XmDb.pidCache.get(`${cacheKeyTree}:${id}`) || [];
        childrenRows = childrenRows.slice((page - 1) * limit, page * limit);
        const children = childrenRows
          .map((n) => build(n.id, currentDepth + 1))
          .filter(Boolean);
        return {
          ...node,
          children,
        };
      };

      if (root_id !== 0) {
        const tree = build(root_id);
        return tree ? [tree] : [];
      } else {
        let rootNodes = XmDb.pidCache.get(`${cacheKeyTree}:0`) || [];
        rootNodes = rootNodes.slice((page - 1) * limit, page * limit);
        if (!rootNodes.length) {
          XmDb.log(`No root nodes found for ${dbName}`, "warn");
          return [];
        }
        return rootNodes.map((root) => build(root.id)).filter(Boolean);
      }
    } catch (error) {
      XmDb.log(`Build tree failed in ${dbName}: ${error.message}`, "error");
      return [];
    }
  }

  static async handleUpdateTreeNode(req, data, dbName, treeTable, XmRouter) {
    try {
      const id = data.id;
      if (!id || !/^\d+$/.test(id)) {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Invalid tree node ID" },
          400
        );
      }
      const updates = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.pid !== undefined) updates.pid = data.pid;
      if (data.version !== undefined) updates.version = data.version;
      if (data.data !== undefined) updates.data = data.data;
      console.log(updates,data)
      const updated = await XmDbCRUD.update({
        type: treeTable,
        id,
        updates,
        dbName,
        expectedVersion: data.version,
        req,
        userId: 0,
      });
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
}
