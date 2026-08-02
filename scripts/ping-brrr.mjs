import https from 'node:https';

const WEBHOOK_SECRET =
  process.env.BRRR_WEBHOOK_SECRET ??
  'br_usr_6d7e11e27448c0090bcbcc52eb9177975dcd74a10ce84b23ba036c0d6de6b091';

const BASE_MESSAGE = process.env.BRRR_MESSAGE ?? 'Calorie tracker server restarted';
const MESSAGE = `${BASE_MESSAGE} · ${new Date().toISOString()}`;
const HOST = 'api.brrr.now';
const PATH = `/v1/${WEBHOOK_SECRET}`;

function request(method, { headers = {}, body = null, path = PATH }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: HOST,
        port: 443,
        path,
        method,
        headers,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            method,
            status: res.statusCode ?? 0,
            body: responseBody,
          });
        });
      },
    );

    req.on('error', reject);
    req.setTimeout(15_000, () => {
      req.destroy(new Error('brrr request timed out after 15s'));
    });

    if (body != null) {
      req.write(body);
    }

    req.end();
  });
}

async function pingPlainPost() {
  const body = MESSAGE;
  return request('POST', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  });
}

async function pingJsonPost() {
  const body = JSON.stringify({
    title: 'Calorie Tracker',
    message: MESSAGE,
    interruption_level: 'active',
  });

  return request('POST', {
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body,
  });
}

async function pingGet() {
  const query = new URLSearchParams({
    title: 'Calorie Tracker',
    message: MESSAGE,
  });

  return request('GET', {
    path: `${PATH}?${query.toString()}`,
  });
}

async function main() {
  const phase = process.env.BRRR_PING_PHASE ?? 'startup';
  console.log(`[brrr] ${phase} ping starting for ${HOST}${PATH}`);

  const attempts = [
    ['plain POST', pingPlainPost],
    ['JSON POST', pingJsonPost],
    ['GET', pingGet],
  ];

  let delivered = false;

  for (const [label, attempt] of attempts) {
    try {
      const result = await attempt();
      console.log(`[brrr] ${label}: HTTP ${result.status} ${result.body}`);

      if (result.status >= 200 && result.status < 300) {
        delivered = true;
        break;
      }
    } catch (error) {
      console.error(`[brrr] ${label} failed:`, error);
    }
  }

  if (!delivered) {
    console.error('[brrr] All delivery attempts failed');
    process.exitCode = 1;
  } else {
    console.log('[brrr] Ping delivered successfully');
  }
}

await main();
