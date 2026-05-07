"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, useOverlayState } from "@heroui/react";
import { UserPlus } from "lucide-react";

export function NewProfessorModal() {
  const router = useRouter();
  const state = useOverlayState();
  const [isPending, startTransition] = useTransition();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/professors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? "")
      })
    });

    if (response.ok) {
      form.reset();
      startTransition(() => {
        state.close();
        router.refresh();
      });
    }
  }

  return (
    <>
      <Button className="brand-button" onPress={state.open}>
        <UserPlus size={18} aria-hidden="true" />
        Nuevo profesor
      </Button>
      <Modal state={state}>
        <Modal.Backdrop>
          <Modal.Container size="lg" placement="center">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Nuevo profesor</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <form className="stacked-form" onSubmit={submit}>
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
                  <div className="form-actions">
                    <Button type="submit" className="brand-button" isDisabled={isPending}>
                      <UserPlus size={18} aria-hidden="true" />
                      {isPending ? "Guardando..." : "Guardar profesor"}
                    </Button>
                  </div>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
