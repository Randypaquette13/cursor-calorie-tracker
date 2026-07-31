import * as SQLite from 'expo-sqlite';

import type { DailySummary, FoodEntry, FoodEntryInput, FoodSource, MealType, SavedFood } from '@/types/food';
import { createLogGroupId } from '@/utils/id';

const DB_NAME = 'cursor_calorie_tracker.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
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
      source TEXT NOT NULL,
      raw_input TEXT,
      barcode TEXT,
      log_group_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_food_entries_date ON food_entries(date);
    CREATE INDEX IF NOT EXISTS idx_food_entries_created_at ON food_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_food_entries_log_group_id ON food_entries(log_group_id);
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
  `);

  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(food_entries)`);
  if (!columns.some((column) => column.name === 'log_group_id')) {
    await db.execAsync(`ALTER TABLE food_entries ADD COLUMN log_group_id TEXT`);
    await db.execAsync(
      `CREATE INDEX IF NOT EXISTS idx_food_entries_log_group_id ON food_entries(log_group_id)`,
    );
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
  return {
    id: row.id as number,
    date: row.date as string,
    mealType: row.meal_type as MealType,
    name: row.name as string,
    calories: row.calories as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    source: row.source as FoodSource,
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
  const result = await db.runAsync(
    `INSERT INTO food_entries
      (date, meal_type, name, calories, protein, carbs, fat, source, raw_input, barcode, log_group_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.date,
      entry.mealType,
      entry.name,
      entry.calories,
      entry.protein,
      entry.carbs,
      entry.fat,
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

export async function getDailySummary(date: string): Promise<DailySummary> {
  const db = await ensureDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT
      date,
      COALESCE(SUM(calories), 0) AS calories,
      COALESCE(SUM(protein), 0) AS protein,
      COALESCE(SUM(carbs), 0) AS carbs,
      COALESCE(SUM(fat), 0) AS fat,
      COUNT(*) AS entry_count
     FROM food_entries
     WHERE date = ?
     GROUP BY date`,
    [date],
  );

  if (!row) {
    return { date, calories: 0, protein: 0, carbs: 0, fat: 0, entryCount: 0 };
  }

  return {
    date,
    calories: row.calories as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    entryCount: row.entry_count as number,
  };
}

export async function getHistorySummaries(limit = 90): Promise<DailySummary[]> {
  const db = await ensureDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT
      date,
      COALESCE(SUM(calories), 0) AS calories,
      COALESCE(SUM(protein), 0) AS protein,
      COALESCE(SUM(carbs), 0) AS carbs,
      COALESCE(SUM(fat), 0) AS fat,
      COUNT(*) AS entry_count
     FROM food_entries
     GROUP BY date
     ORDER BY date DESC
     LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    date: row.date as string,
    calories: row.calories as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    entryCount: row.entry_count as number,
  }));
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
     SET meal_type = ?, name = ?, calories = ?, protein = ?, carbs = ?, fat = ?
     WHERE id = ?`,
    [
      entry.mealType,
      entry.name.trim(),
      entry.calories,
      entry.protein,
      entry.carbs,
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
