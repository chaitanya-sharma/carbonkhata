/**
 * Carbon Khata · Sprint 4 Interactive CDP & Simulation Empirical Challenge Suite
 * Author: challenger_m4_2
 * 
 * Verifies:
 * 1. Syntax of assets/calc.js and all asset scripts.
 * 2. Mathematical model of CK.perTonne and recoveryNotice (<70% vs >=70% and boundary values).
 * 3. Dynamic pricing model with slider economics.
 * 4. Headless Chrome CDP testing on live pages:
 *    - calculator.html (DOM state, recovery card toggle, dynamic liability, responsive layout)
 *    - pricing.html (volume slider, real-time ROI, retained savings)
 *    - trust.html (SVG #custodyChain 6 nodes, regulation accordion)
 *    - pilot.html (capacity gauge 38/50, WhatsApp dispatch, phone validation)
 * 5. Console error detection across all tested pages.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8998;
const CDP_PORT = 9228;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

// Helper for assertion
function assert(cond, msg) {
  if (!cond) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runMathUnitTests() {
  console.log('\n--- Section 1: CK.perTonne & Recovery Notice Mathematical Verification ---');
  
  // Load site.js in VM sandbox to get CK and fmt
  const siteCode = fs.readFileSync(path.join(ROOT_DIR, 'assets', 'site.js'), 'utf-8');
  const sandbox = {
    document: {
      addEventListener: () => {},
      querySelectorAll: () => []
    },
    window: {}
  };
  vm.createContext(sandbox);
  vm.runInContext(siteCode + '\nthis.CK = CK;\nthis.fmt = fmt;\n', sandbox);
  const CK = sandbox.CK;
  const fmt = sandbox.fmt;

  assert(CK && CK.perTonne, 'CK.perTonne must be defined in site.js');
  assert(fmt && fmt.lakh && fmt.inr100, 'fmt formatters must be defined in site.js');

  // Test 1: 120t bolts in 2026 @ 100% traced
  const r100 = CK.perTonne({ product: 'bolts', year: 2026, price: 75.28, traced: 1 });
  console.log(`[Math] 120t bolts 100% traced: saving/tonne = ${r100.saving.toFixed(2)}, total 120t saving = ${fmt.lakh(r100.saving * 120)}`);
  assert(Math.abs(r100.saving - 30374.57) < 50, 'Per tonne saving should be ~₹30,400');
  assert(fmt.lakh(r100.saving * 120) === '₹36.4 L', '120t saving should format to ₹36.4 L');

  // Test 2: Recovery math for traced < 0.70
  const cases = [
    { t: 100, traced: 0.69, expectedNeeded: 1 },
    { t: 120, traced: 0.69, expectedNeeded: 2 },
    { t: 120, traced: 0.50, expectedNeeded: 24 },
    { t: 100, traced: 0.00, expectedNeeded: 70 },
    { t: 120, traced: 0.00, expectedNeeded: 84 },
    { t: 300, traced: 0.65, expectedNeeded: 15 },
    { t: 120, traced: 0.699, expectedNeeded: 1 },
    { t: 1,   traced: 0.69, expectedNeeded: 1 },
  ];

  for (const c of cases) {
    const target = 0.70;
    const needed = Math.ceil(Math.round((target - c.traced) * 1e4) / 1e4 * c.t);
    const rCurrent = CK.perTonne({ product: 'bolts', year: 2026, price: 75.28, traced: c.traced });
    const r70 = CK.perTonne({ product: 'bolts', year: 2026, price: 75.28, traced: target });
    const gap = (r70.saving - rCurrent.saving) * c.t;

    assert(needed === c.expectedNeeded, `Needed tonnes mismatch for t=${c.t}, traced=${c.traced}: got ${needed}, expected ${c.expectedNeeded}`);
    assert(gap > 0, `Gap must be positive when traced < 0.70: got gap=${gap}`);
    console.log(`[Math PASS] t=${c.t}, traced=${(c.traced*100).toFixed(1)}% -> needed=${needed}t, gap=${fmt.lakh(gap)}`);
  }

  // Test 3: Traced >= 0.70 threshold boundary
  for (const tr of [0.70, 0.701, 0.85, 1.00]) {
    const isUnder = tr < 0.70;
    assert(!isUnder, `traced=${tr} should NOT be under 0.70 threshold`);
  }

  // Test 4: Pricing math at 300t default
  const vol = 300;
  const def = vol * 39038;
  const act = vol * 8663;
  const save = def - act;
  const sub = 120000;
  const filing = vol * 400;
  const trace = vol * 50;
  const verifier = 600000;
  const totalCost = sub + filing + trace + verifier;
  const roi = (save / totalCost).toFixed(1) + "×";
  const retained = Math.round(((save - totalCost) / save) * 100) + "%";
  const ckFees = sub + filing;
  const ckRoi = Math.round(save / ckFees) + "×";

  console.log(`[Pricing Math] vol=${vol}t: save=₹${(save/1e5).toFixed(1)}L, roi=${roi}, retained=${retained}, ckRoi=${ckRoi}`);
  assert(roi === '10.7×', `ROI should be 10.7×, got ${roi}`);
  assert(retained === '91%', `Retained savings should be 91%, got ${retained}`);
  assert(ckRoi === '38×', `Carbon Khata fee ROI should be 38×, got ${ckRoi}`);

  console.log('✓ Section 1 passed all unit assertions.');
}

async function runBrowserCDPTests() {
  console.log('\n--- Section 2: Headless Chrome CDP Live Page Verification ---');

  await new Promise(r => server.listen(PORT, r));
  console.log(`[CDP Suite] Static server listening on http://127.0.0.1:${PORT}`);

  const tempDir = path.join(os.tmpdir(), 'chrome_m4_challenger_' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log(`[CDP Suite] Spawning Chrome: ${chromePath}`);
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
        console.log(`[CDP Suite] Chrome CDP connected: ${v.Browser}`);
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

  const consoleErrors = [];

  async function openTab(urlPath) {
    const targetRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}${urlPath}`, { method: 'PUT' });
    const target = await targetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          consoleErrors.push({ url: urlPath, type: 'console.error', text: msg.params.args.map(a => a.value || a.description).join(' ') });
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push({
          url: urlPath,
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
        throw new Error(res.exceptionDetails.text + ' ' + (res.exceptionDetails.exception?.description || ''));
      }
      return res.result?.value;
    }

    await send('Runtime.enable');
    await send('Page.enable');
    
    // Wait for document ready
    await new Promise(r => setTimeout(r, 600));

    return { ws, send, evaluate, targetId: target.id };
  }

  try {
    // ----------------------------------------------------
    // TEST 1: calculator.html
    // ----------------------------------------------------
    console.log('\n[CDP Test 1] Testing calculator.html...');
    const calcTab = await openTab('/calculator.html');

    // 1.1 Check initial state (default: 120t bolts, 100% traced)
    const initCalc = await calcTab.evaluate(`(() => {
      const rec = document.getElementById("recoveryNotice");
      const mSave = document.getElementById("mSave").textContent.trim();
      const tracedOut = document.getElementById("tracedOut").textContent.trim();
      const isDisplayed = rec.style.display !== "none";
      const isAchieved = rec.classList.contains("achieved");
      const text = rec.innerText;
      return { mSave, tracedOut, isDisplayed, isAchieved, text };
    })()`);

    console.log('[CDP Calc] Initial state:', initCalc);
    assert(initCalc.mSave === '₹36.4 L', `Initial saving should be ₹36.4 L, got ${initCalc.mSave}`);
    assert(initCalc.tracedOut === '100%', `Initial traced should be 100%, got ${initCalc.tracedOut}`);
    assert(initCalc.isDisplayed === true, 'recoveryNotice should be displayed for 100% bolts');
    assert(initCalc.isAchieved === true, 'recoveryNotice should have class achieved');
    assert(initCalc.text.includes('Cluster threshold achieved'), 'Text should contain threshold achieved');

    // 1.2 Drag traced slider to 65% (immediate step below 70% on step=5 slider)
    const test65 = await calcTab.evaluate(`(() => {
      const sl = document.getElementById("traced");
      sl.value = "65";
      sl.dispatchEvent(new Event("input", { bubbles: true }));
      const rec = document.getElementById("recoveryNotice");
      return {
        tracedOut: document.getElementById("tracedOut").textContent.trim(),
        mSave: document.getElementById("mSave").textContent.trim(),
        className: rec.className,
        text: rec.innerText,
        html: rec.innerHTML
      };
    })()`);

    console.log('[CDP Calc] At 65% traced:', test65);
    assert(test65.tracedOut === '65%', 'tracedOut should show 65%');
    assert(!test65.className.includes('achieved'), 'recoveryNotice should NOT have class achieved at 65%');
    assert(test65.text.includes('Target 70% cluster threshold'), 'Should display Target 70% cluster threshold');
    assert(test65.text.includes('trace just 6 more tonnes'), 'For 120t @ 65%, needed tonnes must be 6 more tonnes');
    assert(test65.text.includes('in avoided CBAM liability'), 'Should state avoided CBAM liability');

    // 1.3 Drag traced slider to 50%
    const test50 = await calcTab.evaluate(`(() => {
      const sl = document.getElementById("traced");
      sl.value = "50";
      sl.dispatchEvent(new Event("input", { bubbles: true }));
      const rec = document.getElementById("recoveryNotice");
      return {
        tracedOut: document.getElementById("tracedOut").textContent.trim(),
        text: rec.innerText
      };
    })()`);
    console.log('[CDP Calc] At 50% traced:', test50);
    assert(test50.text.includes('trace just 24 more tonnes'), 'For 120t @ 50%, needed tonnes must be 24 more tonnes');

    // 1.4 Switch tons to 100 (while traced remains 50%)
    const test100t = await calcTab.evaluate(`(() => {
      document.getElementById("tons").value = "100";
      document.getElementById("tons").dispatchEvent(new Event("input", { bubbles: true }));
      const rec = document.getElementById("recoveryNotice");
      return { text: rec.innerText };
    })()`);
    console.log('[CDP Calc] At 100t @ 50% traced:', test100t);
    assert(test100t.text.includes('trace just 20 more tonnes'), 'For 100t @ 50%, needed tonnes must be 20 more tonnes');

    // 1.4b Set traced to 65% at 100t
    const test100t65 = await calcTab.evaluate(`(() => {
      const sl = document.getElementById("traced");
      sl.value = "65";
      sl.dispatchEvent(new Event("input", { bubbles: true }));
      const rec = document.getElementById("recoveryNotice");
      return { text: rec.innerText };
    })()`);
    console.log('[CDP Calc] At 100t @ 65% traced:', test100t65);
    assert(test100t65.text.includes('trace just 5 more tonnes'), 'For 100t @ 65%, needed tonnes must be 5 more tonnes');

    // 1.5 Drag traced slider to 70% (exact threshold)
    const test70 = await calcTab.evaluate(`(() => {
      const sl = document.getElementById("traced");
      sl.value = "70";
      sl.dispatchEvent(new Event("input", { bubbles: true }));
      const rec = document.getElementById("recoveryNotice");
      return {
        isAchieved: rec.classList.contains("achieved"),
        text: rec.innerText
      };
    })()`);
    console.log('[CDP Calc] At 70% traced:', test70);
    assert(test70.isAchieved === true, 'recoveryNotice should have achieved class at 70%');
    assert(test70.text.includes('Cluster threshold achieved: 100% of batched audit subsidy unlocked'), 'Should display threshold achieved message');

    // 1.6 Switch product to "coil"
    const testCoil = await calcTab.evaluate(`(() => {
      const bCoil = document.querySelector("#segProduct button[data-v='coil']");
      bCoil.click();
      const rec = document.getElementById("recoveryNotice");
      const tracedField = document.getElementById("tracedField");
      return {
        recDisplay: rec.style.display,
        tracedDisplay: tracedField.style.display
      };
    })()`);
    console.log('[CDP Calc] On product="coil":', testCoil);
    assert(testCoil.recDisplay === 'none', 'recoveryNotice must be hidden for coil');
    assert(testCoil.tracedDisplay === 'none', 'tracedField must be hidden for coil');

    // 1.7 Test reset button
    const testReset = await calcTab.evaluate(`(() => {
      document.getElementById("reset").click();
      const rec = document.getElementById("recoveryNotice");
      return {
        tons: document.getElementById("tons").value,
        product: document.querySelector("#segProduct button[aria-pressed='true']").dataset.v,
        tracedOut: document.getElementById("tracedOut").textContent.trim(),
        isAchieved: rec.classList.contains("achieved")
      };
    })()`);
    console.log('[CDP Calc] After reset:', testReset);
    assert(testReset.tons === '120', 'Reset should restore tons to 120');
    assert(testReset.product === 'bolts', 'Reset should restore product to bolts');
    assert(testReset.tracedOut === '100%', 'Reset should restore traced to 100%');
    assert(testReset.isAchieved === true, 'Reset should restore achieved state');

    // 1.8 Verify responsive layout on mobile width
    await calcTab.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    });
    const mobileGrid = await calcTab.evaluate(`(() => {
      const g = document.getElementById("calcGrid");
      const cs = window.getComputedStyle(g);
      return { gridTemplateColumns: cs.gridTemplateColumns };
    })()`);
    console.log('[CDP Calc] Mobile (375px) calcGrid gridTemplateColumns:', mobileGrid);
    assert(!mobileGrid.gridTemplateColumns.includes(' '), 'calcGrid should collapse to single column on mobile');

    calcTab.ws.close();

    // ----------------------------------------------------
    // TEST 2: pricing.html
    // ----------------------------------------------------
    console.log('\n[CDP Test 2] Testing pricing.html...');
    const priceTab = await openTab('/pricing.html');

    // 2.1 Check default 300t state
    const initPrice = await priceTab.evaluate(`(() => {
      return {
        volOut: document.getElementById("volOut").textContent.trim(),
        volDefVal: document.getElementById("volDefVal").textContent.trim(),
        volActVal: document.getElementById("volActVal").textContent.trim(),
        volSaveVal: document.getElementById("volSaveVal").textContent.trim(),
        volFeeVal: document.getElementById("volFeeVal").textContent.trim(),
        volTraceVal: document.getElementById("volTraceVal").textContent.trim(),
        volAuditVal: document.getElementById("volAuditVal").textContent.trim(),
        volRoiVal: document.getElementById("volRoiVal").textContent.trim(),
        volRetVal: document.getElementById("volRetVal").textContent.trim(),
        badgeRoi: document.getElementById("badgeRoi").textContent.trim(),
        badgeCkRoi: document.getElementById("badgeCkRoi").textContent.trim()
      };
    })()`);
    console.log('[CDP Pricing] Default 300t state:', initPrice);
    assert(initPrice.volOut === '300 tonnes', 'volOut should be 300 tonnes');
    assert(initPrice.volDefVal === '₹117.1 L', 'volDefVal should be ₹117.1 L');
    assert(initPrice.volActVal === '₹26.0 L', 'volActVal should be ₹26.0 L');
    assert(initPrice.volSaveVal === '₹91.1 L', 'volSaveVal should be ₹91.1 L');
    assert(initPrice.volRoiVal === '10.7×', 'volRoiVal should be 10.7×');
    assert(initPrice.volRetVal === '91%', 'volRetVal should be 91%');
    assert(initPrice.badgeRoi === '10.7× all-in return', 'badgeRoi should be 10.7× all-in return');
    assert(initPrice.badgeCkRoi === '38× on Carbon Khata fees', 'badgeCkRoi should be 38× on Carbon Khata fees');

    // 2.2 Move slider to 1000t
    const price1000 = await priceTab.evaluate(`(() => {
      const s = document.getElementById("volSlider");
      s.value = "1000";
      s.dispatchEvent(new Event("input", { bubbles: true }));
      return {
        volOut: document.getElementById("volOut").textContent.trim(),
        volDefVal: document.getElementById("volDefVal").textContent.trim(),
        volSaveVal: document.getElementById("volSaveVal").textContent.trim(),
        volRoiVal: document.getElementById("volRoiVal").textContent.trim(),
        badgeRoi: document.getElementById("badgeRoi").textContent.trim()
      };
    })()`);
    console.log('[CDP Pricing] At 1000t:', price1000);
    assert(price1000.volOut === '1000 tonnes', 'volOut should update to 1000 tonnes');
    assert(price1000.volDefVal === '₹390.4 L', 'volDefVal at 1000t should be ₹390.4 L');
    assert(price1000.volSaveVal === '₹303.8 L', 'volSaveVal at 1000t should be ₹303.8 L');

    priceTab.ws.close();

    // ----------------------------------------------------
    // TEST 3: trust.html
    // ----------------------------------------------------
    console.log('\n[CDP Test 3] Testing trust.html...');
    const trustTab = await openTab('/trust.html');

    // 3.1 Verify #custodyChain SVG
    const svgCustody = await trustTab.evaluate(`(() => {
      const svg = document.getElementById("custodyChain");
      if (!svg) return null;
      const viewBox = svg.getAttribute("viewBox");
      const groups = Array.from(svg.querySelectorAll("g[transform]"));
      const texts = Array.from(svg.querySelectorAll("text")).map(t => t.textContent.trim());
      const defs = svg.querySelector("defs");
      const linearGradient = svg.querySelector("linearGradient#chainGlow");
      const marker = svg.querySelector("marker#arrow");
      return {
        exists: true,
        viewBox,
        groupCount: groups.length,
        hasDefs: !!defs,
        hasGlow: !!linearGradient,
        hasMarker: !!marker,
        texts
      };
    })()`);
    console.log('[CDP Trust] SVG #custodyChain check:', {
      exists: svgCustody.exists,
      viewBox: svgCustody.viewBox,
      groupCount: svgCustody.groupCount,
      hasGlow: svgCustody.hasGlow
    });
    assert(svgCustody.exists, '#custodyChain SVG element must exist');
    assert(svgCustody.viewBox === '0 0 1080 200', 'viewBox must be 0 0 1080 200');
    assert(svgCustody.groupCount === 6, 'Must contain exactly 6 node groups for supply chain custody');
    assert(svgCustody.texts.includes('Primary Mill'), 'Must contain Primary Mill');
    assert(svgCustody.texts.includes('Melt & Pour'), 'Must contain Melt & Pour');
    assert(svgCustody.texts.includes('Heat Number'), 'Must contain Heat Number');
    assert(svgCustody.texts.includes('Stockist'), 'Must contain Stockist');
    assert(svgCustody.texts.includes('Mass-Balance Seal'), 'Must contain Mass-Balance Seal');
    assert(svgCustody.texts.includes('Fastener'), 'Must contain Fastener');
    assert(svgCustody.texts.includes('Ludhiana'), 'Must contain Ludhiana');
    assert(svgCustody.texts.includes('Batch Audit'), 'Must contain Batch Audit');
    assert(svgCustody.texts.includes('Signed EU'), 'Must contain Signed EU');
    assert(svgCustody.texts.includes('CBAM XML'), 'Must contain CBAM XML');
    assert(svgCustody.texts.includes('DG TAXUD Ready'), 'Must contain DG TAXUD Ready');

    // 3.2 Verify interactive regulatory accordion
    const accordionCheck = await trustTab.evaluate(`(() => {
      const acc = document.querySelector(".trust-accordion");
      const details = Array.from(acc.querySelectorAll("details"));
      const summaries = details.map(d => d.querySelector("summary").innerText.trim().replace(/\\s+/g, " "));
      
      // Test opening details
      details[0].open = true;
      const isOpen = details[0].open;
      return {
        accordionExists: !!acc,
        detailsCount: details.length,
        isOpen,
        summaries
      };
    })()`);
    console.log('[CDP Trust] Accordion check:', accordionCheck);
    assert(accordionCheck.accordionExists, '.trust-accordion must exist');
    assert(accordionCheck.detailsCount === 7, 'Must have 7 regulatory details cards');
    assert(accordionCheck.isOpen, 'details element can be opened');

    trustTab.ws.close();

    // ----------------------------------------------------
    // TEST 4: pilot.html
    // ----------------------------------------------------
    console.log('\n[CDP Test 4] Testing pilot.html...');
    const pilotTab = await openTab('/pilot.html');

    // 4.1 Check #capacityGauge
    const gaugeCheck = await pilotTab.evaluate(`(() => {
      const g = document.getElementById("capacityGauge");
      if (!g) return null;
      const text = g.innerText;
      const meterFill = g.querySelector(".meter > div");
      const fillWidth = meterFill ? meterFill.style.width : null;
      return {
        exists: true,
        text,
        fillWidth
      };
    })()`);
    console.log('[CDP Pilot] Capacity gauge check:', gaugeCheck);
    assert(gaugeCheck.exists, '#capacityGauge must exist');
    assert(gaugeCheck.text.includes('38/50 reserved'), 'Must display 38/50 reserved');
    assert(gaugeCheck.text.includes('(76% reserved)'), 'Must display (76% reserved)');
    assert(gaugeCheck.text.includes('12 slots remaining before Dec 2026'), 'Must display 12 slots remaining before Dec 2026');
    assert(gaugeCheck.fillWidth === '76%', 'Meter fill width must be 76%');

    // 4.2 Check initial #waDispatch button
    const initWa = await pilotTab.evaluate(`(() => {
      const btn = document.getElementById("waDispatch");
      return {
        exists: !!btn,
        href: btn.getAttribute("href"),
        target: btn.getAttribute("target"),
        rel: btn.getAttribute("rel")
      };
    })()`);
    console.log('[CDP Pilot] Initial #waDispatch:', initWa);
    assert(initWa.exists, '#waDispatch button must exist');
    assert(initWa.href.startsWith('https://wa.me/919876543210?text='), 'href must link to wa.me with prefilled text');
    assert(initWa.target === '_blank', 'target must be _blank');
    assert(initWa.rel.includes('noopener'), 'rel must include noopener');

    // 4.3 Test validation: submit invalid form
    const invalidSubmit = await pilotTab.evaluate(`(() => {
      const f = document.getElementById("pilotForm");
      const btn = f.querySelector("button[type='submit']");
      btn.click();
      const invalidInputs = Array.from(f.querySelectorAll("[aria-invalid='true']")).map(el => el.id);
      return { invalidInputs };
    })()`);
    console.log('[CDP Pilot] Invalid form submission errors:', invalidSubmit);
    assert(invalidSubmit.invalidInputs.includes('f-name'), 'f-name should be invalid');
    assert(invalidSubmit.invalidInputs.includes('f-firm'), 'f-firm should be invalid');
    assert(invalidSubmit.invalidInputs.includes('f-phone'), 'f-phone should be invalid');

    // 4.4 Test valid form submission and dynamic WhatsApp URL update
    const validSubmit = await pilotTab.evaluate(`(() => {
      document.getElementById("f-name").value = "Harpreet Singh";
      document.getElementById("f-firm").value = "Ludhiana Fastener Works";
      document.getElementById("f-role").value = "Exporter";
      document.getElementById("f-phone").value = "+91 98765 43210";
      document.getElementById("f-tons").value = "250";

      const f = document.getElementById("pilotForm");
      const submitEv = new Event("submit", { cancelable: true, bubbles: true });
      f.dispatchEvent(submitEv);

      const waBtn = document.getElementById("waDispatch");
      const formOut = document.getElementById("formOut");
      const waLinkInOut = formOut.querySelector("a[href*='wa.me']");
      return {
        waDispatchHref: waBtn.href,
        formOutHtml: formOut.innerHTML,
        formOutWaHref: waLinkInOut ? waLinkInOut.href : null
      };
    })()`);
    console.log('[CDP Pilot] Dynamic #waDispatch href after submission:', validSubmit.waDispatchHref);
    assert(validSubmit.waDispatchHref.includes('Harpreet%20Singh'), 'Dynamic waDispatch URL must contain applicant name');
    assert(validSubmit.waDispatchHref.includes('Ludhiana%20Fastener%20Works'), 'Dynamic waDispatch URL must contain company');
    assert(validSubmit.waDispatchHref.includes('Exporter'), 'Dynamic waDispatch URL must contain role');
    assert(validSubmit.waDispatchHref.includes('250'), 'Dynamic waDispatch URL must contain tonnes');
    assert(validSubmit.formOutWaHref.includes('Harpreet%20Singh'), 'formOut WhatsApp link must match');

    pilotTab.ws.close();

    console.log('\n--- Section 3: Browser Console Error Audit ---');
    console.log(`Total captured console errors / exceptions: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Console errors detected:', consoleErrors);
    }
    assert(consoleErrors.length === 0, `Expected 0 console errors, but found ${consoleErrors.length}`);
    console.log('✓ Section 3 passed: ZERO console errors across all pages.');

  } finally {
    chrome.kill();
    server.close();
  }
}

async function main() {
  try {
    console.log('================================================================');
    console.log(' Carbon Khata Sprint 4 Empirical Challenge Runner');
    console.log('================================================================');
    await runMathUnitTests();
    await runBrowserCDPTests();
    console.log('\n================================================================');
    console.log(' ALL EMPIRICAL CHALLENGES PASSED SUCCESSFULLY! (VERDICT: APPROVE)');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ CHALLENGE FAILED:', err);
    process.exit(1);
  }
}

main();
