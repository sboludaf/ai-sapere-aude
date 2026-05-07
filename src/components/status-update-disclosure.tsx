"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, TextArea } from "@heroui/react";
import { Save } from "lucide-react";
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
            <select name="toStatus" defaultValue={currentStatus}>
              {proposalStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Responsable
            <select name="changedBy" defaultValue={proposalResponsibles[0]}>
              {proposalResponsibles.map((responsible) => (
                <option key={responsible} value={responsible}>
                  {responsible}
                </option>
              ))}
            </select>
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
