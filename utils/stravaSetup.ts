export type StravaOAuthMode = 'railway' | 'localhost';

export function getStravaOAuthMode(redirectUri: string): StravaOAuthMode {
  return redirectUri.startsWith('https://') ? 'railway' : 'localhost';
}

export function getStravaSetupCopy(callbackDomain: string, redirectUri: string) {
  const mode = getStravaOAuthMode(redirectUri);

  if (mode === 'railway') {
    return {
      mode,
      callbackDomain,
      redirectUri,
      callbackDomainHint:
        'Expo Go via Railway uses a remote callback. In Strava, set Authorization Callback Domain to the domain below — no https:// and no path.',
      redirectHint:
        'This redirect URL is only for the Railway dev server. App Store builds use localhost instead.',
    };
  }

  return {
    mode,
    callbackDomain: 'localhost',
    redirectUri: 'http://localhost',
    callbackDomainHint:
      'In Strava, set Authorization Callback Domain to localhost — the word only, not http://localhost.',
    redirectHint:
      'App Store and standalone builds use Strava mobile OAuth with redirect http://localhost. No web domain is required.',
  };
}
