"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, TextArea } from "@heroui/react";
import { CalendarDays, Plus, Send, Trash2, WalletCards } from "lucide-react";
import { AppDatePicker, AppNumberField, AppSelect, AppTimeField } from "@/components/app-controls";
import { formatCurrency, formatHours } from "@/lib/format";
import type { Professor } from "@/lib/types";

type BudgetItemDraft = {
  serviceName: string;
  description: string;
  quantity: number;
  persons: number;
  unitPrice: number;
};

type ClassDraft = {
  title: string;
  professorId?: string;
  professorName?: string;
  classDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes: string;
};

type ProposalFormProps = {
  professors: Professor[];
  onSuccess?: () => void;
};

const emptyBudgetItem: BudgetItemDraft = {
  serviceName: "",
  description: "",
  quantity: 1,
  persons: 1,
  unitPrice: 0
};

const emptyClass: ClassDraft = {
  title: "",
  classDate: "",
  startTime: "09:00",
  endTime: "13:00",
  hours: 4,
  notes: ""
};

const unassignedProfessorKey = "__unassigned";

function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  return Number((Math.max(end - start, 0) / 60).toFixed(2));
}

export function ProposalForm({ professors, onSuccess }: ProposalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItemDraft[]>([{ ...emptyBudgetItem }]);
  const [classes, setClasses] = useState<ClassDraft[]>([{ ...emptyClass }]);

  const total = useMemo(
    () => budgetItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.persons || 0) * Number(item.unitPrice || 0), 0),
    [budgetItems]
  );
  const professorOptions = useMemo(
    () => [
      { key: unassignedProfessorKey, label: "Pendiente de asignar profesor" },
      ...professors.map((professor) => ({ key: professor.id, label: `${professor.firstName} ${professor.lastName}` }))
    ],
    [professors]
  );

  function updateBudgetItem(index: number, patch: Partial<BudgetItemDraft>) {
    setBudgetItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function updateClass(index: number, patch: Partial<ClassDraft>) {
    setClasses((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        const next = { ...item, ...patch };

        if (patch.startTime || patch.endTime) {
          next.hours = calculateHours(next.startTime, next.endTime);
        }

        return next;
      })
    );
  }

  async function submitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      presentationUrl: String(formData.get("presentationUrl") ?? ""),
      currency: String(formData.get("currency") ?? "EUR"),
      budgetItems: budgetItems.filter((item) => item.serviceName),
      classes: classes
        .filter((classItem) => classItem.classDate && classItem.startTime && classItem.endTime)
        .map((classItem) => ({
          ...classItem,
          classStatus: classItem.professorId ? "PENDING_CONFIRMATION" : "SEARCHING_PROFESSOR"
        }))
    };

    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setError("No se pudo crear la propuesta. Revisa los campos obligatorios.");
      return;
    }

    const result = (await response.json()) as { id: string };
    startTransition(() => {
      onSuccess?.();
      router.push(`/proposals/${result.id}`);
    });
  }

  return (
    <form className="proposal-form" onSubmit={submitProposal}>
      <div className="form-grid two">
        <label>
          Titulo
          <Input name="title" placeholder="Programa IA para direccion" required />
        </label>
        <label>
          Empresa
          <Input name="companyName" placeholder="Empresa cliente" required />
        </label>
        <label>
          URL presentacion
          <Input name="presentationUrl" placeholder="https://..." type="url" required />
        </label>
        <label>
          Moneda
          <Input name="currency" defaultValue="EUR" maxLength={3} required />
        </label>
      </div>

      <section className="form-section">
        <div className="section-heading">
          <span>
            <WalletCards size={18} aria-hidden="true" />
            Presupuesto
          </span>
          <strong>{formatCurrency(total, "EUR")}</strong>
          <Button type="button" variant="outline" className="secondary-button" onPress={() => setBudgetItems((items) => [...items, { ...emptyBudgetItem }])}>
            <Plus size={16} aria-hidden="true" />
            Servicio
          </Button>
        </div>
        <div className="helper-grid budget-helper">
          <span>Servicio</span>
          <span>Descripcion</span>
          <span>Tiempo / unidades</span>
          <span>Personas</span>
          <span>Precio unitario</span>
          <span />
        </div>
        {budgetItems.map((item, index) => (
          <div className="row-grid budget-row" key={`budget-${index}`}>
            <Input
              aria-label="Servicio"
              placeholder="Servicio"
              value={item.serviceName}
              onChange={(event) => updateBudgetItem(index, { serviceName: event.target.value })}
            />
            <Input
              aria-label="Descripcion"
              placeholder="Descripcion"
              value={item.description}
              onChange={(event) => updateBudgetItem(index, { description: event.target.value })}
            />
            <AppNumberField
              ariaLabel="Tiempo o unidades"
              minValue={0}
              step={0.5}
              value={item.quantity}
              onChange={(value) => updateBudgetItem(index, { quantity: value })}
            />
            <AppNumberField
              ariaLabel="Personas"
              minValue={0}
              step={1}
              value={item.persons}
              onChange={(value) => updateBudgetItem(index, { persons: value })}
            />
            <AppNumberField
              ariaLabel="Precio unitario"
              minValue={0}
              step={50}
              value={item.unitPrice}
              onChange={(value) => updateBudgetItem(index, { unitPrice: value })}
            />
            <Button
              type="button"
              isIconOnly
              variant="outline"
              className="icon-only"
              onPress={() => setBudgetItems((items) => (items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index)))}
              aria-label="Quitar servicio"
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </div>
        ))}
      </section>

      <section className="form-section">
        <div className="section-heading">
          <span>
            <CalendarDays size={18} aria-hidden="true" />
            Clases
          </span>
          <Button type="button" variant="outline" className="secondary-button" onPress={() => setClasses((items) => [...items, { ...emptyClass }])}>
            <Plus size={16} aria-hidden="true" />
            Clase
          </Button>
        </div>
        {classes.map((classItem, index) => (
          <div className="class-editor" key={`class-${index}`}>
            <div className="row-grid class-row">
              <label>
                Titulo
                <Input
                  placeholder="Clase 1: fundamentos IA"
                  value={classItem.title}
                  onChange={(event) => updateClass(index, { title: event.target.value })}
                  required
                />
              </label>
              <label>
                Fecha
                <AppDatePicker ariaLabel="Fecha de la clase" onChange={(value) => updateClass(index, { classDate: value })} required value={classItem.classDate} />
              </label>
              <label>
                Hora inicio
                <AppTimeField ariaLabel="Hora inicio" onChange={(value) => updateClass(index, { startTime: value })} required value={classItem.startTime} />
              </label>
              <label>
                Hora fin
                <AppTimeField ariaLabel="Hora fin" onChange={(value) => updateClass(index, { endTime: value })} required value={classItem.endTime} />
              </label>
              <label>
                Horas
                <Input value={formatHours(classItem.hours)} readOnly />
              </label>
            </div>
            <div className="row-grid class-row secondary">
              <label>
                Profesor
                <AppSelect
                  ariaLabel="Profesor"
                  onChange={(value) => {
                    const professorId = value === unassignedProfessorKey ? "" : value;
                    const professor = professors.find((item) => item.id === professorId);
                    updateClass(index, {
                      professorId: professor?.id,
                      professorName: professor ? `${professor.firstName} ${professor.lastName}` : undefined
                    });
                  }}
                  options={professorOptions}
                  value={classItem.professorId ?? unassignedProfessorKey}
                />
              </label>
              <label>
                Notas
                <TextArea
                  value={classItem.notes}
                  onChange={(event) => updateClass(index, { notes: event.target.value })}
                  placeholder="Contenido o foco de la clase"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                className="secondary-button"
                onPress={() => setClasses((items) => (items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index)))}
              >
                <Trash2 size={16} aria-hidden="true" />
                Quitar clase
              </Button>
            </div>
          </div>
        ))}
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <Button type="submit" isDisabled={isPending} className="brand-button">
          <Send size={18} aria-hidden="true" />
          {isPending ? "Creando..." : "Crear propuesta"}
        </Button>
      </div>
    </form>
  );
}
