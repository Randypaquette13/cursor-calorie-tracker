const BRRR_URL =
  'https://api.brrr.now/v1/br_usr_6d7e11e27448c0090bcbcc52eb9177975dcd74a10ce84b23ba036c0d6de6b091';
const BRRR_MESSAGE = 'Calorie tracker server restarted';

async function pingBrrr() {
  console.log('[brrr] Sending startup ping...');

  try {
    const response = await fetch(BRRR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Calorie Tracker',
        message: BRRR_MESSAGE,
      }),
    });

    const body = await response.text();
    console.log(`[brrr] Response HTTP ${response.status}: ${body}`);

    if (!response.ok) {
      console.error('[brrr] Non-success status from brrr.now');
    }
  } catch (error) {
    console.error('[brrr] Startup ping failed:', error);
  }
}

await pingBrrr();
