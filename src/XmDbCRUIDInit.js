import { XmDbCRUD, XmDb } from "./XmDbCRUD";
import { Database } from "bun:sqlite";

export default class XmDbCRUDInit {
  static async init() {
    const dbNames = await XmDbCRUDInit.dbInit();
    await XmDbCRUDInit.dataInit(dbNames);
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
        XmDb.dbs.set(dbName, new Database(`${dbName}.db`, { create: true }));
        XmDb.log(`Initialized database: ${dbName}`);
      }
      const db = XmDb.dbs.get(dbName);
      db.run("PRAGMA journal_mode=WAL;");

      // 检查表是否已经存在
      let tablesExist = true;
      for (const type of XmDb.knownTypes) {
        const tableExists = db
          .prepare(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
          )
          .get(type);

        if (!tableExists) {
          tablesExist = false;
          break;
        }
      }

      if (tablesExist) {
        // 表存在，检查是否有数据
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
          // 加载现有数据到缓存
          for (const type of XmDb.knownTypes) {
            await XmDb.loadTable(type, dbName);
          }
          continue;
        }
      } else {
        // 表不存在，需要创建表
        for (const type of XmDb.knownTypes) {
          await XmDb.ensureTable(type, dbName);
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
          type: "tree",
          pid: 0,
          name: "Root1",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });

        const root2 = await XmDbCRUD.create({
          type: "tree",
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
            type: "tree",
            pid: rootId1,
            name: `Child-${i}`,
            uniqueFields: [],
            uniqueValues: [],
            dbName,
          });
          childIds.push(child.id);
          await XmDbCRUD.create({
            type: "list",
            pid: rootId1,
            name: `Item-Child-${i}`,
            uniqueFields: [],
            uniqueValues: [],
            dbName,
          });
        }

        const subchild = await XmDbCRUD.create({
          type: "tree",
          pid: childIds[0],
          name: "Subchild-1",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });
        await XmDbCRUD.create({
          type: "list",
          pid: childIds[0],
          name: "Item-Subchild-1",
          uniqueFields: [],
          uniqueValues: [],
          dbName,
        });

        for (let i = 1; i <= 5; i++) {
          await XmDbCRUD.create({
            type: "list",
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
