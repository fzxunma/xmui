// Updated XmDb.js
export default class XmDb {
  static dbs = new Map();
  static idCache = new Map();
  static keyCache = new Map();
  static pidCache = new Map();
  static load = {};

  static log(message, level = "info") {
    console[level](`[XmDb] ${message}`);
  }

  static knownTableNames = ["tree", "list", "log","orders"];
  static baseFields = `
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pid INTEGER DEFAULT 0,
    name TEXT,
    key TEXT,
    type TEXT,
    version INTEGER DEFAULT 1,
    version_t INTEGER DEFAULT 1,
    version_o INTEGER DEFAULT 1,
    version_a INTEGER DEFAULT 1,
    data JSON,
    data_t JSON,
    data_o JSON,
    data_a JSON,
    create_time INTEGER DEFAULT (strftime('%s', 'now')),
    update_time INTEGER DEFAULT (strftime('%s', 'now')),
    delete_time INTEGER DEFAULT NULL
  `;
  static schema = {
    tree: XmDb.baseFields,
    list: XmDb.baseFields,
    log: XmDb.baseFields,
    orders: XmDb.baseFields
  };

  static async ensureTable(tableName, dbName = "xm1") {
    try {
      const cacheKey = `${dbName}:${tableName}`;
      if (XmDb.load[cacheKey]) {
        return;
      }
      if (!XmDb.schema[tableName]) throw new Error(`Unknown tableName: ${tableName}`);

      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      XmDb.log(`Ensuring table '${tableName}' exists in ${dbName}...`);
      db.run(`CREATE TABLE IF NOT EXISTS \`${tableName}\` (${XmDb.schema[tableName]})`);
      XmDb.loadTable(tableName, dbName);
    } catch (error) {
      XmDb.log(
        `Failed to ensure table ${tableName} in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async loadTable(tableName, dbName = "xm1") {
    try {
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${tableName}`;
      const rows = db
        .prepare(`SELECT * FROM \`${tableName}\` WHERE delete_time IS NULL`)
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
        `Loaded ${rows.length} rows into cache for '${tableName}' in ${dbName}`
      );
      XmDb.load[cacheKey] = true;
    } catch (error) {
      XmDb.log(
        `Failed to load table ${tableName} in ${dbName}: ${error.message}`,
        "error"
      );
    }
  }
}