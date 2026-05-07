import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    MYSQL_HOST: process.env.MYSQL_HOST ?? "(not set)",
    MYSQL_PORT: process.env.MYSQL_PORT ?? "(not set)",
    MYSQL_USER: process.env.MYSQL_USER ?? "(not set)",
    MYSQL_DATABASE: process.env.MYSQL_DATABASE ?? "(not set)",
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD ? "***set***" : "(not set)"
  };

  let dbStatus = "unknown";
  let dbError = "";
  let dbResult = null;

  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT 1 AS ok, NOW() AS serverTime");
    dbStatus = "connected";
    dbResult = rows;
  } catch (error: unknown) {
    dbStatus = "error";
    dbError = error instanceof Error ? `${error.message} | ${error.name}` : String(error);
  }

  return NextResponse.json({ env, dbStatus, dbError, dbResult });
}
