import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { DeleteProfessorButton } from "@/components/delete-professor-button";
import { NewProfessorModal } from "@/components/new-professor-modal";
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
          {professors.map((professor) => (
            <article className="professor-card" key={professor.id}>
              <div className="professor-info">
                <h3 className="professor-name">
                  <span className="professor-first-name">{professor.firstName}</span>
                  <span className="professor-last-name">{professor.lastName}</span>
                </h3>
                <p className="professor-email">
                  <Mail size={13} aria-hidden="true" />
                  {professor.email}
                </p>
                {professor.phone ? (
                  <p className="professor-email">
                    <Phone size={13} aria-hidden="true" />
                    {professor.phone}
                  </p>
                ) : null}
              </div>
              <DeleteProfessorButton label={`Eliminar ${professor.firstName} ${professor.lastName}`} professorId={professor.id} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
