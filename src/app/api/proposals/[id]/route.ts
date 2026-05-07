import { NextResponse } from "next/server";
import { getProposal } from "@/lib/repositories/proposals";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const proposal = await getProposal(id);

  if (!proposal) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
