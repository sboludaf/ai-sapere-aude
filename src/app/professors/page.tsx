import Link from "next/link";
import { ArrowLeft, GraduationCap, Mail } from "lucide-react";
import { NewProfessorModal } from "@/components/new-professor-modal";
import { initials } from "@/lib/format";
import { listProfessors } from "@/lib/repositories/proposals";

export const dynamic = "force-dynamic";

export default async function ProfessorsPage() {
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
          <h1>Profesores</h1>
        </div>
        <NewProfessorModal />
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Equipo docente</h2>
          <span className="subtle">{professors.length} registros</span>
        </div>

        <div className="professor-grid">
          {professors.map((professor) => {
            const fullName = `${professor.firstName} ${professor.lastName}`;

            return (
              <article className="professor-card" key={professor.id}>
                <header>
                  <span className="avatar">{initials(fullName)}</span>
                  <GraduationCap size={20} aria-hidden="true" />
                </header>
                <div>
                  <h3>{fullName}</h3>
                  <p className="proposal-meta">
                    <span>
                      <Mail size={14} aria-hidden="true" />
                      {professor.email}
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
