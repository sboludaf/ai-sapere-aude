"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { Plus, Save, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { proposalResponsibles } from "@/lib/types";
import type { BudgetItem } from "@/lib/types";

type BudgetUpdateFormProps = {
  proposalId: string;
  currency: string;
  latestItems: BudgetItem[];
  onSaved?: () => void;
};

type BudgetDraft = {
  serviceName: string;
  description: string;
  quantity: number;
  persons: number;
  unitPrice: number;
};

const emptyItem: BudgetDraft = {
  serviceName: "",
  description: "",
  quantity: 1,
  persons: 1,
  unitPrice: 0
};

export function BudgetUpdateForm({ proposalId, currency, latestItems, onSaved }: BudgetUpdateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BudgetDraft[]>(
    latestItems.length
      ? latestItems.map((item) => ({
          serviceName: item.serviceName,
          description: item.description ?? "",
          quantity: item.quantity,
          persons: item.persons ?? 1,
          unitPrice: item.unitPrice
        }))
      : [{ ...emptyItem }]
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.persons || 0) * Number(item.unitPrice || 0), 0),
    [items]
  );

  function updateItem(index: number, patch: Partial<BudgetDraft>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/proposals/${proposalId}/budget`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reason: String(formData.get("reason") ?? ""),
        createdBy: String(formData.get("createdBy") ?? ""),
        currency,
        items: items.filter((item) => item.serviceName)
      })
    });

    if (!response.ok) {
      setError("No se pudo guardar la nueva version de presupuesto.");
      return;
    }

    startTransition(() => {
      onSaved?.();
      router.refresh();
    });
  }

  return (
    <form className="stacked-form" onSubmit={submit}>
      <div className="form-grid two">
        <label>
          Motivo
          <Input name="reason" placeholder="Ajuste de alcance" />
        </label>
        <label>
          Responsable
          <select name="createdBy" defaultValue={proposalResponsibles[0]}>
            {proposalResponsibles.map((responsible) => (
              <option key={responsible} value={responsible}>
                {responsible}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="section-heading compact">
        <strong>{formatCurrency(total, currency)}</strong>
        <Button type="button" variant="outline" className="secondary-button" onPress={() => setItems((current) => [...current, { ...emptyItem }])}>
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

      {items.map((item, index) => (
        <div className="row-grid budget-row" key={`budget-update-${index}`}>
          <Input
            aria-label="Servicio"
            placeholder="Servicio"
            value={item.serviceName}
            onChange={(event) => updateItem(index, { serviceName: event.target.value })}
          />
          <Input
            aria-label="Descripcion"
            placeholder="Descripcion"
            value={item.description}
            onChange={(event) => updateItem(index, { description: event.target.value })}
          />
          <Input
            aria-label="Tiempo o unidades"
            min="0"
            step="0.5"
            type="number"
            value={String(item.quantity)}
            onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
          />
          <Input
            aria-label="Personas"
            min="0"
            step="1"
            type="number"
            value={String(item.persons)}
            onChange={(event) => updateItem(index, { persons: Number(event.target.value) })}
          />
          <Input
            aria-label="Precio unitario"
            min="0"
            step="50"
            type="number"
            value={String(item.unitPrice)}
            onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
          />
          <Button
            type="button"
            isIconOnly
            variant="outline"
            className="icon-only"
            onPress={() => setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)))}
            aria-label="Quitar servicio"
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      ))}

      {error ? <p className="form-error">{error}</p> : null}

      <Button className="brand-button" type="submit" isDisabled={isPending}>
        <Save size={18} aria-hidden="true" />
        {isPending ? "Guardando..." : "Guardar version"}
      </Button>
    </form>
  );
}
