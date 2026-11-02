import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8080;
const CDP_PORT = 9224;
const SCREENSHOT_DIR = path.resolve('screenshots');

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-mob-'));
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    `--user-data-dir=${tempDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=390,844'
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
    throw new Error('Chrome failed to start on port ' + CDP_PORT);
  }

  console.log('[CDP Mobile] Chrome connected at 390x844 (iPhone 14/15 viewport). Capturing mobile proofs...');

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
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await loadPromise;
    await new Promise(r => setTimeout(r, 700));

    // Check for horizontal overflow
    const overflowCheck = await send('Runtime.evaluate', {
      expression: `({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      })`,
      returnByValue: true
    });

    if (evaluateFn) {
      await send('Runtime.evaluate', { expression: `(${evaluateFn.toString()})()`, awaitPromise: true });
      await new Promise(r => setTimeout(r, 600));
    }

    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
    console.log(`✓ Mobile: ${filename} (Overflow: ${overflowCheck.result.value.hasHorizontalOverflow ? 'FAIL' : 'NONE'}, ${Math.round(fs.statSync(outPath).size / 1024)} KB)`);

    ws.close();
  }

  try {
    await capturePage('', 'mobile_01_home_hero.png');
    await capturePage('', 'mobile_02_nav_drawer.png', () => {
      const toggle = document.querySelector('.menu-toggle');
      if (toggle) toggle.click();
    });
    await capturePage('platform', 'mobile_03_platform_dock.png');
    await capturePage('platform', 'mobile_04_platform_oversell_block.png', () => {
      const btn = document.getElementById('sc1_oversell');
      if (btn) btn.click();
    });
    await capturePage('calculator', 'mobile_05_calculator.png', () => {
      const slider = document.getElementById('traced');
      if (slider) {
        slider.value = 50;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await capturePage('pricing', 'mobile_06_pricing.png');
    await capturePage('trust', 'mobile_07_trust_accordion.png', () => {
      const firstDetails = document.querySelector('details.card');
      if (firstDetails) firstDetails.open = true;
    });
    await capturePage('pilot', 'mobile_08_pilot.png');
    console.log('[CDP Mobile] All 8 mobile verification screenshots captured successfully!');
  } finally {
    chrome.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
