export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number | null;
  athleteName: string | null;
}

export interface StravaActivitySummary {
  id: number;
  name: string;
  type: string;
  startDate: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elapsedTimeSeconds: number;
  calories: number | null;
  averageHeartRate: number | null;
}

export interface StravaConnectionInfo {
  connected: boolean;
  athleteName: string | null;
}
