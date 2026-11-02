/**
 * Carbon Khata · Phase 2 Browser & CDP Adversarial Challenger Suite (Tier 5)
 * Empirical verification of all 8 pages, responsive viewports, and 90-second demo scripts.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.TEST_PORT || '8990', 10);
const CDP_PORT = parseInt(process.env.CDP_PORT || '9225', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const serverRequests = [];
const server404s = [];

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  
  // Clean URL resolution (e.g. /tour -> /tour.html)
  let filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  serverRequests.push({ url: req.url, resolvedPath: filePath });

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    server404s.push(req.url);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found: ' + req.url);
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

function assert(cond, msg) {
  if (!cond) {
    throw new Error(`[Assertion Failure] ${msg}`);
  }
}

async function main() {
  console.log('================================================================');
  console.log(' CARBON KHATA · TIER 5 BROWSER & CDP ADVERSARIAL CHALLENGER');
  console.log(' Quest EY-Parthenon 2026 | Empirical Runtime Automation');
  console.log('================================================================');

  await new Promise(r => server.listen(PORT, r));
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${PORT}`);

  const tempDir = path.join(os.tmpdir(), 'chrome_tier5_cdp_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log(`[Chrome CDP] Launching headless browser from: ${chromePath}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${tempDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-extensions'
  ]);

  let chromeReady = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (res.ok) {
        const v = await res.json();
        console.log(`[Chrome CDP] Successfully connected to ${v.Browser}`);
        chromeReady = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!chromeReady) {
    chrome.kill();
    server.close();
    throw new Error('Failed to connect to Chrome remote debugging port ' + CDP_PORT);
  }

  const summary = {
    pagesAudited: [],
    viewportChecks: [],
    demoScriptResults: {},
    consoleErrors: [],
    brokenResources: [],
    status: 'UNKNOWN'
  };

  try {
    const PAGES = [
      'index.html',
      'platform.html',
      'solutions.html',
      'calculator.html',
      'pricing.html',
      'trust.html',
      'pilot.html',
      'tour.html'
    ];

    // Helper to open a CDP tab
    async function openTab(urlPath) {
      const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/${urlPath}`, { method: 'PUT' });
      const target = await targetRes.json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);

      let idCounter = 1;
      const pending = new Map();
      const pageErrors = [];
      const networkErrors = [];
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
          if (loadResolve) {
            loadResolve();
            loadResolve = null;
          }
        } else if (msg.method === 'Runtime.consoleAPICalled') {
          if (msg.params.type === 'error') {
            const errText = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
            pageErrors.push({ type: 'console.error', text: errText });
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          pageErrors.push({
            type: 'uncaughtException',
            text: msg.params.exceptionDetails.text,
            details: msg.params.exceptionDetails.exception?.description
          });
        } else if (msg.method === 'Network.responseReceived') {
          const resp = msg.params.response;
          if (resp.status >= 400) {
            networkErrors.push({ url: resp.url, status: resp.status, statusText: resp.statusText });
          }
        } else if (msg.method === 'Network.loadingFailed') {
          networkErrors.push({ url: msg.params.url, errorText: msg.params.errorText, canceled: msg.params.canceled });
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

      async function evaluate(expression) {
        const res = await send('Runtime.evaluate', {
          expression,
          returnByValue: true,
          awaitPromise: true
        });
        if (res.exceptionDetails) {
          throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
        }
        return res.result?.value;
      }

      await send('Page.enable');
      await send('Runtime.enable');
      await send('Network.enable');

      // Explicit navigation to target page
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${urlPath}` });
      await Promise.race([
        loadPromise,
        new Promise(r => setTimeout(r, 4000))
      ]);
      await new Promise(r => setTimeout(r, 500));

      return {
        target,
        ws,
        send,
        evaluate,
        pageErrors,
        networkErrors,
        close: async () => {
          try { ws.close(); } catch(e) {}
          await new Promise(r => setTimeout(r, 50));
          try { await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${target.id}`); } catch(e) {}
        }
      };
    }

    // =========================================================================
    // SECTION 1: AUDIT ALL 8 PAGES (0 Console Errors, 0 404s, 0 Broken Resources)
    // =========================================================================
    console.log('\n--- SECTION 1: Auditing 8 Built Pages for Console & Network Integrity ---');

    for (const pageName of PAGES) {
      console.log(`[Audit] Testing page: /${pageName}...`);
      const tab = await openTab(pageName);

      let pageInfo = null;
      for (let i = 0; i < 20; i++) {
        pageInfo = await tab.evaluate(`(() => ({
          title: document.title,
          readyState: document.readyState,
          mainPresent: !!document.getElementById('main'),
          headerPresent: !!document.querySelector('.site-header'),
          footerPresent: !!document.querySelector('.site-footer')
        }))()`);
        if (pageInfo.readyState === 'complete') break;
        await new Promise(r => setTimeout(r, 200));
      }
      console.log(`[Page Info] /${pageName}:`, pageInfo);

      assert(pageInfo.readyState === 'complete', `Page ${pageName} readyState must be complete, got ${pageInfo.readyState}`);
      assert(pageInfo.mainPresent, `Page ${pageName} must contain #main element`);
      assert(pageInfo.headerPresent, `Page ${pageName} must contain .site-header`);
      assert(pageInfo.footerPresent, `Page ${pageName} must contain .site-footer`);

      // Filter out non-fatal network cancellations if any
      const broken = tab.networkErrors.filter(n => !n.canceled);
      if (broken.length > 0) {
        console.error(`[Broken Resources] Page ${pageName} encountered network errors:`, broken);
        summary.brokenResources.push({ page: pageName, errors: broken });
      }
      assert(broken.length === 0, `Page ${pageName} had broken resources: ${JSON.stringify(broken)}`);

      if (tab.pageErrors.length > 0) {
        console.error(`[Console Errors] Page ${pageName} threw errors:`, tab.pageErrors);
        summary.consoleErrors.push({ page: pageName, errors: tab.pageErrors });
      }
      assert(tab.pageErrors.length === 0, `Page ${pageName} had console errors: ${JSON.stringify(tab.pageErrors)}`);

      summary.pagesAudited.push({
        page: pageName,
        title: pageInfo.title,
        status: 'PASSED',
        consoleErrors: 0,
        networkErrors: 0
      });

      console.log(`✓ /${pageName} passed: 0 console errors, 0 network failures ("${pageInfo.title}")`);
      await tab.close();
    }

    assert(server404s.length === 0, `HTTP Server recorded 404 requests: ${JSON.stringify(server404s)}`);
    console.log(`✓ Server recorded 0 404s across all requests.`);

    // =========================================================================
    // SECTION 2: VIEWPORT RENDERING VERIFICATION (1440px, 768px, 375px)
    // =========================================================================
    console.log('\n--- SECTION 2: Responsive Viewport Stress-Testing (1440px, 768px, 375px) ---');

    const VIEWPORTS = [
      { name: 'desktop', width: 1440, height: 900, isMobile: false },
      { name: 'tablet', width: 768, height: 1024, isMobile: false },
      { name: 'mobile', width: 375, height: 667, isMobile: true }
    ];

    for (const pageName of PAGES) {
      console.log(`[Viewport Check] Auditing ${pageName} across all 3 viewports...`);
      const tab = await openTab(pageName);
      await new Promise(r => setTimeout(r, 1000));

      for (const vp of VIEWPORTS) {
        await tab.send('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.isMobile
        });
        await tab.send('Page.reload');
        await new Promise(r => setTimeout(r, 600));

        // Evaluate scrollWidth and check for clipped interactive elements
        const vpAudit = await tab.evaluate(`(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const innerW = window.innerWidth;
          const hasHScroll = scrollW > innerW + 1; // 1px subpixel tolerance

          // Helper to check if an element is inside an intentional horizontal scroll container (e.g. swipeable dock/carousel)
          function isInsideScrollContainer(el) {
            let p = el.parentElement;
            while (p && p !== document.body && p !== document.documentElement) {
              const s = window.getComputedStyle(p);
              if (s.overflowX === 'auto' || s.overflowX === 'scroll') return true;
              p = p.parentElement;
            }
            return false;
          }

          // Check interactive buttons and inputs for right/left clipping
          const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"], select, input[type="range"]'));
          const clipped = [];
          for (const b of buttons) {
            const r = b.getBoundingClientRect();
            // only check visible buttons not inside an intentional horizontal swipe container
            if (r.width > 0 && r.height > 0 && r.top < window.innerHeight * 3 && r.bottom > -500) {
              if (!isInsideScrollContainer(b)) {
                if (r.right > innerW + 2 || r.left < -2) {
                  clipped.push({
                    tag: b.tagName,
                    id: b.id,
                    class: b.className,
                    text: b.innerText?.slice(0, 30),
                    rect: { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) }
                  });
                }
              }
            }
          }

          return {
            scrollW,
            innerW,
            hasHScroll,
            clippedCount: clipped.length,
            clippedElements: clipped.slice(0, 5)
          };
        })()`);

        if (vpAudit.hasHScroll) {
          console.warn(`[WARNING: Horizontal Overflow] ${pageName} @ ${vp.name} (${vp.width}px): scrollWidth=${vpAudit.scrollW} > innerWidth=${vpAudit.innerW}`);
        }
        if (vpAudit.clippedCount > 0) {
          console.warn(`[WARNING: Clipped Buttons] ${pageName} @ ${vp.name}: found ${vpAudit.clippedCount} clipped buttons:`, vpAudit.clippedElements);
        }

        assert(!vpAudit.hasHScroll, `Page ${pageName} has horizontal overflow at ${vp.name} (${vp.width}px): scrollWidth=${vpAudit.scrollW} > innerWidth=${vpAudit.innerW}`);
        assert(vpAudit.clippedCount === 0, `Page ${pageName} has clipped interactive elements at ${vp.name}: ${JSON.stringify(vpAudit.clippedElements)}`);

        summary.viewportChecks.push({
          page: pageName,
          viewport: vp.name,
          width: vp.width,
          scrollW: vpAudit.scrollW,
          hasHScroll: vpAudit.hasHScroll,
          clipped: vpAudit.clippedCount
        });
      }

      console.log(`✓ /${pageName} passed all 3 viewports with ZERO horizontal scrollbar and ZERO clipped buttons.`);
      await tab.close();
    }

    // =========================================================================
    // SECTION 3: 90-SECOND DEMO SCRIPT AUTOMATION
    // =========================================================================
    console.log('\n--- SECTION 3: 90-Second Demo Script Headless Automation ---');

    // -------------------------------------------------------------------------
    // STEP 1: Chapters 1-4 Walkthrough on /tour.html
    // -------------------------------------------------------------------------
    console.log('\n[Demo Step 1] Walking through Chapters 1-4 on /tour.html...');
    const tourTab = await openTab('tour.html');
    await new Promise(r => setTimeout(r, 1200));

    const tourCheck = await tourTab.evaluate(`(() => {
      assert = (cond, msg) => { if (!cond) throw new Error(msg); };
      const chaps = window.chapters;
      if (!Array.isArray(chaps) || chaps.length !== 8) {
        throw new Error("Expected window.chapters array of 8 chapters, found " + (chaps ? chaps.length : "none"));
      }

      // Check Chapter 0 (Mill)
      const c0 = chaps[0];
      const stage = document.getElementById("stage");
      stage.innerHTML = '<div class="cursor" id="cursor"><span class="ripple"></span></div>';
      const tl0 = c0.build();
      assert(!!document.querySelector(".scene"), "Chapter 0 must build a .scene");
      assert(document.getElementById("m-s1") !== null, "Chapter 0 must contain toggle #m-s1");
      assert(document.getElementById("m-pub") !== null, "Chapter 0 must contain publish button #m-pub");
      tl0.progress(1, false); // fast forward with suppressEvents=false
      const c0Published = document.getElementById("m-pub")?.textContent.includes("Published");
      const c0Reaches = { r1: document.getElementById("m-r1")?.textContent, r2: document.getElementById("m-r2")?.textContent };
      tl0.kill();

      // Check Chapter 1 (Stockist)
      const c1 = chaps[1];
      stage.innerHTML = '<div class="cursor" id="cursor"><span class="ripple"></span></div>';
      const tl1 = c1.build();
      assert(!!document.querySelector(".tallyx"), "Chapter 1 must build Tally interface .tallyx");
      const mbTextInit = document.getElementById("s-mb")?.textContent;
      tl1.progress(1, false);
      const sBlkVisible = getComputedStyle(document.getElementById("s-blk")).opacity === "1";
      const sBlkText = document.getElementById("s-blk")?.textContent;
      tl1.kill();

      // Check Chapter 2 (WhatsApp)
      const c2 = chaps[2];
      stage.innerHTML = '<div class="cursor" id="cursor"><span class="ripple"></span></div>';
      const tl2 = c2.build();
      assert(!!document.querySelector(".phone"), "Chapter 2 must build WhatsApp .phone");
      tl2.progress(1, false);
      const waBubbles = Array.from(document.querySelectorAll("#w-b .bub")).map(b => b.innerText);
      const chkOkCount = document.querySelectorAll(".chk.ok").length;
      tl2.kill();

      // Check Chapter 3 (Exporter)
      const c3 = chaps[3];
      stage.innerHTML = '<div class="cursor" id="cursor"><span class="ripple"></span></div>';
      const tl3 = c3.build();
      assert(!!document.querySelector(".scene"), "Chapter 3 must build Exporter .scene");
      tl3.progress(1, false);
      const ekText = document.getElementById("e-k")?.textContent;
      tl3.kill();

      // Test speed toggles
      const speed15 = document.querySelector('.speed-btn[data-speed="1.5"]');
      const speed1 = document.querySelector('.speed-btn[data-speed="1"]');
      speed15.click();
      const speed15Active = speed15.classList.contains("on");
      speed1.click();
      const speed1Active = speed1.classList.contains("on");

      // Test Judicial quick jump button 3 (Exporter)
      const jumpButtons = Array.from(document.querySelectorAll(".jump-btn"));
      jumpButtons[3].click();
      const activeJump3 = jumpButtons[3].classList.contains("on");
      const tChapText = document.getElementById("tChap")?.textContent;

      return {
        has8Chapters: true,
        c0: { published: c0Published, reach: c0Reaches },
        c1: { mbTextInit, sBlkVisible, sBlkText },
        c2: { bubbleCount: waBubbles.length, sampleBubble: waBubbles[0], chkOkCount },
        c3: { ekText },
        speedOk: speed15Active && speed1Active,
        jumpOk: activeJump3 && tChapText.includes("Exporter")
      };
    })()`);

    console.log('[Tour Automation Results]:', tourCheck);
    assert(tourCheck.has8Chapters, 'Tour must feature all 8 chapters');
    assert(tourCheck.c0.published, 'Chapter 0 (Mill) publish button must transition to Published ✓');
    assert(tourCheck.c1.sBlkVisible && tourCheck.c1.sBlkText.includes('Blocked: 30 t requested, 25 t left on ST-7781'), 'Chapter 1 must block 30t sale exceeding 25t available');
    assert(tourCheck.c2.chkOkCount === 3, 'Chapter 2 (WhatsApp) review desk must have 3 verified checks');
    assert(tourCheck.c3.ekText === '₹36.4 L', 'Chapter 3 (Exporter) shipment EU-2391 must show kept value of ₹36.4 L');
    assert(tourCheck.speedOk, 'Speed toggles must operate correctly');
    assert(tourCheck.jumpOk, 'Judicial quick jump to Exporter must work');

    summary.demoScriptResults.step1 = { status: 'PASS', details: tourCheck };
    console.log('✓ Step 1 passed: Product tour Chapters 1-4 successfully executed in headless automation.');
    await tourTab.close();

    // -------------------------------------------------------------------------
    // STEP 2: Try demo -> Stockist -> sell 99t -> blocked by mass-balance guard (#oversellAlert)
    // -------------------------------------------------------------------------
    console.log('\n[Demo Step 2] Navigating to /platform.html -> Stockist -> sell 99t (oversell guard)...');
    const platformTab = await openTab('platform.html');
    await new Promise(r => setTimeout(r, 1200));

    const stockistOversellCheck = await platformTab.evaluate(`(() => {
      // 1. Click Stockist in persona dock
      const stockistBtn = document.querySelector('[data-dock-role="stockist"]') || document.querySelector('#roleSel option[value="stockist"]');
      if (!stockistBtn) return { error: "No Stockist button found" };
      if (stockistBtn.click) stockistBtn.click();
      else if (stockistBtn.tagName === 'OPTION') {
        document.getElementById('roleSel').value = 'stockist';
        document.getElementById('roleSel').dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Inspect active lot ST-7781
      const activeLotRow = document.querySelector('tr[data-lot="ST-7781"]');
      const meterTextBefore = document.querySelector('.range-row.small')?.innerText;
      
      // 3. Attempt to record sale of 99 tonnes
      const tonsInput = document.getElementById("tons");
      const saleForm = document.getElementById("saleForm");
      if (!tonsInput || !saleForm) return { error: "No #tons or #saleForm found" };

      tonsInput.value = "99";
      saleForm.dispatchEvent(new Event("submit", { cancelable: true }));

      // 4. Inspect #oversellAlert and DOM state
      const alertEl = document.getElementById("oversellAlert");
      const meterTextAfter = document.querySelector('.range-row.small')?.innerText;
      const salesCount = document.querySelectorAll('.panel-b table.data tbody tr').length;

      return {
        stockistSelected: stockistBtn.classList.contains("active"),
        hasActiveLot: !!activeLotRow,
        meterTextBefore,
        alertExists: !!alertEl,
        alertTitle: alertEl?.querySelector('.alert-title')?.innerText,
        alertP: alertEl?.querySelector('p')?.innerText,
        meterTextAfter,
        salesCount
      };
    })()`);

    console.log('[Stockist Oversell Guard Results]:', stockistOversellCheck);
    assert(stockistOversellCheck.stockistSelected, 'Stockist role must be activated');
    assert(stockistOversellCheck.alertExists, '#oversellAlert must appear in DOM');
    assert(stockistOversellCheck.alertTitle.includes('MASS-BALANCE VIOLATION PREVENTED'), 'Alert must declare MASS-BALANCE VIOLATION PREVENTED');
    assert(stockistOversellCheck.alertP.includes('Blocked. Only 25 t of ST-7781 is left'), 'Alert must state: Blocked. Only 25 t of ST-7781 is left');
    assert(stockistOversellCheck.meterTextAfter === stockistOversellCheck.meterTextBefore, 'Mass balance meter must remain uncorrupted');
    assert(stockistOversellCheck.salesCount === 2, 'No illegal sale record was appended');

    summary.demoScriptResults.step2 = { status: 'PASS', details: stockistOversellCheck };
    console.log('✓ Step 2 passed: Stockist 99t sale strictly blocked by mass-balance guard (#oversellAlert).');
    await platformTab.close();

    // -------------------------------------------------------------------------
    // STEP 3: Open Calculator -> drag traced share from 100% to 0% and back -> show ₹36.4L impact live
    // -------------------------------------------------------------------------
    console.log('\n[Demo Step 3] Testing /calculator.html -> drag traced share 100% -> 0% -> 100%...');
    const calcTab = await openTab('calculator.html');
    await new Promise(r => setTimeout(r, 1200));

    const calcLiveCheck = await calcTab.evaluate(`(() => {
      const results = {};

      // Initial state: 120t, bolts, 2026, 100% traced
      const mDef0 = document.getElementById("mDef").textContent.trim();
      const mAct0 = document.getElementById("mAct").textContent.trim();
      const mSave0 = document.getElementById("mSave").textContent.trim();
      const tracedOut0 = document.getElementById("tracedOut").textContent.trim();
      const rec0 = document.getElementById("recoveryNotice");
      const recAchieved0 = rec0.classList.contains("achieved");

      results.initial100 = { mDef0, mAct0, mSave0, tracedOut0, recAchieved0, recDisplay: rec0.style.display };

      // Drag to 0%
      const slider = document.getElementById("traced");
      slider.value = "0";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));

      const mActZero = document.getElementById("mAct").textContent.trim();
      const mSaveZero = document.getElementById("mSave").textContent.trim();
      const tracedOutZero = document.getElementById("tracedOut").textContent.trim();
      const recAchievedZero = rec0.classList.contains("achieved");
      const recTextZero = rec0.innerText;

      results.at0 = { mActZero, mSaveZero, tracedOutZero, recAchievedZero, recTextZero };

      // Drag to 50%
      slider.value = "50";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      const mSave50 = document.getElementById("mSave").textContent.trim();
      const recText50 = rec0.innerText;
      results.at50 = { mSave50, recText50 };

      // Drag back to 100%
      slider.value = "100";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));

      const mDefRestored = document.getElementById("mDef").textContent.trim();
      const mActRestored = document.getElementById("mAct").textContent.trim();
      const mSaveRestored = document.getElementById("mSave").textContent.trim();
      const tracedOutRestored = document.getElementById("tracedOut").textContent.trim();
      const recAchievedRestored = rec0.classList.contains("achieved");

      results.restored100 = { mDefRestored, mActRestored, mSaveRestored, tracedOutRestored, recAchievedRestored };

      return results;
    })()`);

    console.log('[Calculator Live Drag Results]:', JSON.stringify(calcLiveCheck, null, 2));
    assert(calcLiveCheck.initial100.mSave0 === '₹36.4 L', `Initial saving must be ₹36.4 L, got ${calcLiveCheck.initial100.mSave0}`);
    assert(calcLiveCheck.initial100.mAct0 === '₹10.4 L', `Initial actual cost must be ₹10.4 L, got ${calcLiveCheck.initial100.mAct0}`);
    assert(calcLiveCheck.initial100.mDef0 === '₹46.8 L', `Initial default cost must be ₹46.8 L, got ${calcLiveCheck.initial100.mDef0}`);
    assert(calcLiveCheck.initial100.recAchieved0 === true, 'Initial recoveryNotice must have .achieved at 100%');

    assert(calcLiveCheck.at0.tracedOutZero === '0%', 'Traced output must update to 0%');
    assert(calcLiveCheck.at0.mActZero === '₹33.6 L', `Actual cost at 0% traced must be ₹33.6 L, got ${calcLiveCheck.at0.mActZero}`);
    assert(calcLiveCheck.at0.mSaveZero === '₹13.2 L', `Savings at 0% traced must drop to ₹13.2 L, got ${calcLiveCheck.at0.mSaveZero}`);
    assert(calcLiveCheck.at0.recAchievedZero === false, 'Recovery notice must NOT be achieved at 0%');
    assert(calcLiveCheck.at0.recTextZero.includes('trace just 84 more tonnes'), 'At 120t @ 0%, needed tonnes to reach 70% threshold must be 84 tonnes');

    assert(calcLiveCheck.restored100.tracedOutRestored === '100%', 'Traced output must return to 100%');
    assert(calcLiveCheck.restored100.mSaveRestored === '₹36.4 L', `Restored saving must be ₹36.4 L live, got ${calcLiveCheck.restored100.mSaveRestored}`);
    assert(calcLiveCheck.restored100.mActRestored === '₹10.4 L', `Restored actual cost must return to ₹10.4 L, got ${calcLiveCheck.restored100.mActRestored}`);
    assert(calcLiveCheck.restored100.recAchievedRestored === true, 'Restored state must have achieved badge');

    summary.demoScriptResults.step3 = { status: 'PASS', details: calcLiveCheck };
    console.log('✓ Step 3 passed: Calculator traced share slider dragged 100% -> 0% -> 100% displaying live ₹36.4L impact.');
    await calcTab.close();

    summary.status = 'PASS';
    console.log('\n================================================================');
    console.log(' ALL EMPIRICAL CHALLENGES PASSED! ZERO DEFECTS FOUND (100% PASS)');
    console.log('================================================================\n');

  } finally {
    chrome.kill();
    server.close();
  }
}

main().catch(err => {
  console.error('\n❌ FATAL CHALLENGE FAILURE:', err);
  process.exit(1);
});
