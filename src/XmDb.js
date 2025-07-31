import { Database } from "bun:sqlite";

export class XmDb {
  static dbs = new Map();
  static cache = new Map();
  static keyCache = new Map();
  static knownTypes = ["tree_node", "list_item"];
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
    tree_node: XmDb.baseFields,
    list_item: XmDb.baseFields,
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
        const root1 = await XmDb.create(
          "tree_node",
          0,
          "Root1",
          "",
          [],
          [],
          dbName
        );
        await XmDb.loadTable("tree_node", dbName); // Reload cache
        const root2 = await XmDb.create(
          "tree_node",
          0,
          "Root2",
          "",
          [],
          [],
          dbName
        );
        await XmDb.loadTable("tree_node", dbName); // Reload cache
        const rootId1 = root1.id;
        const rootId2 = root2.id;
        const childIds = [];
        for (let i = 1; i <= 5; i++) {
          const child = await XmDb.create(
            "tree_node",
            rootId1,
            `Child-${i}`,
            "",
            [],
            [],
            dbName
          );
          await XmDb.loadTable("tree_node", dbName); // Reload cache
          childIds.push(child.id);
          await XmDb.create(
            "list_item",
            rootId1,
            `Item-Child-${i}`,
            `list_${child.id}`,
            ["name"],
            [`Item-Child-${i}`],
            dbName
          );
        }

        const subchild = await XmDb.create(
          "tree_node",
          childIds[0],
          "Subchild-1",
          "",
          [],
          [],
          dbName
        );
        await XmDb.loadTable("tree_node", dbName); // Reload cache
        await XmDb.create(
          "list_item",
          childIds[0],
          "Item-Subchild-1",
          `list_${subchild.id}`,
          ["name"],
          ["Item-Subchild-1"],
          dbName
        );

        for (let i = 1; i <= 5; i++) {
          await XmDb.create(
            "list_item",
            0,
            `Item-${i}`,
            "default_list",
            ["name"],
            [`Item-${i}`],
            dbName
          );
        }
        await XmDb.loadTable("list_item", dbName); // Reload cache
        XmDb.log(`Data initialization completed for ${dbName}.`);
      } catch (error) {
        XmDb.log(
          `Initialization failed for ${dbName}: ${error.message}`,
          "error"
        );
        //throw error;
      }
    }
  }

  static async ensureTable(type, dbName = "xm1") {
    try {
      if (!XmDb.schema[type]) throw new Error(`Unknown type: ${type}`);
      const cacheKey = `${dbName}:${type}`;
      if (!XmDb.cache.has(cacheKey)) {
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
      const idMap = new Map();
      const nameMap = new Map();
      for (const row of rows) {
        idMap.set(row.id, row);
        if (row.name && !nameMap.has(row.name)) {
          nameMap.set(row.name, row);
        } else if (nameMap.has(row.name)) {
          XmDb.log(
            `Duplicate name '${row.name}' in ${type} for ${dbName}, skipping keyCache entry`,
            "warn"
          );
        }
      }
      XmDb.cache.set(cacheKey, { data: idMap, lastUpdated: Date.now() });
      XmDb.keyCache.set(cacheKey, { data: nameMap, lastUpdated: Date.now() });
      XmDb.log(
        `Loaded ${rows.length} rows into cache for '${type}' in ${dbName}`
      );
    } catch (error) {
      XmDb.log(
        `Failed to load table ${type} in ${dbName}: ${error.message}`,
        "error"
      );
      XmDb.cache.set(cacheKey, { data: new Map(), lastUpdated: Date.now() });
      XmDb.keyCache.set(cacheKey, { data: new Map(), lastUpdated: Date.now() });
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
      console.log(type, pid, name, cacheKey);
      if (
        type === "tree_node" &&
        pid !== 0 &&
        !XmDb.cache.get(cacheKey)?.data.has(pid)
      ) {
        throw new Error("pid not found in cache");
      }
      if (uniqueFields.length === 1 && uniqueFields[0] === "name") {
        const nameCache = XmDb.keyCache.get(cacheKey)?.data;
        if (nameCache?.has(uniqueValues[0])) {
          throw new Error(`Unique constraint violation for: name`);
        }
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
      const idCache = XmDb.cache.get(cacheKey)?.data;
      const nameCache = XmDb.keyCache.get(cacheKey)?.data;
      if (idCache && nameCache) {
        idCache.set(row.id, row);
        if (row.name && !nameCache.has(row.name)) {
          nameCache.set(row.name, row);
        } else if (nameCache.has(row.name)) {
          XmDb.log(
            `Duplicate name '${row.name}' in ${type} for ${dbName}, skipping keyCache entry`,
            "warn"
          );
        }
      }
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
      const cache = XmDb.cache.get(cacheKey);
      if (cache && Date.now() - cache.lastUpdated > 60000) {
        await XmDb.loadTable(type, dbName);
      }
      return cache?.data.get(id) ?? null;
    } catch (error) {
      XmDb.log(
        `Read ${type} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async readByName(type, name, dbName = "xm1") {
    try {
      await XmDb.ensureTable(type, dbName);
      const cacheKey = `${dbName}:${type}`;
      const cache = XmDb.keyCache.get(cacheKey);
      if (cache && Date.now() - cache.lastUpdated > 60000) {
        await XmDb.loadTable(type, dbName);
      }
      return cache?.data.get(name) ?? null;
    } catch (error) {
      XmDb.log(
        `Read ${type} by name ${name} failed in ${dbName}: ${error.message}`,
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
      const existing = await XmDb.read(type, id, dbName);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
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

      const cacheKey = `${dbName}:${type}`;
      const idCache = XmDb.cache.get(cacheKey)?.data;
      const nameCache = XmDb.keyCache.get(cacheKey)?.data;
      if (idCache && nameCache) {
        if (updates.name && existing.name !== updates.name) {
          nameCache.delete(existing.name);
          if (!nameCache.has(updates.name)) {
            nameCache.set(updates.name, updatedData);
          } else {
            XmDb.log(
              `Duplicate name '${updates.name}' in ${type} for ${dbName}, skipping keyCache update`,
              "warn"
            );
          }
        }
        idCache.set(id, updatedData);
      }
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
      const existing = await XmDb.read(type, id, dbName);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }

      const query = soft
        ? `UPDATE \`${type}\` SET delete_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL`
        : `DELETE FROM \`${type}\` WHERE id = ?`;
      db.run(query, [id]);

      const cacheKey = `${dbName}:${type}`;
      const idCache = XmDb.cache.get(cacheKey)?.data;
      const nameCache = XmDb.keyCache.get(cacheKey)?.data;
      if (idCache && nameCache) {
        idCache.delete(id);
        nameCache.delete(existing.name);
      }
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
      const node = await XmDb.create(
        "tree_node",
        pid,
        name,
        key,
        ["name"],
        [name],
        dbName
      );
      await XmDb.create(
        "list_item",
        pid,
        name || `Item-${node.id}`,
        key || `list_${node.id}`,
        ["name"],
        [name || `Item-${node.id}`],
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
      const tree = await XmDb.read("tree_node", id, dbName);
      const list = await XmDb.read("list_item", id, dbName);
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
    return await XmDb.update("tree_node", id, updates, dbName);
  }

  static async deleteTreeNode(id, soft = true, dbName = "xm1") {
    try {
      await XmDb.delete("tree_node", id, soft, dbName);
      await XmDb.delete("list_item", id, soft, dbName);
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
      await XmDb.ensureTable("tree_node", dbName);
      const cacheKey = `${dbName}:tree_node`;
      const data = XmDb.cache.get(cacheKey)?.data ?? new Map();
      if (!(data instanceof Map)) {
        XmDb.log(
          `Cache for tree_node is invalid in ${dbName}, reloading...`,
          "warn"
        );
        await XmDb.loadTable("tree_node", dbName);
      }
      return [...data.values()].filter((n) => n.pid === pid);
    } catch (error) {
      XmDb.log(
        `Get children for pid ${pid} failed in ${dbName}: ${error.message}`,
        "error"
      );
      return [];
    }
  }

  static async buildTree(root_id = 0, dbName = "xm1") {
    try {
      await XmDb.ensureTable("tree_node", dbName);
      await XmDb.ensureTable("list_item", dbName);
      const cacheKeyTree = `${dbName}:tree_node`;
      const cacheKeyList = `${dbName}:list_item`;

      let treeCache = XmDb.cache.get(cacheKeyTree);
      let listCache = XmDb.keyCache.get(cacheKeyList);
      if (!treeCache || Date.now() - treeCache.lastUpdated > 60000) {
        await XmDb.loadTable("tree_node", dbName);
        treeCache = XmDb.cache.get(cacheKeyTree);
      }
      if (!listCache || Date.now() - listCache.lastUpdated > 60000) {
        await XmDb.loadTable("list_item", dbName);
        listCache = XmDb.keyCache.get(cacheKeyList);
      }

      const nodes = Array.from(treeCache.data.values());
      const lists = Array.from(listCache.data.values());
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const listMap = new Map(lists.map((l) => [l.id, l]));

      const build = (id) => {
        const node = nodeMap.get(id);
        if (!node) {
          XmDb.log(`Node ${id} not found in ${dbName}`, "warn");
          return null;
        }
        const children = nodes
          .filter((n) => n.pid === id)
          .map((n) => build(n.id))
          .filter(Boolean);
        return { ...node, list_item: listMap.get(id), children };
      };
      if (root_id !== 0) {
        const tree = build(root_id);
        return tree ? [tree] : [];
      } else {
        const rootNodes = nodes.filter((n) => n.pid === 0);
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
      "list_item",
      pid,
      name,
      key,
      uniqueFields,
      uniqueValues,
      dbName
    );
  }

  static async getListItem(id, dbName = "xm1") {
    return await XmDb.read("list_item", id, dbName);
  }

  static async getListItemByName(name, dbName = "xm1") {
    return await XmDb.readByName("list_item", name, dbName);
  }

  static async updateListItem(id, updates, dbName = "xm1") {
    return await XmDb.update("list_item", id, updates, dbName);
  }

  static async deleteListItem(id, soft = true, dbName = "xm1") {
    return await XmDb.delete("list_item", id, soft, dbName);
  }

  static async getListItems(
    key = "default_list",
    page = 1,
    limit = 10,
    dbName = "xm1"
  ) {
    try {
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const offset = (page - 1) * limit;
      const rows = db
        .prepare(
          `SELECT * FROM \`list_item\` WHERE key = ? AND delete_time IS NULL LIMIT ? OFFSET ?`
        )
        .all(key, limit, offset);
      const count = db
        .prepare(
          `SELECT COUNT(*) as count FROM \`list_item\` WHERE key = ? AND delete_time IS NULL`
        )
        .get(key).count;
      return { rows, total: count };
    } catch (error) {
      XmDb.log(
        `Get list items for key ${key} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async groupListItemsToTree(groupByFields, dbName = "xm1") {
    try {
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const items = db
        .prepare("SELECT * FROM `list_item` WHERE delete_time IS NULL")
        .all();
      const groups = {};
      for (const item of items) {
        const key = groupByFields.map((f) => item[f]).join("-");
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
      for (const groupKey in groups) {
        const node = await XmDb.create(
          "tree_node",
          0,
          groupKey,
          "",
          [],
          [],
          dbName
        );
        for (const item of groups[groupKey]) {
          await XmDb.update("list_item", item.id, { pid: node.id }, dbName);
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
    XmDb.cache.clear();
    XmDb.keyCache.clear();
  }
}
