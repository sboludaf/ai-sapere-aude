"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { formatClassStatus } from "@/lib/format";
import { classStatuses, type ClassStatus, type Professor } from "@/lib/types";

type ClassManagementFormProps = {
  proposalId: string;
  classId: string;
  professorId?: string | null;
  classStatus: ClassStatus;
  professors: Professor[];
};

export function ClassManagementForm({
  proposalId,
  classId,
  professorId,
  classStatus,
  professors
}: ClassManagementFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const response = await fetch(`/api/proposals/${proposalId}/classes/${classId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        professorId: String(formData.get("professorId") ?? ""),
        classStatus: String(formData.get("classStatus") ?? "")
      })
    });

    if (response.ok) {
      startTransition(() => router.refresh());
    }
  }

  return (
    <form className="row-grid class-management-row" onSubmit={submit}>
      <label>
        Profesor
        <select name="professorId" defaultValue={professorId ?? ""}>
          <option value="">Pendiente de asignar profesor</option>
          {professors.map((professor) => (
            <option key={professor.id} value={professor.id}>
              {professor.firstName} {professor.lastName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Estado profesor/clase
        <select name="classStatus" defaultValue={classStatus}>
          {classStatuses.map((status) => (
            <option key={status} value={status}>
              {formatClassStatus(status)}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline" className="secondary-button" isDisabled={isPending}>
        {isPending ? "Guardando..." : "Guardar clase"}
      </Button>
    </form>
  );
}
