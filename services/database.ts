import * as SQLite from 'expo-sqlite';

import type { DailySummary, FoodEntry, FoodSource, MealType } from '@/types/food';

const DB_NAME = 'cursor_calorie_tracker.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDatabase() {
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
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_food_entries_date ON food_entries(date);
    CREATE INDEX IF NOT EXISTS idx_food_entries_created_at ON food_entries(created_at);
  `);
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
    createdAt: row.created_at as string,
  };
}

export async function insertFoodEntry(entry: {
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: FoodSource;
  rawInput?: string | null;
  barcode?: string | null;
}) {
  const db = await getDb();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO food_entries
      (date, meal_type, name, calories, protein, carbs, fat, source, raw_input, barcode, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      createdAt,
    ],
  );

  return {
    id: result.lastInsertRowId,
    ...entry,
    rawInput: entry.rawInput ?? null,
    barcode: entry.barcode ?? null,
    createdAt,
  } satisfies FoodEntry;
}

export async function getEntriesForDate(date: string) {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM food_entries WHERE date = ? ORDER BY created_at ASC`,
    [date],
  );
  return rows.map(mapRow);
}

export async function getDailySummary(date: string): Promise<DailySummary> {
  const db = await getDb();
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
  const db = await getDb();
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
  const db = await getDb();
  await db.runAsync(`DELETE FROM food_entries WHERE id = ?`, [id]);
}
