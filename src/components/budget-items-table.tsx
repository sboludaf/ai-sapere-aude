"use client";

import { Table } from "@heroui/react";
import { CircleDollarSign, Clock3, User } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { BudgetItem } from "@/lib/types";

type BudgetItemsTableProps = {
  currency: string;
  items: BudgetItem[];
};

function compactNumber(value: number) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(value);
}

function compactCurrency(value: number, currency: string, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits
  })
    .format(value)
    .replace(/\s/g, "");
}

export function BudgetItemsTable({ currency, items }: BudgetItemsTableProps) {
  const total = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

  return (
    <div className="budget-items">
      <Table className="app-table-root">
        <Table.ScrollContainer className="budget-table-wrap">
          <Table.Content aria-label="Servicios y presupuesto" className="budget-table">
            <Table.Header>
              <Table.Column isRowHeader>Servicio</Table.Column>
              <Table.Column>Descripcion</Table.Column>
              <Table.Column>Tiempo / unidades</Table.Column>
              <Table.Column>Personas</Table.Column>
              <Table.Column>Precio unitario</Table.Column>
              <Table.Column>Total</Table.Column>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id ?? item.serviceName}>
                  <Table.Cell data-label="Servicio">{item.serviceName}</Table.Cell>
                  <Table.Cell data-label="Descripcion">{item.description || "-"}</Table.Cell>
                  <Table.Cell data-label="Tiempo / unidades">{item.quantity}</Table.Cell>
                  <Table.Cell data-label="Personas">{item.persons}</Table.Cell>
                  <Table.Cell data-label="Precio unitario">{formatCurrency(item.unitPrice, currency)}</Table.Cell>
                  <Table.Cell data-label="Total">{formatCurrency(item.subtotal, currency)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      <div className="budget-mobile-list" aria-label="Servicios y presupuesto en tarjetas">
        {items.map((item) => (
          <article className="budget-service-card" key={item.id ?? `${item.serviceName}-card`}>
            <div className="budget-service-copy">
              <h3>{item.serviceName}</h3>
              <p>{item.description || "Sin descripcion"}</p>
            </div>
            <div className="budget-service-detail">
              <div className="budget-service-metrics">
                <span className="budget-service-meta">
                  <Clock3 size={22} aria-hidden="true" />
                  {compactNumber(item.quantity)}h
                </span>
                <span className="budget-service-meta">
                  <User size={24} aria-hidden="true" />
                  {compactNumber(item.persons)}
                </span>
                <span className="budget-service-meta">
                  <CircleDollarSign size={24} aria-hidden="true" />
                  {compactCurrency(item.unitPrice, currency, 2)}
                </span>
              </div>
              <strong className="budget-service-total">{compactCurrency(item.subtotal, currency)}</strong>
            </div>
          </article>
        ))}
        {items.length ? <strong className="budget-mobile-total">{compactCurrency(total, currency)}</strong> : null}
      </div>
    </div>
  );
}
