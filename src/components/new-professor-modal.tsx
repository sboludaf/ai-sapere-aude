"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@heroui/react";
import { ChevronDown, UserPlus } from "lucide-react";
import { createProfessorAction } from "@/app/actions";

export function NewProfessorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      await createProfessorAction(formData);
      setIsOpen(false);
    });
  }

  return (
    <div className="dropdown-wrapper">
      <Button className="brand-button" onPress={() => setIsOpen((current) => !current)}>
        <UserPlus size={18} aria-hidden="true" />
        Nuevo profesor
        <ChevronDown className={isOpen ? "dropdown-trigger-icon open" : "dropdown-trigger-icon"} size={16} aria-hidden="true" />
      </Button>
      {isOpen ? (
        <div className="dropdown-panel professor-dropdown-panel">
          <form className="stacked-form" action={submit}>
            <div className="form-grid two">
              <label>
                Nombre
                <Input name="firstName" required />
              </label>
              <label>
                Apellidos
                <Input name="lastName" required />
              </label>
            </div>
            <label>
              Correo
              <Input name="email" type="email" required />
            </label>
            <div className="form-grid two">
              <label>
                Telefono
                <Input name="phone" type="tel" placeholder="+34 600 000 000" />
              </label>
              <label>
                LinkedIn
                <Input name="linkedin" type="url" placeholder="https://linkedin.com/in/..." />
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" className="brand-button" isDisabled={isPending}>
                <UserPlus size={18} aria-hidden="true" />
                {isPending ? "Guardando..." : "Guardar profesor"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
