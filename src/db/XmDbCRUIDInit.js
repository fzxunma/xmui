import { XmDbCRUD, XmDb } from "./XmDbCRUD";
import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "fs";
import { dirname, resolve } from "path";

export default class XmDbCRUDInit {
  static async init() {
    await XmDbCRUDInit.initPath("init");
    await XmDbCRUDInit.dbInit();
    //await XmDbCRUDInit.dataInit(dbNames);
  }
  static async initPath(dbName) {
    try {
      const dbPath = `xmdb/${dbName}.db`;
      const absolutePath = resolve(dbPath);
      const dbDir = dirname(absolutePath);

      // 确保目录存在
      if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
        console.log(`Created directory: ${dbDir}`);
      }
    } catch (error) {
      console.error("Failed to initialize database:", error);
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

  static async dbInit(dbNames = ["xm1", "xm2", "xmlog"]) {
    const result = [];
    for (const dbName of dbNames) {
      if (!XmDb.dbs.has(dbName)) {
        XmDb.dbs.set(
          dbName,
          new Database(`xmdb/${dbName}.db`, { create: true })
        );
        XmDb.log(`Initialized database: ${dbName}`);
      }
      const db = XmDb.dbs.get(dbName);
      db.run("PRAGMA journal_mode=WAL;");

      // 检查表是否已经存在
      let tablesExist = true;
      for (const tableName of XmDb.knownTableNames) {
        const tableExists = db
          .prepare(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
          )
          .get(tableName);

        if (!tableExists) {
          tablesExist = false;
          break;
        }
      }

      if (tablesExist) {
        // 表存在，检查是否有数据
        let totalCount = 0;
        for (const tableName of XmDb.knownTableNames) {
          const countRow = db
            .prepare(
              `SELECT COUNT(*) as count FROM \`${tableName}\` WHERE delete_time IS NULL`
            )
            .get();
          totalCount += countRow.count;
        }

        if (totalCount > 0) {
          XmDb.log(`Data already initialized for ${dbName}, skipping.`);
          // 加载现有数据到缓存
          for (const tableName of XmDb.knownTableNames) {
            await XmDb.loadTable(tableName, dbName);
          }
          continue;
        }
      } else {
        // 表不存在，需要创建表
        for (const tableName of XmDb.knownTableNames) {
          await XmDb.ensureTable(tableName, dbName);
        }
      }

      result.push(dbName);
      XmDb.log(`Initializing data for ${dbName}...`);
    }
    return result;
  }

  static async dataInit(dbNames) {
    for (const dbName of dbNames) {
      try {
        // 创建初始数据
        const root1 = await XmDbCRUD.create({
          tableName: "tree",
          pid: 0,
          name: "Root1",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });

        const root2 = await XmDbCRUD.create({
          tableName: "tree",
          pid: 0,
          name: "Root2",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });

        const rootId1 = root1.id;
        const rootId2 = root2.id;

        const childIds = [];
        for (let i = 1; i <= 5; i++) {
          const child = await XmDbCRUD.create({
            tableName: "tree",
            pid: rootId1,
            name: `Child-${i}`,
            uniqueFields: [],
            uniqueValues: [],
            dbName,
          });
          childIds.push(child.id);
          await XmDbCRUD.create({
            tableName: "list",
            pid: rootId1,
            name: `Item-Child-${i}`,
            uniqueFields: [],
            uniqueValues: [],
            dbName,
          });
        }

        const subchild = await XmDbCRUD.create({
          tableName: "tree",
          pid: childIds[0],
          name: "Subchild-1",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });
        await XmDbCRUD.create({
          tableName: "list",
          pid: childIds[0],
          name: "Item-Subchild-1",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });

        for (let i = 1; i <= 5; i++) {
          await XmDbCRUD.create({
            tableName: "list",
            pid: 0,
            name: `root-${i}`,
            uniqueFields: [],
            uniqueValues: [],
            dbName,
          });
        }

        XmDb.log(`Data initialization completed for ${dbName}.`);
      } catch (error) {
        XmDb.log(
          `Initialization failed for ${dbName}: ${error.message}`,
          "error"
        );
      }
    }
  }
}
