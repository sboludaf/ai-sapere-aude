"use client";

import { Table } from "@heroui/react";
import { formatCurrency } from "@/lib/format";
import type { BudgetItem } from "@/lib/types";

type BudgetItemsTableProps = {
  currency: string;
  items: BudgetItem[];
};

export function BudgetItemsTable({ currency, items }: BudgetItemsTableProps) {
  return (
    <Table className="app-table-root">
      <Table.ScrollContainer className="classes-table-wrap budget-table-wrap">
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
  );
}
