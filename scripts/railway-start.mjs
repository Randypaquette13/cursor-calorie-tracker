import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function log(message) {
  console.log(`[railway-start] ${message}`);
}

function pingBrrrOnce() {
  log('Sending brrr ping');

  const result = spawnSync(process.execPath, [path.join(__dirname, 'ping-brrr.mjs')], {
    cwd: ROOT,
    env: {
      ...process.env,
      BRRR_PING_PHASE: 'railway-start',
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    log(`brrr ping exited with code ${result.status ?? 'unknown'}`);
  }
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

  pingBrrrOnce();

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
