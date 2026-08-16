import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import type { StravaActivitySummary, StravaConnectionInfo, StravaTokens } from '@/types/strava';
import { getDayUnixRange } from '@/utils/strava';

WebBrowser.maybeCompleteAuthSession();

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/mobile/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API = 'https://www.strava.com/api/v3';
const STRAVA_REDIRECT_URI = 'http://localhost';

function readExtraString(key: string) {
  const value = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getStravaCallbackDomain() {
  return readExtraString('stravaCallbackDomain') ?? 'localhost';
}

export function getStravaRedirectUri() {
  return readExtraString('stravaOAuthRedirectUri') ?? STRAVA_REDIRECT_URI;
}

export function getStravaReturnUrl() {
  return Linking.createURL('strava');
}

export function usesStravaRailwayCallback() {
  return getStravaRedirectUri().startsWith('https://');
}

function parseAuthorizationCode(resultUrl: string) {
  const parsed = new URL(resultUrl);
  const error = parsed.searchParams.get('error');
  if (error) {
    throw new Error(`Strava authorization failed: ${error}`);
  }

  const code = parsed.searchParams.get('code');
  if (!code) {
    throw new Error('Strava did not return an authorization code.');
  }

  return code;
}

const CLIENT_ID_KEY = 'strava_client_id';
const CLIENT_SECRET_KEY = 'strava_client_secret';
const ACCESS_TOKEN_KEY = 'strava_access_token';
const REFRESH_TOKEN_KEY = 'strava_refresh_token';
const EXPIRES_AT_KEY = 'strava_expires_at';
const ATHLETE_ID_KEY = 'strava_athlete_id';
const ATHLETE_NAME_KEY = 'strava_athlete_name';

const STRAVA_SCOPES = ['activity:read_all'];

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: {
    id?: number;
    firstname?: string;
    lastname?: string;
  };
}

interface StravaActivityResponse {
  id: number;
  name: string;
  type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  calories?: number | null;
  average_heartrate?: number | null;
}


export async function getStravaCredentials() {
  const clientId = await SecureStore.getItemAsync(CLIENT_ID_KEY);
  const clientSecret = await SecureStore.getItemAsync(CLIENT_SECRET_KEY);
  return { clientId, clientSecret };
}

export async function saveStravaCredentials(clientId: string, clientSecret: string) {
  await SecureStore.setItemAsync(CLIENT_ID_KEY, clientId.trim());
  await SecureStore.setItemAsync(CLIENT_SECRET_KEY, clientSecret.trim());
}

export async function clearStravaCredentials() {
  await SecureStore.deleteItemAsync(CLIENT_ID_KEY);
  await SecureStore.deleteItemAsync(CLIENT_SECRET_KEY);
}

async function saveTokens(tokens: StravaTokens) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt));
  if (tokens.athleteId != null) {
    await SecureStore.setItemAsync(ATHLETE_ID_KEY, String(tokens.athleteId));
  }
  if (tokens.athleteName) {
    await SecureStore.setItemAsync(ATHLETE_NAME_KEY, tokens.athleteName);
  }
}

async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
  await SecureStore.deleteItemAsync(ATHLETE_ID_KEY);
  await SecureStore.deleteItemAsync(ATHLETE_NAME_KEY);
}

function mapTokenResponse(data: StravaTokenResponse): StravaTokens {
  const first = data.athlete?.firstname?.trim() ?? '';
  const last = data.athlete?.lastname?.trim() ?? '';
  const athleteName = [first, last].filter(Boolean).join(' ') || null;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete?.id ?? null,
    athleteName,
  };
}

async function exchangeToken(body: Record<string, string>) {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Strava token error (${response.status})`);
  }

  const data = (await response.json()) as StravaTokenResponse;
  const tokens = mapTokenResponse(data);
  await saveTokens(tokens);
  return tokens;
}

export async function getStravaConnectionInfo(): Promise<StravaConnectionInfo> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const athleteName = await SecureStore.getItemAsync(ATHLETE_NAME_KEY);
  return {
    connected: !!accessToken,
    athleteName,
  };
}

export async function disconnectStrava() {
  await clearTokens();
}

export async function connectStrava() {
  const { clientId, clientSecret } = await getStravaCredentials();
  if (!clientId || !clientSecret) {
    throw new Error('Add your Strava Client ID and Client Secret in Settings first.');
  }

  const redirectUri = getStravaRedirectUri();
  const appReturnUrl = getStravaReturnUrl();
  const usesRailway = usesStravaRailwayCallback();

  // Localhost: Strava redirects to http://localhost and the auth session must listen for that URL.
  // Railway: Strava hits the server, which forwards the code back via the app deep link.
  const authSessionReturnUrl = usesRailway ? appReturnUrl : redirectUri;

  let authUrl =
    `${STRAVA_AUTH_URL}?client_id=${encodeURIComponent(clientId)}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&approval_prompt=auto&scope=${encodeURIComponent(STRAVA_SCOPES.join(','))}`;

  if (usesRailway) {
    authUrl += `&state=${encodeURIComponent(appReturnUrl)}`;
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, authSessionReturnUrl, {
    preferEphemeralSession: true,
  });
  if (result.type !== 'success' || !result.url) {
    throw new Error('Strava authorization was cancelled.');
  }

  const code = parseAuthorizationCode(result.url);

  await exchangeToken({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });
}

async function refreshAccessToken(clientId: string, clientSecret: string, refreshToken: string) {
  return exchangeToken({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
}

async function getValidAccessToken() {
  const { clientId, clientSecret } = await getStravaCredentials();
  if (!clientId || !clientSecret) {
    throw new Error('Add your Strava Client ID and Client Secret in Settings first.');
  }

  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  const expiresAtRaw = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;

  if (!accessToken || !refreshToken) {
    throw new Error('Connect Strava in Settings or on the Activity tab first.');
  }

  if (Date.now() / 1000 >= expiresAt - 60) {
    const refreshed = await refreshAccessToken(clientId, clientSecret, refreshToken);
    return refreshed.accessToken;
  }

  return accessToken;
}

function mapActivity(activity: StravaActivityResponse): StravaActivitySummary {
  return {
    id: activity.id,
    name: activity.name,
    type: activity.type,
    startDate: activity.start_date,
    distanceMeters: activity.distance ?? 0,
    movingTimeSeconds: activity.moving_time ?? 0,
    elapsedTimeSeconds: activity.elapsed_time ?? 0,
    calories: activity.calories ?? null,
    averageHeartRate: activity.average_heartrate ?? null,
  };
}

export async function fetchStravaActivitiesForDate(date: string) {
  const accessToken = await getValidAccessToken();
  const { after, before } = getDayUnixRange(date);

  const response = await fetch(
    `${STRAVA_API}/athlete/activities?after=${after}&before=${before}&per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Strava API error (${response.status})`);
  }

  const activities = (await response.json()) as StravaActivityResponse[];
  return activities.map(mapActivity).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function serializeStravaActivities(activities: StravaActivitySummary[]) {
  return JSON.stringify(activities);
}
