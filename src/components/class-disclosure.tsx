"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, TextArea } from "@heroui/react";
import { Plus } from "lucide-react";
import { AppDatePicker, AppTimeField } from "@/components/app-controls";
import { formatHours } from "@/lib/format";

type ClassDisclosureProps = {
  proposalId: string;
};

function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  return Number((Math.max(end - start, 0) / 60).toFixed(2));
}

export function ClassDisclosure({ proposalId }: ClassDisclosureProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [classDate, setClassDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const hours = useMemo(() => calculateHours(startTime, endTime), [startTime, endTime]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!classDate) {
      setError("Selecciona la fecha de la clase.");
      return;
    }

    const response = await fetch(`/api/proposals/${proposalId}/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: String(formData.get("title") ?? ""),
        classDate,
        startTime,
        endTime,
        hours,
        notes: String(formData.get("notes") ?? "")
      })
    });

    if (!response.ok) {
      setError("No se pudo anadir la clase.");
      return;
    }

    form.reset();
    setClassDate("");
    setStartTime("09:00");
    setEndTime("13:00");
    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="disclosure class-disclosure">
      <Button className="brand-button" onPress={() => setIsOpen((current) => !current)}>
        <Plus size={18} aria-hidden="true" />
        <span className="class-add-label">Anadir clase</span>
      </Button>
      {isOpen ? (
        <form className="disclosure-panel stacked-form" onSubmit={submit}>
          <label>
            Titulo
            <Input name="title" placeholder="Clase 1: fundamentos IA" required />
          </label>
          <div className="form-grid two">
            <label>
              Fecha
              <AppDatePicker ariaLabel="Fecha de la clase" onChange={setClassDate} required value={classDate} />
            </label>
            <label>
              Sumatorio de horas
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
          <label>
            Notas
            <TextArea name="notes" placeholder="Contenido o foco de la clase" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <Button className="brand-button" type="submit" isDisabled={isPending}>
            <Plus size={18} aria-hidden="true" />
            {isPending ? "Guardando..." : "Guardar clase"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
