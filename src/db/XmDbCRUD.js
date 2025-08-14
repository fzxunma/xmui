// Updated XmDbCRUD.js
import XmDb from "./XmDb";

export class XmDbCRUD {
  // 获取客户端IP的辅助方法
  static getClientIP(req) {
    try {
      if (req) {
        return (
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          req.socket?.remoteAddress ||
          "unknown"
        );
      }
    } catch (error) {
      // 忽略错误
    }
    return "unknown";
  }

  static async create({
    tableName,
    pid,
    name,
    type = "default",
    uniqueFields = [],
    uniqueValues = [],
    dbName = "xm1",
    data = null,
    data_o = null,
    data_t = null,
    data_a = null,
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(tableName, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      if (uniqueFields.length !== uniqueValues.length) {
        throw new Error("Mismatch between uniqueFields and uniqueValues");
      }
      pid = pid || 0;
      const cacheKey = `${dbName}:${tableName}`;
      if (
        tableName === "tree" &&
        pid !== 0 &&
        !XmDb.idCache.has(`${cacheKey}:${pid}`)
      ) {
        throw new Error("pid not found in cache");
      }

      const key = `${name}_${pid}`;

      // 检查唯一约束
      const compositeKey = `${name}_${pid}`;
      if (XmDb.keyCache.has(`${cacheKey}:${compositeKey}`)) {
        throw new Error(
          `Unique constraint violation for name+pid: ${compositeKey}`
        );
      }

      if (uniqueFields.length > 0) {
        const conditions = uniqueFields.map((f) => `${f} = ?`).join(" AND ");
        const existing = db
          .prepare(
            `SELECT * FROM \`${tableName}\` WHERE ${conditions} AND delete_time IS NULL`
          )
          .get(...uniqueValues);
        if (existing) {
          throw new Error(
            `Unique constraint violation for: ${uniqueFields.join(", ")}`
          );
        }
      }

      // 处理 data 字段
      let dataJson = null;
      let dataOJson = null;
      let dataTJson = null;
      let dataAJson = null;
      if (data) {
        dataJson = typeof data === "string" ? data : JSON.stringify(data);
      }
      if (data_o) {
        dataOJson =
          typeof data_o === "string" ? data_o : JSON.stringify(data_o);
      }
      if (data_t) {
        dataTJson =
          typeof data_t === "string" ? data_t : JSON.stringify(data_t);
      }
      if (data_a) {
        dataAJson =
          typeof data_a === "string" ? data_a : JSON.stringify(data_a);
      }

      const stmt = db.prepare(`
        INSERT INTO \`${tableName}\` (pid, name, key, type, version, version_o, version_t, version_a, data, data_o, data_t, data_a, create_time, update_time)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now')) RETURNING *`);
      const row = stmt.get(
        pid,
        name,
        key,
        type,
        data_o ? 1 : 0,
        data_t ? 1 : 0,
        data_a ? 1 : 0,
        dataJson,
        dataOJson,
        dataTJson,
        dataAJson
      );

      // 记录创建日志到日志表
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "create",
        recordId: row.id,
        databaseName: dbName,
        tableName: tableName,
        success: true,
        message: `Created ${tableName} record with id ${row.id} in ${dbName}`,
        details: {
          pid: row.pid,
          name: row.name,
          key: row.key,
          type: row.type,
          version: row.version,
          version_o: row.version_o,
          version_t: row.version_t,
          version_a: row.version_a,
          ip: this.getClientIP(req),
          userId: userId,
          data: data,
          data_o: data_o,
          data_t: data_t,
          data_a: data_a,
        },
        req: req,
      });

      XmDb.idCache.set(`${cacheKey}:${row.id}`, row);
      XmDb.keyCache.set(`${cacheKey}:${row.name}_${row.pid}`, row);
      const pidRows = XmDb.pidCache.get(`${cacheKey}:${row.pid}`) || [];
      pidRows.push(row);
      XmDb.pidCache.set(`${cacheKey}:${row.pid}`, pidRows);
      return row;
    } catch (error) {
      // 记录错误日志
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "create",
        databaseName: dbName,
        tableName: tableName,
        success: false,
        message: `Create ${tableName} failed in ${dbName}: ${error.message}`,
        details: {
          pid: pid,
          name: name,
          type: type,
          ip: this.getClientIP(req),
          userId: userId,
          data: data,
          data_o: data_o,
          data_t: data_t,
          data_a: data_a,
        },
        req: req,
      });

      XmDb.log(
        `Create ${tableName} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async read({
    tableName,
    id,
    dbName = "xm1",
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(tableName, dbName);
      const cacheKey = `${dbName}:${tableName}`;
      const result = XmDb.idCache.get(`${cacheKey}:${id}`) ?? null;

      // 记录读取日志
      let message, logLevel;
      if (result) {
        message = `Read ${tableName} record with id ${id} from ${dbName}`;
        logLevel = "info";
      } else {
        message = `Read ${tableName} record with id ${id} not found in ${dbName}`;
        logLevel = "warn";
      }

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "read",
        recordId: id,
        databaseName: dbName,
        tableName: tableName,
        success: result !== null,
        message: message,
        details: {
          ip: this.getClientIP(req),
          userId: userId,
          found: result !== null,
        },
        req: req,
      });

      XmDb.log(message, logLevel);
      return result;
    } catch (error) {
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "read",
        recordId: id,
        databaseName: dbName,
        tableName: tableName,
        success: false,
        message: `Read ${tableName} id ${id} failed in ${dbName}: ${error.message}`,
        details: {
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Read ${tableName} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async readByName({
    tableName,
    compositeKey,
    dbName = "xm1",
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(tableName, dbName);
      const cacheKey = `${dbName}:${tableName}`;
      const result = XmDb.keyCache.get(`${cacheKey}:${compositeKey}`) ?? null;

      // 记录读取日志
      let message, logLevel;
      if (result) {
        message = `Read ${tableName} record with key ${compositeKey} from ${dbName}`;
        logLevel = "info";
      } else {
        message = `Read ${tableName} record with key ${compositeKey} not found in ${dbName}`;
        logLevel = "warn";
      }

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "read_by_name",
        recordId: result ? result.id : null,
        databaseName: dbName,
        tableName: tableName,
        success: result !== null,
        message: message,
        details: {
          compositeKey: compositeKey,
          ip: this.getClientIP(req),
          userId: userId,
          found: result !== null,
        },
        req: req,
      });

      XmDb.log(message, logLevel);
      return result;
    } catch (error) {
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "read_by_name",
        databaseName: dbName,
        tableName: tableName,
        success: false,
        message: `Read ${tableName} by name+pid ${compositeKey} failed in ${dbName}: ${error.message}`,
        details: {
          compositeKey: compositeKey,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Read ${tableName} by name+pid ${compositeKey} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async update({
    tableName,
    id,
    updates,
    dbName = "xm1",
    expectedVersion = null,
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(tableName, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${tableName}`;
      const existing = await XmDbCRUD.read({ tableName, id, dbName });
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${tableName}`);
      }

      // Check version consistency
      if (expectedVersion !== null && existing.version !== expectedVersion) {
        const errorMsg = `Version conflict: expected ${expectedVersion}, but found ${existing.version} for ${tableName} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "update",
          recordId: id,
          databaseName: dbName,
          tableName: tableName,
          success: false,
          message: errorMsg,
          details: {
            expectedVersion: expectedVersion,
            actualVersion: existing.version,
            ip: this.getClientIP(req),
            userId: userId,
          },
          req: req,
        });

        throw new Error(errorMsg);
      }

      // Handle name, pid, and key updates
      const newName = updates.name !== undefined ? updates.name : existing.name;
      const newPid =
        updates.pid !== undefined
          ? updates.pid === null
            ? 0
            : updates.pid
          : existing.pid;
      const compositeKey = `${newName}_${newPid}`;
      const oldCompositeKey = `${existing.name}_${existing.pid}`;
      const newKey = updates.key !== undefined ? updates.key : compositeKey;

      // Check unique constraint
      if (
        XmDb.keyCache.has(`${cacheKey}:${compositeKey}`) &&
        compositeKey !== oldCompositeKey
      ) {
        throw new Error(
          `Unique constraint violation for name+pid: ${compositeKey}`
        );
      }

      // Track changed fields and prepare data
      const changedFields = [];
      let newVersion = existing.version;
      let newVersionO = existing.version_o || 0;
      let newVersionT = existing.version_t || 0;
      let newVersionA = existing.version_a || 1; // Fallback for old records
      let dataJson = existing.data;
      let dataOJson = existing.data_o;
      let dataTJson = existing.data_t;
      let dataAJson = existing.data_a || null; // Fallback for old records

      if (updates.data !== undefined) {
        const newDataJson =
          updates.data === null
            ? null
            : typeof updates.data === "string"
            ? updates.data
            : JSON.stringify(updates.data);
        const existingDataJson =
          existing.data === null ? null : String(existing.data); // Normalize to string
        if (newDataJson !== existingDataJson) {
          dataJson = newDataJson;
          newVersion = existing.version + 1;
          changedFields.push("data");
        }
      }

      if (updates.data_o !== undefined) {
        const newDataOJson =
          updates.data_o === null
            ? null
            : typeof updates.data_o === "string"
            ? updates.data_o
            : JSON.stringify(updates.data_o);
        const existingDataOJson =
          existing.data_o === null ? null : String(existing.data_o); // Normalize to string
        if (newDataOJson !== existingDataOJson) {
          dataOJson = newDataOJson;
          newVersionO = (existing.version_o || 0) + 1;
          changedFields.push("data_o");
        }
      }

      if (updates.data_t !== undefined) {
        const newDataTJson =
          updates.data_t === null
            ? null
            : typeof updates.data_t === "string"
            ? updates.data_t
            : JSON.stringify(updates.data_t);
        const existingDataTJson =
          existing.data_t === null ? null : String(existing.data_t); // Normalize to string
        if (newDataTJson !== existingDataTJson) {
          dataTJson = newDataTJson;
          newVersionT = (existing.version_t || 0) + 1;
          changedFields.push("data_t");
        }
      }

      if (updates.data_a !== undefined) {
        const newDataAJson =
          updates.data_a === null
            ? null
            : typeof updates.data_a === "string"
            ? updates.data_a
            : JSON.stringify(updates.data_a);
        const existingDataAJson =
          existing.data_a === null ? null : String(existing.data_a); // Normalize to string
        if (newDataAJson !== existingDataAJson) {
          dataAJson = newDataAJson;
          newVersionA = (existing.version_a || 1) + 1;
          changedFields.push("data_a");
        }
      }
      if (updates.name !== undefined && newName !== existing.name) {
        changedFields.push("name");
      }
      if (updates.pid !== undefined && newPid !== existing.pid) {
        changedFields.push("pid");
      }
      if (updates.key !== undefined && updates.key !== existing.key) {
        changedFields.push("key");
      }
      if (updates.type !== undefined && updates.type !== existing.type) {
        changedFields.push("type");
      }

      const updateFields = [];
      const updateValues = [];

      if (updates.name !== undefined) {
        updateFields.push("name = ?");
        updateValues.push(newName);
      }
      if (updates.pid !== undefined) {
        updateFields.push("pid = ?");
        updateValues.push(newPid);
      }
      if (updates.key !== undefined || newKey !== existing.key) {
        updateFields.push("key = ?");
        updateValues.push(newKey);
      }
      if (updates.type !== undefined) {
        updateFields.push("type = ?");
        updateValues.push(updates.type);
      }
      if (updates.data !== undefined && dataJson !== existing.data) {
        updateFields.push("data = ?");
        updateValues.push(dataJson);
        updateFields.push("version = ?");
        updateValues.push(newVersion);
      }
      if (updates.data_o !== undefined && dataOJson !== existing.data_o) {
        updateFields.push("data_o = ?");
        updateValues.push(dataOJson);
        updateFields.push("version_o = ?");
        updateValues.push(newVersionO);
      }
      if (updates.data_t !== undefined && dataTJson !== existing.data_t) {
        updateFields.push("data_t = ?");
        updateValues.push(dataTJson);
        updateFields.push("version_t = ?");
        updateValues.push(newVersionT);
      }
      if (updates.data_a !== undefined && dataAJson !== existing.data_a) {
        updateFields.push("data_a = ?");
        updateValues.push(dataAJson);
        updateFields.push("version_a = ?");
        updateValues.push(newVersionA);
      }

      updateFields.push("update_time = strftime('%s', 'now')");

      if (updateFields.length === 0) {
        XmDb.log(
          `No changes applied to ${tableName} record with id ${id} in ${dbName}`,
          "info"
        );
        return existing; // No updates
      }

      const query = `UPDATE \`${tableName}\` SET ${updateFields.join(
        ", "
      )} WHERE id = ? AND delete_time IS NULL`;
      updateValues.push(id);

      const result = db.run(query, updateValues);

      if (result.changes === 0) {
        throw new Error(
          `No record updated for ${tableName} id ${id} in ${dbName}`
        );
      }

      // Create updated row for cache and return
      const updatedRow = {
        ...existing,
        name: newName,
        pid: newPid,
        key: newKey,
        type: updates.type !== undefined ? updates.type : existing.type,
        version: newVersion,
        version_o: newVersionO,
        version_t: newVersionT,
        version_a: newVersionA,
        data: dataJson,
        data_o: dataOJson,
        data_t: dataTJson,
        data_a: dataAJson,
        update_time: Math.floor(Date.now() / 1000),
      };

      // Update caches
      XmDb.idCache.set(`${cacheKey}:${id}`, updatedRow);
      // if (
      //   updates.name !== undefined ||
      //   updates.pid !== undefined ||
      //   updates.key !== undefined
      // ) {
        XmDb.keyCache.delete(`${cacheKey}:${oldCompositeKey}`);
        XmDb.keyCache.set(`${cacheKey}:${compositeKey}`, updatedRow);

        // Update pidCache
        if (existing.pid !== newPid) {
          const oldPidRows =
            XmDb.pidCache.get(`${cacheKey}:${existing.pid}`) || [];
          XmDb.pidCache.set(
            `${cacheKey}:${existing.pid}`,
            oldPidRows.filter((row) => row.id !== id)
          );
          const newPidRows = XmDb.pidCache.get(`${cacheKey}:${newPid}`) || [];
          newPidRows.push(updatedRow);
          XmDb.pidCache.set(`${cacheKey}:${newPid}`, newPidRows);
        } else {
          const pidRows =
            XmDb.pidCache.get(`${cacheKey}:${existing.pid}`) || [];
          const updatedPidRows = pidRows.map((row) =>
            row.id === id ? updatedRow : row
          );
          XmDb.pidCache.set(`${cacheKey}:${existing.pid}`, updatedPidRows);
        }
      //}

      // Log update operation
      const logMessage = changedFields.length
        ? `Updated ${tableName} record with id ${id} in ${dbName} (changed: ${changedFields.join(
            ", "
          )})`
        : `No changes applied to ${tableName} record with id ${id} in ${dbName}`;
      XmDb.log(logMessage, "info");

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "update",
        recordId: id,
        databaseName: dbName,
        tableName: tableName,
        success: true,
        message: logMessage,
        details: {
          updates,
          changedFields,
          oldVersion: existing.version,
          newVersion,
          oldVersionO: existing.version_o || 0,
          newVersionO,
          oldVersionT: existing.version_t || 0,
          newVersionT,
          oldVersionA: existing.version_a || 1,
          newVersionA,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      return updatedRow;
    } catch (error) {
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "update",
        recordId: id,
        databaseName: dbName,
        tableName: tableName,
        success: false,
        message: `Update ${tableName} id ${id} failed in ${dbName}: ${error.message}`,
        details: {
          updates,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Update ${tableName} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async delete({
    tableName,
    id,
    soft = true,
    dbName = "xm1",
    expectedVersion = null,
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(tableName, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${tableName}`;
      const existing = await XmDbCRUD.read({ tableName, id, dbName });
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${tableName}`);
      }

      // 检查版本一致性
      if (expectedVersion !== null && existing.version !== expectedVersion) {
        const errorMsg = `Version conflict: expected ${expectedVersion}, but found ${existing.version} for ${tableName} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "delete",
          recordId: id,
          databaseName: dbName,
          tableName: tableName,
          success: false,
          message: errorMsg,
          details: {
            expectedVersion: expectedVersion,
            actualVersion: existing.version,
            ip: this.getClientIP(req),
            userId: userId,
          },
          req: req,
        });

        throw new Error(errorMsg);
      }

      const query = soft
        ? `UPDATE \`${tableName}\` SET delete_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL AND version = ?`
        : `DELETE FROM \`${tableName}\` WHERE id = ? AND version = ?`;

      const result = db.run(query, [id, existing.version]);

      // 检查是否有行被删除/更新
      if (result.changes === 0) {
        const errorMsg = `Version conflict or record not found during delete for ${tableName} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "delete",
          recordId: id,
          databaseName: dbName,
          tableName: tableName,
          success: false,
          message: errorMsg,
          details: {
            ip: this.getClientIP(req),
            userId: userId,
          },
          req: req,
        });

        throw new Error(errorMsg);
      }

      // 记录删除日志
      const deleteType = soft ? "soft-deleted" : "hard-deleted";
      const logMessage = `${deleteType} ${tableName} record with id ${id} in ${dbName}`;
      XmDb.log(logMessage, "info");

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "delete",
        recordId: id,
        databaseName: dbName,
        tableName: tableName,
        success: true,
        message: logMessage,
        details: {
          deleteType: deleteType,
          soft: soft,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      const compositeKey = `${existing.name}_${existing.pid}`;
      const pidRows = XmDb.pidCache.get(`${cacheKey}:${existing.pid}`) || [];
      XmDb.pidCache.set(
        `${cacheKey}:${existing.pid}`,
        pidRows.filter((row) => row.id !== id)
      );
      XmDb.idCache.delete(`${cacheKey}:${id}`);
      XmDb.keyCache.delete(`${cacheKey}:${compositeKey}`);
      return true;
    } catch (error) {
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "delete",
        recordId: id,
        databaseName: dbName,
        tableName: tableName,
        success: false,
        message: `Delete ${tableName} id ${id} failed in ${dbName}: ${error.message}`,
        details: {
          soft: soft,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Delete ${tableName} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  // 统一日志记录方法
  static async logOperation({
    dbName,
    tableType,
    operation,
    recordId = null,
    databaseName = null,
    tableName = null,
    success = true,
    message = "",
    details = {},
    req = null,
  }) {
    try {
      // 确保日志表存在
      await XmDb.ensureTable(tableType, dbName);

      const db = XmDb.dbs.get(dbName);
      if (!db) {
        console.error(`Log database ${dbName} not found`);
        return;
      }

      // 构建日志记录的 name 字段 (database_name + table_type)
      const logName = databaseName
        ? `${databaseName}_${tableName || "unknown"}`
        : "system_log";

      // 构建日志记录的 pid 字段 (record_id)
      const logPid = recordId || 0;

      // 构建详细的日志数据
      const logData = {
        operation: operation,
        success: success,
        timestamp: Math.floor(Date.now() / 1000),
        ip: details.ip || this.getClientIP(req) || "unknown",
        userId: details.userId || null,
        details: details,
        userAgent: req?.headers?.get("user-agent") || null,
        url: req?.url || null,
        method: req?.method || null,
      };

      const stmt = db.prepare(`
        INSERT INTO \`${tableType}\` (pid, name, key, version, data, data_o, data_t, create_time, update_time)
        VALUES (?, ?, ?, 1, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now')) RETURNING *`);

      const logMessage = {
        message: message,
        ...logData,
      };

      stmt.get(
        logPid,
        logName,
        `log_${Date.now()}`,
        JSON.stringify(logMessage),
        null,
        null
      );
    } catch (error) {
      console.error("Failed to write log to database:", error.message);
    }
  }

  // 添加解析 data 字段的辅助方法
  static parseData(data) {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      XmDb.log(`Failed to parse data: ${error.message}`, "warn");
      return null; // 返回原始字符串
    }
  }

  // 查询日志的方法
  static async getLogs({
    dbName = "xmlog",
    tableType = "log",
    databaseName = null,
    tableName = null,
    operation = null,
    success = null,
    limit = 100,
    offset = 0,
  } = {}) {
    try {
      await XmDb.ensureTable(tableType, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);

      let query = `SELECT * FROM \`${tableType}\` WHERE delete_time IS NULL`;
      const params = [];

      if (databaseName) {
        query += ` AND name LIKE ?`;
        params.push(`${databaseName}%`);
      }

      if (operation) {
        query += ` AND data LIKE ?`;
        params.push(`%"operation":"${operation}"%`);
      }

      if (success !== null) {
        query += ` AND data LIKE ?`;
        params.push(`%"success":${success}%`);
      }

      query += ` ORDER BY create_time DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const stmt = db.prepare(query);
      return stmt.all(...params);
    } catch (error) {
      XmDb.log(`Failed to fetch logs: ${error.message}`, "error");
      throw error;
    }
  }

  static async upsert({
    tableName,
    name,
    pid = 0,
    data = {},
    dbName = "xm1",
    expectedVersion = null,
    req = null,
    userId = null,
  }) {
    try {
      const compositeKey = `${name}_${pid}`;
      let existing = await this.readByName({
        tableName,
        compositeKey,
        dbName,
        req,
        userId,
      });
      if (existing) {
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (pid !== undefined) updates.pid = pid;
        if (data.data !== undefined) updates.data = data.data;
        if (data.data_o !== undefined) updates.data_o = data.data_o;
        if (data.data_t !== undefined) updates.data_t = data.data_t;
        if (data.data_a !== undefined) updates.data_a = data.data_a;
        updates.version = existing.version;
        return await this.update({
          tableName,
          id: existing.id,
          updates,
          dbName,
          expectedVersion: existing.version,
          req,
          userId,
        });
      } else {
        // 不存在，执行创建
        return await this.create({
          tableName,
          pid: pid ?? 0,
          name: name ?? "",
          uniqueFields: data.uniqueFields || [],
          uniqueValues: data.uniqueValues || [],
          dbName,
          data: data.data || null,
          data_o: data.data_o || null,
          data_t: data.data_t || null,
          data_a: data.data_a || null,
          req,
          userId,
        });
      }
    } catch (error) {
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "upsert",
        databaseName: dbName,
        tableName: tableName,
        success: false,
        message: `Upsert ${tableName} failed in ${dbName}: ${error.message}`,
        details: {
          name: name,
          pid: pid,
          data: data.data,
          data_o: data.data_o,
          data_t: data.data_t,
          data_a: data.data_a,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      throw error;
    }
  }
}

export { XmDb };
