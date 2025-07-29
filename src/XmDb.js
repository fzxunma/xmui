import { Database } from "bun:sqlite";

export class XmDb {
  static db = new Database("xm", { create: true });
  static cache = new Map();
  static knownTypes = ["tree_node", "list_item"];
  static schema = {
    tree_node: "id INTEGER PRIMARY KEY AUTOINCREMENT, pid INTEGER",
    list_item: "id INTEGER PRIMARY KEY AUTOINCREMENT, pid INTEGER, name TEXT, key TEXT, create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, delete_time TIMESTAMP DEFAULT NULL"
  };

  static async init() {
    // Ensure tables and migrate schemas
    for (const type of XmDb.knownTypes) {
      await XmDb.ensureTable(type);
    }

    // Check if data is initialized
    let totalCount = 0;
    for (const type of XmDb.knownTypes) {
      const countRow = XmDb.db.prepare(`SELECT COUNT(*) as count FROM \`${type}\` WHERE delete_time IS NULL OR delete_time IS NOT NULL`).get();
      totalCount += countRow.count;
    }

    if (totalCount > 0) {
      console.log("Data already initialized, skipping.");
      return;
    }

    console.log("Initializing data...");
    // Initialize tree_node
    const root = await XmDb.create("tree_node", null, "Root", "");
    const rootId = root.id;
    const childIds = [];
    for (let i = 1; i <= 5; i++) {
      const child = await XmDb.create("tree_node", rootId, `Child-${i}`, "");
      childIds.push(child.id);
      // Create corresponding list_item
      await XmDb.create("list_item", rootId, `Item-Child-${i}`, `list_${child.id}`, ["name"]);
    }
    // Add Subchild-1
    const subchild = await XmDb.create("tree_node", childIds[0], "Subchild-1", "");
    await XmDb.create("list_item", childIds[0], "Item-Subchild-1", `list_${subchild.id}`, ["name"]);

    // Initialize additional list_item data
    for (let i = 1; i <= 5; i++) {
      await XmDb.create("list_item", null, `Item-${i}`, "default_list", ["name"]);
    }

    console.log("Data initialization completed.");
  }

  static async ensureTable(type) {
    const tableExists = XmDb.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(type);

    if (!tableExists) {
      console.log(`Table '${type}' does not exist, creating...`);
      XmDb.db.run(`CREATE TABLE \`${type}\` (${XmDb.schema[type]})`);
    } else if (type === "list_item") {
      // Migrate list_item table to add missing columns
      const columns = XmDb.db.prepare(`PRAGMA table_info(\`${type}\`)`).all();
      const columnNames = columns.map(c => c.name);
      const requiredColumns = ["create_time", "update_time", "delete_time"];
      for (const col of requiredColumns) {
        if (!columnNames.includes(col)) {
          console.log(`Adding column ${col} to ${type}...`);
          XmDb.db.run(`ALTER TABLE \`${type}\` ADD COLUMN ${col} TIMESTAMP DEFAULT ${col === "delete_time" ? "NULL" : "CURRENT_TIMESTAMP"}`);
        }
      }
    }

    if (!XmDb.cache.has(type)) {
      XmDb.loadTable(type);
    }
  }

  static loadTable(type) {
    const rows = XmDb.db.prepare(`SELECT * FROM \`${type}\` WHERE delete_time IS NULL`).all();
    const innerMap = new Map();
    for (const row of rows) {
      innerMap.set(String(row.id), row);
    }
    XmDb.cache.set(type, innerMap);
  }

  static async query(sql, params = []) {
    return XmDb.db.prepare(sql).bind(...params);
  }

  // 通用 CRUD 方法
  static async create(type, pid, name, key, uniqueFields = []) {
    await XmDb.ensureTable(type);
    // Unique key check
    if (uniqueFields.length > 0) {
      const fields = uniqueFields.map(f => `${f} = ?`).join(' AND ');
      const values = uniqueFields.map(f => name || key); // Simplified; use actual field values
      const existing = XmDb.db.prepare(`SELECT * FROM \`${type}\` WHERE ${fields} AND delete_time IS NULL`).get(...values);
      if (existing) {
        throw new Error(`Unique constraint violation for fields: ${uniqueFields.join(', ')}`);
      }
    }
    const stmt = XmDb.db.prepare(
      `INSERT INTO \`${type}\` (pid, name, key, create_time, update_time) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`
    );
    const row = stmt.get(pid, name, key);
    XmDb.cache.get(type).set(String(row.id), row);
    return row;
  }

  static async read(type, id) {
    await XmDb.ensureTable(type);
    return XmDb.cache.get(type)?.get(String(id)) ?? null;
  }

  static async update(type, id, updates) {
    await XmDb.ensureTable(type);
    const existing = await XmDb.read(type, id);
    if (!existing) return null;
    const updatedData = { ...existing, ...updates, update_time: new Date().toISOString() };
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    XmDb.db.run(
      `UPDATE \`${type}\` SET ${fields}, update_time = CURRENT_TIMESTAMP WHERE id = ? AND delete_time IS NULL`,
      [...values]
    );
    XmDb.cache.get(type).set(String(id), updatedData);
    return updatedData;
  }

  static async delete(type, id, soft = true) {
    await XmDb.ensureTable(type);
    if (soft) {
      XmDb.db.run(`UPDATE \`${type}\` SET delete_time = CURRENT_TIMESTAMP WHERE id = ? AND delete_time IS NULL`, [id]);
      const typeMap = XmDb.cache.get(type);
      if (typeMap) {
        typeMap.delete(String(id));
      }
      return true;
    } else {
      XmDb.db.run(`DELETE FROM \`${type}\` WHERE id = ?`, [id]);
      const typeMap = XmDb.cache.get(type);
      if (typeMap) {
        typeMap.delete(String(id));
        if (typeMap.size === 0) {
          XmDb.cache.delete(type);
        }
      }
      return true;
    }
  }

  // GraphQL 对接方法
  static async fetchGraphQL(endpoint, query, variables = {}, headers = {}) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data, errors } = await response.json();
      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }

      return data;
    } catch (error) {
      console.error('GraphQL fetch error:', error);
      throw error;
    }
  }

  static async syncFromGraphQL(endpoint, query, variables = {}, type, mappingFn) {
    const data = await this.fetchGraphQL(endpoint, query, variables);
    const items = mappingFn(data);
    for (const item of items) {
      await this.create(type, item.pid, item.name, item.key, item.uniqueFields || []);
    }
    console.log(`Synced ${items.length} items to type '${type}' from GraphQL.`);
  }

  // 树形结构专用方法 (type: 'tree_node')
  static async createTreeNode(pid = null, name = "", key = "") {
    const treeNode = await XmDb.create("tree_node", pid, name, key);
    // Create corresponding list_item
    await XmDb.create("list_item", pid, name || `Item-${treeNode.id}`, key || `list_${treeNode.id}`, ["name"]);
    return treeNode;
  }

  static async getTreeNode(id) {
    const tree = await XmDb.read("tree_node", id);
    if (!tree) return null;
    const list = await XmDb.read("list_item", id);
    return { tree, list };
  }

  static async updateTreeNode(id, updates) {
    return XmDb.update("tree_node", id, updates);
  }

  static async deleteTreeNode(id) {
    // Soft delete tree_node and corresponding list_item
    await XmDb.delete("tree_node", id);
    await XmDb.delete("list_item", id);
    return true;
  }

  static async getChildren(parent_id) {
    const typeMap = XmDb.cache.get("tree_node");
    if (!typeMap) return [];
    const children = [];
    for (const [id, data] of typeMap) {
      if (data.pid === parent_id) {
        children.push({ id, ...data });
      }
    }
    return children;
  }

  static async buildTree(root_id = null) {
    if (root_id === null) {
      const typeMap = XmDb.cache.get("tree_node");
      if (!typeMap) return null;
      for (const [id, data] of typeMap) {
        if (data.pid === null) {
          root_id = id;
          break;
        }
      }
      if (root_id === null) return null;
    }
    const build = async (node_id) => {
      const node = await XmDb.getTreeNode(node_id);
      if (!node) return null;
      const children = await XmDb.getChildren(node_id);
      return {
        id: node_id,
        ...node.tree,
        list_item: node.list,
        children: await Promise.all(children.map((child) => build(child.id))),
      };
    };
    return build(root_id);
  }

  // 列表数据专用方法 (type: 'list_item')
  static async createListItem(pid, name, key, uniqueFields = []) {
    return XmDb.create("list_item", pid, name, key, uniqueFields);
  }

  static async getListItem(id) {
    return XmDb.read("list_item", id);
  }

  static async updateListItem(id, updates) {
    return XmDb.update("list_item", id, updates);
  }

  static async deleteListItem(id) {
    return XmDb.delete("list_item", id);
  }

  static async getListItems(list_id = "default_list", page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const stmt = XmDb.db.prepare(
      `SELECT * FROM \`list_item\` WHERE key = ? AND delete_time IS NULL LIMIT ? OFFSET ?`
    );
    return stmt.all(list_id, limit, offset);
  }

  static async groupListItemsToTree(groupByFields) {
    const stmt = XmDb.db.prepare(`SELECT * FROM \`list_item\` WHERE delete_time IS NULL`);
    const items = stmt.all();
    const groups = {};
    for (const item of items) {
      const groupKey = groupByFields.map(f => item[f]).join('-');
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    }
    for (const group in groups) {
      const groupItems = groups[group];
      const name = group || `Group-${Object.keys(groups).length}`;
      await XmDb.create("tree_node", null, name, "");
    }
  }
}