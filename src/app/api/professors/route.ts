import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProfessor, listProfessors } from "@/lib/repositories/proposals";

export async function GET() {
  const professors = await listProfessors();
  return NextResponse.json({ professors });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await createProfessor(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.flatten().fieldErrors }, { status: 400 });
    }

    console.error("Create professor failed", error);
    return NextResponse.json({ error: "CREATE_PROFESSOR_FAILED" }, { status: 500 });
  }
}
