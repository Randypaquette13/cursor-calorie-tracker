export interface UserProfile {
  heightCm: number | null;
  updatedAt: string | null;
}

export interface WeightEntry {
  id: number;
  weightKg: number;
  recordedAt: string;
}

export interface ActivityEntry {
  id: number;
  date: string;
  rawInput: string;
  activityScore: number | null;
  bmrCalories: number;
  activityCalories: number;
  totalBurnedCalories: number;
  summary: string | null;
  stravaActivitiesJson: string | null;
  createdAt: string;
}

export interface ActivityEntryInput {
  date: string;
  rawInput: string;
  activityScore?: number | null;
  bmrCalories: number;
  activityCalories: number;
  totalBurnedCalories: number;
  summary?: string | null;
  stravaActivitiesJson?: string | null;
}

export type ActivityParseJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ActivityParseJob {
  id: number;
  date: string;
  rawInput: string;
  status: ActivityParseJobStatus;
  agentId: string | null;
  runId: string | null;
  errorMessage: string | null;
  stravaActivitiesJson: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ParsedActivityResponse {
  bmrCalories: number;
  activityCalories: number;
  totalBurnedCalories: number;
  activityScore: number;
  summary: string;
}

export interface ActivityBurnSummary {
  totalBurned: number;
  bmrTotal: number;
  activityTotal: number;
  entryCount: number;
}
