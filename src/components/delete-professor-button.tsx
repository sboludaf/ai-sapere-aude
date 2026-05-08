"use client";

import { Button } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { deleteProfessorAction } from "@/app/actions";

type DeleteProfessorButtonProps = {
  label: string;
  professorId: string;
};

export function DeleteProfessorButton({ label, professorId }: DeleteProfessorButtonProps) {
  return (
    <form action={deleteProfessorAction}>
      <input type="hidden" name="professorId" value={professorId} />
      <Button isIconOnly type="submit" className="delete-professor-button" aria-label={label}>
        <Trash2 size={15} aria-hidden="true" />
      </Button>
    </form>
  );
}
