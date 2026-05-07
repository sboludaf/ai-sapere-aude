"use client";

import { useState, useTransition } from "react";
import { ChevronDown, UserPlus } from "lucide-react";
import { createProfessorAction } from "@/app/actions";

export function AddProfessorDropdown() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createProfessorAction(formData);
      setOpen(false);
    });
  }

  return (
    <div className="dropdown-wrapper">
      <button
        type="button"
        className="brand-button"
        onClick={() => setOpen(!open)}
      >
        <UserPlus size={18} aria-hidden="true" />
        Nuevo profesor
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown-panel">
          <form className="dropdown-form" action={handleSubmit}>
            <div className="dropdown-form-grid">
              <label>
                Nombre
                <input name="firstName" required placeholder="Nombre" />
              </label>
              <label>
                Apellidos
                <input name="lastName" required placeholder="Apellidos" />
              </label>
            </div>
            <label>
              Correo
              <input name="email" type="email" required placeholder="correo@ejemplo.com" />
            </label>
            <label>
              Telefono
              <input name="phone" type="tel" placeholder="+34 600 000 000" />
            </label>
            <div className="dropdown-form-actions">
              <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="brand-button" disabled={isPending}>
                <UserPlus size={16} aria-hidden="true" />
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
