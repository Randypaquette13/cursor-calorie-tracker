import { format, parseISO } from 'date-fns';

import type { StravaActivitySummary } from '@/types/strava';

export function formatStravaDistance(meters: number) {
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.round(meters)} m`;
  return `${miles.toFixed(miles >= 10 ? 0 : 1)} mi`;
}

export function formatStravaDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes} min`;
}

export function formatStravaActivityLine(activity: StravaActivitySummary) {
  const parts = [
    `${activity.name} (${activity.type})`,
    formatStravaDistance(activity.distanceMeters),
    `${formatStravaDuration(activity.movingTimeSeconds)} moving`,
  ];

  if (activity.calories != null) {
    parts.push(`${Math.round(activity.calories)} kcal on Strava`);
  }

  if (activity.averageHeartRate != null) {
    parts.push(`avg HR ${Math.round(activity.averageHeartRate)} bpm`);
  }

  return `- ${parts.join(' · ')}`;
}

export function formatStravaActivitiesForPrompt(activities: StravaActivitySummary[]) {
  if (activities.length === 0) {
    return '\n\nNo Strava activities were recorded for this day.';
  }

  const lines = activities.map(formatStravaActivityLine);
  return `\n\nStrava activities recorded for this day:\n${lines.join('\n')}\nUse this recorded workout data when estimating activity calories. Do not double-count Strava workouts in the activity score.`;
}

export function parseStravaActivitiesJson(raw: string | null | undefined): StravaActivitySummary[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as StravaActivitySummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function collectUniqueStravaActivities(
  entries: { stravaActivitiesJson: string | null }[],
): StravaActivitySummary[] {
  const byId = new Map<number, StravaActivitySummary>();

  for (const entry of entries) {
    for (const activity of parseStravaActivitiesJson(entry.stravaActivitiesJson)) {
      byId.set(activity.id, activity);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function summarizeStravaActivities(activities: StravaActivitySummary[]) {
  if (activities.length === 0) return null;
  return `${activities.length} Strava ${activities.length === 1 ? 'activity' : 'activities'}: ${activities.map((activity) => activity.name).join(', ')}`;
}

export function formatStravaActivityTime(startDate: string) {
  try {
    return format(parseISO(startDate), 'h:mm a');
  } catch {
    return startDate;
  }
}

export function getDayUnixRange(date: string) {
  const start = parseISO(`${date}T00:00:00`);
  const end = parseISO(`${date}T23:59:59.999`);
  return {
    after: Math.floor(start.getTime() / 1000),
    before: Math.floor(end.getTime() / 1000),
  };
}
