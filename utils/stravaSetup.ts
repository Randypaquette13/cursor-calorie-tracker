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
        'In Strava, set Authorization Callback Domain to the domain below — no https:// and no path.',
      redirectHint:
        'The app sends this redirect URL during OAuth. Strava checks that it matches your callback domain. Your Railway server forwards the result back to the app.',
    };
  }

  return {
    mode,
    callbackDomain: 'localhost',
    redirectUri: 'http://localhost',
    callbackDomainHint:
      'In Strava, set Authorization Callback Domain to localhost — the word only, not http://localhost.',
    redirectHint:
      'Localhost only works for some dev builds. For the App Store app or Expo Go via Railway, rebuild with your Railway domain configured (see Settings).',
  };
}
