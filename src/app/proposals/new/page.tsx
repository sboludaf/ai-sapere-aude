import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProposalForm } from "@/components/proposal-form";
import { listProfessors } from "@/lib/repositories/proposals";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const professors = await listProfessors();

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title">
          <Link className="secondary-button" href="/">
            <ArrowLeft size={18} aria-hidden="true" />
            Volver
          </Link>
          <span className="eyebrow">AI Sapere Aude</span>
          <h1>Nueva propuesta</h1>
        </div>
      </header>

      <section className="panel">
        <ProposalForm professors={professors} />
      </section>
    </div>
  );
}
