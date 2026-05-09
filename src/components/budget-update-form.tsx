"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { AppNumberField, AppSelect } from "@/components/app-controls";
import { formatCurrency } from "@/lib/format";
import { proposalResponsibles } from "@/lib/types";
import type { BudgetItem } from "@/lib/types";

type BudgetUpdateFormProps = {
  proposalId: string;
  currency: string;
  latestItems: BudgetItem[];
  onCancel?: () => void;
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

export function BudgetUpdateForm({ proposalId, currency, latestItems, onCancel, onSaved }: BudgetUpdateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState<string>(proposalResponsibles[0]);
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
    <form className="stacked-form budget-update-form" onSubmit={submit}>
      <div className="budget-update-form-header">
        <div>
          <h3>Modificar presupuesto</h3>
          <p className="subtle">Parte de la version actual.</p>
        </div>
        {onCancel ? (
          <Button type="button" isIconOnly aria-label="Cerrar edicion de presupuesto" className="edit-button" variant="outline" onPress={onCancel}>
            <X size={15} aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="form-grid two compact-fields">
        <label>
          Motivo
          <Input name="reason" placeholder="Ajuste de alcance" />
        </label>
        <label>
          Responsable
          <AppSelect
            ariaLabel="Responsable"
            name="createdBy"
            onChange={setCreatedBy}
            options={proposalResponsibles.map((responsible) => ({ key: responsible, label: responsible }))}
            value={createdBy}
          />
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
          <label className="budget-field">
            <span className="budget-field-label">Servicio</span>
            <Input
              aria-label="Servicio"
              placeholder="Servicio"
              value={item.serviceName}
              onChange={(event) => updateItem(index, { serviceName: event.target.value })}
            />
          </label>
          <label className="budget-field">
            <span className="budget-field-label">Descripcion</span>
            <Input
              aria-label="Descripcion"
              placeholder="Descripcion"
              value={item.description}
              onChange={(event) => updateItem(index, { description: event.target.value })}
            />
          </label>
          <label className="budget-field">
            <span className="budget-field-label">Tiempo / unidades</span>
            <AppNumberField
              ariaLabel="Tiempo o unidades"
              minValue={0}
              step={0.5}
              value={item.quantity}
              onChange={(value) => updateItem(index, { quantity: value })}
            />
          </label>
          <label className="budget-field">
            <span className="budget-field-label">Personas</span>
            <AppNumberField
              ariaLabel="Personas"
              minValue={0}
              step={1}
              value={item.persons}
              onChange={(value) => updateItem(index, { persons: value })}
            />
          </label>
          <label className="budget-field">
            <span className="budget-field-label">Precio unitario</span>
            <AppNumberField
              ariaLabel="Precio unitario"
              minValue={0}
              step={0.5}
              value={item.unitPrice}
              onChange={(value) => updateItem(index, { unitPrice: value })}
            />
          </label>
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
