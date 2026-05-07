import { NextResponse } from "next/server";
import { resetPool } from "@/lib/db";

export async function POST() {
  try {
    await resetPool();
    return NextResponse.json({ success: true, message: "Pool reset successfully" });
  } catch (error) {
    console.error("Reset pool failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
