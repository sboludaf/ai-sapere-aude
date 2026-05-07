import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProposalClass } from "@/lib/repositories/proposals";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const classId = await createProposalClass({ ...body, proposalId: id });
    return NextResponse.json({ id: classId }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.flatten().fieldErrors }, { status: 400 });
    }

    console.error("Create proposal class failed", error);
    return NextResponse.json({ error: "CREATE_CLASS_FAILED" }, { status: 500 });
  }
}
