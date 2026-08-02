const { spawnSync } = require('node:child_process');
const path = require('node:path');

let pinged = false;

function pingBrrrOnce(phase = 'metro') {
  if (pinged) {
    return;
  }

  pinged = true;

  const scriptPath = path.join(__dirname, 'ping-brrr.mjs');
  console.log(`[brrr] triggering ${phase} ping via ${scriptPath}`);

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      BRRR_PING_PHASE: phase,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error(`[brrr] ${phase} ping exited with code ${result.status ?? 'unknown'}`);
  }
}

module.exports = { pingBrrrOnce };
