"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, TextArea } from "@heroui/react";
import { MessageSquare } from "lucide-react";
import { AppSelect } from "@/components/app-controls";
import { proposalResponsibles } from "@/lib/types";

type CommentDisclosureProps = {
  proposalId: string;
};

export function CommentDisclosure({ proposalId }: CommentDisclosureProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>(proposalResponsibles[0]);
  const [category, setCategory] = useState("GENERAL");

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
              <AppSelect
                ariaLabel="Autor"
                name="authorName"
                onChange={setAuthorName}
                options={proposalResponsibles.map((responsible) => ({ key: responsible, label: responsible }))}
                value={authorName}
              />
            </label>
            <label>
              Categoria
              <AppSelect
                ariaLabel="Categoria"
                name="category"
                onChange={setCategory}
                options={[
                  { key: "GENERAL", label: "General" },
                  { key: "CONTENT", label: "Contenido" },
                  { key: "BUDGET", label: "Presupuesto" }
                ]}
                value={category}
              />
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
