import Link from "next/link";
import { ArrowLeft, Mail, Phone, Trash2 } from "lucide-react";
import { AddProfessorDropdown } from "@/components/add-professor-dropdown";
import { deleteProfessorAction } from "@/app/actions";
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
        <AddProfessorDropdown />
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
              <form action={deleteProfessorAction}>
                <input type="hidden" name="professorId" value={professor.id} />
                <button
                  type="submit"
                  className="delete-professor-button"
                  aria-label={`Eliminar ${professor.firstName} ${professor.lastName}`}
                  title="Eliminar profesor"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
