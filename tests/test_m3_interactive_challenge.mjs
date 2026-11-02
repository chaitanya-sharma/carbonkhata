/**
 * Carbon Khata · Milestone 3 Interactive CDP & Scenario Challenge Suite
 * Independent empirical verification of Persona Command Deck, Scenarios, and Responsive Layout.
 * 
 * Usage:
 *   node tests/test_m3_interactive_challenge.mjs
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
const PORT = 8997;
const CDP_PORT = 9227;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/platform.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function main() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`[Challenge Suite] Static server running on http://127.0.0.1:${PORT}`);

  const tempDir = path.join(os.tmpdir(), 'chrome_m3_challenger_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log(`[Challenge Suite] Spawning Chrome: ${chromePath}`);
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
        console.log(`[Challenge Suite] Chrome CDP connected: ${v.Browser}`);
        chromeReady = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  if (!chromeReady) {
    chrome.kill();
    server.close();
    throw new Error('Timeout connecting to Chrome CDP on port ' + CDP_PORT);
  }

  const results = {
    personaDock: null,
    scenario1: null,
    massBalanceEdgeCases: null,
    scenario2: null,
    jsonExport: null,
    drawerModal: null,
    scenario3: null,
    loanInteractions: null,
    responsiveLayout: null,
    consoleErrors: []
  };

  try {
    // Open new tab targeting platform.html
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/platform.html`, { method: 'PUT' });
    const target = await targetRes.json();
    console.log(`[Challenge Suite] Target tab created: ${target.id}`);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          results.consoleErrors.push({ type: 'console.error', text: msg.params.args.map(a => a.value || a.description).join(' ') });
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        results.consoleErrors.push({
          type: 'uncaughtException',
          text: msg.params.exceptionDetails.text,
          details: msg.params.exceptionDetails.exception?.description
        });
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
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
        throw new Error(`CDP Eval Error: ${res.exceptionDetails.text} - ${JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result ? res.result.value : undefined;
    }

    await send('Runtime.enable');
    await send('Page.enable');
    await send('DOM.enable');

    // Wait for document load
    await new Promise(r => setTimeout(r, 600));

    console.log('\n======================================================');
    console.log(' TEST 1: Persona Quick-Switch Dock (F10) Verification');
    console.log('======================================================');
    const dockAudit = await evaluate(`(() => {
      const deck = document.getElementById('commandDeck');
      const dock = document.getElementById('personaQuickSwitch');
      const pills = Array.from(document.querySelectorAll('.dock-pill'));
      const roles = pills.map(p => ({
        role: p.dataset.dockRole,
        title: p.querySelector('.dock-pill-title')?.textContent?.trim(),
        sub: p.querySelector('.dock-pill-sub')?.textContent?.trim(),
        badge: p.querySelector('.dock-pill-badge')?.textContent?.trim(),
        ariaSelected: p.getAttribute('aria-selected'),
        isActive: p.classList.contains('active')
      }));
      return {
        hasDeck: !!deck,
        hasDock: !!dock,
        pillCount: pills.length,
        roles
      };
    })()`);

    console.log(`Command Deck exists: ${dockAudit.hasDeck}, Dock exists: ${dockAudit.hasDock}, Pills: ${dockAudit.pillCount}`);
    if (dockAudit.pillCount !== 7) throw new Error(`Expected 7 dock pills, found ${dockAudit.pillCount}`);

    // Click each dock pill directly via DOM click
    const expectedRoles = [
      { role: "exporter", expectedTitle: "Overview" },
      { role: "stockist", expectedTitle: "Steel lots" },
      { role: "mill", expectedTitle: "Reports" },
      { role: "verifier", expectedTitle: "Ludhiana campaign" },
      { role: "importer", expectedTitle: "Imports" },
      { role: "lender", expectedTitle: "Applications" },
      { role: "cluster", expectedTitle: "Pilot dashboard" }
    ];

    const personaTransitions = [];
    for (const er of expectedRoles) {
      const transitionResult = await evaluate(`(() => {
        const pill = document.querySelector(\`[data-dock-role="\${'${er.role}'}"]\`);
        if (!pill) return { error: 'Pill not found' };
        pill.click();
        const activePill = document.querySelector('.dock-pill.active');
        const roleSel = document.getElementById('roleSel');
        const viewTitle = document.getElementById('viewTitle');
        const appBody = document.getElementById('appBody');
        const allPills = Array.from(document.querySelectorAll('.dock-pill'));
        const activeCount = allPills.filter(p => p.classList.contains('active')).length;
        return {
          clickedRole: '${er.role}',
          activePillRole: activePill?.dataset.dockRole,
          activeAriaSelected: activePill?.getAttribute('aria-selected'),
          activeCount,
          roleSelVal: roleSel?.value,
          viewTitle: viewTitle?.textContent?.trim(),
          bodyChildren: appBody?.children.length,
          hash: location.hash
        };
      })()`);

      console.log(`Pill click [${er.role}] -> Active: ${transitionResult.activePillRole}, Title: "${transitionResult.viewTitle}", RoleSel: ${transitionResult.roleSelVal}, Hash: ${transitionResult.hash}`);
      if (transitionResult.activePillRole !== er.role) throw new Error(`Active pill role mismatch for ${er.role}`);
      if (transitionResult.activeAriaSelected !== 'true') throw new Error(`aria-selected was not true for ${er.role}`);
      if (transitionResult.activeCount !== 1) throw new Error(`Expected exactly 1 active pill, found ${transitionResult.activeCount}`);
      if (transitionResult.roleSelVal !== er.role) throw new Error(`roleSel mismatch for ${er.role}`);
      if (transitionResult.viewTitle !== er.expectedTitle) throw new Error(`viewTitle mismatch for ${er.role}: expected "${er.expectedTitle}", got "${transitionResult.viewTitle}"`);
      personaTransitions.push(transitionResult);
    }

    // Bidirectional sync: change roleSel dropdown directly
    const roleSelSync = await evaluate(`(() => {
      const sel = document.getElementById('roleSel');
      sel.value = 'stockist';
      sel.dispatchEvent(new Event('change'));
      const activePill = document.querySelector('.dock-pill.active')?.dataset.dockRole;
      return {
        selected: sel.value,
        activePill
      };
    })()`);
    console.log(`Dropdown change -> active pill: ${roleSelSync.activePill}`);
    if (roleSelSync.activePill !== 'stockist') throw new Error('Changing roleSel did not activate stockist pill');

    results.personaDock = { status: 'PASS', pillCount: dockAudit.pillCount, transitions: personaTransitions };

    console.log('\n======================================================');
    console.log(' TEST 2: Demo Scenario 1 (Stockist Oversell Guard)');
    console.log('======================================================');
    const s1Result = await evaluate(`(() => {
      const s1Btn = document.getElementById('demoScenario1');
      if (!s1Btn) return { error: 'No #demoScenario1 button' };
      s1Btn.click();

      const activePill = document.querySelector('.dock-pill.active')?.dataset.dockRole;
      const roleSel = document.getElementById('roleSel')?.value;
      const viewTitle = document.getElementById('viewTitle')?.textContent?.trim();
      const tonsVal = document.getElementById('tons')?.value;
      const alertEl = document.getElementById('oversellAlert');
      const alertTitle = alertEl?.querySelector('.alert-title')?.textContent?.trim();
      const alertP = alertEl?.querySelector('p')?.textContent?.trim();
      const toastText = document.getElementById('toast')?.textContent?.trim();
      const toastVisible = document.getElementById('toast')?.classList.contains('show');

      // Check that tonnes were not added to sales
      const activeLotRow = document.querySelector('tr[data-lot="ST-7781"]');
      const salesTableText = document.querySelector('.range-row.small')?.textContent?.trim();

      return {
        activePill,
        roleSel,
        viewTitle,
        tonsVal,
        hasAlert: !!alertEl,
        alertTitle,
        alertP,
        toastText,
        toastVisible,
        salesTableText
      };
    })()`);

    console.log(`Scenario 1 Triggered:`);
    console.log(`- Role: ${s1Result.activePill} (view: ${s1Result.viewTitle})`);
    console.log(`- Tons value: ${s1Result.tonsVal}`);
    console.log(`- Alert Title: "${s1Result.alertTitle}"`);
    console.log(`- Alert P: "${s1Result.alertP}"`);
    console.log(`- Toast: "${s1Result.toastText}" (visible: ${s1Result.toastVisible})`);
    console.log(`- Mass balance display: "${s1Result.salesTableText}"`);

    if (s1Result.activePill !== 'stockist') throw new Error('Scenario 1 did not switch to stockist');
    if (s1Result.tonsVal !== '99') throw new Error('Scenario 1 tons value is not 99');
    if (!s1Result.hasAlert) throw new Error('Scenario 1 did not render #oversellAlert');
    if (!s1Result.alertTitle.includes('MASS-BALANCE VIOLATION PREVENTED')) throw new Error('Scenario 1 alert title missing required phrase');
    if (!s1Result.alertP.includes('Blocked. Only 25 t of ST-7781 is left')) throw new Error('Scenario 1 alert text missing required block message');
    if (!s1Result.toastText.includes('Mass-balance guard: 99t sale strictly blocked')) throw new Error('Scenario 1 toast text incorrect');
    if (!s1Result.salesTableText.includes('75 of 100 t sold')) throw new Error('99t was improperly added to lot sales!');

    results.scenario1 = { status: 'PASS', details: s1Result };

    console.log('\n--- Adversarial Mass-Balance Edge Case Testing ---');
    // Test:
    // 1. Valid exact capacity: 25t sale should succeed
    // 2. Next 1t sale should fail with "Blocked. Only 0 t of ST-7781 is left"
    // 3. 0t sale should show "Enter tonnes above zero."
    // 4. -10t sale should show "Enter tonnes above zero."
    const mbEdgeResult = await evaluate(`(() => {
      const results = {};

      // 1. Valid 25t
      let tons = document.getElementById('tons');
      let form = document.getElementById('saleForm');
      tons.value = '25';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      const after25Alert = document.getElementById('oversellAlert');
      const after25Text = document.querySelector('.range-row.small')?.textContent?.trim();
      results.exact25 = {
        hasAlert: !!after25Alert,
        meterText: after25Text
      };

      // 2. 1t when 0t left
      tons = document.getElementById('tons');
      form = document.getElementById('saleForm');
      tons.value = '1';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      const afterZeroAlert = document.getElementById('oversellAlert');
      results.overBy1 = {
        hasAlert: !!afterZeroAlert,
        alertP: afterZeroAlert?.querySelector('p')?.textContent?.trim()
      };

      // 3. Zero tonnes
      tons = document.getElementById('tons');
      form = document.getElementById('saleForm');
      tons.value = '0';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      results.zeroTonnes = {
        msgText: document.getElementById('saleMsg')?.textContent?.trim()
      };

      // 4. Negative tonnes
      tons = document.getElementById('tons');
      form = document.getElementById('saleForm');
      tons.value = '-10';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      results.negativeTonnes = {
        msgText: document.getElementById('saleMsg')?.textContent?.trim()
      };

      return results;
    })()`);

    console.log('Mass balance edge case results:', JSON.stringify(mbEdgeResult, null, 2));
    if (mbEdgeResult.exact25.hasAlert) throw new Error('Exact 25t sale was improperly blocked');
    if (!mbEdgeResult.exact25.meterText.includes('100 of 100 t sold')) throw new Error('Exact 25t sale did not update meter to 100 of 100 t');
    if (!mbEdgeResult.overBy1.hasAlert) throw new Error('1t sale when 0t left was not blocked');
    if (!mbEdgeResult.overBy1.alertP.includes('Blocked. Only 0 t of ST-7781 is left')) throw new Error('Incorrect message for 0t left');
    if (!mbEdgeResult.zeroTonnes.msgText.includes('Enter tonnes above zero')) throw new Error('0t did not trigger positive tonnes validation');
    if (!mbEdgeResult.negativeTonnes.msgText.includes('Enter tonnes above zero')) throw new Error('Negative tonnes did not trigger validation');

    results.massBalanceEdgeCases = { status: 'PASS', details: mbEdgeResult };

    console.log('\n======================================================');
    console.log(' TEST 3: Demo Scenario 2 (WhatsApp OCR to EU-2391)');
    console.log('======================================================');
    const s2Result = await evaluate(`(() => {
      const s2Btn = document.getElementById('demoScenario2');
      if (!s2Btn) return { error: 'No #demoScenario2 button' };
      s2Btn.click();

      const drawer = document.getElementById('drawer');
      const drawerOpen = drawer?.dataset.open;
      const kicker = document.getElementById('drawerKicker')?.textContent?.trim();
      const title = document.getElementById('drawerTitle')?.textContent?.trim();
      const bodyHtml = document.getElementById('drawerBody')?.innerHTML;
      const bodyText = document.getElementById('drawerBody')?.innerText;
      const toastText = document.getElementById('toast')?.textContent?.trim();
      const toastVisible = document.getElementById('toast')?.classList.contains('show');

      const dlBtn = document.getElementById('dl');

      return {
        drawerOpen,
        kicker,
        title,
        hasMillReport: bodyText.includes('RPT-2026-0142') && bodyText.includes('Sample Integrated Steel'),
        hasHeatNumber: bodyText.includes('H-24K118'),
        hasPunjabFuels: bodyText.includes('Punjab Fuels #INV-3200'),
        hasWeighbridge: bodyText.includes('Weighbridge Slip WR-5.5-A'),
        toastText,
        toastVisible,
        hasDlBtn: !!dlBtn,
        dlBtnText: dlBtn?.textContent?.trim()
      };
    })()`);

    console.log(`Scenario 2 Triggered:`);
    console.log(`- Drawer Open: ${s2Result.drawerOpen}`);
    console.log(`- Kicker: "${s2Result.kicker}"`);
    console.log(`- Title: "${s2Result.title}"`);
    console.log(`- Mill Report: ${s2Result.hasMillReport}, Heat #: ${s2Result.hasHeatNumber}`);
    console.log(`- Punjab Fuels OCR: ${s2Result.hasPunjabFuels}, Weighbridge Slip: ${s2Result.hasWeighbridge}`);
    console.log(`- Toast: "${s2Result.toastText}"`);

    if (s2Result.drawerOpen !== 'true') throw new Error('Scenario 2 did not open drawer');
    if (!s2Result.kicker.includes('EU-2391')) throw new Error('Drawer kicker missing EU-2391');
    if (!s2Result.hasMillReport) throw new Error('Drawer body missing Mill Report RPT-2026-0142 (Sample Integrated Steel)');
    if (!s2Result.hasHeatNumber) throw new Error('Drawer body missing Heat # H-24K118');
    if (!s2Result.hasPunjabFuels) throw new Error('Drawer body missing Punjab Fuels #INV-3200');
    if (!s2Result.hasWeighbridge) throw new Error('Drawer body missing Weighbridge Slip WR-5.5-A');
    if (!s2Result.toastText.includes('Opened EU-2391: WhatsApp receipt linked to mill heat number')) throw new Error('Scenario 2 toast text incorrect');

    results.scenario2 = { status: 'PASS', details: s2Result };

    console.log('\n--- JSON Export Interception & Schema Verification ---');
    const jsonTest = await evaluate(`(() => {
      let interceptedPkg = null;
      let interceptedFilename = null;
      const origCreate = URL.createObjectURL;
      const origClick = HTMLAnchorElement.prototype.click;

      URL.createObjectURL = (blob) => {
        const reader = new FileReaderSync();
        try {
          // If FileReaderSync is not available, we read blob via text promise
        } catch(e) {}
        return "blob:mock-url";
      };

      // We can inspect the dl button handler directly or monkey-patch document.createElement('a')
      const origCreateElement = document.createElement;
      document.createElement = function(tag) {
        const el = origCreateElement.call(document, tag);
        if (tag.toLowerCase() === 'a') {
          el.click = function() {
            interceptedFilename = el.download;
          };
        }
        return el;
      };

      // Also grab package from dl onclick context by executing dl button
      let blobCaptured = null;
      window.URL.createObjectURL = function(blob) {
        blobCaptured = blob;
        return "blob:captured";
      };

      document.getElementById('dl').click();

      // restore
      document.createElement = origCreateElement;
      window.URL.createObjectURL = origCreate;

      return {
        filename: interceptedFilename,
        hasBlob: !!blobCaptured,
        blobSize: blobCaptured ? blobCaptured.size : 0,
        blobType: blobCaptured ? blobCaptured.type : null
      };
    })()`);

    console.log(`JSON Export result:`, jsonTest);
    if (jsonTest.filename !== 'carbon-khata-EU-2391.json') throw new Error(`Expected filename carbon-khata-EU-2391.json, got ${jsonTest.filename}`);
    if (!jsonTest.hasBlob) throw new Error('JSON Blob was not created on download click');

    results.jsonExport = { status: 'PASS', details: jsonTest };

    console.log('\n--- Drawer Modal & Scroll-Lock Verification ---');
    const modalTest = await evaluate(`(() => {
      const drawer = document.getElementById('drawer');
      const bodyOverflowInitial = document.body.style.overflow;

      // Press Escape key
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const openAfterEsc = drawer.dataset.open;
      const bodyOverflowAfterEsc = document.body.style.overflow;

      // Open drawer again via scenario 2
      window.CK_DEMO.scenario2();
      const openAfterReopen = drawer.dataset.open;

      // Click close button
      const closeBtn = drawer.querySelector('.icon-btn[data-close]');
      closeBtn.click();
      const openAfterCloseBtn = drawer.dataset.open;
      const bodyOverflowAfterClose = document.body.style.overflow;

      return {
        bodyOverflowInitial,
        openAfterEsc,
        bodyOverflowAfterEsc,
        openAfterReopen,
        openAfterCloseBtn,
        bodyOverflowAfterClose
      };
    })()`);

    console.log('Modal test results:', modalTest);
    if (modalTest.bodyOverflowInitial !== 'hidden') throw new Error('Drawer did not lock body scroll when opened');
    if (modalTest.openAfterEsc !== 'false') throw new Error('Escape key failed to close drawer');
    if (modalTest.bodyOverflowAfterEsc !== '') throw new Error('Escape key did not restore body scroll');
    if (modalTest.openAfterCloseBtn !== 'false') throw new Error('Close button failed to close drawer');

    results.drawerModal = { status: 'PASS', details: modalTest };

    console.log('\n======================================================');
    console.log(' TEST 4: Demo Scenario 3 (SIDBI Green Loan Checklist)');
    console.log('======================================================');
    const s3Result = await evaluate(`(() => {
      const s3Btn = document.getElementById('demoScenario3');
      if (!s3Btn) return { error: 'No #demoScenario3 button' };
      s3Btn.click();

      const activePill = document.querySelector('.dock-pill.active')?.dataset.dockRole;
      const roleSel = document.getElementById('roleSel')?.value;
      const viewTitle = document.getElementById('viewTitle')?.textContent?.trim();
      const checklist = document.getElementById('sidbiChecklist');
      const checklistText = checklist?.innerText;
      const toastText = document.getElementById('toast')?.textContent?.trim();

      return {
        activePill,
        roleSel,
        viewTitle,
        hasChecklist: !!checklist,
        hasEmissions106: checklistText.includes('1.06 tCO₂e/t Certified'),
        has50Bps: checklistText.includes('50 bps Concession Unlocked') && checklistText.includes('-50 bps (₹2.0 L/yr)'),
        hasPrecursor100: checklistText.includes('100% Traced & Audited'),
        hasIR20252546: checklistText.includes('IR 2025/2546 Verified'),
        toastText
      };
    })()`);

    console.log(`Scenario 3 Triggered:`);
    console.log(`- Role: ${s3Result.activePill} (view: ${s3Result.viewTitle})`);
    console.log(`- Checklist exists: ${s3Result.hasChecklist}`);
    console.log(`- 1.06 tCO2e/t Certified: ${s3Result.hasEmissions106}`);
    console.log(`- 50 bps concession: ${s3Result.has50Bps}`);
    console.log(`- Precursor traceability: ${s3Result.hasPrecursor100}`);
    console.log(`- IR 2025/2546 verification: ${s3Result.hasIR20252546}`);
    console.log(`- Toast: "${s3Result.toastText}"`);

    if (s3Result.activePill !== 'lender') throw new Error('Scenario 3 did not switch role to lender');
    if (!s3Result.hasChecklist) throw new Error('Missing #sidbiChecklist');
    if (!s3Result.hasEmissions106) throw new Error('SIDBI checklist missing "1.06 tCO₂e/t Certified"');
    if (!s3Result.has50Bps) throw new Error('SIDBI checklist missing 50 bps concession');
    if (!s3Result.hasPrecursor100) throw new Error('SIDBI checklist missing 100% traced precursor criteria');
    if (!s3Result.hasIR20252546) throw new Error('SIDBI checklist missing IR 2025/2546 verified criteria');
    if (!s3Result.toastText.includes('Lender view: verified 1.06 tCO2e/t unlocks green loan')) throw new Error('Scenario 3 toast text incorrect');

    results.scenario3 = { status: 'PASS', details: s3Result };

    console.log('\n--- Lender Interactive Loan Actions ---');
    const loanActionTest = await evaluate(`(() => {
      const apBtn = document.getElementById('ap');
      const infBtn = document.getElementById('inf');
      if (!apBtn || !infBtn) return { error: 'Missing loan buttons' };

      // Click Approve
      apBtn.click();
      const toastAfterAp = document.getElementById('toast')?.textContent?.trim();
      const badgeAfterAp = document.querySelector('.panel-h .badge')?.textContent?.trim();

      // Click Request Info
      infBtn.click();
      const toastAfterInf = document.getElementById('toast')?.textContent?.trim();
      const badgeAfterInf = document.querySelector('.panel-h .badge')?.textContent?.trim();

      return {
        toastAfterAp,
        badgeAfterAp,
        toastAfterInf,
        badgeAfterInf
      };
    })()`);

    console.log('Loan action results:', loanActionTest);
    if (loanActionTest.badgeAfterAp !== 'Approved') throw new Error('Approve button did not update loan badge to Approved');
    if (loanActionTest.badgeAfterInf !== 'Information requested') throw new Error('Request info button did not update loan badge');

    results.loanInteractions = { status: 'PASS', details: loanActionTest };

    console.log('\n======================================================');
    console.log(' TEST 5: Responsive Layout & Zero Horizontal Scroll');
    console.log('======================================================');
    const testViewports = [
      { name: "Desktop Wide", width: 1440, height: 900 },
      { name: "Desktop Regular", width: 1200, height: 800 },
      { name: "Dock Breakpoint", width: 1080, height: 800 },
      { name: "Judge Grid Breakpoint", width: 900, height: 750 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Mobile Swipe Breakpoint", width: 640, height: 800 },
      { name: "Mobile iPhone SE", width: 375, height: 667 },
      { name: "Mobile Narrow", width: 320, height: 568 }
    ];

    const vpResults = [];
    for (const vp of testViewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768
      });
      await new Promise(r => setTimeout(r, 120));

      const vpAudit = await evaluate(`(() => {
        const docEl = document.documentElement;
        const winW = window.innerWidth;
        const scrollW = docEl.scrollWidth;
        const clientW = docEl.clientWidth;

        // Check for any element overflowing the viewport
        const allElements = Array.from(document.querySelectorAll('*'));
        const overflowingEls = [];
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > winW + 1) {
            overflowingEls.push({
              tag: el.tagName,
              id: el.id,
              cls: el.className,
              right: Math.round(rect.right),
              excess: Math.round(rect.right - winW)
            });
          }
        }

        // Element clipping check against commandDeck
        const deck = document.getElementById('commandDeck');
        const dr = deck ? deck.getBoundingClientRect() : null;
        const btn3 = document.getElementById('demoScenario3');
        const b3 = btn3 ? btn3.getBoundingClientRect() : null;
        const isBtn3Clipped = dr && b3 ? b3.right > dr.right + 1 : false;
        const btn3ClippedPx = dr && b3 ? Math.max(0, Math.round(b3.right - dr.right)) : 0;

        // Dock specific checks
        const dock = document.getElementById('personaQuickSwitch');
        const dockComputed = dock ? window.getComputedStyle(dock) : null;

        return {
          winW,
          scrollW,
          clientW,
          hasDocOverflow: scrollW > clientW,
          isBtn3Clipped,
          btn3ClippedPx,
          overflowElementCount: overflowingEls.length,
          topOverflowElements: overflowingEls.slice(0, 3),
          dockDisplay: dockComputed?.display,
          dockOverflowX: dockComputed?.overflowX
        };
      })()`);

      console.log(`Viewport ${vp.name.padEnd(22)} (${String(vp.width).padStart(4)}x${vp.height}): ScrollW=${vpAudit.scrollW}, ClientW=${vpAudit.clientW}, Overflow=${vpAudit.hasDocOverflow}, Btn3Clipped=${vpAudit.btn3ClippedPx}px, Dock: ${vpAudit.dockDisplay}/${vpAudit.dockOverflowX}`);
      if (vpAudit.hasDocOverflow) {
        console.error(`HORIZONTAL OVERFLOW AT ${vp.name}! Elements:`, vpAudit.topOverflowElements);
        throw new Error(`Horizontal overflow at ${vp.name} (${vp.width}px): scrollWidth=${vpAudit.scrollW} > clientWidth=${vpAudit.clientW}`);
      }
      if (vpAudit.isBtn3Clipped) {
        console.warn(`[DEFECT FOUND] Element #demoScenario3 clipped by ${vpAudit.btn3ClippedPx}px at ${vp.name} (${vp.width}px) viewport!`);
      }
      vpResults.push({ ...vp, ...vpAudit });
    }

    await send('Emulation.clearDeviceMetricsOverride');
    
    // Evaluate clipping defect
    const clippedViewports = vpResults.filter(v => v.isBtn3Clipped);
    if (clippedViewports.length > 0) {
      results.responsiveLayout = {
        status: 'DEFECT_DETECTED',
        clippedViewports: clippedViewports.map(v => ({ name: v.name, width: v.width, clippedPx: v.btn3ClippedPx })),
        viewports: vpResults
      };
      results.verdict = 'REJECT';
      console.log('\n======================================================');
      console.log(`  VERDICT: REJECT (${clippedViewports.length} viewports suffer element clipping on #demoScenario3)`);
      console.log('======================================================\n');
    } else {
      results.responsiveLayout = { status: 'PASS', viewports: vpResults };
      results.verdict = 'APPROVE';
      console.log('\n======================================================');
      console.log('  ALL MILENSTONE 3 ADVERSARIAL CHALLENGES PASSED!');
      console.log('======================================================\n');
    }

  } finally {
    // Write empirical results JSON
    fs.writeFileSync(
      path.join(ROOT_DIR, '.agents', 'teamwork', 'challenger_m3_2', 'empirical_results.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    );
    chrome.kill();
    server.close();
  }
}

main().catch(err => {
  console.error('\n[CHALLENGE SUITE FAILED]:', err);
  process.exit(1);
});
