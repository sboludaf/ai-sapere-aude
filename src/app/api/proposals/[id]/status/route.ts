import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateProposalStatus } from "@/lib/repositories/proposals";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    await updateProposalStatus({ ...body, proposalId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "VALIDATION_ERROR", issues: error.flatten().fieldErrors }, { status: 400 });
    }

    return NextResponse.json({ error: "STATUS_FAILED" }, { status: 500 });
  }
}
