import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createProposal, listProposals } from "@/lib/repositories/proposals";

export async function GET() {
  const proposals = await listProposals();
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await createProposal(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          issues: error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    console.error("Create proposal failed", error);
    return NextResponse.json({ error: "CREATE_PROPOSAL_FAILED" }, { status: 500 });
  }
}
