"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, TextArea } from "@heroui/react";
import { Save } from "lucide-react";
import { AppSelect } from "@/components/app-controls";
import { formatStatus } from "@/lib/format";
import { proposalResponsibles, proposalStatuses, type ProposalStatus } from "@/lib/types";

type StatusUpdateDisclosureProps = {
  proposalId: string;
  currentStatus: ProposalStatus;
};

export function StatusUpdateDisclosure({ proposalId, currentStatus }: StatusUpdateDisclosureProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toStatus, setToStatus] = useState<ProposalStatus>(currentStatus);
  const [changedBy, setChangedBy] = useState<string>(proposalResponsibles[0]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/proposals/${proposalId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        toStatus: String(formData.get("toStatus") ?? ""),
        changedBy: String(formData.get("changedBy") ?? ""),
        note: String(formData.get("note") ?? "")
      })
    });

    if (!response.ok) {
      setError("No se pudo actualizar el estado.");
      return;
    }

    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="disclosure">
      <Button className="brand-button" onPress={() => setIsOpen((current) => !current)}>
        <Save size={18} aria-hidden="true" />
        Cambiar estado
      </Button>
      {isOpen ? (
        <form className="disclosure-panel stacked-form" onSubmit={submit}>
          <label>
            Nuevo estado
            <AppSelect
              ariaLabel="Nuevo estado"
              name="toStatus"
              onChange={(value) => setToStatus(value as ProposalStatus)}
              options={proposalStatuses.map((status) => ({ key: status, label: formatStatus(status) }))}
              value={toStatus}
            />
          </label>
          <label>
            Responsable
            <AppSelect
              ariaLabel="Responsable"
              name="changedBy"
              onChange={setChangedBy}
              options={proposalResponsibles.map((responsible) => ({ key: responsible, label: responsible }))}
              value={changedBy}
            />
          </label>
          <label>
            Nota
            <TextArea name="note" placeholder="Cambio, motivo o ajuste" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <Button className="brand-button" type="submit" isDisabled={isPending}>
            <Save size={18} aria-hidden="true" />
            {isPending ? "Guardando..." : "Guardar estado"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
