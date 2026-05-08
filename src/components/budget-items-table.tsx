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
      <Table.ScrollContainer className="table-wrap">
        <Table.Content aria-label="Servicios y presupuesto" className="app-data-table">
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
                <Table.Cell>{item.serviceName}</Table.Cell>
                <Table.Cell>{item.description || "-"}</Table.Cell>
                <Table.Cell>{item.quantity}</Table.Cell>
                <Table.Cell>{item.persons}</Table.Cell>
                <Table.Cell>{formatCurrency(item.unitPrice, currency)}</Table.Cell>
                <Table.Cell>{formatCurrency(item.subtotal, currency)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
