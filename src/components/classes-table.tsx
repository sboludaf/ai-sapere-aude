"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Table } from "@heroui/react";
import { Pencil } from "lucide-react";
import { AppSelect } from "@/components/app-controls";
import { formatClassStatus, formatDate, formatHours } from "@/lib/format";
import { classStatuses, type ClassStatus, type Professor, type ProposalClass } from "@/lib/types";

type ClassesTableProps = {
  proposalId: string;
  classes: ProposalClass[];
  professors: Professor[];
};

type EditingCell = {
  classId: string;
  field: "professor" | "status";
} | null;

function professorFullName(professor: Professor) {
  return `${professor.firstName} ${professor.lastName}`;
}

const unassignedProfessorKey = "__unassigned";
const classStatusTone: Record<ClassStatus, string> = {
  SEARCHING_PROFESSOR: "class-status-searching",
  PENDING_CONFIRMATION: "class-status-confirmation",
  PENDING_PRESENTATION_REVIEW: "class-status-review",
  PRESENTATION_OK: "class-status-ok"
};

export function ClassesTable({ proposalId, classes, professors }: ClassesTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState(classes);
  const [editing, setEditing] = useState<EditingCell>(null);
  const [pendingCell, setPendingCell] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const professorOptions = [
    { key: unassignedProfessorKey, label: "Pendiente de asignar profesor" },
    ...professors.map((professor) => ({ key: professor.id, label: professorFullName(professor) }))
  ];
  const statusOptions = classStatuses.map((status) => ({ key: status, label: formatClassStatus(status), tone: classStatusTone[status] }));

  useEffect(() => {
    setRows(classes);
  }, [classes]);

  async function updateClass(classItem: ProposalClass, patch: { professorId?: string; classStatus?: ClassStatus }) {
    if (!classItem.id) {
      return;
    }

    const nextProfessorId = patch.professorId ?? classItem.professorId ?? "";
    const nextStatus = patch.classStatus ?? classItem.classStatus;
    const pendingKey = `${classItem.id}-${patch.professorId !== undefined ? "professor" : "status"}`;
    setPendingCell(pendingKey);

    const response = await fetch(`/api/proposals/${proposalId}/classes/${classItem.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        professorId: nextProfessorId,
        classStatus: nextStatus
      })
    });

    setPendingCell(null);

    if (!response.ok) {
      return;
    }

    const professor = professors.find((item) => item.id === nextProfessorId);
    setRows((current) =>
      current.map((row) =>
        row.id === classItem.id
          ? {
              ...row,
              professorId: nextProfessorId || null,
              professorName: professor ? professorFullName(professor) : null,
              classStatus: nextStatus
            }
          : row
      )
    );
    setEditing(null);
    startTransition(() => router.refresh());
  }

  return (
    <Table className="app-table-root">
      <Table.ScrollContainer className="classes-table-wrap">
        <Table.Content aria-label="Clases y profesores" className="classes-table">
          <Table.Header>
            <Table.Column isRowHeader>Titulo</Table.Column>
            <Table.Column>Fecha</Table.Column>
            <Table.Column>Hora Inicio</Table.Column>
            <Table.Column>Hora Fin</Table.Column>
            <Table.Column>Horas totales</Table.Column>
            <Table.Column>Profesor</Table.Column>
            <Table.Column>Estado Clase</Table.Column>
          </Table.Header>
          <Table.Body>
          {rows.map((classItem) => {
            const classId = classItem.id ?? "";
            const isProfessorEditing = editing?.classId === classId && editing.field === "professor";
            const isStatusEditing = editing?.classId === classId && editing.field === "status";

            return (
              <Table.Row key={classId || `${classItem.title}-${classItem.classDate}`}>
                <Table.Cell data-label="Titulo">{classItem.title}</Table.Cell>
                <Table.Cell data-label="Fecha">{formatDate(classItem.classDate)}</Table.Cell>
                <Table.Cell data-label="Hora Inicio">{classItem.startTime}</Table.Cell>
                <Table.Cell data-label="Hora Fin">{classItem.endTime}</Table.Cell>
                <Table.Cell data-label="Horas totales">{formatHours(classItem.hours)}</Table.Cell>
                <Table.Cell data-label="Profesor">
                  {isProfessorEditing ? (
                    <AppSelect
                      ariaLabel="Profesor"
                      isDisabled={pendingCell === `${classId}-professor`}
                      onChange={(value) => updateClass(classItem, { professorId: value === unassignedProfessorKey ? "" : value })}
                      options={professorOptions}
                      value={classItem.professorId ?? unassignedProfessorKey}
                    />
                  ) : (
                    <span className="editable-cell">
                      {classItem.professorName ?? "Pendiente de asignar profesor"}
                      {classId ? (
                        <Button
                          isIconOnly
                          aria-label="Modificar profesor"
                          className="edit-button"
                          variant="outline"
                          onPress={() => setEditing({ classId, field: "professor" })}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </Button>
                      ) : null}
                    </span>
                  )}
                </Table.Cell>
                <Table.Cell data-label="Estado Clase">
                  {isStatusEditing ? (
                    <AppSelect
                      ariaLabel="Estado Clase"
                      isDisabled={pendingCell === `${classId}-status`}
                      onChange={(value) => updateClass(classItem, { classStatus: value as ClassStatus })}
                      options={statusOptions}
                      value={classItem.classStatus}
                    />
                  ) : (
                    <span className="editable-cell">
                      <span className={`class-status-badge ${classStatusTone[classItem.classStatus]}`}>{formatClassStatus(classItem.classStatus)}</span>
                      {classId ? (
                        <Button
                          isIconOnly
                          aria-label="Modificar estado de clase"
                          className="edit-button"
                          variant="outline"
                          onPress={() => setEditing({ classId, field: "status" })}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </Button>
                      ) : null}
                    </span>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
