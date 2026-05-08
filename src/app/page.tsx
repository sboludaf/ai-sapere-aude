import Link from "next/link";
import { UsersRound } from "lucide-react";
import { ClassesCalendar } from "@/components/classes-calendar";
import { NewProposalModal } from "@/components/new-proposal-modal";
import { ProposalsDashboard } from "@/components/proposals-dashboard";
import { listCalendarEvents, listProfessors, listProposals } from "@/lib/repositories/proposals";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [proposals, professors, calendarEvents] = await Promise.all([
    listProposals(),
    listProfessors(),
    listCalendarEvents()
  ]);

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
          <NewProposalModal professors={professors} />
        </div>
      </header>

      <ClassesCalendar events={calendarEvents} />
      <ProposalsDashboard proposals={proposals} />
    </div>
  );
}
