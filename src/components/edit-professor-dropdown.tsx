"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@heroui/react";
import { Pencil, Save } from "lucide-react";
import { updateProfessorAction } from "@/app/actions";
import type { Professor } from "@/lib/types";

type Props = { professor: Professor };

export function EditProfessorDropdown({ professor }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      await updateProfessorAction(formData);
      setIsOpen(false);
    });
  }

  return (
    <div className="dropdown-wrapper edit-professor-wrapper">
      <button
        type="button"
        className="delete-professor-button"
        aria-label="Editar profesor"
        title="Editar profesor"
        onClick={() => setIsOpen((c) => !c)}
      >
        <Pencil size={13} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="dropdown-panel professor-dropdown-panel">
          <form className="stacked-form" action={submit}>
            <input type="hidden" name="professorId" value={professor.id} />
            <div className="form-grid two">
              <label>
                Nombre
                <Input name="firstName" defaultValue={professor.firstName} required />
              </label>
              <label>
                Apellidos
                <Input name="lastName" defaultValue={professor.lastName} required />
              </label>
            </div>
            <label>
              Correo
              <Input name="email" type="email" defaultValue={professor.email} required />
            </label>
            <div className="form-grid two">
              <label>
                Telefono
                <Input name="phone" type="tel" defaultValue={professor.phone ?? ""} placeholder="+34 600 000 000" />
              </label>
              <label>
                LinkedIn
                <Input name="linkedin" type="url" defaultValue={professor.linkedin ?? ""} placeholder="https://linkedin.com/in/..." />
              </label>
            </div>
            <div className="form-actions">
              <Button type="button" className="secondary-button" onPress={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="brand-button" isDisabled={isPending}>
                <Save size={16} aria-hidden="true" />
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
