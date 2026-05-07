import { z } from "zod";
import { classStatuses, proposalResponsibles, proposalStatuses } from "@/lib/types";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const budgetItemSchema = z.object({
  serviceName: z.string().trim().min(1, "Servicio obligatorio"),
  description: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  quantity: z.coerce.number().positive("El tiempo o las unidades deben ser mayores que cero"),
  persons: z.coerce.number().positive("Las personas deben ser mayores que cero").default(1),
  unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo")
});

const proposalClassSchema = z.object({
  title: z.string().trim().min(1, "Titulo de clase obligatorio"),
  professorId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  professorName: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  classDate: z.string().trim().min(1, "Fecha obligatoria"),
  startTime: z.string().trim().min(1, "Hora inicio obligatoria"),
  endTime: z.string().trim().min(1, "Hora fin obligatoria"),
  hours: z.coerce.number().positive("Horas obligatorias"),
  classStatus: z.enum(classStatuses).default("SEARCHING_PROFESSOR"),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional())
});

export const createProposalSchema = z.object({
  title: z.string().trim().min(1, "Titulo obligatorio"),
  companyName: z.string().trim().min(1, "Empresa obligatoria"),
  presentationUrl: z.string().trim().url("URL de presentacion no valida"),
  currency: z.string().trim().length(3).default("EUR"),
  budgetItems: z.array(budgetItemSchema).min(1, "Anade al menos un servicio"),
  classes: z.array(proposalClassSchema).min(1, "Anade al menos una clase")
});

export const updateStatusSchema = z.object({
  proposalId: z.string().uuid(),
  toStatus: z.enum(proposalStatuses),
  changedBy: z.enum(proposalResponsibles),
  note: z.preprocess(emptyToUndefined, z.string().trim().optional())
});

export const addCommentSchema = z.object({
  proposalId: z.string().uuid(),
  authorName: z.enum(proposalResponsibles),
  category: z.enum(["GENERAL", "CONTENT", "BUDGET"]),
  body: z.string().trim().min(1, "Comentario obligatorio")
});

export const updateBudgetSchema = z.object({
  proposalId: z.string().uuid(),
  reason: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  createdBy: z.enum(proposalResponsibles),
  currency: z.string().trim().length(3).default("EUR"),
  items: z.array(budgetItemSchema).min(1, "Anade al menos un servicio")
});

export const createProfessorSchema = z.object({
  firstName: z.string().trim().min(1, "Nombre obligatorio"),
  lastName: z.string().trim().min(1, "Apellidos obligatorios"),
  email: z.string().trim().email("Correo no valido"),
  phone: z.preprocess(emptyToUndefined, z.string().trim().optional())
});

export const updateProposalClassSchema = z.object({
  proposalId: z.string().uuid(),
  classId: z.string().uuid(),
  professorId: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  classStatus: z.enum(classStatuses)
});

export const createProposalClassSchema = z.object({
  proposalId: z.string().uuid(),
  title: z.string().trim().min(1, "Titulo de clase obligatorio"),
  classDate: z.string().trim().min(1, "Fecha obligatoria"),
  startTime: z.string().trim().min(1, "Hora inicio obligatoria"),
  endTime: z.string().trim().min(1, "Hora fin obligatoria"),
  hours: z.coerce.number().positive("Horas obligatorias").optional(),
  notes: z.preprocess(emptyToUndefined, z.string().trim().optional())
});
