"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addProposalComment,
  createProfessor,
  updateProposalClass,
  updateProposalBudget,
  updateProposalStatus
} from "@/lib/repositories/proposals";
import type { BudgetCategory, ClassStatus, ProposalStatus } from "@/lib/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseBudgetItems(formData: FormData) {
  const serviceNames = formData.getAll("serviceName").map(String);
  const descriptions = formData.getAll("description").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const persons = formData.getAll("persons").map(String);
  const unitPrices = formData.getAll("unitPrice").map(String);

  return serviceNames
    .map((serviceName, index) => ({
      serviceName,
      description: descriptions[index],
      quantity: Number(quantities[index] || 1),
      persons: Number(persons[index] || 1),
      unitPrice: Number(unitPrices[index] || 0)
    }))
    .filter((item) => item.serviceName.trim());
}

export async function addCommentAction(formData: FormData) {
  const proposalId = value(formData, "proposalId");

  await addProposalComment({
    proposalId,
    authorName: value(formData, "authorName"),
    category: value(formData, "category") as BudgetCategory,
    body: value(formData, "body")
  });

  revalidatePath(`/proposals/${proposalId}`);
}

export async function updateStatusAction(formData: FormData) {
  const proposalId = value(formData, "proposalId");

  await updateProposalStatus({
    proposalId,
    toStatus: value(formData, "toStatus") as ProposalStatus,
    changedBy: value(formData, "changedBy"),
    note: value(formData, "note")
  });

  revalidatePath("/");
  revalidatePath(`/proposals/${proposalId}`);
}

export async function updateClassAction(formData: FormData) {
  const proposalId = value(formData, "proposalId");

  await updateProposalClass({
    proposalId,
    classId: value(formData, "classId"),
    professorId: value(formData, "professorId"),
    classStatus: value(formData, "classStatus") as ClassStatus
  });

  revalidatePath(`/proposals/${proposalId}`);
}

export async function updateBudgetAction(formData: FormData) {
  const proposalId = value(formData, "proposalId");

  await updateProposalBudget({
    proposalId,
    reason: value(formData, "reason"),
    createdBy: value(formData, "createdBy"),
    currency: value(formData, "currency") || "EUR",
    items: parseBudgetItems(formData)
  });

  revalidatePath("/");
  revalidatePath(`/proposals/${proposalId}`);
}

export async function createProfessorAction(formData: FormData) {
  await createProfessor({
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    email: value(formData, "email")
  });

  revalidatePath("/professors");
  redirect("/professors");
}
