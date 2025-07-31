import XmDb from "./XmDb";
import { Database } from "bun:sqlite";

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
    type,
    pid,
    name,
    uniqueFields = [],
    uniqueValues = [],
    dbName = "xm1",
    data = null,
    req = null, // 添加请求对象用于获取IP等信息
    userId = null, // 用户ID
  }) {
    try {
      await XmDb.ensureTable(type, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      if (uniqueFields.length !== uniqueValues.length) {
        throw new Error("Mismatch between uniqueFields and uniqueValues");
      }
      pid = pid || 0;
      const cacheKey = `${dbName}:${type}`;
      if (
        type === "tree" &&
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
            `SELECT * FROM \`${type}\` WHERE ${conditions} AND delete_time IS NULL`
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
      if (data) {
        dataJson = typeof data === "string" ? data : JSON.stringify(data);
      }

      const stmt = db.prepare(`
        INSERT INTO \`${type}\` (pid, name, key, version, data, create_time, update_time)
        VALUES (?, ?, ?, 1, ?, strftime('%s', 'now'), strftime('%s', 'now')) RETURNING *`);
      const row = stmt.get(pid, name, key, dataJson);

      // 记录创建日志到日志表
      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "create",
        recordId: row.id,
        databaseName: dbName,
        tableName: type,
        success: true,
        message: `Created ${type} record with id ${row.id} in ${dbName}`,
        details: {
          pid: row.pid,
          name: row.name,
          key: row.key,
          ip: this.getClientIP(req),
          userId: userId,
          data: data,
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
        tableName: type,
        success: false,
        message: `Create ${type} failed in ${dbName}: ${error.message}`,
        details: {
          pid: pid,
          name: name,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(`Create ${type} failed in ${dbName}: ${error.message}`, "error");
      throw error;
    }
  }

  static async read({ type, id, dbName = "xm1", req = null, userId = null }) {
    try {
      await XmDb.ensureTable(type, dbName);
      const cacheKey = `${dbName}:${type}`;
      const result = XmDb.idCache.get(`${cacheKey}:${id}`) ?? null;

      // 记录读取日志
      let message, logLevel;
      if (result) {
        message = `Read ${type} record with id ${id} from ${dbName}`;
        logLevel = "info";
      } else {
        message = `Read ${type} record with id ${id} not found in ${dbName}`;
        logLevel = "warn";
      }

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "read",
        recordId: id,
        databaseName: dbName,
        tableName: type,
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
        tableName: type,
        success: false,
        message: `Read ${type} id ${id} failed in ${dbName}: ${error.message}`,
        details: {
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Read ${type} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async readByName({
    type,
    compositeKey,
    dbName = "xm1",
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(type, dbName);
      const cacheKey = `${dbName}:${type}`;
      const result = XmDb.keyCache.get(`${cacheKey}:${compositeKey}`) ?? null;

      // 记录读取日志
      let message, logLevel;
      if (result) {
        message = `Read ${type} record with key ${compositeKey} from ${dbName}`;
        logLevel = "info";
      } else {
        message = `Read ${type} record with key ${compositeKey} not found in ${dbName}`;
        logLevel = "warn";
      }

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "read_by_name",
        recordId: result ? result.id : null,
        databaseName: dbName,
        tableName: type,
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
        tableName: type,
        success: false,
        message: `Read ${type} by name+pid ${compositeKey} failed in ${dbName}: ${error.message}`,
        details: {
          compositeKey: compositeKey,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Read ${type} by name+pid ${compositeKey} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async update({
    type,
    id,
    updates,
    dbName = "xm1",
    expectedVersion = null,
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(type, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${type}`;
      const existing = await XmDbCRUD.read({ type, id, dbName });
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }

      // 检查版本一致性
      if (existing.version !== expectedVersion) {
        const errorMsg = `Version conflict: expected ${expectedVersion}, but found ${existing.version} for ${type} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "update",
          recordId: id,
          databaseName: dbName,
          tableName: type,
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
      const newPid = updates.pid !== undefined ? updates.pid : existing.pid;
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
      if (updates.data !== undefined) {
        if (updates.data === null) {
          updates.data = null;
        } else {
          updates.data =
            typeof updates.data === "string"
              ? updates.data
              : JSON.stringify(updates.data);
        }
      }

      // 版本号递增
      const newVersion = (existing.version || 0) + 1;
      updates.version = newVersion;

      const updatedData = {
        ...existing,
        ...updates,
        update_time: Math.floor(Date.now() / 1000),
      };

      const keys = Object.keys(updates);
      const values = Object.values(updates);

      // 在 WHERE 条件中加入版本检查
      const result = db.run(
        `UPDATE \`${type}\` SET ${keys
          .map((k) => `${k} = ?`)
          .join(
            ", "
          )}, update_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL AND version = ?`,
        [...values, id, existing.version]
      );

      // 检查是否有行被更新
      if (result.changes === 0) {
        const errorMsg = `Version conflict or record not found during update for ${type} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "update",
          recordId: id,
          databaseName: dbName,
          tableName: type,
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
      const logMessage = `Updated ${type} record with id ${id} in ${dbName} (version ${newVersion})`;
      XmDb.log(logMessage, "info");

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "update",
        recordId: id,
        databaseName: dbName,
        tableName: type,
        success: true,
        message: logMessage,
        details: {
          updates: updates,
          oldVersion: existing.version,
          newVersion: newVersion,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      if (compositeKey !== oldCompositeKey) {
        XmDb.keyCache.delete(`${cacheKey}:${oldCompositeKey}`);
        XmDb.keyCache.set(`${cacheKey}:${compositeKey}`, updatedData);
      }

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
        tableName: type,
        success: false,
        message: `Update ${type} id ${id} failed in ${dbName}: ${error.message}`,
        details: {
          updates: updates,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Update ${type} id ${id} failed in ${dbName}: ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  static async delete({
    type,
    id,
    soft = true,
    dbName = "xm1",
    expectedVersion = null,
    req = null,
    userId = null,
  }) {
    try {
      await XmDb.ensureTable(type, dbName);
      const db = XmDb.dbs.get(dbName);
      if (!db) throw new Error(`Database ${dbName} not found`);
      const cacheKey = `${dbName}:${type}`;
      const existing = await XmDbCRUD.read({ type, id, dbName });
      if (!existing) {
        throw new Error(`Record with id ${id} not found in ${type}`);
      }

      // 检查版本一致性
      if (expectedVersion !== null && existing.version !== expectedVersion) {
        const errorMsg = `Version conflict: expected ${expectedVersion}, but found ${existing.version} for ${type} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "delete",
          recordId: id,
          databaseName: dbName,
          tableName: type,
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
        ? `UPDATE \`${type}\` SET delete_time = strftime('%s', 'now') WHERE id = ? AND delete_time IS NULL AND version = ?`
        : `DELETE FROM \`${type}\` WHERE id = ? AND version = ?`;

      const result = db.run(query, [id, existing.version]);

      // 检查是否有行被删除/更新
      if (result.changes === 0) {
        const errorMsg = `Version conflict or record not found during delete for ${type} id ${id} in ${dbName}`;
        XmDb.log(errorMsg, "warn");

        await this.logOperation({
          dbName: "xmlog",
          tableType: "log",
          operation: "delete",
          recordId: id,
          databaseName: dbName,
          tableName: type,
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
      const logMessage = `${deleteType} ${type} record with id ${id} in ${dbName}`;
      XmDb.log(logMessage, "info");

      await this.logOperation({
        dbName: "xmlog",
        tableType: "log",
        operation: "delete",
        recordId: id,
        databaseName: dbName,
        tableName: type,
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
        tableName: type,
        success: false,
        message: `Delete ${type} id ${id} failed in ${dbName}: ${error.message}`,
        details: {
          soft: soft,
          ip: this.getClientIP(req),
          userId: userId,
        },
        req: req,
      });

      XmDb.log(
        `Delete ${type} id ${id} failed in ${dbName}: ${error.message}`,
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
        INSERT INTO \`${tableType}\` (pid, name, key, version, data, create_time, update_time)
        VALUES (?, ?, ?, 1, ?, strftime('%s', 'now'), strftime('%s', 'now')) RETURNING *`);

      const logMessage = {
        message: message,
        ...logData,
      };

      stmt.get(
        logPid,
        logName,
        `log_${Date.now()}`,
        JSON.stringify(logMessage)
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
}

export { XmDb };
