export const proposalStatuses = ["PENDING", "APPROVED", "REJECTED", "DELIVERED", "PAID"] as const;

export type ProposalStatus = (typeof proposalStatuses)[number];

export const classStatuses = [
  "SEARCHING_PROFESSOR",
  "PENDING_CONFIRMATION",
  "PENDING_PRESENTATION_REVIEW",
  "PRESENTATION_OK"
] as const;

export type ClassStatus = (typeof classStatuses)[number];

export const proposalResponsibles = ["Sergio Boluda Fernandes", "Adrian Bertol Pinilla"] as const;

export type ProposalResponsible = (typeof proposalResponsibles)[number];

export type BudgetCategory = "GENERAL" | "CONTENT" | "BUDGET";

export type BudgetItem = {
  id?: string;
  serviceName: string;
  description?: string;
  quantity: number;
  persons: number;
  unitPrice: number;
  subtotal: number;
};

export type BudgetVersion = {
  id: string;
  versionNumber: number;
  totalCost: number;
  currency: string;
  reason?: string | null;
  createdBy?: string | null;
  createdAt: string;
  items: BudgetItem[];
};

export type Professor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  linkedin?: string | null;
  active: boolean;
  createdAt: string;
};

export type ProposalClass = {
  id?: string;
  title: string;
  professorId?: string | null;
  professorName?: string | null;
  classDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  classStatus: ClassStatus;
  notes?: string | null;
};

export type ProposalSummary = {
  id: string;
  title: string;
  companyName: string;
  consultationType: string;
  presentationUrl: string;
  status: ProposalStatus;
  totalCost: number;
  currency: string;
  startDate?: string | null;
  endDate?: string | null;
  commentCount: number;
  classCount: number;
  pendingClassCount: number;
  updatedAt: string;
};

export type ProposalComment = {
  id: string;
  authorName: string;
  category: BudgetCategory;
  body: string;
  createdAt: string;
};

export type ProposalStatusHistoryItem = {
  id: string;
  fromStatus?: ProposalStatus | null;
  toStatus: ProposalStatus;
  note?: string | null;
  changedBy?: string | null;
  changedAt: string;
};

export type ProposalDetail = ProposalSummary & {
  classes: ProposalClass[];
  comments: ProposalComment[];
  statusHistory: ProposalStatusHistoryItem[];
  budgetVersions: BudgetVersion[];
};

export type CreateProposalInput = {
  title: string;
  companyName: string;
  presentationUrl: string;
  currency: string;
  budgetItems: Omit<BudgetItem, "subtotal">[];
  classes: ProposalClass[];
};

export type UpdateBudgetInput = {
  proposalId: string;
  reason?: string;
  createdBy?: string;
  currency: string;
  items: Omit<BudgetItem, "subtotal">[];
};

export type UpdateProposalClassInput = {
  proposalId: string;
  classId: string;
  title?: string;
  professorId?: string;
  classDate?: string;
  startTime?: string;
  endTime?: string;
  hours?: number;
  classStatus?: ClassStatus;
  notes?: string;
};

export type CreateProposalClassInput = {
  proposalId: string;
  title: string;
  classDate: string;
  startTime: string;
  endTime: string;
  hours?: number;
  notes?: string;
};

export type CalendarEvent = {
  classId: string;
  classTitle: string;
  classDate: string;
  startTime: string;
  endTime: string;
  classStatus: ClassStatus;
  professorName: string | null;
  proposalId: string;
  proposalTitle: string;
};

export type SyncProposalSnapshot = {
  id: string;
  title: string;
  companyName: string;
  consultationType: string;
  status: ProposalStatus;
  totalCost: number;
  currency: string;
  presentationUrl: string;
  professorNames: string[];
  serviceNames: string[];
};
