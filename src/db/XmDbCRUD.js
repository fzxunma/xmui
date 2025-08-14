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

      const stmt = db.prepare(`
        INSERT INTO \`${tableName}\` (pid, name, key, type, version, version_o, version_t, data, data_o, data_t, create_time, update_time)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, strftime('%s', 'now'), strftime('%s', 'now')) RETURNING *`);
      const row = stmt.get(
        pid,
        name,
        key,
        type,
        data_o ? 1 : 0,
        data_t ? 1 : 0,
        dataJson,
        dataOJson,
        dataTJson
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
          ip: this.getClientIP(req),
          userId: userId,
          data: data,
          data_o: data_o,
          data_t: data_t,
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

      // 检查版本一致性
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

      // 处理 name 和 pid 更新
      const newName = updates.name !== undefined ? updates.name : existing.name;
      const newPid =
        updates.pid !== undefined
          ? updates.pid === null
            ? 0
            : updates.pid
          : existing.pid;
      const compositeKey = `${newName}_${newPid}`;
      const oldCompositeKey = `${existing.name}_${existing.pid}`;

      // 处理 key 更新
      if (updates.key === undefined) {
        updates.key = compositeKey;
      }

      // 检查唯一约束
      if (
        XmDb.keyCache.has(`${cacheKey}:${compositeKey}`) &&
        compositeKey !== oldCompositeKey
      ) {
        throw new Error(
          `Unique constraint violation for name+pid: ${compositeKey}`
        );
      }

      // 处理 data 更新
      let dataChanged = false;
      if (updates.data !== undefined) {
        if (updates.data === null) {
          updates.data = null;
          dataChanged = existing.data !== null;
        } else {
          updates.data =
            typeof updates.data === "string"
              ? updates.data
              : JSON.stringify(updates.data);
          dataChanged = updates.data !== existing.data;
        }
      }

      let dataOChanged = false;
      if (updates.data_o !== undefined) {
        if (updates.data_o === null) {
          updates.data_o = null;
          dataOChanged = existing.data_o !== null;
        } else {
          updates.data_o =
            typeof updates.data_o === "string"
              ? updates.data_o
              : JSON.stringify(updates.data_o);
          dataOChanged = updates.data_o !== existing.data_o;
        }
      }

      let dataTChanged = false;
      if (updates.data_t !== undefined) {
        if (updates.data_t === null) {
          updates.data_t = null;
          dataTChanged = existing.data_t !== null;
        } else {
          updates.data_t =
            typeof updates.data_t === "string"
              ? updates.data_t
              : JSON.stringify(updates.data_t);
          dataTChanged = updates.data_t !== existing.data_t;
        }
      }

      // 版本号递增（仅当值实际发生变化时）
      const newVersion =
        (updates.name !== undefined && updates.name !== existing.name) ||
        (updates.pid !== undefined && updates.pid !== existing.pid) ||
        (updates.type !== undefined && updates.type !== existing.type) ||
        dataChanged
          ? (existing.version || 0) + 1
          : existing.version;
      const newVersionO = dataOChanged
        ? (existing.version_o || 0) + 1
        : existing.version_o;
      const newVersionT = dataTChanged
        ? (existing.version_t || 0) + 1
        : existing.version_t;

      updates.version = newVersion;
      updates.version_o = newVersionO;
      updates.version_t = newVersionT;

      const updatedData = {
        ...existing,
        ...updates,
        update_time: Math.floor(Date.now() / 1000),
      };

      const keys = Object.keys(updates);
      const values = Object.values(updates);

      // 在 WHERE 条件中加入版本检查
      const result = db.run(
        `UPDATE \`${tableName}\` SET ${keys
          .map((k) => `${k} = ?`)
          .join(
            ", "
          )}, update_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL AND version = ?`,
        [...values, id, existing.version]
      );

      // 检查是否有行被更新
      if (result.changes === 0) {
        const errorMsg = `Version conflict or record not found during update for ${tableName} id ${id} in ${dbName}`;
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
            ip: this.getClientIP(req),
            userId: userId,
          },
          req: req,
        });

        throw new Error(errorMsg);
      }

      // 记录更新日志
      const changedFields = Object.keys(updates).filter(
        (key) =>
          !["version", "version_o", "version_t"].includes(key) &&
          ((key === "name" && updates.name !== existing.name) ||
            (key === "pid" && updates.pid !== existing.pid) ||
            (key === "type" && updates.type !== existing.type) ||
            (key === "data" && dataChanged) ||
            (key === "data_o" && dataOChanged) ||
            (key === "data_t" && dataTChanged))
      );
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
          updates: updates,
          changedFields: changedFields,
          oldVersion: existing.version,
          newVersion: newVersion,
          oldVersionO: existing.version_o,
          newVersionO: newVersionO,
          oldVersionT: existing.version_t,
          newVersionT: newVersionT,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.keyCache.delete(`${cacheKey}:${oldCompositeKey}`);
      XmDb.keyCache.set(`${cacheKey}:${compositeKey}`, updatedData);

      if (existing.pid !== newPid) {
        // Remove from all pidCache entries where this id appears
        for (const [key, rows] of XmDb.pidCache.entries()) {
          if (key.startsWith(cacheKey) && rows.some((row) => row.id === id)) {
            XmDb.pidCache.set(
              key,
              rows.filter((row) => row.id !== id)
            );
          }
        }
        // Add to new pidCache entry
        const newPidRows = XmDb.pidCache.get(`${cacheKey}:${newPid}`) || [];
        if (!newPidRows.some((row) => row.id === id)) {
          newPidRows.push(updatedData);
        }
        XmDb.pidCache.set(`${cacheKey}:${newPid}`, newPidRows);
      } else {
        // Update existing pidCache entry with updatedData
        const pidRows = XmDb.pidCache.get(`${cacheKey}:${existing.pid}`) || [];
        const updatedPidRows = pidRows.map((row) =>
          row.id === id ? updatedData : row
        );
        XmDb.pidCache.set(`${cacheKey}:${existing.pid}`, updatedPidRows);
      }
      XmDb.idCache.set(`${cacheKey}:${id}`, updatedData);
      return updatedData;
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
          updates: updates,
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
      return data; // 返回原始字符串
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
