import { Database } from "bun:sqlite";

export class XmDb {
  static db = new Database("xm", { create: true });

  static async init() {
    // 检查表是否存在
    const tableExists = await XmDb.db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='data'")
      .get();

    if (!tableExists) {
      console.log("Table 'data' does not exist, creating...");
      XmDb.db.run(`
        CREATE TABLE data (
          id TEXT,
          type TEXT,
          data JSON,
          PRIMARY KEY (type, id)
        )
      `);
    } else {
      console.log("Table 'data' already exists.");
    }

    // 检查是否已初始化数据
    const count = await XmDb.db
      .prepare("SELECT COUNT(*) as count FROM data WHERE type IN ('user', 'product')")
      .get();
    
    if (count.count > 0) {
      console.log("Data already initialized, skipping.");
      return;
    }

    console.log("Initializing data...");
    // 初始化模拟数据
    for (let i = 1; i <= 10; i++) {
      for (const type of ["user", "product"]) {
        XmDb.db.run(
          `INSERT OR IGNORE INTO data (id, type, data) VALUES (?, ?, ?)`,
          [
            `${i}`,
            type,
            JSON.stringify(
              type === "user"
                ? { username: `User-${i}`, email: `user${i}@example.com` }
                : { name: `Product-${i}`, price: i * 100 }
            ),
          ]
        );
      }
    }
    console.log("Data initialization completed.");
  }

  static async query(sql, params = []) {
    return XmDb.db.prepare(sql).bind(...params);
  }
}