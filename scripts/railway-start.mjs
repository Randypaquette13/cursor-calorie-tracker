import { spawn } from 'node:child_process';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEBHOOK_SECRET =
  process.env.BRRR_WEBHOOK_SECRET ??
  'br_usr_6d7e11e27448c0090bcbcc52eb9177975dcd74a10ce84b23ba036c0d6de6b091';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function log(message) {
  console.log(`[railway-start] ${message}`);
}

function pingBrrr(source) {
  const message = `Calorie tracker server restarted (${source}) · ${new Date().toISOString()}`;
  const body = message;

  return new Promise((resolve) => {
    log(`Sending brrr ping (${source})`);

    const req = https.request(
      {
        hostname: 'api.brrr.now',
        port: 443,
        path: `/v1/${WEBHOOK_SECRET}`,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          log(`brrr HTTP ${res.statusCode}: ${responseBody}`);
          resolve();
        });
      },
    );

    req.on('error', (error) => {
      log(`brrr failed: ${error.message}`);
      resolve();
    });

    req.setTimeout(15_000, () => {
      req.destroy();
      log('brrr timed out after 15s');
      resolve();
    });

    req.write(body);
    req.end();
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

async function main() {
  log(`boot ${new Date().toISOString()}`);
  log(`cwd ${ROOT}`);

  await pingBrrr('railway-start');

  const port = process.env.PORT ?? '8081';
  const publicDomain = requireEnv('RAILWAY_PUBLIC_DOMAIN');
  requireEnv('EXPO_TOKEN');

  process.env.EXPO_DEVTOOLS_LISTEN_ADDRESS = '0.0.0.0';
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = publicDomain;
  process.env.EXPO_PACKAGER_PROXY_URL = `https://${publicDomain}`;
  process.env.CI = 'false';

  log(`Metro proxy URL: ${process.env.EXPO_PACKAGER_PROXY_URL}`);
  log(`Expo Go URL: exp://${publicDomain}`);

  const expoBin = path.join(ROOT, 'node_modules', '.bin', 'expo');

  const expo = spawn(expoBin, ['start', '--port', port, '--host', 'lan'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  expo.on('error', (error) => {
    log(`expo failed to start: ${error.message}`);
    process.exit(1);
  });

  expo.on('exit', (code, signal) => {
    if (signal) {
      log(`expo exited via signal ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  log(`fatal: ${error.message}`);
  process.exit(1);
});
