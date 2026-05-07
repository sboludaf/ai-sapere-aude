import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { ProposalsDashboard } from "@/components/proposals-dashboard";
import { listProposals } from "@/lib/repositories/proposals";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const proposals = await listProposals();

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title">
          <span className="eyebrow">AI Sapere Aude</span>
          <h1>Propuestas</h1>
        </div>
        <div className="top-actions">
          <Link className="secondary-button" href="/professors">
            <UsersRound size={18} aria-hidden="true" />
            Profesores
          </Link>
          <Link className="brand-button" href="/proposals/new">
            <Plus size={18} aria-hidden="true" />
            Nueva propuesta
          </Link>
        </div>
      </header>

      <ProposalsDashboard proposals={proposals} />
    </div>
  );
}
