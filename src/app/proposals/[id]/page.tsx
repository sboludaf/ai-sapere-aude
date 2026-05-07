import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, CircleDollarSign, History, MessageSquare, UserRoundCheck } from "lucide-react";
import { BudgetUpdateDisclosure } from "@/components/budget-update-disclosure";
import { ClassDisclosure } from "@/components/class-disclosure";
import { ClassesTable } from "@/components/classes-table";
import { CommentDisclosure } from "@/components/comment-disclosure";
import { StatusUpdateDisclosure } from "@/components/status-update-disclosure";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatDateTime, formatHours, formatStatus } from "@/lib/format";
import { getProposal, listProfessors } from "@/lib/repositories/proposals";

export const dynamic = "force-dynamic";

function CardRoot({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={className}>{children}</section>;
}

const Card = Object.assign(CardRoot, {
  Header({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
  },
  Content({ children }: { children: ReactNode }) {
    return <div>{children}</div>;
  }
});

function SummarySurface({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <article className="summary-surface">
      <span className="summary-surface-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

type ProposalPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;
  const [proposal, professors] = await Promise.all([getProposal(id), listProfessors()]);

  if (!proposal) {
    notFound();
  }

  const latestBudget = proposal.budgetVersions[0];
  const teacherHours = proposal.classes.reduce((sum, classItem) => sum + classItem.hours, 0);
  const dateRange =
    proposal.startDate && proposal.endDate && proposal.startDate !== proposal.endDate
      ? `${formatDate(proposal.startDate)} - ${formatDate(proposal.endDate)}`
      : formatDate(proposal.startDate);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-title">
          <Link className="secondary-button" href="/">
            <ArrowLeft size={18} aria-hidden="true" />
            Volver
          </Link>
          <span className="eyebrow">{proposal.companyName}</span>
          <h1>{proposal.title}</h1>
        </div>
        <div className="top-actions">
          <StatusBadge status={proposal.status} />
          <a className="presentation-button link-button" href={proposal.presentationUrl} target="_blank" rel="noreferrer">
            Presentacion
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <StatusUpdateDisclosure proposalId={proposal.id} currentStatus={proposal.status} />
        </div>
      </header>

      <section className="summary-surfaces">
        <SummarySurface
          icon={<CircleDollarSign size={18} aria-hidden="true" />}
          label="Presupuesto actual"
          value={formatCurrency(proposal.totalCost, proposal.currency)}
        />
        <SummarySurface icon={<CalendarDays size={18} aria-hidden="true" />} label="Fechas" value={dateRange} />
        <SummarySurface
          icon={<UserRoundCheck size={18} aria-hidden="true" />}
          label="Clases"
          value={`${proposal.classes.length} clases - ${formatHours(teacherHours)}`}
        />
        <SummarySurface
          icon={<MessageSquare size={18} aria-hidden="true" />}
          label="Comentarios"
          value={`${proposal.comments.length} comentarios`}
        />
      </section>

      <Card className="panel">
        <Card.Header className="panel-header">
          <div>
            <h2>Servicios y presupuesto</h2>
            <p className="subtle">{latestBudget ? `Version ${latestBudget.versionNumber}` : "Sin presupuesto"}</p>
          </div>
          <BudgetUpdateDisclosure proposalId={proposal.id} currency={proposal.currency} latestItems={latestBudget?.items ?? []} />
        </Card.Header>
        <Card.Content>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Descripcion</th>
                  <th>Tiempo / unidades</th>
                  <th>Personas</th>
                  <th>Precio unitario</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {latestBudget?.items.map((item) => (
                  <tr key={item.id ?? item.serviceName}>
                    <td>{item.serviceName}</td>
                    <td>{item.description || "-"}</td>
                    <td>{item.quantity}</td>
                    <td>{item.persons}</td>
                    <td>{formatCurrency(item.unitPrice, proposal.currency)}</td>
                    <td>{formatCurrency(item.subtotal, proposal.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Clases y profesores</h2>
            <p className="subtle">{proposal.pendingClassCount} pendientes de asignar profesor</p>
          </div>
          <ClassDisclosure proposalId={proposal.id} />
        </div>
        {proposal.classes.length ? (
          <ClassesTable proposalId={proposal.id} classes={proposal.classes} professors={professors} />
        ) : (
          <div className="empty-state">Sin clases registradas</div>
        )}
      </section>

      <Card className="panel">
        <Card.Header className="panel-header">
          <div>
            <h2>Comentarios</h2>
            <p className="subtle">{proposal.comments.length} registros</p>
          </div>
          <CommentDisclosure proposalId={proposal.id} />
        </Card.Header>
        <Card.Content>
          <div className="comments">
            {proposal.comments.length ? (
              proposal.comments.map((comment) => (
                <article className="comment-item" key={comment.id}>
                  <div className="comment-meta">
                    <strong>{comment.authorName}</strong>
                    <span>{comment.category}</span>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p>{comment.body}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">Sin comentarios</div>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card className="panel">
        <Card.Header className="panel-header">
          <h2>Historicos</h2>
          <History size={18} aria-hidden="true" />
        </Card.Header>
        <Card.Content>
          <div className="history-unified">
            <section className="history-group">
              <h3>Estados</h3>
              <div className="timeline">
                {proposal.statusHistory.map((item) => (
                  <article className="timeline-item" key={item.id}>
                    <div className="timeline-line">
                      <strong>{formatStatus(item.toStatus)}</strong>
                      <span>{formatDateTime(item.changedAt)}</span>
                    </div>
                    <p>{item.note || "Sin nota"}</p>
                    {item.changedBy ? <p className="subtle">{item.changedBy}</p> : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="history-group">
              <h3>Presupuestos</h3>
              <div className="timeline">
                {proposal.budgetVersions.map((version) => (
                  <article className="timeline-item" key={version.id}>
                    <div className="timeline-line">
                      <strong>Version {version.versionNumber}</strong>
                      <span>{formatCurrency(version.totalCost, version.currency)}</span>
                      <span>{formatDateTime(version.createdAt)}</span>
                    </div>
                    <p>{version.reason || "Sin motivo"}</p>
                    {version.createdBy ? <p className="subtle">{version.createdBy}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
