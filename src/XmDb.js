import { Database } from "bun:sqlite";

export class XmDb {
  static dbs = new Map();
  static idCache = new Map();
  static keyCache = new Map();
  static pidCache = new Map();
  static knownTypes = ["tree", "list"];
  static baseFields = `
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pid INTEGER DEFAULT 0,
    name TEXT,
    key TEXT,
    create_time INTEGER DEFAULT (strftime('%s', 'now')),
    update_time INTEGER DEFAULT (strftime('%s', 'now')),
    delete_time INTEGER DEFAULT NULL
  `;
  static schema = {
    tree: XmDb.baseFields,
    list: XmDb.baseFields,
  };

  static log(message, level = "info") {
    console[level](`[XmDb] ${message}`);
  }

  static async init(dbNames = ["xm1", "xm2"]) {
    for (const dbName of dbNames) {
      if (!XmDb.dbs.has(dbName)) {
        XmDb.dbs.set(dbName, new Database(`${dbName}.db`, { create: true }));
        XmDb.log(`Initialized database: ${dbName}`);
      }
      const db = XmDb.dbs.get(dbName);
      db.run("PRAGMA journal_mode=WAL;");
      for (const type of XmDb.knownTypes) {
        await XmDb.ensureTable(type, dbName);
      }

      let totalCount = 0;
      for (const type of XmDb.knownTypes) {
        const countRow = db
          .prepare(
            `SELECT COUNT(*) as count FROM \`${type}\` WHERE delete_time IS NULL`
          )
          .get();
        totalCount += countRow.count;
      }

      if (totalCount > 0) {
        XmDb.log(`Data already initialized for ${dbName}, skipping.`);
        continue;
      }

      XmDb.log(`Initializing data for ${dbName}...`);
      try {
        const root1 = await XmDb.create("tree", 0, "Root1", "", [], [], dbName);
        await XmDb.loadTable("tree", dbName);
        const root2 = await XmDb.create(
          "tree",
          0,
          "Root2",
          "root2",
          [],
          [],
          dbName
        );
        await XmDb.loadTable("tree", dbName);
        const rootId1 = root1.id;
        const rootId2 = root2.id;
        const childIds = [];
        for (let i = 1; i <= 5; i++) {
          const child = await XmDb.create(
            "tree",
            rootId1,
            `Child-${i}`,
            "",
            [],
            [],
            dbName
          );
          await XmDb.loadTable("tree", dbName);
          childIds.push(child.id);
          await XmDb.create(
            "list",
            rootId1,
            `Item-Child-${i}`,
            "",
            [],
            [],
            dbName
          );
        }

        const subchild = await XmDb.create(
          "tree",
          childIds[0],
          "Subchild-1",
          "",
          [],
          [],
          dbName
        );
        await XmDb.loadTable("tree", dbName);
        await XmDb.create(
          "list",
          childIds[0],
          "Item-Subchild-1",
          "",
          [],
          [],
          dbName
        );

        for (let i = 1; i <= 5; i++) {
          await XmDb.create("list", 0, `root-${i}`, "", [], [], dbName);
        }
        await XmDb.loadTable("list", dbName);
        XmDb.log(`Data initialization completed for ${dbName}.`);
      } catch (error) {
        XmDb.log(
          `Initialization failed for ${dbName}: ${error.message}`,
          "error"
        );
      }
    }
  }

  static async ensureTable(type, dbName = "xm1") {
    try {
      if (!XmDb.schema[type]) throw new Error(`Unknown type: ${type}`);
      const cacheKey = `${dbName}:${type}`;
      if (!XmDb.idCache.has(`${cacheKey}:0`)) {
        const db = XmDb.dbs.get(dbName);
        if (!db) throw new Error(`Database ${dbName} not found`);
        XmDb.log(`Ensuring table '${type}' exists in ${dbName}...`);
        db.run(`CREATE TABLE IF NOT EXISTS \`${type}\` (${XmDb.schema[type]})`);
        await XmDb.loadTable(type, dbName);
      }
    } catch (error) {
      XmDb.log(
        `Failed to ensure table ${type} in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async loadTable(type, dbName = "xm1") {
    try {
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${type}`;
      const rows = db
        .prepare(`SELECT * FROM \`${type}\` WHERE delete_time IS NULL`)
        .all();
      const pidMap = new Map();
      for (const row of rows) {
        XmDb.idCache.set(`${cacheKey}:${row.id}`, row);
        XmDb.keyCache.set(`${cacheKey}:${row.name}_${row.pid}`, row);
        if (!pidMap.has(row.pid)) {
          pidMap.set(row.pid, []);
        }
        pidMap.get(row.pid).push(row);
        XmDb.pidCache.set(`${cacheKey}:${row.pid}`, pidMap.get(row.pid));
      }
      XmDb.log(
        `Loaded ${rows.length} rows into cache for '${type}' in ${dbName}`
      );
    } catch (error) {
      XmDb.log(
        `Failed to load table ${type} in ${dbName}: ${error.message}`,
        "error"
      );
    }
  }

  static async create(
    type,
    pid,
    name,
    key,
    uniqueFields = [],
    uniqueValues = [],
    dbName = "xm1"
  ) {
    try {
      await XmDb.ensureTable(type, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      if (uniqueFields.length !== uniqueValues.length) {
        throw new Error("Mismatch between uniqueFields and uniqueValues");
      }
      const cacheKey = `${dbName}:${type}`;
      if (
        type === "tree" &&
        pid !== 0 &&
        !XmDb.idCache.has(`${cacheKey}:${pid}`)
      ) {
        throw new Error("pid not found in cache");
      }
      const compositeKey = `${name}_${pid}`;
      if (XmDb.keyCache.has(`${cacheKey}:${compositeKey}`)) {
        throw new Error(
          `Unique constraint violation for name+pid: ${compositeKey}`
        );
      }
      if (!key) {
        key = compositeKey;
      }
      if (uniqueFields.length > 0) {
        const conditions = uniqueFields.map((f) => `${f} = ?`).join(" AND ");
        const existing = db
          .prepare(
            `SELECT * FROM \`${type}\` WHERE ${conditions} AND delete_time IS NULL`
          )
          .get(...uniqueValues);
        if (existing) {
          throw new Error(
            `Unique constraint violation for: ${uniqueFields.join(", ")}`
          );
        }
      }

      const stmt = db.prepare(`
        INSERT INTO \`${type}\` (pid, name, key, create_time, update_time)
        VALUES (?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now')) RETURNING *`);
      const row = stmt.get(pid, name, key);
      XmDb.idCache.set(`${cacheKey}:${row.id}`, row);
      XmDb.keyCache.set(`${cacheKey}:${row.name}_${row.pid}`, row);
      const pidRows = XmDb.pidCache.get(`${cacheKey}:${row.pid}`) || [];
      pidRows.push(row);
      XmDb.pidCache.set(`${cacheKey}:${row.pid}`, pidRows);
      return row;
    } catch (error) {
      XmDb.log(
        `Create ${type} failed in ${dbName}: ${error.message}`,
        "error",
        pid
      );
      throw error;
    }
  }

  static async read(type, id, dbName = "xm1") {
    try {
      await XmDb.ensureTable(type, dbName);
      const cacheKey = `${dbName}:${type}`;
      return XmDb.idCache.get(`${cacheKey}:${id}`) ?? null;
    } catch (error) {
      XmDb.log(
        `Read ${type} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async readByName(type, compositeKey, dbName = "xm1") {
    try {
      await XmDb.ensureTable(type, dbName);
      const cacheKey = `${dbName}:${type}`;
      return XmDb.keyCache.get(`${cacheKey}:${compositeKey}`) ?? null;
    } catch (error) {
      XmDb.log(
        `Read ${type} by name+pid ${compositeKey} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async update(type, id, updates, dbName = "xm1") {
    try {
      await XmDb.ensureTable(type, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${type}`;
      const existing = await XmDb.read(type, id, dbName);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }
      const newName = updates.name || existing.name;
      const newPid = updates.pid !== undefined ? updates.pid : existing.pid;
      const compositeKey = `${newName}_${newPid}`;
      if (!updates.key) {
        updates.key = compositeKey;
      }
      if (
        XmDb.keyCache.has(`${cacheKey}:${compositeKey}`) &&
        compositeKey !== `${existing.name}_${existing.pid}`
      ) {
        throw new Error(
          `Unique constraint violation for name+pid: ${compositeKey}`
        );
      }
      const updatedData = {
        ...existing,
        ...updates,
        update_time: Math.floor(Date.now() / 1000),
      };
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      db.run(
        `UPDATE \`${type}\` SET ${keys
          .map((k) => `${k} = ?`)
          .join(
            ", "
          )}, update_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL`,
        [...values, id]
      );

      const oldCompositeKey = `${existing.name}_${existing.pid}`;
      if (compositeKey !== oldCompositeKey) {
        XmDb.keyCache.delete(`${cacheKey}:${oldCompositeKey}`);
        XmDb.keyCache.set(`${cacheKey}:${compositeKey}`, updatedData);
      }
      if (existing.pid !== newPid) {
        // Remove from all pidCache entries where this id appears
        for (const [key, rows] of XmDb.pidCache.entries()) {
          if (key.startsWith(cacheKey) && rows.some((row) => row.id === id)) {
            XmDb.pidCache.set(
              key,
              rows.filter((row) => row.id !== id)
            );
          }
        }
        // Add to new pidCache entry
        const newPidRows = XmDb.pidCache.get(`${cacheKey}:${newPid}`) || [];
        if (!newPidRows.some((row) => row.id === id)) {
          newPidRows.push(updatedData);
        }
        XmDb.pidCache.set(`${cacheKey}:${newPid}`, newPidRows);
      } else {
        // Update existing pidCache entry with updatedData
        const pidRows = XmDb.pidCache.get(`${cacheKey}:${existing.pid}`) || [];
        const updatedPidRows = pidRows.map((row) =>
          row.id === id ? updatedData : row
        );
        XmDb.pidCache.set(`${cacheKey}:${existing.pid}`, updatedPidRows);
      }
      XmDb.idCache.set(`${cacheKey}:${id}`, updatedData);
      return updatedData;
    } catch (error) {
      XmDb.log(
        `Update ${type} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async delete(type, id, soft = true, dbName = "xm1") {
    try {
      await XmDb.ensureTable(type, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${type}`;
      const existing = await XmDb.read(type, id, dbName);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }

      const query = soft
        ? `UPDATE \`${type}\` SET delete_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL`
        : `DELETE FROM \`${type}\` WHERE id = ?`;
      db.run(query, [id]);

      const compositeKey = `${existing.name}_${existing.pid}`;
      const pidRows = XmDb.pidCache.get(`${cacheKey}:${existing.pid}`) || [];
      XmDb.pidCache.set(
        `${cacheKey}:${existing.pid}`,
        pidRows.filter((row) => row.id !== id)
      );
      XmDb.idCache.delete(`${cacheKey}:${id}`);
      XmDb.keyCache.delete(`${cacheKey}:${compositeKey}`);
      return true;
    } catch (error) {
      XmDb.log(
        `Delete ${type} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async createTreeNode(pid = 0, name = "", key = "", dbName = "xm1") {
    try {
      const node = await XmDb.create("tree", pid, name, key, [], [], dbName);
      await XmDb.create(
        "list",
        pid,
        name || `Item-${node.id}`,
        key || `list_${node.id}`,
        [],
        [],
        dbName
      );
      return node;
    } catch (error) {
      XmDb.log(
        `Create tree node failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async getTreeNode(id, dbName = "xm1") {
    try {
      const tree = await XmDb.read("tree", id, dbName);
      const list = await XmDb.read("list", id, dbName);
      return { tree, list };
    } catch (error) {
      XmDb.log(
        `Get tree node id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async updateTreeNode(id, updates, dbName = "xm1") {
    return await XmDb.update("tree", id, updates, dbName);
  }

  static async deleteTreeNode(id, soft = true, dbName = "xm1") {
    try {
      await XmDb.delete("tree", id, soft, dbName);
      await XmDb.delete("list", id, soft, dbName);
      return true;
    } catch (error) {
      XmDb.log(
        `Delete tree node id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async getChildren(pid, dbName = "xm1") {
    try {
      await XmDb.ensureTable("tree", dbName);
      const cacheKey = `${dbName}:tree`;
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
    limit = Infinity
  ) {
    try {
      await XmDb.ensureTable("tree", dbName);
      await XmDb.ensureTable("list", dbName);
      const cacheKeyTree = `${dbName}:tree`;
      const cacheKeyList = `${dbName}:list`;

      const build = (id, currentDepth = 1) => {
        const node = XmDb.idCache.get(`${cacheKeyTree}:${id}`);
        if (!node) {
          XmDb.log(`Node ${id} not found in ${dbName}`, "warn");
          return null;
        }
        if (currentDepth > maxDepth) {
          return {
            ...node,
            list: XmDb.pidCache.get(`${cacheKeyList}:${id}`),
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
          list: XmDb.pidCache.get(`${cacheKeyList}:${id}`),
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

  static async createListItem(
    pid = 0,
    name = "",
    key = "",
    uniqueFields = [],
    uniqueValues = [],
    dbName = "xm1"
  ) {
    return await XmDb.create(
      "list",
      pid,
      name,
      key,
      uniqueFields,
      uniqueValues,
      dbName
    );
  }

  static async getListItem(id, dbName = "xm1") {
    return await XmDb.read("list", id, dbName);
  }

  static async getListItemByName(compositeKey, dbName = "xm1") {
    return await XmDb.readByName("list", compositeKey, dbName);
  }

  static async updateListItem(id, updates, dbName = "xm1") {
    return await XmDb.update("list", id, updates, dbName);
  }

  static async deleteListItem(id, soft = true, dbName = "xm1") {
    return await XmDb.delete("list", id, soft, dbName);
  }
  static async getListItems(
    pid = 0,
    page = 1,
    limit = 10,
    dbName = "xm1",
    table = "tree"
  ) {
    try {
      const cacheKey = `${dbName}:${table}`;
      const rows = XmDb.pidCache.get(`${cacheKey}:${pid}`) || [];
      const offset = (page - 1) * limit;
      const paginatedRows = rows.slice(offset, offset + limit);
      if (paginatedRows.length > 0) {
        return { rows: paginatedRows, total: rows.length };
      }

      // Fallback to database if cache is empty
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const offsetDb = (page - 1) * limit;
      const rowsDb = db
        .prepare(
          `SELECT * FROM \`list\` WHERE pid = ? AND delete_time IS NULL LIMIT ? OFFSET ?`
        )
        .all(pid, limit, offsetDb);
      const count = db
        .prepare(
          `SELECT COUNT(*) as count FROM \`list\` WHERE pid = ? AND delete_time IS NULL`
        )
        .get(pid).count;
      return { rows: rowsDb, total: count };
    } catch (error) {
      XmDb.log(
        `Get list items for pid ${pid} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async getListKeys(dbName = "xm1") {
    try {
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const rows = db
        .prepare(`SELECT DISTINCT key FROM \`list\` WHERE delete_time IS NULL`)
        .all();
      return rows.map((row) => row.key);
    } catch (error) {
      XmDb.log(`Get list keys failed in ${dbName}: ${error.message}`, "error");
      return [];
    }
  }

  static async groupListItemsToTree(groupByFields, dbName = "xm1") {
    try {
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const items = db
        .prepare(`SELECT * FROM \`list\` WHERE delete_time IS NULL`)
        .all();
      const groups = {};
      for (const item of items) {
        const key = groupByFields.map((f) => item[f]).join("-");
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
      for (const groupKey in groups) {
        const node = await XmDb.create("tree", 0, groupKey, "", [], [], dbName);
        for (const item of groups[groupKey]) {
          await XmDb.update("list", item.id, { pid: node.id }, dbName);
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

  static closeAll() {
    for (const [dbName, db] of XmDb.dbs) {
      try {
        db.close();
        XmDb.log(`Closed database: ${dbName}`);
      } catch (error) {
        XmDb.log(
          `Failed to close database ${dbName}: ${error.message}`,
          "error"
        );
      }
    }
    XmDb.dbs.clear();
    XmDb.idCache.clear();
    XmDb.keyCache.clear();
    XmDb.pidCache.clear();
  }
}
