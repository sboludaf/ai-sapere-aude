import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getPool, toIsoString, verifyConnection, withTransaction } from "@/lib/db";
import { syncProposalGraph } from "@/lib/integrations/neo4j";
import { syncProposalVector } from "@/lib/integrations/qdrant";
import {
  addCommentSchema,
  createProposalClassSchema,
  createProfessorSchema,
  createProposalSchema,
  updateBudgetSchema,
  updateProfessorSchema,
  updateProposalClassSchema,
  updateStatusSchema
} from "@/lib/validation";
import type {
  BudgetCategory,
  BudgetItem,
  BudgetVersion,
  CalendarEvent,
  ClassStatus,
  CreateProposalInput,
  CreateProposalClassInput,
  Professor,
  ProposalComment,
  ProposalDetail,
  ProposalStatus,
  ProposalStatusHistoryItem,
  ProposalSummary,
  SyncProposalSnapshot,
  UpdateBudgetInput,
  UpdateProposalClassInput
} from "@/lib/types";

type ProposalSummaryRow = RowDataPacket & {
  id: string;
  title: string;
  companyName: string;
  consultationType: string;
  presentationUrl: string;
  status: ProposalStatus;
  totalCost: number;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  commentCount: number;
  classCount: number;
  pendingClassCount: number;
  updatedAt: string;
};

type ProposalClassRow = RowDataPacket & {
  id: string;
  title: string;
  professorId: string | null;
  professorName: string | null;
  classDate: string;
  startTime: string | null;
  endTime: string | null;
  hours: number;
  classStatus: ClassStatus;
  notes: string | null;
};

type CommentRow = RowDataPacket & ProposalComment;
type StatusHistoryRow = RowDataPacket & ProposalStatusHistoryItem;

type BudgetVersionRow = RowDataPacket & {
  id: string;
  versionNumber: number;
  totalCost: number;
  currency: string;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
};

type BudgetItemRow = RowDataPacket &
  BudgetItem & {
    budgetVersionId: string;
  };

type ProfessorRow = RowDataPacket & Professor;

let schemaReady: Promise<void> | null = null;

function subtotal(item: { quantity: number; persons?: number; unitPrice: number }) {
  return Number((item.quantity * (item.persons ?? 1) * item.unitPrice).toFixed(2));
}

function totalCost(items: Array<{ quantity: number; persons?: number; unitPrice: number }>) {
  return Number(items.reduce((sum, item) => sum + subtotal(item), 0).toFixed(2));
}

function mapLegacyProposalStatus(status: string | null): ProposalStatus | null {
  if (!status) {
    return null;
  }

  const statusMap: Record<string, ProposalStatus> = {
    DRAFT: "PENDING",
    PENDING_APPROVAL: "PENDING",
    ADJUSTMENTS: "PENDING",
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    DELIVERED: "DELIVERED",
    CLOSED: "DELIVERED",
    PAID: "PAID"
  };

  return statusMap[status] ?? "PENDING";
}

function normalizeTime(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function calculateHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const diff = Math.max(end - start, 0);

  return Number((diff / 60).toFixed(2));
}

function mapProposalSummary(row: ProposalSummaryRow): ProposalSummary {
  return {
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    consultationType: row.consultationType,
    presentationUrl: row.presentationUrl,
    status: mapLegacyProposalStatus(row.status) ?? "PENDING",
    totalCost: Number(row.totalCost),
    currency: row.currency,
    startDate: row.startDate,
    endDate: row.endDate,
    commentCount: Number(row.commentCount),
    classCount: Number(row.classCount),
    pendingClassCount: Number(row.pendingClassCount),
    updatedAt: toIsoString(row.updatedAt)
  };
}

async function ignoreSchemaError(statement: string) {
  const connection = await getPool().getConnection();
  try {
    await connection.query(statement);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_FIELDNAME"
    ) {
      return;
    }

    console.warn("Schema migration step skipped", error);
  } finally {
    connection.release();
  }
}

async function ensureApplicationSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await verifyConnection();
      await ignoreSchemaError(
        `
        ALTER TABLE proposals
        MODIFY current_status ENUM('DRAFT','PENDING_APPROVAL','ADJUSTMENTS','PENDING','APPROVED','REJECTED','DELIVERED','CLOSED','PAID')
        NOT NULL DEFAULT 'PENDING'
        `
      );
      await ignoreSchemaError(
        `
        ALTER TABLE proposal_status_history
        MODIFY from_status ENUM('DRAFT','PENDING_APPROVAL','ADJUSTMENTS','PENDING','APPROVED','REJECTED','DELIVERED','CLOSED','PAID') NULL
        `
      );
      await ignoreSchemaError(
        `
        ALTER TABLE proposal_status_history
        MODIFY to_status ENUM('DRAFT','PENDING_APPROVAL','ADJUSTMENTS','PENDING','APPROVED','REJECTED','DELIVERED','CLOSED','PAID') NOT NULL
        `
      );
      await ignoreSchemaError(
        `
        UPDATE proposals
        SET current_status = CASE current_status
          WHEN 'DRAFT' THEN 'PENDING'
          WHEN 'PENDING_APPROVAL' THEN 'PENDING'
          WHEN 'ADJUSTMENTS' THEN 'PENDING'
          WHEN 'CLOSED' THEN 'DELIVERED'
          ELSE current_status
        END
        `
      );
      await ignoreSchemaError(
        `
        UPDATE proposal_status_history
        SET from_status = CASE from_status
          WHEN 'DRAFT' THEN 'PENDING'
          WHEN 'PENDING_APPROVAL' THEN 'PENDING'
          WHEN 'ADJUSTMENTS' THEN 'PENDING'
          WHEN 'CLOSED' THEN 'DELIVERED'
          ELSE from_status
        END,
        to_status = CASE to_status
          WHEN 'DRAFT' THEN 'PENDING'
          WHEN 'PENDING_APPROVAL' THEN 'PENDING'
          WHEN 'ADJUSTMENTS' THEN 'PENDING'
          WHEN 'CLOSED' THEN 'DELIVERED'
          ELSE to_status
        END
        `
      );
      await ignoreSchemaError(
        `
        ALTER TABLE proposals
        MODIFY current_status ENUM('PENDING','APPROVED','REJECTED','DELIVERED','PAID') NOT NULL DEFAULT 'PENDING'
        `
      );
      await ignoreSchemaError(
        `
        ALTER TABLE proposal_status_history
        MODIFY from_status ENUM('PENDING','APPROVED','REJECTED','DELIVERED','PAID') NULL
        `
      );
      await ignoreSchemaError(
        `
        ALTER TABLE proposal_status_history
        MODIFY to_status ENUM('PENDING','APPROVED','REJECTED','DELIVERED','PAID') NOT NULL
        `
      );
      await ignoreSchemaError("ALTER TABLE proposal_professor_assignments MODIFY professor_name VARCHAR(255) NULL");
      await ignoreSchemaError("ALTER TABLE budget_items ADD COLUMN persons DECIMAL(10,2) NOT NULL DEFAULT 1 AFTER quantity");
      await ignoreSchemaError("ALTER TABLE professors ADD COLUMN phone VARCHAR(30) NULL AFTER email");
      await ignoreSchemaError("ALTER TABLE professors ADD COLUMN linkedin VARCHAR(512) NULL AFTER phone");
      await ignoreSchemaError("ALTER TABLE proposal_professor_assignments ADD COLUMN class_title VARCHAR(255) NOT NULL DEFAULT 'Clase' AFTER professor_id");
      await ignoreSchemaError("ALTER TABLE proposal_professor_assignments ADD COLUMN start_time TIME NULL AFTER session_date");
      await ignoreSchemaError("ALTER TABLE proposal_professor_assignments ADD COLUMN end_time TIME NULL AFTER start_time");
      await ignoreSchemaError(
        `
        ALTER TABLE proposal_professor_assignments
        ADD COLUMN class_status ENUM('SEARCHING_PROFESSOR','PENDING_CONFIRMATION','PENDING_PRESENTATION_REVIEW','PRESENTATION_OK')
        NOT NULL DEFAULT 'SEARCHING_PROFESSOR' AFTER hours
        `
      );
      await ignoreSchemaError(
        `
        UPDATE proposal_professor_assignments
        SET
          class_title = CASE
            WHEN class_title IS NULL OR class_title = '' OR class_title = 'Clase' THEN COALESCE(NULLIF(notes, ''), 'Clase')
            ELSE class_title
          END,
          start_time = COALESCE(start_time, '09:00:00'),
          end_time = COALESCE(end_time, ADDTIME('09:00:00', SEC_TO_TIME(hours * 3600))),
          class_status = CASE
            WHEN professor_id IS NULL AND professor_name IS NULL THEN 'SEARCHING_PROFESSOR'
            ELSE class_status
          END
        `
      );
    })();
  }

  await schemaReady;
}

async function upsertCompany(connection: PoolConnection, name: string) {
  const id = crypto.randomUUID();

  await connection.execute(
    `
    INSERT INTO companies (id, name)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `,
    [id, name]
  );

  const [rows] = await connection.execute<Array<RowDataPacket & { id: string }>>(
    "SELECT id FROM companies WHERE name = ? LIMIT 1",
    [name]
  );

  return rows[0].id;
}

async function insertBudgetVersion(
  connection: PoolConnection,
  proposalId: string,
  versionNumber: number,
  currency: string,
  items: UpdateBudgetInput["items"],
  reason?: string,
  createdBy?: string
) {
  const budgetVersionId = crypto.randomUUID();
  const versionTotal = totalCost(items);

  await connection.execute(
    `
    INSERT INTO budget_versions (id, proposal_id, version_number, total_cost, currency, reason, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [budgetVersionId, proposalId, versionNumber, versionTotal, currency, reason || null, createdBy || null]
  );

  for (const item of items) {
    await connection.execute(
      `
      INSERT INTO budget_items (id, budget_version_id, service_name, description, quantity, persons, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        crypto.randomUUID(),
        budgetVersionId,
        item.serviceName,
        item.description || null,
        item.quantity,
        item.persons ?? 1,
        item.unitPrice,
        subtotal(item)
      ]
    );
  }

  return versionTotal;
}

async function syncProposalById(id: string) {
  const snapshot = await buildProposalSnapshot(id);

  if (!snapshot) {
    return;
  }

  await Promise.all([syncProposalGraph(snapshot), syncProposalVector(snapshot)]);
}

export async function listProposals(): Promise<ProposalSummary[]> {
  await ensureApplicationSchema();
  const [rows] = await getPool().query<ProposalSummaryRow[]>(
    `
    SELECT
      p.id,
      p.title,
      c.name AS companyName,
      p.consultation_type AS consultationType,
      p.presentation_url AS presentationUrl,
      p.current_status AS status,
      p.total_cost AS totalCost,
      p.currency,
      p.start_date AS startDate,
      p.end_date AS endDate,
      p.updated_at AS updatedAt,
      COUNT(DISTINCT pc.id) AS commentCount,
      COUNT(DISTINCT ppa.id) AS classCount,
      SUM(CASE WHEN ppa.professor_id IS NULL AND ppa.professor_name IS NULL THEN 1 ELSE 0 END) AS pendingClassCount
    FROM proposals p
    INNER JOIN companies c ON c.id = p.company_id
    LEFT JOIN proposal_comments pc ON pc.proposal_id = p.id
    LEFT JOIN proposal_professor_assignments ppa ON ppa.proposal_id = p.id
    GROUP BY p.id, c.name
    ORDER BY p.updated_at DESC
    `
  );

  return rows.map(mapProposalSummary);
}

export async function getProposal(id: string): Promise<ProposalDetail | null> {
  try {
    await ensureApplicationSchema();
    const [proposalRows] = await getPool().execute<ProposalSummaryRow[]>(
      `
      SELECT
        p.id,
        p.title,
        c.name AS companyName,
        p.consultation_type AS consultationType,
        p.presentation_url AS presentationUrl,
        p.current_status AS status,
        p.total_cost AS totalCost,
        p.currency,
        p.start_date AS startDate,
        p.end_date AS endDate,
        p.updated_at AS updatedAt,
        COUNT(DISTINCT pc.id) AS commentCount,
        COUNT(DISTINCT ppa.id) AS classCount,
        SUM(CASE WHEN ppa.professor_id IS NULL AND ppa.professor_name IS NULL THEN 1 ELSE 0 END) AS pendingClassCount
      FROM proposals p
      INNER JOIN companies c ON c.id = p.company_id
      LEFT JOIN proposal_comments pc ON pc.proposal_id = p.id
      LEFT JOIN proposal_professor_assignments ppa ON ppa.proposal_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, c.name
      LIMIT 1
      `,
      [id]
    );

    const proposal = proposalRows[0];

    if (!proposal) {
      return null;
    }

    const [classes] = await getPool().execute<ProposalClassRow[]>(
      `
      SELECT
        id,
        class_title AS title,
        professor_id AS professorId,
        professor_name AS professorName,
        session_date AS classDate,
        start_time AS startTime,
        end_time AS endTime,
        hours,
        class_status AS classStatus,
        notes
      FROM proposal_professor_assignments
      WHERE proposal_id = ?
      ORDER BY session_date ASC, start_time ASC
      `,
      [id]
    );

    const [comments] = await getPool().execute<CommentRow[]>(
      `
      SELECT
        id,
        author_name AS authorName,
        category,
        body,
        created_at AS createdAt
      FROM proposal_comments
      WHERE proposal_id = ?
      ORDER BY created_at DESC
      `,
      [id]
    );

    const [statusHistory] = await getPool().execute<StatusHistoryRow[]>(
      `
      SELECT
        id,
        from_status AS fromStatus,
        to_status AS toStatus,
        note,
        changed_by AS changedBy,
        changed_at AS changedAt
      FROM proposal_status_history
      WHERE proposal_id = ?
      ORDER BY changed_at DESC
      `,
      [id]
    );

    const [budgetVersionsRows] = await getPool().execute<BudgetVersionRow[]>(
      `
      SELECT
        id,
        version_number AS versionNumber,
        total_cost AS totalCost,
        currency,
        reason,
        created_by AS createdBy,
        created_at AS createdAt
      FROM budget_versions
      WHERE proposal_id = ?
      ORDER BY version_number DESC
      `,
      [id]
    );

    let budgetItemsRows: BudgetItemRow[] = [];
    const budgetVersionIds = budgetVersionsRows.map((version) => version.id);

    if (budgetVersionIds.length > 0) {
      const [rows] = await getPool().query<BudgetItemRow[]>(
        `
        SELECT
          id,
          budget_version_id AS budgetVersionId,
          service_name AS serviceName,
          description,
          quantity,
          persons,
          unit_price AS unitPrice,
          subtotal
        FROM budget_items
        WHERE budget_version_id IN (?)
        ORDER BY created_at ASC
        `,
        [budgetVersionIds]
      );

      budgetItemsRows = rows;
    }

    const budgetVersions: BudgetVersion[] = budgetVersionsRows.map((version) => ({
      id: version.id,
      versionNumber: Number(version.versionNumber),
      totalCost: Number(version.totalCost),
      currency: version.currency,
      reason: version.reason,
      createdBy: version.createdBy,
      createdAt: toIsoString(version.createdAt),
      items: budgetItemsRows
        .filter((item) => item.budgetVersionId === version.id)
        .map((item) => ({
          id: item.id,
          serviceName: item.serviceName,
          description: item.description,
          quantity: Number(item.quantity),
          persons: Number(item.persons ?? 1),
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal)
        }))
    }));

    return {
      ...mapProposalSummary(proposal),
      classes: classes.map((classItem) => ({
        id: classItem.id,
        title: classItem.title,
        professorId: classItem.professorId,
        professorName: classItem.professorName,
        classDate: classItem.classDate,
        startTime: normalizeTime(classItem.startTime),
        endTime: normalizeTime(classItem.endTime),
        hours: Number(classItem.hours),
        classStatus: classItem.classStatus,
        notes: classItem.notes
      })),
      comments: comments.map((comment) => ({
        id: comment.id,
        authorName: comment.authorName,
        category: comment.category as BudgetCategory,
        body: comment.body,
        createdAt: toIsoString(comment.createdAt)
      })),
      statusHistory: statusHistory.map((history) => ({
        id: history.id,
        fromStatus: mapLegacyProposalStatus(history.fromStatus as string | null),
        toStatus: mapLegacyProposalStatus(history.toStatus as string) ?? "PENDING",
        note: history.note,
        changedBy: history.changedBy,
        changedAt: toIsoString(history.changedAt)
      })),
      budgetVersions
    };
  } catch (error) {
    console.error("[getProposal] DB connection failed for id:", id, {
      host: process.env.MYSQL_HOST,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

export async function createProposal(input: CreateProposalInput) {
  await ensureApplicationSchema();
  const parsed = createProposalSchema.parse(input);
  const proposalId = await withTransaction(async (connection) => {
    const companyId = await upsertCompany(connection, parsed.companyName);
    const id = crypto.randomUUID();
    const cost = totalCost(parsed.budgetItems);
    const classDates = parsed.classes.map((classItem) => classItem.classDate).sort();
    const startDate = classDates[0] ?? null;
    const endDate = classDates[classDates.length - 1] ?? null;

    await connection.execute(
      `
      INSERT INTO proposals (
        id, company_id, title, consultation_type, presentation_url, current_status,
        total_cost, currency, start_date, end_date
      )
      VALUES (?, ?, ?, 'Formacion', ?, 'PENDING', ?, ?, ?, ?)
      `,
      [id, companyId, parsed.title, parsed.presentationUrl, cost, parsed.currency, startDate, endDate]
    );

    await insertBudgetVersion(
      connection,
      id,
      1,
      parsed.currency,
      parsed.budgetItems,
      "Alta inicial",
      "Sergio Boluda Fernandes"
    );

    for (const classItem of parsed.classes) {
      const professorName = classItem.professorName || null;
      const professorId = classItem.professorId || null;
      const hours = calculateHours(classItem.startTime, classItem.endTime) || classItem.hours;
      const classStatus = professorName ? classItem.classStatus : "SEARCHING_PROFESSOR";

      await connection.execute(
        `
        INSERT INTO proposal_professor_assignments (
          id, proposal_id, professor_id, class_title, professor_name, session_date, start_time, end_time, hours, class_status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          crypto.randomUUID(),
          id,
          professorId,
          classItem.title,
          professorName,
          classItem.classDate,
          classItem.startTime,
          classItem.endTime,
          hours,
          classStatus,
          classItem.notes || null
        ]
      );
    }

    await connection.execute(
      `
      INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, note, changed_by)
      VALUES (?, ?, NULL, 'PENDING', ?, ?)
      `,
      [crypto.randomUUID(), id, "Oferta cargada para aprobacion.", "Sergio Boluda Fernandes"]
    );

    return id;
  });

  await syncProposalById(proposalId);
  return proposalId;
}

export async function addProposalComment(input: {
  proposalId: string;
  authorName: string;
  category: BudgetCategory;
  body: string;
}) {
  await ensureApplicationSchema();
  const parsed = addCommentSchema.parse(input);

  await getPool().execute(
    `
    INSERT INTO proposal_comments (id, proposal_id, author_name, category, body)
    VALUES (?, ?, ?, ?, ?)
    `,
    [crypto.randomUUID(), parsed.proposalId, parsed.authorName, parsed.category, parsed.body]
  );
}

export async function updateProposalStatus(input: {
  proposalId: string;
  toStatus: ProposalStatus;
  changedBy?: string;
  note?: string;
}) {
  await ensureApplicationSchema();
  const parsed = updateStatusSchema.parse(input);

  await withTransaction(async (connection) => {
    const [rows] = await connection.execute<Array<RowDataPacket & { currentStatus: ProposalStatus }>>(
      "SELECT current_status AS currentStatus FROM proposals WHERE id = ? LIMIT 1",
      [parsed.proposalId]
    );
    const currentStatus = mapLegacyProposalStatus(rows[0]?.currentStatus) ?? null;

    await connection.execute(
      "UPDATE proposals SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [parsed.toStatus, parsed.proposalId]
    );

    await connection.execute(
      `
      INSERT INTO proposal_status_history (id, proposal_id, from_status, to_status, note, changed_by)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        crypto.randomUUID(),
        parsed.proposalId,
        currentStatus,
        parsed.toStatus,
        parsed.note || null,
        parsed.changedBy
      ]
    );
  });

  await syncProposalById(parsed.proposalId);
}

export async function updateProposalBudget(input: UpdateBudgetInput) {
  await ensureApplicationSchema();
  const parsed = updateBudgetSchema.parse(input);

  await withTransaction(async (connection) => {
    const [rows] = await connection.execute<Array<RowDataPacket & { nextVersion: number }>>(
      "SELECT COALESCE(MAX(version_number), 0) + 1 AS nextVersion FROM budget_versions WHERE proposal_id = ?",
      [parsed.proposalId]
    );
    const nextVersion = Number(rows[0]?.nextVersion ?? 1);
    const cost = await insertBudgetVersion(
      connection,
      parsed.proposalId,
      nextVersion,
      parsed.currency,
      parsed.items,
      parsed.reason,
      parsed.createdBy
    );

    await connection.execute(
      "UPDATE proposals SET total_cost = ?, currency = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [cost, parsed.currency, parsed.proposalId]
    );
  });

  await syncProposalById(parsed.proposalId);
}

export async function updateProposalClass(input: UpdateProposalClassInput) {
  await ensureApplicationSchema();
  const parsed = updateProposalClassSchema.parse(input);
  let professorName: string | null = null;

  if (parsed.professorId) {
    const [professorRows] = await getPool().execute<Array<RowDataPacket & { firstName: string; lastName: string }>>(
      "SELECT first_name AS firstName, last_name AS lastName FROM professors WHERE id = ? LIMIT 1",
      [parsed.professorId]
    );
    const professor = professorRows[0];
    professorName = professor ? `${professor.firstName} ${professor.lastName}` : professorName;
  }

  await getPool().execute(
    `
    UPDATE proposal_professor_assignments
    SET professor_id = ?, professor_name = ?, class_status = ?,
        class_title = COALESCE(?, class_title)
    WHERE id = ? AND proposal_id = ?
    `,
    [parsed.professorId || null, professorName, parsed.classStatus, parsed.title ?? null, parsed.classId, parsed.proposalId]
  );

  await syncProposalById(parsed.proposalId);
}

export async function createProposalClass(input: CreateProposalClassInput) {
  await ensureApplicationSchema();
  const parsed = createProposalClassSchema.parse(input);
  const hours = parsed.hours ?? calculateHours(parsed.startTime, parsed.endTime);
  const id = crypto.randomUUID();

  await getPool().execute(
    `
    INSERT INTO proposal_professor_assignments (
      id, proposal_id, professor_id, class_title, professor_name, session_date, start_time, end_time, hours, class_status, notes
    )
    VALUES (?, ?, NULL, ?, NULL, ?, ?, ?, ?, 'SEARCHING_PROFESSOR', ?)
    `,
    [
      id,
      parsed.proposalId,
      parsed.title,
      parsed.classDate,
      parsed.startTime,
      parsed.endTime,
      hours,
      parsed.notes || null
    ]
  );

  const [rows] = await getPool().execute<Array<RowDataPacket & { startDate: string | null; endDate: string | null }>>(
    "SELECT MIN(session_date) AS startDate, MAX(session_date) AS endDate FROM proposal_professor_assignments WHERE proposal_id = ?",
    [parsed.proposalId]
  );
  const dates = rows[0];

  await getPool().execute("UPDATE proposals SET start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    dates?.startDate ?? parsed.classDate,
    dates?.endDate ?? parsed.classDate,
    parsed.proposalId
  ]);

  await syncProposalById(parsed.proposalId);
  return id;
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  await ensureApplicationSchema();
  const [rows] = await getPool().query<Array<RowDataPacket & CalendarEvent>>(
    `
    SELECT
      ppa.id AS classId,
      ppa.class_title AS classTitle,
      ppa.session_date AS classDate,
      ppa.start_time AS startTime,
      ppa.end_time AS endTime,
      ppa.class_status AS classStatus,
      ppa.professor_name AS professorName,
      p.id AS proposalId,
      p.title AS proposalTitle
    FROM proposal_professor_assignments ppa
    INNER JOIN proposals p ON p.id = ppa.proposal_id
    ORDER BY ppa.session_date ASC, ppa.start_time ASC
    `
  );

  return rows.map((row) => ({
    classId: row.classId,
    classTitle: row.classTitle,
    classDate: toIsoString(row.classDate).slice(0, 10),
    startTime: String(row.startTime ?? "").slice(0, 5),
    endTime: String(row.endTime ?? "").slice(0, 5),
    classStatus: row.classStatus,
    professorName: row.professorName,
    proposalId: row.proposalId,
    proposalTitle: row.proposalTitle
  }));
}

export async function listProfessors(): Promise<Professor[]> {
  await ensureApplicationSchema();
  const [rows] = await getPool().query<ProfessorRow[]>(
    `
    SELECT
      id,
      first_name AS firstName,
      last_name AS lastName,
      email,
      phone,
      linkedin,
      active,
      created_at AS createdAt
    FROM professors
    ORDER BY active DESC, last_name ASC, first_name ASC
    `
  );

  return rows.map((professor) => ({
    id: professor.id,
    firstName: professor.firstName,
    lastName: professor.lastName,
    email: professor.email,
    phone: professor.phone ?? null,
    linkedin: professor.linkedin ?? null,
    active: Boolean(professor.active),
    createdAt: toIsoString(professor.createdAt)
  }));
}

export async function createProfessor(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedin?: string;
}) {
  await ensureApplicationSchema();
  const parsed = createProfessorSchema.parse(input);

  await getPool().execute(
    `
    INSERT INTO professors (id, first_name, last_name, email, phone, linkedin)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      first_name = VALUES(first_name),
      last_name = VALUES(last_name),
      phone = VALUES(phone),
      linkedin = VALUES(linkedin),
      active = TRUE,
      updated_at = CURRENT_TIMESTAMP
    `,
    [crypto.randomUUID(), parsed.firstName, parsed.lastName, parsed.email, parsed.phone ?? null, parsed.linkedin ?? null]
  );
}

export async function updateProfessor(input: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedin?: string;
}) {
  await ensureApplicationSchema();
  const parsed = updateProfessorSchema.parse(input);

  await getPool().execute(
    `
    UPDATE professors
    SET first_name = ?, last_name = ?, email = ?, phone = ?, linkedin = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [parsed.firstName, parsed.lastName, parsed.email, parsed.phone ?? null, parsed.linkedin ?? null, parsed.id]
  );
}

export async function deleteProfessor(id: string) {
  await getPool().execute("DELETE FROM professors WHERE id = ?", [id]);
}

async function buildProposalSnapshot(id: string): Promise<SyncProposalSnapshot | null> {
  const detail = await getProposal(id);

  if (!detail) {
    return null;
  }

  const latestBudget = detail.budgetVersions[0];

  return {
    id: detail.id,
    title: detail.title,
    companyName: detail.companyName,
    consultationType: detail.consultationType,
    status: detail.status,
    totalCost: detail.totalCost,
    currency: detail.currency,
    presentationUrl: detail.presentationUrl,
    professorNames: Array.from(
      new Set(detail.classes.map((classItem) => classItem.professorName).filter((name): name is string => Boolean(name)))
    ),
    serviceNames: latestBudget ? latestBudget.items.map((item) => item.serviceName) : []
  };
}
