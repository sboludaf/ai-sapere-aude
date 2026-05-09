"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Table, TextArea } from "@heroui/react";
import { CalendarDays, Check, Clock3, Pencil, Presentation, X } from "lucide-react";
import { AppDatePicker, AppSelect, AppTimeField } from "@/components/app-controls";
import { formatClassStatus, formatDate, formatHours } from "@/lib/format";
import { classStatuses, type ClassStatus, type Professor, type ProposalClass } from "@/lib/types";

type ClassesTableProps = {
  proposalId: string;
  classes: ProposalClass[];
  professors: Professor[];
};

type ClassFormValues = {
  title: string;
  professorId: string;
  classDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  classStatus: ClassStatus;
  notes: string;
};

function professorFullName(professor: Professor) {
  return `${professor.firstName} ${professor.lastName}`;
}

function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  return Number((Math.max(end - start, 0) / 60).toFixed(2));
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
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const professorOptions = [
    { key: unassignedProfessorKey, label: "Pendiente de asignar profesor" },
    ...professors.map((professor) => ({ key: professor.id, label: professorFullName(professor) }))
  ];
  const statusOptions = classStatuses.map((status) => ({ key: status, label: formatClassStatus(status), tone: classStatusTone[status] }));
  const editingClass = rows.find((classItem) => classItem.id === editingClassId);

  useEffect(() => {
    setRows(classes);
  }, [classes]);

  async function updateClass(classItem: ProposalClass, values: ClassFormValues) {
    if (!classItem.id) {
      return "No se pudo identificar la clase.";
    }

    setPendingClassId(classItem.id);

    const response = await fetch(`/api/proposals/${proposalId}/classes/${classItem.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: values.title,
        professorId: values.professorId === unassignedProfessorKey ? "" : values.professorId,
        classDate: values.classDate,
        startTime: values.startTime,
        endTime: values.endTime,
        hours: values.hours,
        classStatus: values.classStatus,
        notes: values.notes
      })
    });

    setPendingClassId(null);

    if (!response.ok) {
      return "No se pudo actualizar la clase.";
    }

    const professor = professors.find((item) => item.id === values.professorId);
    setRows((current) =>
      current.map((row) =>
        row.id === classItem.id
          ? {
              ...row,
              title: values.title,
              professorId: values.professorId === unassignedProfessorKey ? null : values.professorId,
              professorName: professor ? professorFullName(professor) : null,
              classDate: values.classDate,
              startTime: values.startTime,
              endTime: values.endTime,
              hours: values.hours,
              classStatus: values.classStatus,
              notes: values.notes || null
            }
          : row
      )
    );
    setEditingClassId(null);
    startTransition(() => router.refresh());
    return null;
  }

  function toggleEditor(classId: string) {
    setEditingClassId((current) => (current === classId ? null : classId));
  }

  return (
    <div className="classes-manager">
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
              <Table.Column>Editar</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((classItem) => {
                const classId = classItem.id ?? "";

                return (
                  <Table.Row key={classId || `${classItem.title}-${classItem.classDate}`}>
                    <Table.Cell data-label="Titulo">{classItem.title}</Table.Cell>
                    <Table.Cell data-label="Fecha">{formatDate(classItem.classDate)}</Table.Cell>
                    <Table.Cell data-label="Hora Inicio">{classItem.startTime}</Table.Cell>
                    <Table.Cell data-label="Hora Fin">{classItem.endTime}</Table.Cell>
                    <Table.Cell data-label="Horas totales">{formatHours(classItem.hours)}</Table.Cell>
                    <Table.Cell data-label="Profesor">{classItem.professorName ?? "Pendiente de asignar profesor"}</Table.Cell>
                    <Table.Cell data-label="Estado Clase">
                      <span className={`class-status-badge ${classStatusTone[classItem.classStatus]}`}>{formatClassStatus(classItem.classStatus)}</span>
                    </Table.Cell>
                    <Table.Cell data-label="Editar">
                      {classId ? (
                        <Button
                          isIconOnly
                          aria-label={`Editar ${classItem.title}`}
                          className="edit-button"
                          variant="outline"
                          onPress={() => toggleEditor(classId)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </Button>
                      ) : null}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {editingClass ? (
        <div className="class-edit-desktop-panel">
          <ClassEditForm
            classItem={editingClass}
            isPending={pendingClassId === editingClass.id}
            professorOptions={professorOptions}
            statusOptions={statusOptions}
            onCancel={() => setEditingClassId(null)}
            onSave={(values) => updateClass(editingClass, values)}
          />
        </div>
      ) : null}

      <div className="classes-mobile-list" aria-label="Clases y profesores en tarjetas">
        {rows.map((classItem) => {
          const classId = classItem.id ?? "";
          const isEditing = editingClassId === classId;

          return (
            <article className="class-session-card-wrap" key={classId || `${classItem.title}-${classItem.classDate}-card`}>
              <div className="class-session-card">
                <div className="class-session-card-header">
                  <h3>{classItem.title}</h3>
                  {classId ? (
                    <Button
                      isIconOnly
                      aria-label={`Editar ${classItem.title}`}
                      className="class-card-edit-button"
                      variant="ghost"
                      onPress={() => toggleEditor(classId)}
                    >
                      <Pencil size={21} aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                <div className="class-session-meta">
                  <span className="class-session-meta-item">
                    <CalendarDays size={22} aria-hidden="true" />
                    {formatDate(classItem.classDate)}
                  </span>
                  <span className="class-session-meta-item">
                    <Presentation size={23} aria-hidden="true" />
                    {classItem.professorName ?? "Sin asignar"}
                  </span>
                  <span className="class-session-meta-item">
                    <Clock3 size={22} aria-hidden="true" />
                    {classItem.startTime} - {classItem.endTime}
                  </span>
                </div>
                <div className="class-session-status">
                  <span className={`class-status-badge ${classStatusTone[classItem.classStatus]}`}>{formatClassStatus(classItem.classStatus)}</span>
                </div>
              </div>
              {isEditing ? (
                <div className="class-edit-mobile-panel">
                  <ClassEditForm
                    classItem={classItem}
                    isPending={pendingClassId === classId}
                    professorOptions={professorOptions}
                    statusOptions={statusOptions}
                    onCancel={() => setEditingClassId(null)}
                    onSave={(values) => updateClass(classItem, values)}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

type ClassEditFormProps = {
  classItem: ProposalClass;
  isPending: boolean;
  professorOptions: Array<{ key: string; label: string }>;
  statusOptions: Array<{ key: string; label: string; tone?: string }>;
  onCancel: () => void;
  onSave: (values: ClassFormValues) => Promise<string | null>;
};

function ClassEditForm({ classItem, isPending, professorOptions, statusOptions, onCancel, onSave }: ClassEditFormProps) {
  const [title, setTitle] = useState(classItem.title);
  const [professorId, setProfessorId] = useState(classItem.professorId ?? unassignedProfessorKey);
  const [classDate, setClassDate] = useState(classItem.classDate);
  const [startTime, setStartTime] = useState(classItem.startTime);
  const [endTime, setEndTime] = useState(classItem.endTime);
  const [classStatus, setClassStatus] = useState<ClassStatus>(classItem.classStatus);
  const [notes, setNotes] = useState(classItem.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const hours = useMemo(() => calculateHours(startTime, endTime), [startTime, endTime]);

  useEffect(() => {
    setTitle(classItem.title);
    setProfessorId(classItem.professorId ?? unassignedProfessorKey);
    setClassDate(classItem.classDate);
    setStartTime(classItem.startTime);
    setEndTime(classItem.endTime);
    setClassStatus(classItem.classStatus);
    setNotes(classItem.notes ?? "");
    setError(null);
  }, [classItem]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("El titulo de la clase es obligatorio.");
      return;
    }

    if (!classDate || !startTime || !endTime || hours <= 0) {
      setError("Revisa fecha, hora de inicio y hora de fin.");
      return;
    }

    const result = await onSave({
      title: title.trim(),
      professorId,
      classDate,
      startTime,
      endTime,
      hours,
      classStatus,
      notes: notes.trim()
    });

    if (result) {
      setError(result);
    }
  }

  return (
    <form className="class-edit-panel stacked-form" onSubmit={submit}>
      <div className="class-edit-panel-header">
        <div>
          <h3>Editar clase</h3>
          <p className="subtle">Actualiza fecha, horario, profesor, estado y notas.</p>
        </div>
        <Button isIconOnly aria-label="Cerrar editor" className="edit-button" isDisabled={isPending} variant="outline" onPress={onCancel}>
          <X size={15} aria-hidden="true" />
        </Button>
      </div>
      <label>
        Titulo
        <Input value={title} disabled={isPending} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="form-grid two">
        <label>
          Fecha
          <AppDatePicker ariaLabel="Fecha de la clase" onChange={setClassDate} required value={classDate} />
        </label>
        <label>
          Horas totales
          <Input value={formatHours(hours)} readOnly />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Hora inicio
          <AppTimeField ariaLabel="Hora inicio" onChange={setStartTime} required value={startTime} />
        </label>
        <label>
          Hora fin
          <AppTimeField ariaLabel="Hora fin" onChange={setEndTime} required value={endTime} />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Profesor
          <AppSelect ariaLabel="Profesor" isDisabled={isPending} onChange={setProfessorId} options={professorOptions} value={professorId} />
        </label>
        <label>
          Estado clase
          <AppSelect
            ariaLabel="Estado clase"
            isDisabled={isPending}
            onChange={(value) => setClassStatus(value as ClassStatus)}
            options={statusOptions}
            value={classStatus}
          />
        </label>
      </div>
      <label>
        Notas
        <TextArea value={notes} disabled={isPending} placeholder="Contenido o foco de la clase" onChange={(event) => setNotes(event.target.value)} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        <Button type="button" className="secondary-button" isDisabled={isPending} onPress={onCancel}>
          Cancelar
        </Button>
        <Button className="brand-button" type="submit" isDisabled={isPending}>
          <Check size={18} aria-hidden="true" />
          {isPending ? "Guardando..." : "Guardar clase"}
        </Button>
      </div>
    </form>
  );
}
