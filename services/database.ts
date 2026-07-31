import * as SQLite from 'expo-sqlite';

import type { DailySummary, FoodEntry, FoodEntryInput, MealType, SavedFood } from '@/types/food';
import { createLogGroupId } from '@/utils/id';

const DB_NAME = 'cursor_calorie_tracker.db';
const SCHEMA_VERSION = 3;

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
      entry.calories,
      entry.calories,
      entry.protein,
      entry.protein,
      entry.carbs,
      entry.carbs,
      entry.fat,
      entry.fat,
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
