import type { Professor, ProposalDetail, ProposalSummary } from "@/lib/types";

export const demoProposalId = "a2b9a94a-7996-41d0-875d-5faab1e558fa";

export const demoProposals: ProposalSummary[] = [
  {
    id: demoProposalId,
    title: "Programa ejecutivo IA generativa",
    companyName: "Northwind Iberia",
    consultationType: "Formacion",
    presentationUrl: "https://docs.example.com/presentacion-ai",
    status: "PENDING",
    totalCost: 12500,
    currency: "EUR",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    commentCount: 1,
    classCount: 3,
    pendingClassCount: 0,
    updatedAt: new Date().toISOString()
  }
];

export const demoProposalDetail: ProposalDetail = {
  ...demoProposals[0],
  classes: [
    {
      id: "2a1a56ff-5278-401d-8efb-ef20b0c1d24f",
      title: "Kickoff y estrategia IA",
      professorName: "Laura Medina",
      classDate: "2026-06-10",
      startTime: "09:00",
      endTime: "15:00",
      hours: 6,
      classStatus: "PRESENTATION_OK",
      notes: "Kickoff y estrategia"
    },
    {
      id: "50c191dd-cbce-4471-bcc6-e0ed157e3f42",
      title: "Casos de uso y automatizacion",
      professorName: "Daniel Ramos",
      classDate: "2026-06-11",
      startTime: "09:00",
      endTime: "15:00",
      hours: 6,
      classStatus: "PENDING_PRESENTATION_REVIEW",
      notes: "Casos de uso y automatizacion"
    },
    {
      id: "31cf364a-9c78-450c-a85d-33a0cd5091e0",
      title: "Gobierno y adopcion",
      professorName: null,
      classDate: "2026-06-12",
      startTime: "09:00",
      endTime: "14:00",
      hours: 5,
      classStatus: "SEARCHING_PROFESSOR",
      notes: "Gobierno y adopcion"
    }
  ],
  comments: [
    {
      id: "d44fa154-e0e4-469e-a356-b2899e3f6212",
      authorName: "Sergio Boluda Fernandes",
      category: "BUDGET",
      body: "Revisar si se agrupa el diagnostico con los talleres para facilitar aprobacion interna.",
      createdAt: new Date().toISOString()
    }
  ],
  statusHistory: [
    {
      id: "9b1d7174-1003-42ef-bcd0-b5f7dd780070",
      fromStatus: null,
      toStatus: "PENDING",
      note: "Oferta cargada para aprobacion.",
      changedBy: "Sergio Boluda Fernandes",
      changedAt: new Date().toISOString()
    }
  ],
  budgetVersions: [
    {
      id: "9d9fb49c-4d08-4fd0-99fd-73dc6cd6567b",
      versionNumber: 1,
      totalCost: 12500,
      currency: "EUR",
      reason: "Alta inicial",
      createdBy: "Sergio Boluda Fernandes",
      createdAt: new Date().toISOString(),
      items: [
        {
          serviceName: "Diagnostico de madurez IA",
          description: "Sesiones de descubrimiento y mapa de oportunidades.",
          quantity: 1,
          persons: 1,
          unitPrice: 3500,
          subtotal: 3500
        },
        {
          serviceName: "Talleres ejecutivos",
          description: "Tres jornadas presenciales con materiales.",
          quantity: 3,
          persons: 1,
          unitPrice: 3000,
          subtotal: 9000
        }
      ]
    }
  ]
};

export const demoProfessors: Professor[] = [
  {
    id: "f71e63a3-f5b8-4d20-99f8-4efbb6148011",
    firstName: "Laura",
    lastName: "Medina",
    email: "laura.medina@aisapereaude.com",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "12ba569f-8d5c-452c-a2fe-75f10631bbab",
    firstName: "Daniel",
    lastName: "Ramos",
    email: "daniel.ramos@aisapereaude.com",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "77880cc8-e82e-4a5c-9f3e-83352ab68c4c",
    firstName: "Marta",
    lastName: "Santos",
    email: "marta.santos@aisapereaude.com",
    active: true,
    createdAt: new Date().toISOString()
  }
];
