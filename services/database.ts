import * as SQLite from 'expo-sqlite';

import type {
  ActivityEntry,
  ActivityEntryInput,
  ActivityParseJob,
  ActivityParseJobStatus,
  UserProfile,
  WeightEntry,
} from '@/types/profile';
import type {
  DailySummary,
  FoodEntry,
  FoodEntryInput,
  MealType,
  ParseJob,
  ParseJobStatus,
  SavedFood,
} from '@/types/food';
import { createLogGroupId } from '@/utils/id';

const DB_NAME = 'cursor_calorie_tracker.db';
const SCHEMA_VERSION = 5;

const RANGE_COLUMNS = [
  ['calories_min', 'REAL'],
  ['calories_max', 'REAL'],
  ['protein_min', 'REAL'],
  ['protein_max', 'REAL'],
  ['carbs_min', 'REAL'],
  ['carbs_max', 'REAL'],
  ['fat_min', 'REAL'],
  ['fat_max', 'REAL'],
] as const;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

async function tableHasColumn(db: SQLite.SQLiteDatabase, table: string, column: string) {
  const columns = await db.getAllAsync<Record<string, unknown>>(`PRAGMA table_info(${table})`);
  return columns.some((row) => String(row.name) === column);
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
) {
  if (!(await tableHasColumn(db, table, column))) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function emptySummary(date: string): DailySummary {
  return {
    date,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    caloriesMin: 0,
    caloriesMax: 0,
    proteinMin: 0,
    proteinMax: 0,
    carbsMin: 0,
    carbsMax: 0,
    fatMin: 0,
    fatMax: 0,
    entryCount: 0,
  };
}

function mapSummaryRow(date: string, row: Record<string, unknown>): DailySummary {
  return {
    date,
    calories: row.calories as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    caloriesMin: row.calories_min as number,
    caloriesMax: row.calories_max as number,
    proteinMin: row.protein_min as number,
    proteinMax: row.protein_max as number,
    carbsMin: row.carbs_min as number,
    carbsMax: row.carbs_max as number,
    fatMin: row.fat_min as number,
    fatMax: row.fat_max as number,
    entryCount: row.entry_count as number,
  };
}

function resolveEntryBounds(entry: FoodEntryInput) {
  return {
    caloriesMin: entry.caloriesMin ?? entry.calories,
    caloriesMax: entry.caloriesMax ?? entry.calories,
    proteinMin: entry.proteinMin ?? entry.protein,
    proteinMax: entry.proteinMax ?? entry.protein,
    carbsMin: entry.carbsMin ?? entry.carbs,
    carbsMax: entry.carbsMax ?? entry.carbs,
    fatMin: entry.fatMin ?? entry.fat,
    fatMax: entry.fatMax ?? entry.fat,
  };
}

async function runMigrations() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS food_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'unknown',
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      calories_min REAL,
      calories_max REAL,
      protein_min REAL,
      protein_max REAL,
      carbs_min REAL,
      carbs_max REAL,
      fat_min REAL,
      fat_max REAL,
      source TEXT NOT NULL,
      raw_input TEXT,
      barcode TEXT,
      log_group_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_food_entries_date ON food_entries(date);
    CREATE INDEX IF NOT EXISTS idx_food_entries_created_at ON food_entries(created_at);
    CREATE TABLE IF NOT EXISTS saved_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_saved_foods_name ON saved_foods(name);
    CREATE TABLE IF NOT EXISTS schema_version (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS parse_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      status TEXT NOT NULL,
      agent_id TEXT,
      run_id TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_parse_jobs_date ON parse_jobs(date);
    CREATE INDEX IF NOT EXISTS idx_parse_jobs_status ON parse_jobs(status);
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      height_cm REAL,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS weight_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight_kg REAL NOT NULL,
      recorded_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_weight_entries_recorded_at ON weight_entries(recorded_at);
    CREATE TABLE IF NOT EXISTS activity_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      activity_score REAL,
      bmr_calories REAL NOT NULL,
      activity_calories REAL NOT NULL,
      total_burned_calories REAL NOT NULL,
      summary TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_entries_date ON activity_entries(date);
    CREATE TABLE IF NOT EXISTS activity_parse_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      raw_input TEXT NOT NULL,
      status TEXT NOT NULL,
      agent_id TEXT,
      run_id TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_activity_parse_jobs_date ON activity_parse_jobs(date);
    CREATE INDEX IF NOT EXISTS idx_activity_parse_jobs_status ON activity_parse_jobs(status);
  `);

  await ensureColumn(db, 'food_entries', 'log_group_id', 'TEXT');
  await db.execAsync(
    `CREATE INDEX IF NOT EXISTS idx_food_entries_log_group_id ON food_entries(log_group_id)`,
  );

  for (const [column, definition] of RANGE_COLUMNS) {
    await ensureColumn(db, 'food_entries', column, definition);
  }

  const versionRow = await db.getFirstAsync<{ version: number }>(
    `SELECT version FROM schema_version WHERE id = 1`,
  );
  const currentVersion = versionRow?.version ?? 1;

  if (currentVersion < 3) {
    await db.execAsync(`
      UPDATE food_entries
      SET
        calories_min = COALESCE(calories_min, calories),
        calories_max = COALESCE(calories_max, calories),
        protein_min = COALESCE(protein_min, protein),
        protein_max = COALESCE(protein_max, protein),
        carbs_min = COALESCE(carbs_min, carbs),
        carbs_max = COALESCE(carbs_max, carbs),
        fat_min = COALESCE(fat_min, fat),
        fat_max = COALESCE(fat_max, fat)
      WHERE calories_min IS NULL OR calories_max IS NULL
    `);
  }

  if (currentVersion < SCHEMA_VERSION) {
    await db.runAsync(`INSERT OR REPLACE INTO schema_version (id, version) VALUES (1, ?)`, [
      SCHEMA_VERSION,
    ]);
  }
}

export async function initDatabase() {
  if (!initPromise) {
    initPromise = runMigrations();
  }
  return initPromise;
}

async function ensureDb() {
  await initDatabase();
  return getDb();
}

function mapRow(row: Record<string, unknown>): FoodEntry {
  const calories = row.calories as number;
  const protein = row.protein as number;
  const carbs = row.carbs as number;
  const fat = row.fat as number;

  return {
    id: row.id as number,
    date: row.date as string,
    mealType: row.meal_type as MealType,
    name: row.name as string,
    calories,
    protein,
    carbs,
    fat,
    caloriesMin: (row.calories_min as number | null) ?? calories,
    caloriesMax: (row.calories_max as number | null) ?? calories,
    proteinMin: (row.protein_min as number | null) ?? protein,
    proteinMax: (row.protein_max as number | null) ?? protein,
    carbsMin: (row.carbs_min as number | null) ?? carbs,
    carbsMax: (row.carbs_max as number | null) ?? carbs,
    fatMin: (row.fat_min as number | null) ?? fat,
    fatMax: (row.fat_max as number | null) ?? fat,
    source: row.source as FoodEntry['source'],
    rawInput: (row.raw_input as string | null) ?? null,
    barcode: (row.barcode as string | null) ?? null,
    logGroupId: (row.log_group_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function insertFoodEntry(
  entry: FoodEntryInput & {
    date: string;
    logGroupId?: string | null;
    createdAt?: string;
  },
) {
  const db = await ensureDb();
  const createdAt = entry.createdAt ?? new Date().toISOString();
  const logGroupId = entry.logGroupId ?? createLogGroupId();
  const bounds = resolveEntryBounds(entry);
  const result = await db.runAsync(
    `INSERT INTO food_entries
      (date, meal_type, name, calories, protein, carbs, fat,
       calories_min, calories_max, protein_min, protein_max, carbs_min, carbs_max, fat_min, fat_max,
       source, raw_input, barcode, log_group_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.date,
      entry.mealType,
      entry.name,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      bounds.caloriesMin,
      bounds.caloriesMax,
      bounds.proteinMin,
      bounds.proteinMax,
      bounds.carbsMin,
      bounds.carbsMax,
      bounds.fatMin,
      bounds.fatMax,
      entry.source,
      entry.rawInput ?? null,
      entry.barcode ?? null,
      logGroupId,
      createdAt,
    ],
  );

  return {
    id: result.lastInsertRowId,
    ...entry,
    ...bounds,
    rawInput: entry.rawInput ?? null,
    barcode: entry.barcode ?? null,
    logGroupId,
    createdAt,
  } satisfies FoodEntry;
}

export async function insertFoodEntries(
  date: string,
  entries: FoodEntryInput[],
  options?: { logGroupId?: string; createdAt?: string; rawInput?: string | null },
) {
  const logGroupId = options?.logGroupId ?? createLogGroupId();
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const results: FoodEntry[] = [];

  for (const entry of entries) {
    const inserted = await insertFoodEntry({
      ...entry,
      date,
      logGroupId,
      createdAt,
      rawInput: entry.rawInput ?? options?.rawInput ?? null,
    });
    results.push(inserted);
  }

  return results;
}

export async function getEntriesForDate(date: string) {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM food_entries WHERE date = ? ORDER BY created_at DESC, id DESC`,
    [date],
  );
  return rows.map(mapRow);
}

const SUMMARY_SELECT = `
  date,
  COALESCE(SUM(calories), 0) AS calories,
  COALESCE(SUM(protein), 0) AS protein,
  COALESCE(SUM(carbs), 0) AS carbs,
  COALESCE(SUM(fat), 0) AS fat,
  COALESCE(SUM(COALESCE(calories_min, calories)), 0) AS calories_min,
  COALESCE(SUM(COALESCE(calories_max, calories)), 0) AS calories_max,
  COALESCE(SUM(COALESCE(protein_min, protein)), 0) AS protein_min,
  COALESCE(SUM(COALESCE(protein_max, protein)), 0) AS protein_max,
  COALESCE(SUM(COALESCE(carbs_min, carbs)), 0) AS carbs_min,
  COALESCE(SUM(COALESCE(carbs_max, carbs)), 0) AS carbs_max,
  COALESCE(SUM(COALESCE(fat_min, fat)), 0) AS fat_min,
  COALESCE(SUM(COALESCE(fat_max, fat)), 0) AS fat_max,
  COUNT(*) AS entry_count
`;

export async function getDailySummary(date: string): Promise<DailySummary> {
  const db = await ensureDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT ${SUMMARY_SELECT}
     FROM food_entries
     WHERE date = ?
     GROUP BY date`,
    [date],
  );

  if (!row) {
    return emptySummary(date);
  }

  return mapSummaryRow(date, row);
}

export async function getHistorySummaries(limit = 90): Promise<DailySummary[]> {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT ${SUMMARY_SELECT}
     FROM food_entries
     GROUP BY date
     ORDER BY date DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => mapSummaryRow(row.date as string, row));
}

export async function deleteFoodEntry(id: number) {
  const db = await ensureDb();
  await db.runAsync(`DELETE FROM food_entries WHERE id = ?`, [id]);
}

export async function updateFoodEntry(
  id: number,
  entry: {
    mealType: MealType;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    caloriesMin: number;
    caloriesMax: number;
    proteinMin: number;
    proteinMax: number;
    carbsMin: number;
    carbsMax: number;
    fatMin: number;
    fatMax: number;
  },
) {
  const db = await ensureDb();
  await db.runAsync(
    `UPDATE food_entries
     SET meal_type = ?, name = ?, calories = ?, protein = ?, carbs = ?, fat = ?,
         calories_min = ?, calories_max = ?, protein_min = ?, protein_max = ?,
         carbs_min = ?, carbs_max = ?, fat_min = ?, fat_max = ?
     WHERE id = ?`,
    [
      entry.mealType,
      entry.name.trim(),
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
      entry.caloriesMin,
      entry.caloriesMax,
      entry.proteinMin,
      entry.proteinMax,
      entry.carbsMin,
      entry.carbsMax,
      entry.fatMin,
      entry.fatMax,
      id,
    ],
  );
}

function mapSavedFoodRow(row: Record<string, unknown>): SavedFood {
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    calories: (row.calories as number | null) ?? null,
    protein: (row.protein as number | null) ?? null,
    carbs: (row.carbs as number | null) ?? null,
    fat: (row.fat as number | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getSavedFoods(): Promise<SavedFood[]> {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM saved_foods ORDER BY name COLLATE NOCASE ASC`,
  );
  return rows.map(mapSavedFoodRow);
}

export async function insertSavedFood(entry: {
  name: string;
  description: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}) {
  const db = await ensureDb();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO saved_foods (name, description, calories, protein, carbs, fat, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.name.trim(),
      entry.description.trim(),
      entry.calories ?? null,
      entry.protein ?? null,
      entry.carbs ?? null,
      entry.fat ?? null,
      now,
      now,
    ],
  );

  return {
    id: result.lastInsertRowId,
    name: entry.name.trim(),
    description: entry.description.trim(),
    calories: entry.calories ?? null,
    protein: entry.protein ?? null,
    carbs: entry.carbs ?? null,
    fat: entry.fat ?? null,
    createdAt: now,
    updatedAt: now,
  } satisfies SavedFood;
}

export async function updateSavedFood(
  id: number,
  entry: {
    name: string;
    description: string;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
  },
) {
  const db = await ensureDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE saved_foods
     SET name = ?, description = ?, calories = ?, protein = ?, carbs = ?, fat = ?, updated_at = ?
     WHERE id = ?`,
    [
      entry.name.trim(),
      entry.description.trim(),
      entry.calories ?? null,
      entry.protein ?? null,
      entry.carbs ?? null,
      entry.fat ?? null,
      now,
      id,
    ],
  );
}

export async function deleteSavedFood(id: number) {
  const db = await ensureDb();
  await db.runAsync(`DELETE FROM saved_foods WHERE id = ?`, [id]);
}

function mapParseJobRow(row: Record<string, unknown>): ParseJob {
  return {
    id: row.id as number,
    date: row.date as string,
    rawInput: row.raw_input as string,
    status: row.status as ParseJobStatus,
    agentId: (row.agent_id as string | null) ?? null,
    runId: (row.run_id as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export async function insertParseJob(date: string, rawInput: string) {
  const db = await ensureDb();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO parse_jobs (date, raw_input, status, created_at)
     VALUES (?, ?, 'queued', ?)`,
    [date, rawInput, createdAt],
  );

  return {
    id: result.lastInsertRowId,
    date,
    rawInput,
    status: 'queued' as const,
    agentId: null,
    runId: null,
    errorMessage: null,
    createdAt,
    completedAt: null,
  } satisfies ParseJob;
}

export async function getDisplayParseJobs(date: string) {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM parse_jobs
     WHERE date = ? AND status IN ('queued', 'running', 'failed')
     ORDER BY created_at ASC, id ASC`,
    [date],
  );
  return rows.map(mapParseJobRow);
}

export async function getResumableParseJobs() {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM parse_jobs
     WHERE status IN ('queued', 'running')
     ORDER BY created_at ASC, id ASC`,
  );
  return rows.map(mapParseJobRow);
}

export async function updateParseJob(
  id: number,
  updates: {
    status?: ParseJobStatus;
    agentId?: string | null;
    runId?: string | null;
    errorMessage?: string | null;
    completedAt?: string | null;
  },
) {
  const db = await ensureDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.agentId !== undefined) {
    fields.push('agent_id = ?');
    values.push(updates.agentId);
  }
  if (updates.runId !== undefined) {
    fields.push('run_id = ?');
    values.push(updates.runId);
  }
  if (updates.errorMessage !== undefined) {
    fields.push('error_message = ?');
    values.push(updates.errorMessage);
  }
  if (updates.completedAt !== undefined) {
    fields.push('completed_at = ?');
    values.push(updates.completedAt);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE parse_jobs SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteParseJob(id: number) {
  const db = await ensureDb();
  await db.runAsync(`DELETE FROM parse_jobs WHERE id = ?`, [id]);
}

export async function getUserProfile(): Promise<UserProfile> {
  const db = await ensureDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(`SELECT * FROM user_profile WHERE id = 1`);
  if (!row) {
    return { heightCm: null, updatedAt: null };
  }
  return {
    heightCm: (row.height_cm as number | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
  };
}

export async function saveUserHeight(heightCm: number) {
  const db = await ensureDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO user_profile (id, height_cm, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET height_cm = excluded.height_cm, updated_at = excluded.updated_at`,
    [heightCm, now],
  );
}

function mapWeightEntryRow(row: Record<string, unknown>): WeightEntry {
  return {
    id: row.id as number,
    weightKg: row.weight_kg as number,
    recordedAt: row.recorded_at as string,
  };
}

export async function insertWeightEntry(weightKg: number) {
  const db = await ensureDb();
  const recordedAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO weight_entries (weight_kg, recorded_at) VALUES (?, ?)`,
    [weightKg, recordedAt],
  );
  return {
    id: result.lastInsertRowId,
    weightKg,
    recordedAt,
  } satisfies WeightEntry;
}

export async function getWeightEntries(limit = 30): Promise<WeightEntry[]> {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM weight_entries ORDER BY recorded_at DESC, id DESC LIMIT ?`,
    [limit],
  );
  return rows.map(mapWeightEntryRow);
}

export async function getLatestWeightEntry(): Promise<WeightEntry | null> {
  const db = await ensureDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT * FROM weight_entries ORDER BY recorded_at DESC, id DESC LIMIT 1`,
  );
  return row ? mapWeightEntryRow(row) : null;
}

export async function deleteWeightEntry(id: number) {
  const db = await ensureDb();
  await db.runAsync(`DELETE FROM weight_entries WHERE id = ?`, [id]);
}

function mapActivityEntryRow(row: Record<string, unknown>): ActivityEntry {
  return {
    id: row.id as number,
    date: row.date as string,
    rawInput: row.raw_input as string,
    activityScore: (row.activity_score as number | null) ?? null,
    bmrCalories: row.bmr_calories as number,
    activityCalories: row.activity_calories as number,
    totalBurnedCalories: row.total_burned_calories as number,
    summary: (row.summary as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function insertActivityEntry(entry: ActivityEntryInput) {
  const db = await ensureDb();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO activity_entries
      (date, raw_input, activity_score, bmr_calories, activity_calories, total_burned_calories, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.date,
      entry.rawInput,
      entry.activityScore ?? null,
      entry.bmrCalories,
      entry.activityCalories,
      entry.totalBurnedCalories,
      entry.summary ?? null,
      createdAt,
    ],
  );
  return {
    id: result.lastInsertRowId,
    ...entry,
    activityScore: entry.activityScore ?? null,
    summary: entry.summary ?? null,
    createdAt,
  } satisfies ActivityEntry;
}

export async function getActivityEntriesForDate(date: string) {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM activity_entries WHERE date = ? ORDER BY created_at DESC, id DESC`,
    [date],
  );
  return rows.map(mapActivityEntryRow);
}

export async function getActivityBurnSummaryForDate(date: string) {
  const db = await ensureDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT
       COALESCE(SUM(total_burned_calories), 0) AS total_burned,
       COALESCE(SUM(bmr_calories), 0) AS bmr_total,
       COALESCE(SUM(activity_calories), 0) AS activity_total,
       COUNT(*) AS entry_count
     FROM activity_entries
     WHERE date = ?`,
    [date],
  );

  return {
    totalBurned: (row?.total_burned as number) ?? 0,
    bmrTotal: (row?.bmr_total as number) ?? 0,
    activityTotal: (row?.activity_total as number) ?? 0,
    entryCount: (row?.entry_count as number) ?? 0,
  };
}

export async function deleteActivityEntry(id: number) {
  const db = await ensureDb();
  await db.runAsync(`DELETE FROM activity_entries WHERE id = ?`, [id]);
}

function mapActivityParseJobRow(row: Record<string, unknown>): ActivityParseJob {
  return {
    id: row.id as number,
    date: row.date as string,
    rawInput: row.raw_input as string,
    status: row.status as ActivityParseJobStatus,
    agentId: (row.agent_id as string | null) ?? null,
    runId: (row.run_id as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export async function insertActivityParseJob(date: string, rawInput: string) {
  const db = await ensureDb();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO activity_parse_jobs (date, raw_input, status, created_at)
     VALUES (?, ?, 'queued', ?)`,
    [date, rawInput, createdAt],
  );
  return {
    id: result.lastInsertRowId,
    date,
    rawInput,
    status: 'queued' as const,
    agentId: null,
    runId: null,
    errorMessage: null,
    createdAt,
    completedAt: null,
  } satisfies ActivityParseJob;
}

export async function getDisplayActivityParseJobs(date: string) {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM activity_parse_jobs
     WHERE date = ? AND status IN ('queued', 'running', 'failed')
     ORDER BY created_at ASC, id ASC`,
    [date],
  );
  return rows.map(mapActivityParseJobRow);
}

export async function getResumableActivityParseJobs() {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM activity_parse_jobs
     WHERE status IN ('queued', 'running')
     ORDER BY created_at ASC, id ASC`,
  );
  return rows.map(mapActivityParseJobRow);
}

export async function updateActivityParseJob(
  id: number,
  updates: {
    status?: ActivityParseJobStatus;
    agentId?: string | null;
    runId?: string | null;
    errorMessage?: string | null;
    completedAt?: string | null;
  },
) {
  const db = await ensureDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.agentId !== undefined) {
    fields.push('agent_id = ?');
    values.push(updates.agentId);
  }
  if (updates.runId !== undefined) {
    fields.push('run_id = ?');
    values.push(updates.runId);
  }
  if (updates.errorMessage !== undefined) {
    fields.push('error_message = ?');
    values.push(updates.errorMessage);
  }
  if (updates.completedAt !== undefined) {
    fields.push('completed_at = ?');
    values.push(updates.completedAt);
  }

  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE activity_parse_jobs SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteActivityParseJob(id: number) {
  const db = await ensureDb();
  await db.runAsync(`DELETE FROM activity_parse_jobs WHERE id = ?`, [id]);
}
