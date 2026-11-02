import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8080;
const CDP_PORT = 9223;
const SCREENSHOT_DIR = path.resolve('screenshots');

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-ss-'));
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    `--user-data-dir=${tempDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900'
  ]);

  let chromeReady = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) {
        chromeReady = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!chromeReady) {
    chrome.kill();
    throw new Error('Chrome failed to start');
  }

  console.log('[CDP] Chrome connected. Capturing visual proof screenshots...');

  async function capturePage(urlPath, filename, evaluateFn = null) {
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/${urlPath}`, { method: 'PUT' });
    const target = await targetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let idCounter = 1;
    const pending = new Map();
    let loadResolve = null;
    const loadPromise = new Promise(r => loadResolve = r);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Page.loadEventFired') {
        if (loadResolve) loadResolve();
      }
    };

    await new Promise(r => ws.onopen = r);
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    await loadPromise;
    await new Promise(r => setTimeout(r, 600));

    if (evaluateFn) {
      await send('Runtime.evaluate', { expression: `(${evaluateFn.toString()})()`, awaitPromise: true });
      await new Promise(r => setTimeout(r, 500));
    }

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`✓ Captured ${filename} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);

    ws.close();
  }

  try {
    await capturePage('', '01_home_hero.png');
    await capturePage('platform', '02_platform_command_deck.png');
    await capturePage('platform', '03_platform_oversell_block.png', () => {
      const btn = document.getElementById('sc1_oversell');
      if (btn) btn.click();
    });
    await capturePage('calculator', '04_calculator_recovery.png', () => {
      const slider = document.getElementById('traced');
      if (slider) {
        slider.value = 50;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await capturePage('pricing', '05_pricing_unit_economics.png');
    await capturePage('trust', '06_trust_custody_chain.png');
    console.log('[CDP] All screenshots saved to screenshots/');
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
