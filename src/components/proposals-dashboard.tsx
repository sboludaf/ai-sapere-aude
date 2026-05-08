"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Filter } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ProposalStatus, ProposalSummary } from "@/lib/types";

type ProposalsDashboardProps = {
  proposals: ProposalSummary[];
};

const statusFilters: Array<{ status: ProposalStatus; label: string }> = [
  { status: "PENDING", label: "Pendientes" },
  { status: "APPROVED", label: "Aprobadas" },
  { status: "REJECTED", label: "Rechazadas" },
  { status: "DELIVERED", label: "Impartidas" },
  { status: "PAID", label: "Cobradas" }
];

function ProposalCard({ proposal }: { proposal: ProposalSummary }) {
  return (
    <Link className="proposal-card proposal-card-link" href={`/proposals/${proposal.id}`} aria-label={`Abrir ${proposal.title}`}>
      <div className="proposal-card-main">
        <div className="proposal-card-title">
          <h3>{proposal.title}</h3>
          <p className="subtle">{proposal.companyName}</p>
        </div>
        <div className="proposal-card-side">
          <StatusBadge status={proposal.status} />
          <span className="summary-chip proposal-budget">{formatCurrency(proposal.totalCost, proposal.currency)}</span>
        </div>
      </div>
      <div className="proposal-card-details">
        <span>{formatDate(proposal.startDate)}</span>
        <span>{proposal.classCount} clases</span>
        <span>{proposal.pendingClassCount} pendientes profesor</span>
      </div>
    </Link>
  );
}

export function ProposalsDashboard({ proposals }: ProposalsDashboardProps) {
  const [selectedStatuses, setSelectedStatuses] = useState<ProposalStatus[]>([]);

  const selectedSet = useMemo(() => new Set(selectedStatuses), [selectedStatuses]);
  const visibleProposals = useMemo(
    () => (selectedStatuses.length ? proposals.filter((proposal) => selectedSet.has(proposal.status)) : proposals),
    [proposals, selectedSet, selectedStatuses.length]
  );

  const counts = useMemo(
    () =>
      statusFilters.reduce<Record<ProposalStatus, number>>(
        (acc, filter) => {
          acc[filter.status] = proposals.filter((proposal) => proposal.status === filter.status).length;
          return acc;
        },
        {
          PENDING: 0,
          APPROVED: 0,
          REJECTED: 0,
          DELIVERED: 0,
          PAID: 0
        }
      ),
    [proposals]
  );

  function toggleStatus(status: ProposalStatus) {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((selected) => selected !== status) : [...current, status]
    );
  }

  return (
    <section className="proposal-dashboard" aria-label="Dashboard de propuestas">
      <div className="filter-surface">
        <div className="filter-heading">
          <span>
            <Filter size={18} aria-hidden="true" />
            Filtros por estado
          </span>
          <strong>
            {visibleProposals.length} de {proposals.length}
          </strong>
        </div>
        <div className="filter-button-group" aria-label="Estados de propuesta">
          {statusFilters.map((filter) => {
            const isSelected = selectedSet.has(filter.status);

            return (
              <Button
                key={filter.status}
                className={isSelected ? "filter-button selected" : "filter-button"}
                onPress={() => toggleStatus(filter.status)}
                aria-pressed={isSelected}
                variant={isSelected ? "primary" : "outline"}
              >
                {filter.label}
                <span>{counts[filter.status]}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="proposal-dashboard-grid">
        {visibleProposals.length ? (
          visibleProposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)
        ) : (
          <div className="empty-state dashboard-empty">Sin propuestas para estos filtros</div>
        )}
      </div>
    </section>
  );
}
