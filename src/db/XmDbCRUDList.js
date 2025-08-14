import { XmDbCRUD, XmDb } from "./XmDbCRUD";

export default class XmDbListCURD {
  static async getListItems(
    pid = 0,
    page = 1,
    limit = 100,
    dbName = "xm1",
    table = "list"
  ) {
    try {
      // 确保表存在
      await XmDb.ensureTable(table, dbName);

      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);

      // 先尝试从缓存获取
      const cacheKey = `${dbName}:${table}`;

      const allRows = XmDb.pidCache.get(`${cacheKey}:${pid}`) || [];
      if (allRows.length > 0) {
        const offset = (page - 1) * limit;
        const paginatedRows = allRows.slice(offset, offset + limit);
        return { rows: paginatedRows, total: allRows.length };
      }

      // 缓存为空时从数据库获取
      const offset = (page - 1) * limit;
      const rows = db
        .prepare(
          `SELECT * FROM \`${table}\` WHERE pid = ? AND delete_time IS NULL LIMIT ? OFFSET ?`
        )
        .all(pid, limit, offset);
      const count = db
        .prepare(
          `SELECT COUNT(*) as count FROM \`${table}\` WHERE pid = ? AND delete_time IS NULL`
        )
        .get(pid).count;
      return { rows, total: count };
    } catch (error) {
      XmDb.log(
        `Get list items for pid ${pid} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async groupListItemsToTree(
    groupByFields,
    dbName = "xm1",
    table = "list"
  ) {
    try {
      await XmDb.ensureTable(table, dbName);
      await XmDb.ensureTable("tree", dbName);

      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);

      const items = db
        .prepare(`SELECT * FROM \`${table}\` WHERE delete_time IS NULL`)
        .all();

      const groups = {};
      for (const item of items) {
        const groupKey = groupByFields.map((f) => item[f]).join("-");
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
      }

      for (const groupKey in groups) {
        // 创建树节点
        const node = await XmDbCRUD.create({
          type: "tree",
          pid: 0,
          name: groupKey,
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });

        // 更新列表项的 pid
        for (const item of groups[groupKey]) {
          await XmDbCRUD.update({
            type: table,
            id: item.id,
            updates: { pid: node.id },
            dbName,
          });
        }
      }
    } catch (error) {
      XmDb.log(
        `Group list items to tree failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }
}
