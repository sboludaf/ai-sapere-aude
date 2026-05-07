"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Pencil } from "lucide-react";
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

export function ClassesTable({ proposalId, classes, professors }: ClassesTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState(classes);
  const [editing, setEditing] = useState<EditingCell>(null);
  const [pendingCell, setPendingCell] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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
    <div className="classes-table-wrap">
      <table className="classes-table">
        <thead>
          <tr>
            <th>Titulo</th>
            <th>Fecha</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Horas totales</th>
            <th>Profesor</th>
            <th>Estado Clase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((classItem) => {
            const classId = classItem.id ?? "";
            const isProfessorEditing = editing?.classId === classId && editing.field === "professor";
            const isStatusEditing = editing?.classId === classId && editing.field === "status";

            return (
              <tr key={classId || `${classItem.title}-${classItem.classDate}`}>
                <td data-label="Titulo">{classItem.title}</td>
                <td data-label="Fecha">{formatDate(classItem.classDate)}</td>
                <td data-label="Hora Inicio">{classItem.startTime}</td>
                <td data-label="Hora Fin">{classItem.endTime}</td>
                <td data-label="Horas totales">{formatHours(classItem.hours)}</td>
                <td data-label="Profesor">
                  {isProfessorEditing ? (
                    <select
                      autoFocus
                      aria-label="Profesor"
                      className="inline-select"
                      disabled={pendingCell === `${classId}-professor`}
                      value={classItem.professorId ?? ""}
                      onChange={(event) => updateClass(classItem, { professorId: event.target.value })}
                    >
                      <option value="">Pendiente de asignar profesor</option>
                      {professors.map((professor) => (
                        <option key={professor.id} value={professor.id}>
                          {professorFullName(professor)}
                        </option>
                      ))}
                    </select>
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
                </td>
                <td data-label="Estado Clase">
                  {isStatusEditing ? (
                    <select
                      autoFocus
                      aria-label="Estado Clase"
                      className="inline-select"
                      disabled={pendingCell === `${classId}-status`}
                      value={classItem.classStatus}
                      onChange={(event) => updateClass(classItem, { classStatus: event.target.value as ClassStatus })}
                    >
                      {classStatuses.map((status) => (
                        <option key={status} value={status}>
                          {formatClassStatus(status)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="editable-cell">
                      {formatClassStatus(classItem.classStatus)}
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
