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
      <header className="page-header proposals-header">
        <div className="page-title proposals-title">
          <span className="eyebrow">AI Sapere Aude</span>
          <div className="title-action-row">
            <h1>Propuestas</h1>
            <NewProposalModal compact professors={professors} />
          </div>
        </div>
      </header>

      <ClassesCalendar events={calendarEvents} />
      <ProposalsDashboard proposals={proposals} />
    </div>
  );
}
