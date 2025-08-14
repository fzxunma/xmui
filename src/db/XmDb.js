export default class XmDb {
  static dbs = new Map();
  static idCache = new Map();
  static keyCache = new Map();
  static pidCache = new Map();
  static load = {};

  static log(message, level = "info") {
    console[level](`[XmDb] ${message}`);
  }

  static knownTypes = ["tree", "list", "log","orders"];
  static baseFields = `
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pid INTEGER DEFAULT 0,
    name TEXT,
    key TEXT,
    version INTEGER DEFAULT 1,
    data JSON,
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

  static async ensureTable(type, dbName = "xm1") {
    try {
      const cacheKey = `${dbName}:${type}`;
      if (XmDb.load[cacheKey]) {
        return;
      }
      if (!XmDb.schema[type]) throw new Error(`Unknown type: ${type}`);

      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      XmDb.log(`Ensuring table '${type}' exists in ${dbName}...`);
      db.run(`CREATE TABLE IF NOT EXISTS \`${type}\` (${XmDb.schema[type]})`);
      XmDb.loadTable(type, dbName);
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
      XmDb.load[cacheKey] = true;
    } catch (error) {
      XmDb.log(
        `Failed to load table ${type} in ${dbName}: ${error.message}`,
        "error"
      );
    }
  }
}
