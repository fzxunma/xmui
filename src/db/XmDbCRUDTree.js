// Updated XmDbCRUDTree.js
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
      const { pid = 0, name, type } = data;
      const treeNode = await XmDbCRUD.create({
        tableName: treeTable,
        pid,
        name,
        type,
        uniqueFields: [],
        uniqueValues: [],
        dbName,
        data: data.data,
        data_o: data.data_o,
        data_t: data.data_t,
        data_a: data.data_a,
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
            data_o: treeNode.data_o,
            data_t: treeNode.data_t,
            data_a: treeNode.data_a,
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

  static async handleUpsertTreeNode(req, data, dbName, treeTable, XmRouter) {
    try {
      if (!data.name || typeof data.name !== "string") {
        return XmRouter.gzipResponse(
          { code: 400, msg: "Name is required and must be a string" },
          400
        );
      }
      const { pid = 0, type, name } = data;
      const treeNode = await XmDbCRUD.upsert({
        tableName: treeTable,
        pid: pid ? pid : 0,
        name,
        type,
        data: {
          data: data.data,
          data_o: data.data_o,
          data_t: data.data_t,
          data_a: data.data_a,
        },
        dbName,
        req,
        userId: 0,
      });
      return XmRouter.gzipResponse(
        {
          code: 0,
          msg: "Node created or updated successfully",
          data: {
            id: treeNode.id,
            pid: treeNode.pid,
            name: treeNode.name,
            key: treeNode.key,
            data_o: treeNode.data_o,
            data_t: treeNode.data_t,
            data_a: treeNode.data_a,
          },
        },
        201
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(
          `[XmRouter] handleUpsertTreeNode error for ${dbName}:`,
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
          msg: `Failed to upsert tree node in ${dbName}: ${error.message}`,
        },
        code
      );
    }
  }

  static async getTreeNode(id, dbName = "xm1", treeTable = "tree") {
    try {
      const tree = await XmDbCRUD.read({ tableName: treeTable, id, dbName });
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
        tableName: treeTable,
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

        const orders = XmDbCRUD.parseData(node.data_o);
        if (orders && Array.isArray(orders)) {
          const orderMap = new Map(orders.map((cid, idx) => [cid, idx]));
          childrenRows.sort(
            (a, b) =>
              (orderMap.get(a.id) ?? Infinity) -
              (orderMap.get(b.id) ?? Infinity)
          );
        }
        // 子节点分页
        childrenRows = childrenRows.slice((page - 1) * limit, page * limit);

        // 递归构建子树
        const children = childrenRows
          .map((n) => build(n.id, currentDepth + 1))
          .filter(Boolean);

        const result = { ...node };
        if (children.length > 0) {
          result.children = children;
        }
        return result;
      };

      if (root_id !== 0) {
        const tree = build(root_id);
        return tree ? [tree] : [];
      } else {
        // 根节点为 pid=0 的所有节点
        let rootNodes = XmDb.pidCache.get(`${cacheKeyTree}:0`) || [];

        const rootOrder = XmDbCRUD.parseData(rootNodes.data_o);
        if (rootOrder && Array.isArray(rootOrder)) {
          const orderMap = new Map(rootOrder.map((cid, idx) => [cid, idx]));
          rootNodes.sort(
            (a, b) =>
              (orderMap.get(a.id) ?? Infinity) -
              (orderMap.get(b.id) ?? Infinity)
          );
        }

        // 根节点分页
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
      if (data.type !== undefined) updates.type = data.type;
      if (data.version !== undefined) updates.version = data.version;
      if (data.data !== undefined) updates.data = data.data;
      if (data.data_o !== undefined) updates.data_o = data.data_o;
      if (data.data_t !== undefined) updates.data_t = data.data_t;
      if (data.data_a !== undefined) updates.data_a = data.data_a;
      const updated = await XmDbCRUD.update({
        tableName: treeTable,
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
            type: updated.type,
            name: updated.name,
            key: updated.key,
            data_o: updated.data_o,
            data_t: updated.data_t,
            data_a: updated.data_a,
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
