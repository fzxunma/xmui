import { XmDbCRUD, XmDb } from "./XmDbCRUD";
export default class XmDbTreeCURD {
  static async createTreeNode(
    pid = 0,
    name = "",
    dbName = "xm1",
    treeTable = "tree"
  ) {
    try {
      const node = await XmDbCRUD.create({
        type: treeTable,
        pid,
        name,
        uniqueFields: [],
        uniqueValues: [],
        dbName,
      });
      return node;
    } catch (error) {
      XmDb.log(
        `Create tree node failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async getTreeNode(
    id,
    dbName = "xm1",
    treeTable = "tree"
  ) {
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

  static async updateTreeNode(id, updates, dbName = "xm1", treeTable = "tree") {
    return await XmDbCRUD.update({ type: treeTable, id, updates, dbName });
  }

  static async deleteTreeNode(
    id,
    soft = true,
    dbName = "xm1",
    treeTable = "tree"
  ) {
    try {
      await XmDbCRUD.delete({ type: treeTable, id, soft, dbName });
      return true;
    } catch (error) {
      XmDb.log(
        `Delete tree node id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
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
}
