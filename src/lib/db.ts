import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";
import type { AnalysisResult, AnalysisType, AuthUser } from "./types";

const dbPath = path.join(process.cwd(), "scamshield.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

let initialized = false;

export function initDb() {
  if (initialized) {
    return;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      input_type TEXT NOT NULL,
      input_text TEXT,
      source_url TEXT,
      risk_level TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      summary TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analysis_findings (
      id TEXT PRIMARY KEY,
      analysis_id TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      finding TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assistant_messages (
      id TEXT PRIMARY KEY,
      analysis_id TEXT,
      user_id TEXT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(analysis_id) REFERENCES analyses(id) ON DELETE SET NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_user_created_at ON analyses(user_id, created_at DESC);
  `);

  initialized = true;
}

export function createUser(email: string, passwordHash: string, displayName: string) {
  initDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, display_name) VALUES (@id, @email, @password_hash, @display_name)`,
  ).run({ id, email, password_hash: passwordHash, display_name: displayName });

  return { id, email, displayName } satisfies AuthUser;
}

export function findUserByEmail(email: string) {
  initDb();
  return db
    .prepare(`SELECT id, email, password_hash as passwordHash, display_name as displayName FROM users WHERE email = ?`)
    .get(email) as { id: string; email: string; passwordHash: string; displayName: string } | undefined;
}

export function findUserById(id: string) {
  initDb();
  return db
    .prepare(`SELECT id, email, display_name as displayName FROM users WHERE id = ?`)
    .get(id) as AuthUser | undefined;
}

export function createSession(userId: string, tokenHash: string, expiresAt: string) {
  initDb();
  const id = randomUUID();
  db.prepare(`INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`).run(
    id,
    userId,
    tokenHash,
    expiresAt,
  );
  return id;
}

export function getSessionByTokenHash(tokenHash: string) {
  initDb();
  return db
    .prepare(
      `SELECT sessions.id, sessions.user_id as userId, sessions.expires_at as expiresAt, users.email, users.display_name as displayName
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
    )
    .get(tokenHash) as
    | {
        id: string;
        userId: string;
        expiresAt: string;
        email: string;
        displayName: string;
      }
    | undefined;
}

export function deleteSessionByTokenHash(tokenHash: string) {
  initDb();
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
}

export function saveAnalysis(input: {
  userId: string | null;
  inputType: AnalysisType;
  inputText?: string;
  sourceUrl?: string;
  result: AnalysisResult;
}) {
  initDb();
  const id = randomUUID();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO analyses (
        id, user_id, input_type, input_text, source_url, risk_level, risk_score, summary, result_json
      ) VALUES (@id, @user_id, @input_type, @input_text, @source_url, @risk_level, @risk_score, @summary, @result_json)`,
    ).run({
      id,
      user_id: input.userId,
      input_type: input.inputType,
      input_text: input.inputText ?? null,
      source_url: input.sourceUrl ?? null,
      risk_level: input.result.risk_level,
      risk_score: input.result.risk_score,
      summary: input.result.summary,
      result_json: JSON.stringify(input.result),
    });

    for (const finding of input.result.findings) {
      db.prepare(
        `INSERT INTO analysis_findings (id, analysis_id, category, severity, finding) VALUES (?, ?, ?, ?, ?)`,
      ).run(randomUUID(), id, finding.category, finding.severity, finding.explanation);
    }
  });

  tx();
  return id;
}

export function getAnalysisById(id: string) {
  initDb();
  const row = db
    .prepare(
      `SELECT id, user_id as userId, input_type as inputType, risk_level as riskLevel, risk_score as riskScore,
              summary, created_at as createdAt, result_json as resultJson
       FROM analyses WHERE id = ?`,
    )
    .get(id) as
    | {
        id: string;
        userId: string | null;
        inputType: AnalysisType;
        riskLevel: string;
        riskScore: number;
        summary: string;
        createdAt: string;
        resultJson: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    ...row,
    result: JSON.parse(row.resultJson) as AnalysisResult,
  };
}

export function listUserAnalyses(params: {
  userId: string;
  search?: string;
  riskLevel?: string;
  inputType?: string;
}) {
  initDb();

  const conditions = ["user_id = @user_id"];
  const bindings: Record<string, unknown> = { user_id: params.userId };

  if (params.search) {
    conditions.push("(summary LIKE @search OR input_text LIKE @search)");
    bindings.search = `%${params.search}%`;
  }

  if (params.riskLevel) {
    conditions.push("risk_level = @risk_level");
    bindings.risk_level = params.riskLevel;
  }

  if (params.inputType) {
    conditions.push("input_type = @input_type");
    bindings.input_type = params.inputType;
  }

  const whereClause = conditions.join(" AND ");

  return db
    .prepare(
      `SELECT id, input_type as inputType, risk_level as riskLevel, risk_score as riskScore, summary, created_at as createdAt
       FROM analyses
       WHERE ${whereClause}
       ORDER BY datetime(created_at) DESC`,
    )
    .all(bindings) as Array<{
    id: string;
    inputType: AnalysisType;
    riskLevel: string;
    riskScore: number;
    summary: string;
    createdAt: string;
  }>;
}

export function deleteAnalysisById(id: string, userId: string) {
  initDb();
  const result = db.prepare(`DELETE FROM analyses WHERE id = ? AND user_id = ?`).run(id, userId);
  return result.changes > 0;
}

export function saveAssistantMessage(input: {
  userId: string | null;
  analysisId?: string;
  question: string;
  answer: string;
}) {
  initDb();
  db.prepare(
    `INSERT INTO assistant_messages (id, analysis_id, user_id, question, answer) VALUES (?, ?, ?, ?, ?)`,
  ).run(randomUUID(), input.analysisId ?? null, input.userId, input.question, input.answer);
}

export function cleanupExpiredSessions(nowIso: string) {
  initDb();
  db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(nowIso);
}
