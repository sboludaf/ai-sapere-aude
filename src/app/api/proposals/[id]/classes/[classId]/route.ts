import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateProposalClass } from "@/lib/repositories/proposals";

type RouteContext = {
  params: Promise<{
    id: string;
    classId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id, classId } = await context.params;

  try {
    const body = await request.json();
    await updateProposalClass({ ...body, proposalId: id, classId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.flatten().fieldErrors }, { status: 400 });
    }

    console.error("Update proposal class failed", error);
    return NextResponse.json({ error: "UPDATE_CLASS_FAILED" }, { status: 500 });
  }
}
