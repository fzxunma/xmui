import { Database } from "bun:sqlite";

export class XmDb {
  static db = new Database("xm", { create: true });
  static cache = new Map();
  static keyCache = new Map();
  static knownTypes = ["tree_node", "list_item"];
  static baseFields = `
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pid INTEGER,
    name TEXT,
    key TEXT,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delete_time TIMESTAMP DEFAULT NULL
  `;
  static schema = {
    tree_node: XmDb.baseFields,
    list_item: XmDb.baseFields,
  };

  static log(message, level = "info") {
    console[level](`[XmDb] ${message}`);
  }

  static async init() {
    for (const type of XmDb.knownTypes) {
      await XmDb.ensureTable(type);
    }

    let totalCount = 0;
    for (const type of XmDb.knownTypes) {
      const countRow = XmDb.db
        .prepare(
          `SELECT COUNT(*) as count FROM \`${type}\` WHERE delete_time IS NULL`
        )
        .get();
      totalCount += countRow.count;
    }

    if (totalCount > 0) {
      XmDb.log("Data already initialized, skipping.");
      return;
    }

    XmDb.log("Initializing data...");
    try {
      const root = await XmDb.create("tree_node", null, "Root", "");
      const rootId = root.id;
      const childIds = [];
      for (let i = 1; i <= 5; i++) {
        const child = await XmDb.create("tree_node", rootId, `Child-${i}`, "");
        childIds.push(child.id);
        await XmDb.create(
          "list_item",
          rootId,
          `Item-Child-${i}`,
          `list_${child.id}`,
          ["name"],
          [`Item-Child-${i}`]
        );
      }

      const subchild = await XmDb.create(
        "tree_node",
        childIds[0],
        "Subchild-1",
        ""
      );
      await XmDb.create(
        "list_item",
        childIds[0],
        "Item-Subchild-1",
        `list_${subchild.id}`,
        ["name"],
        ["Item-Subchild-1"]
      );

      for (let i = 1; i <= 5; i++) {
        await XmDb.create(
          "list_item",
          null,
          `Item-${i}`,
          "default_list",
          ["name"],
          [`Item-${i}`]
        );
      }
      XmDb.log("Data initialization completed.");
    } catch (error) {
      XmDb.log(`Initialization failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async ensureTable(type) {
    try {
      if (!XmDb.schema[type]) throw new Error(`Unknown type: ${type}`);
      if (!XmDb.cache.has(type)) {
        XmDb.log(`Ensuring table '${type}' exists...`);
        XmDb.db.run(
          `CREATE TABLE IF NOT EXISTS \`${type}\` (${XmDb.schema[type]})`
        );
        await XmDb.loadTable(type);
      }
    } catch (error) {
      XmDb.log(`Failed to ensure table ${type}: ${error.message}`, "error");
      throw error;
    }
  }

  static async loadTable(type) {
    try {
      const rows = XmDb.db
        .prepare(`SELECT * FROM \`${type}\` WHERE delete_time IS NULL`)
        .all();
      const idMap = new Map();
      const nameMap = new Map();
      for (const row of rows) {
        idMap.set(row.id, row);
        // Only add to nameMap if name is unique and not already present
        if (row.name && !nameMap.has(row.name)) {
          nameMap.set(row.name, row);
        } else if (nameMap.has(row.name)) {
          XmDb.log(
            `Duplicate name '${row.name}' in ${type}, skipping keyCache entry`,
            "warn"
          );
        }
      }
      XmDb.cache.set(type, { data: idMap, lastUpdated: Date.now() });
      XmDb.keyCache.set(type, { data: nameMap, lastUpdated: Date.now() });
      XmDb.log(`Loaded ${rows.length} rows into cache for '${type}'`);
    } catch (error) {
      XmDb.log(`Failed to load table ${type}: ${error.message}`, "error");
      XmDb.cache.set(type, { data: new Map(), lastUpdated: Date.now() });
      XmDb.keyCache.set(type, { data: new Map(), lastUpdated: Date.now() });
    }
  }

  static async create(
    type,
    pid,
    name,
    key,
    uniqueFields = [],
    uniqueValues = []
  ) {
    try {
      await XmDb.ensureTable(type);
      if (uniqueFields.length !== uniqueValues.length) {
        throw new Error("Mismatch between uniqueFields and uniqueValues");
      }

      // 预检查 nameCache，仅当 uniqueFields 只包含 name
      if (uniqueFields.length === 1 && uniqueFields[0] === "name") {
        const nameCache = XmDb.keyCache.get(type)?.data;
        if (nameCache?.has(uniqueValues[0])) {
          throw new Error(`Unique constraint violation for: name`);
        }
      }
      console.log("create", type, name);
      // 数据库查询检查所有 uniqueFields
      if (uniqueFields.length > 0) {
        const conditions = uniqueFields.map((f) => `${f} = ?`).join(" AND ");
        const existing = XmDb.db
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

      const stmt = XmDb.db.prepare(`
      INSERT INTO \`${type}\` (pid, name, key, create_time, update_time)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`);
      const row = stmt.get(pid, name, key);
      const idCache = XmDb.cache.get(type)?.data;
      const nameCache = XmDb.keyCache.get(type)?.data;
      if (idCache && nameCache) {
        idCache.set(row.id, row);
        if (row.name && !nameCache.has(row.name)) {
          nameCache.set(row.name, row);
        } else if (nameCache.has(row.name)) {
          XmDb.log(
            `Duplicate name '${row.name}' in ${type}, skipping keyCache entry`,
            "warn"
          );
        }
      }
      return row;
    } catch (error) {
      XmDb.log(`Create ${type} failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async read(type, id) {
    try {
      await XmDb.ensureTable(type);
      const cache = XmDb.cache.get(type);
      if (cache && Date.now() - cache.lastUpdated > 60000) {
        await XmDb.loadTable(type);
      }
      return cache?.data.get(id) ?? null;
    } catch (error) {
      XmDb.log(`Read ${type} id ${id} failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async readByName(type, name) {
    try {
      await XmDb.ensureTable(type);
      const cache = XmDb.keyCache.get(type);
      if (cache && Date.now() - cache.lastUpdated > 60000) {
        await XmDb.loadTable(type);
      }
      return cache?.data.get(name) ?? null;
    } catch (error) {
      XmDb.log(
        `Read ${type} by name ${name} failed: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async update(type, id, updates) {
    try {
      await XmDb.ensureTable(type);
      const existing = await XmDb.read(type, id);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }

      const updatedData = {
        ...existing,
        ...updates,
        update_time: new Date(),
      };
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      XmDb.db.run(
        `UPDATE \`${type}\` SET ${keys
          .map((k) => `${k} = ?`)
          .join(
            ", "
          )}, update_time = CURRENT_TIMESTAMP WHERE id = ? AND delete_time IS NULL`,
        [...values, id]
      );

      const idCache = XmDb.cache.get(type)?.data;
      const nameCache = XmDb.keyCache.get(type)?.data;
      if (idCache && nameCache) {
        // Remove old name from keyCache if it changed
        if (updates.name && existing.name !== updates.name) {
          nameCache.delete(existing.name);
          if (!nameCache.has(updates.name)) {
            nameCache.set(updates.name, updatedData);
          } else {
            XmDb.log(
              `Duplicate name '${updates.name}' in ${type}, skipping keyCache update`,
              "warn"
            );
          }
        }
        idCache.set(id, updatedData);
      }
      return updatedData;
    } catch (error) {
      XmDb.log(`Update ${type} id ${id} failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async delete(type, id, soft = true) {
    try {
      await XmDb.ensureTable(type);
      const existing = await XmDb.read(type, id);
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }

      const query = soft
        ? `UPDATE \`${type}\` SET delete_time = CURRENT_TIMESTAMP WHERE id = ? AND delete_time IS NULL`
        : `DELETE FROM \`${type}\` WHERE id = ?`;
      XmDb.db.run(query, [id]);

      const idCache = XmDb.cache.get(type)?.data;
      const nameCache = XmDb.keyCache.get(type)?.data;
      if (idCache && nameCache) {
        idCache.delete(id);
        nameCache.delete(existing.name);
      }
      return true;
    } catch (error) {
      XmDb.log(`Delete ${type} id ${id} failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async createTreeNode(pid = null, name = "", key = "") {
    try {
      const node = await XmDb.create(
        "tree_node",
        pid,
        name,
        key,
        ["name"],
        [name]
      );
      // await XmDb.create(
      //   "list_item",
      //   pid,
      //   name || `Item-${node.id}`,
      //   key || `list_${node.id}`,
      //   ["name"],
      //   [name || `Item-${node.id}`]
      // );
      return node;
    } catch (error) {
      XmDb.log(`Create tree node failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async getTreeNode(id) {
    try {
      const tree = await XmDb.read("tree_node", id);
      const list = await XmDb.read("list_item", id);
      return { tree, list };
    } catch (error) {
      XmDb.log(`Get tree node id ${id} failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async updateTreeNode(id, updates) {
    return await XmDb.update("tree_node", id, updates);
  }

  static async deleteTreeNode(id, soft = true) {
    try {
      await XmDb.delete("tree_node", id, soft);
      await XmDb.delete("list_item", id, soft);
      return true;
    } catch (error) {
      XmDb.log(`Delete tree node id ${id} failed: ${error.message}`, "error");
      throw error;
    }
  }

  static async getChildren(pid) {
    try {
      await XmDb.ensureTable("tree_node");
      const data = XmDb.cache.get("tree_node")?.data ?? new Map();
      if (!(data instanceof Map)) {
        XmDb.log("Cache for tree_node is invalid, reloading...", "warn");
        await XmDb.loadTable("tree_node");
      }
      return [...data.values()].filter((n) => n.pid === pid);
    } catch (error) {
      XmDb.log(`Get children for pid ${pid} failed: ${error.message}`, "error");
      return [];
    }
  }

  static async buildTree(root_id = null) {
    try {
      await XmDb.ensureTable("tree_node");
      await XmDb.ensureTable("list_item");
      const nodes = XmDb.db
        .prepare("SELECT * FROM `tree_node` WHERE delete_time IS NULL")
        .all();
      const lists = XmDb.db
        .prepare("SELECT * FROM `list_item` WHERE delete_time IS NULL")
        .all();
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const listMap = new Map(lists.map((l) => [l.id, l]));

      if (!root_id) {
        const rootNode = nodes.find((n) => n.pid === null);
        if (!rootNode) {
          XmDb.log("No root node found for tree", "warn");
          return null;
        }
        root_id = rootNode.id;
      }

      const build = (id) => {
        const node = nodeMap.get(id);
        if (!node) {
          XmDb.log(`Node ${id} not found`, "warn");
          return null;
        }
        const children = nodes
          .filter((n) => n.pid === id)
          .map((n) => build(n.id))
          .filter(Boolean);
        return { ...node, list_item: listMap.get(id), children };
      };
      return build(root_id);
    } catch (error) {
      XmDb.log(`Build tree failed: ${error.message}`, "error");
      return null;
    }
  }

  static async createListItem(
    pid,
    name,
    key,
    uniqueFields = [],
    uniqueValues = []
  ) {
    return await XmDb.create(
      "list_item",
      pid,
      name,
      key,
      uniqueFields,
      uniqueValues
    );
  }

  static async getListItem(id) {
    return await XmDb.read("list_item", id);
  }

  static async getListItemByName(name) {
    return await XmDb.readByName("list_item", name);
  }

  static async updateListItem(id, updates) {
    return await XmDb.update("list_item", id, updates);
  }

  static async deleteListItem(id, soft = true) {
    return await XmDb.delete("list_item", id, soft);
  }

  static async getListItems(key = "default_list", page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const rows = XmDb.db
        .prepare(
          `SELECT * FROM \`list_item\` WHERE key = ? AND delete_time IS NULL LIMIT ? OFFSET ?`
        )
        .all(key, limit, offset);
      const count = XmDb.db
        .prepare(
          `SELECT COUNT(*) as count FROM \`list_item\` WHERE key = ? AND delete_time IS NULL`
        )
        .get(key).count;
      return { rows, total: count };
    } catch (error) {
      XmDb.log(
        `Get list items for key ${key} failed: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async groupListItemsToTree(groupByFields) {
    try {
      const items = XmDb.db
        .prepare("SELECT * FROM `list_item` WHERE delete_time IS NULL")
        .all();
      const groups = {};
      for (const item of items) {
        const key = groupByFields.map((f) => item[f]).join("-");
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
      for (const groupKey in groups) {
        const node = await XmDb.create("tree_node", null, groupKey, "");
        for (const item of groups[groupKey]) {
          await XmDb.update("list_item", item.id, { pid: node.id });
        }
      }
    } catch (error) {
      XmDb.log(`Group list items to tree failed: ${error.message}`, "error");
      throw error;
    }
  }
}
