import { Database } from "bun:sqlite";
const db = new Database("database.sqlite", { create: true });

// 创建数据表
db.run(`
  CREATE TABLE IF NOT EXISTS data (
    id TEXT,
    type TEXT,
    data JSON,
    PRIMARY KEY (type, id)
  )
`);

// 初始化模拟数据（1000 个对象 × 2 种类型，可扩展到 100 种）
for (let i = 1; i <= 10; i++) {
  for (const type of ["user", "product"]) {
    db.run(`INSERT OR IGNORE INTO data (id, type, data) VALUES (?, ?, ?)`, [
      `${i}`,
      type,
      JSON.stringify(
        type === "user"
          ? { username: `User-${i}`, email: `user${i}@example.com` }
          : { name: `Product-${i}`, price: i * 100 }
      ),
    ]);
  }
}
export default db;