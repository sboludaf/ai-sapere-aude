import type { ClassStatus, ProposalStatus } from "@/lib/types";

const statusLabels: Record<ProposalStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  DELIVERED: "Impartida",
  PAID: "Cobrada"
};

const classStatusLabels: Record<ClassStatus, string> = {
  SEARCHING_PROFESSOR: "Busqueda de Profesor",
  PENDING_CONFIRMATION: "Pendiente Confirmacion",
  PENDING_PRESENTATION_REVIEW: "Pendiente Revision Presentacion",
  PRESENTATION_OK: "OK a Presentacion"
};

export function formatStatus(status: ProposalStatus) {
  return statusLabels[status];
}

export function formatClassStatus(status: ClassStatus) {
  return classStatusLabels[status];
}

export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatHours(value: number) {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(value)} h`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
