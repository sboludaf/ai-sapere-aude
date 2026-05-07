import mysql from "mysql2/promise";

let pool: mysql.Pool | undefined;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? "127.0.0.1",
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER ?? "ai_sapere",
      password: process.env.MYSQL_PASSWORD ?? "ai_sapere_password",
      database: process.env.MYSQL_DATABASE ?? "ai_sapere_aude",
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 5000,
      namedPlaceholders: true,
      timezone: "Z",
      decimalNumbers: true,
      dateStrings: true
    });
  }

  return pool;
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
