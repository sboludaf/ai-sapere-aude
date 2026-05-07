"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, TextArea } from "@heroui/react";
import { MessageSquare } from "lucide-react";
import { proposalResponsibles } from "@/lib/types";

type CommentDisclosureProps = {
  proposalId: string;
};

export function CommentDisclosure({ proposalId }: CommentDisclosureProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch(`/api/proposals/${proposalId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        authorName: String(formData.get("authorName") ?? ""),
        category: String(formData.get("category") ?? ""),
        body: String(formData.get("body") ?? "")
      })
    });

    if (!response.ok) {
      setError("No se pudo anadir el comentario.");
      return;
    }

    form.reset();
    startTransition(() => {
      setIsOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="disclosure">
      <Button className="brand-button" onPress={() => setIsOpen((current) => !current)}>
        <MessageSquare size={18} aria-hidden="true" />
        Anadir comentario
      </Button>
      {isOpen ? (
        <form className="disclosure-panel stacked-form" onSubmit={submit}>
          <div className="form-grid two">
            <label>
              Autor
              <select name="authorName" defaultValue={proposalResponsibles[0]}>
                {proposalResponsibles.map((responsible) => (
                  <option key={responsible} value={responsible}>
                    {responsible}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Categoria
              <select name="category" defaultValue="GENERAL">
                <option value="GENERAL">General</option>
                <option value="CONTENT">Contenido</option>
                <option value="BUDGET">Presupuesto</option>
              </select>
            </label>
          </div>
          <label>
            Comentario
            <TextArea name="body" placeholder="Ajuste, decision o pendiente" required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <Button className="brand-button" type="submit" isDisabled={isPending}>
            <MessageSquare size={18} aria-hidden="true" />
            {isPending ? "Guardando..." : "Guardar comentario"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
