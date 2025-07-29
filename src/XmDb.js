import { Database } from "bun:sqlite";

export class XmDb {
  static db = new Database("xm", { create: true });
  static cache = new Map();
  static knownTypes = ["user", "product", "tree_node", "list_item"];
  static schema = "id INTEGER PRIMARY KEY AUTOINCREMENT, pid INTEGER, name TEXT, key TEXT";

  static async init() {
    // 为每个已知类型确保表存在
    for (const type of XmDb.knownTypes) {
      await XmDb.ensureTable(type);
    }

    // 检查是否已初始化数据
    let totalCount = 0;
    for (const type of XmDb.knownTypes) {
      const countRow = XmDb.db.prepare(`SELECT COUNT(*) as count FROM \`${type}\``).get();
      totalCount += countRow.count;
    }

    if (totalCount > 0) {
      console.log("Data already initialized, skipping.");
      return;
    }

    console.log("Initializing data...");
    // 初始化模拟数据：user 和 product
    for (let i = 1; i <= 10; i++) {
      await XmDb.create("user", null, `User-${i}`, `user${i}@example.com`);
      await XmDb.create("product", null, `Product-${i}`, (i * 100).toString());
    }

    // 初始化树形结构模拟数据 (type: 'tree_node')
    const root = await XmDb.create("tree_node", null, "Root", "");
    const rootId = root.id;
    const childIds = [];
    for (let i = 1; i <= 5; i++) {
      const child = await XmDb.create("tree_node", rootId, `Child-${i}`, "");
      childIds.push(child.id);
    }
    // 添加二级子节点示例
    await XmDb.create("tree_node", childIds[0], "Subchild-1", "");

    // 初始化列表数据模拟数据 (type: 'list_item')
    for (let i = 1; i <= 10; i++) {
      await XmDb.create("list_item", null, `Item-${i}`, "default_list");
    }

    console.log("Data initialization completed.");
  }

  static async ensureTable(type) {
    const tableExists = XmDb.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(type);

    if (!tableExists) {
      console.log(`Table '${type}' does not exist, creating...`);
      XmDb.db.run(`CREATE TABLE \`${type}\` (${XmDb.schema})`);
    }

    if (!XmDb.cache.has(type)) {
      XmDb.loadTable(type);
    }
  }

  static loadTable(type) {
    const rows = XmDb.db.prepare(`SELECT id, pid, name, key FROM \`${type}\``).all();
    const innerMap = new Map();
    for (const row of rows) {
      innerMap.set(row.id, {
        pid: row.pid,
        name: row.name,
        key: row.key,
      });
    }
    XmDb.cache.set(type, innerMap);
  }

  static async query(sql, params = []) {
    return XmDb.db.prepare(sql).bind(...params);
  }

  // 通用 CRUD 方法
  static async create(type, pid, name, key) {
    await XmDb.ensureTable(type);
    const stmt = XmDb.db.prepare(
      `INSERT INTO \`${type}\` (pid, name, key) VALUES (?, ?, ?) RETURNING id`
    );
    const row = stmt.get(pid, name, key);
    const id = row.id;
    const data = { pid, name, key };
    XmDb.cache.get(type).set(id, data);
    return { id, ...data };
  }

  static async read(type, id) {
    await XmDb.ensureTable(type);
    return XmDb.cache.get(type)?.get(id) ?? null;
  }

  static async update(type, id, updates) {
    await XmDb.ensureTable(type);
    const existing = await XmDb.read(type, id);
    if (!existing) return null;
    const updatedData = { ...existing, ...updates };
    XmDb.db.run(
      `UPDATE \`${type}\` SET pid = ?, name = ?, key = ? WHERE id = ?`,
      [updatedData.pid, updatedData.name, updatedData.key, id]
    );
    XmDb.cache.get(type).set(id, updatedData);
    return updatedData;
  }

  static async delete(type, id) {
    await XmDb.ensureTable(type);
    XmDb.db.run(`DELETE FROM \`${type}\` WHERE id = ?`, [id]);
    const typeMap = XmDb.cache.get(type);
    if (typeMap) {
      typeMap.delete(id);
      if (typeMap.size === 0) {
        XmDb.cache.delete(type);
      }
    }
    return true;
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

  // 示例：从 GraphQL 同步数据到本地数据库（假设 GraphQL 返回特定格式的数据）
  static async syncFromGraphQL(endpoint, query, variables = {}, type, mappingFn) {
    const data = await this.fetchGraphQL(endpoint, query, variables);
    // 假设 data 是对象，包含需要同步的列表，例如 data.users 或 data.products
    const items = mappingFn(data); // mappingFn 用于提取和映射数据
    for (const item of items) {
      await this.create(type, item.pid, item.name, item.key);
    }
    console.log(`Synced ${items.length} items to type '${type}' from GraphQL.`);
  }

  // 树形结构专用方法 (type: 'tree_node')
  // 创建树节点
  static async createTreeNode(name, pid = null, key = "") {
    return XmDb.create("tree_node", pid, name, key);
  }

  // 获取树节点
  static async getTreeNode(id) {
    return XmDb.read("tree_node", id);
  }

  // 更新树节点
  static async updateTreeNode(id, updates) {
    return XmDb.update("tree_node", id, updates);
  }

  // 删除树节点（注意：不递归删除子节点，需要手动处理）
  static async deleteTreeNode(id) {
    return XmDb.delete("tree_node", id);
  }

  // 获取子节点列表
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

  // 构建整个树（从根节点开始，递归）
  static async buildTree(root_id = null) {
    if (root_id === null) {
      // 如果没有指定root_id，假设找到pid为null的根节点（假设只有一个）
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
        ...node,
        children: await Promise.all(children.map((child) => build(child.id))),
      };
    };
    return build(root_id);
  }

  // 列表数据专用方法 (type: 'list_item')
  // 创建列表项
  static async createListItem(value, list_id = "default_list") {
    return XmDb.create("list_item", null, value, list_id);
  }

  // 获取列表项
  static async getListItem(id) {
    return XmDb.read("list_item", id);
  }

  // 更新列表项
  static async updateListItem(id, updates) {
    // updates 可以是 {name: newValue, key: newListId, ...}
    return XmDb.update("list_item", id, updates);
  }

  // 删除列表项
  static async deleteListItem(id) {
    return XmDb.delete("list_item", id);
  }

  // 获取特定列表的所有项
  static async getListItems(list_id = "default_list") {
    const typeMap = XmDb.cache.get("list_item");
    if (!typeMap) return [];
    const items = [];
    for (const [id, data] of typeMap) {
      if (data.key === list_id) {
        items.push({ id, ...data });
      }
    }
    return items;
  }
}