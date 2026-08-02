export function handleStravaOAuthCallback(req, res, publicDomain) {
  const requestUrl = new URL(req.url ?? '/', `https://${publicDomain}`);
  const returnUrlRaw = requestUrl.searchParams.get('state');

  if (!returnUrlRaw) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Missing return URL. Start Strava connect from the Calorie Tracker app.');
    return;
  }

  let returnUrl;
  try {
    returnUrl = new URL(returnUrlRaw);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Invalid return URL.');
    return;
  }

  for (const [key, value] of requestUrl.searchParams.entries()) {
    if (key !== 'state') {
      returnUrl.searchParams.set(key, value);
    }
  }

  res.writeHead(302, { Location: returnUrl.toString() });
  res.end();
}
