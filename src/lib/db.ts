import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;
let dbVerified = false;

const dbConfig = {
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? "ai_sapere",
  password: process.env.MYSQL_PASSWORD ?? "ai_sapere_password",
  database: process.env.MYSQL_DATABASE ?? "ai_sapere_aude"
};

export function getPool() {
  if (!pool) {
    console.log("[DB] Creating connection pool →", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? "***set***" : "(not set)"
    });

    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 5000,
      idleTimeout: 60000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      namedPlaceholders: true,
      timezone: "Z",
      decimalNumbers: true,
      dateStrings: true
    });
  }

  return pool;
}

export async function verifyConnection() {
  if (dbVerified) return;

  const start = Date.now();
  console.log("[DB] Verifying database connection...");

  try {
    const connection = await getPool().getConnection();
    try {
      const [rows] = await connection.query("SELECT 1 AS ok");
      const elapsed = Date.now() - start;
      console.log("[DB] ✓ Connection verified in", elapsed, "ms →", JSON.stringify(rows));
      dbVerified = true;
    } finally {
      connection.release();
    }
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error("[DB] ✗ Connection FAILED after", elapsed, "ms →", {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}. ` +
      `Check MYSQL_HOST (${dbConfig.host}), MYSQL_PORT (${dbConfig.port}), MYSQL_USER (${dbConfig.user}), MYSQL_DATABASE (${dbConfig.database}).`
    );
  }
}

export async function resetPool() {
  if (pool) {
    console.log("[DB] Resetting connection pool");
    await pool.end();
    pool = undefined;
    dbVerified = false;
  }
}

export async function withTransaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function toIsoString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return new Date().toISOString();
}
