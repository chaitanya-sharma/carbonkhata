/**
 * Carbon Khata · Milestone 2 Interactive & Journey Challenge Suite
 * Independent empirical verification of Supply Chain Map, Product Tour, and Responsive Layouts.
 * 
 * Usage:
 *   node tests/test_m2_interactive_challenge.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 8995;
const CDP_PORT = 9222;

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
    return res.end();
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

async function run() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`[Challenge Suite] Static server running on http://localhost:${PORT}`);

  const report = {
    supplyChainMapStandard: null,
    supplyChainMapReducedMotion: null,
    productTour: null,
    responsiveLayout: null,
    verdict: null
  };

  // 1. Test Supply Chain Map (Standard Motion)
  {
    console.log('\n[1/3] Testing Supply Chain Map (Standard Motion)...');
    const target = await (await fetch(`http://localhost:${CDP_PORT}/json/new?http://localhost:${PORT}/index.html`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 0;
    const send = (m, p={}) => new Promise(res => {
      const mid = ++id;
      const h = (e) => { const d = JSON.parse(e.data); if (d.id === mid) { ws.removeEventListener('message', h); res(d.result); } };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mid, method: m, params: p }));
    });
    const exceptions = [];
    ws.addEventListener('message', (e) => { const d = JSON.parse(e.data); if (d.method === 'Runtime.exceptionThrown') exceptions.push(d.params); });

    await send('Page.enable');
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 1200));

    // Scroll #journey into view to trigger lazy script loading
    await send('Runtime.evaluate', {
      expression: 'document.getElementById("journey").scrollIntoView({ behavior: "instant" }); window.dispatchEvent(new Event("scroll"));'
    });
    await new Promise(r => setTimeout(r, 2000));

    // Test Hover & Clicks
    const res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tip = document.getElementById("mapTip");
          const nodes = [...document.querySelectorAll("#map .node")];
          const pills = [...document.querySelectorAll("#journeyPills .stage-pill")];
          const stops = [...document.querySelectorAll("#stops .stop")];
          
          const hovers = nodes.map((n, i) => {
            const r = n.getBoundingClientRect();
            n.dispatchEvent(new MouseEvent("mouseenter", { clientX: r.left + 5, clientY: r.top + 5, bubbles: true }));
            const tipOn = tip.classList.contains("on");
            const html = tip.innerHTML;
            n.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
            return { index: i, tipOn, html };
          });

          const clicks = pills.map((p, i) => {
            p.click();
            return {
              index: i,
              pillOn: p.classList.contains("on"),
              stopOn: stops[i].classList.contains("on"),
              prog: document.getElementById("jProg")?.textContent.trim()
            };
          });

          return { hovers, clicks, nodesCount: nodes.length, pillsCount: pills.length };
        })()
      `,
      returnByValue: true
    });

    await fetch(`http://localhost:${CDP_PORT}/json/close/${target.id}`);
    ws.close();

    const d = res.result.value;
    const allHoversPass = d.hovers.length === 6 && d.hovers.every(h => h.tipOn && h.html.includes('<b>'));
    const allClicksPass = d.clicks.length === 6 && d.clicks.every(c => c.pillOn && c.stopOn);
    report.supplyChainMapStandard = {
      pass: allHoversPass && allClicksPass && exceptions.length === 0,
      allHoversPass,
      allClicksPass,
      exceptions
    };
    console.log(`Standard Map: Hovers=${allHoversPass ? 'PASS' : 'FAIL'}, Clicks=${allClicksPass ? 'PASS' : 'FAIL'}, Exceptions=${exceptions.length}`);
  }

  // 2. Test Supply Chain Map (Reduced Motion / Static Fallback)
  {
    console.log('\n[1b/3] Testing Supply Chain Map (prefers-reduced-motion: reduce)...');
    const target = await (await fetch(`http://localhost:${CDP_PORT}/json/new?http://localhost:${PORT}/index.html`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 0;
    const send = (m, p={}) => new Promise(res => {
      const mid = ++id;
      const h = (e) => { const d = JSON.parse(e.data); if (d.id === mid) { ws.removeEventListener('message', h); res(d.result); } };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mid, method: m, params: p }));
    });
    const exceptions = [];
    ws.addEventListener('message', (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.exceptionThrown') {
        exceptions.push(d.params.exceptionDetails?.exception?.description || d.params.exceptionDetails?.text);
      }
    });

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await new Promise(r => setTimeout(r, 1200));

    await send('Runtime.evaluate', {
      expression: 'document.getElementById("journey").scrollIntoView({ behavior: "instant" }); window.dispatchEvent(new Event("scroll"));'
    });
    await new Promise(r => setTimeout(r, 2000));

    const clickRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = [...document.querySelectorAll("#journeyPills .stage-pill")];
          try {
            pills[2].click();
            return { clicked: true, pill2On: pills[2].classList.contains("on") };
          } catch(e) {
            return { clicked: false, error: e.name + ": " + e.message };
          }
        })()
      `,
      returnByValue: true
    });

    await fetch(`http://localhost:${CDP_PORT}/json/close/${target.id}`);
    ws.close();

    const hasBug = exceptions.some(e => e.includes('ReferenceError') && e.includes('tl'));
    report.supplyChainMapReducedMotion = {
      pass: !hasBug && exceptions.length === 0,
      clickResult: clickRes.result.value,
      hasTdzBug: hasBug,
      exceptions
    };
    console.log(`Reduced Motion Map: TDZ ReferenceError Detected = ${hasBug ? 'YES (BUG CONFIRMED)' : 'NO'}`);
    if (hasBug) {
      console.log(`  -> Verbatim Error: ${exceptions[0]}`);
    }
  }

  // 3. Test Product Tour
  {
    console.log('\n[2/3] Testing Product Tour (Speed Controls, Quick Jump, Pacing)...');
    const target = await (await fetch(`http://localhost:${CDP_PORT}/json/new?http://localhost:${PORT}/tour.html`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let id = 0;
    const send = (m, p={}) => new Promise(res => {
      const mid = ++id;
      const h = (e) => { const d = JSON.parse(e.data); if (d.id === mid) { ws.removeEventListener('message', h); res(d.result); } };
      ws.addEventListener('message', h);
      ws.send(JSON.stringify({ id: mid, method: m, params: p }));
    });
    const exceptions = [];
    ws.addEventListener('message', (e) => { const d = JSON.parse(e.data); if (d.method === 'Runtime.exceptionThrown') exceptions.push(d.params); });

    await send('Page.enable');
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 1200));

    const tourRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Speed toggles
          const btn1 = document.querySelector('.speed-btn[data-speed="1"]');
          const btn15 = document.querySelector('.speed-btn[data-speed="1.5"]');
          btn15.click();
          const speed15Ok = btn15.classList.contains("on") && btn15.getAttribute("aria-pressed") === "true";
          btn1.click();
          const speed1Ok = btn1.classList.contains("on") && btn1.getAttribute("aria-pressed") === "true";

          // Quick jump buttons
          const jumps = [...document.querySelectorAll(".jump-btn")].map((b, i) => {
            b.click();
            return {
              index: i,
              btnOn: b.classList.contains("on"),
              kicker: document.getElementById("tChap")?.textContent,
              hasScene: !!document.querySelector("#stage .scene")
            };
          });

          // GSAP timeline pacing
          const durations = window.chapters.map(c => {
            const tl = c.build();
            const dur = tl.duration();
            tl.kill();
            return { chapter: c.t, dur };
          });

          return {
            hasChapters: Array.isArray(window.chapters) && window.chapters.length === 8,
            speed15Ok,
            speed1Ok,
            allJumpsOk: jumps.every(j => j.btnOn && j.hasScene),
            allPacingOk: durations.every(d => d.dur > 0 && Number.isFinite(d.dur)),
            durations
          };
        })()
      `,
      returnByValue: true
    });

    await fetch(`http://localhost:${CDP_PORT}/json/close/${target.id}`);
    ws.close();

    const t = tourRes.result.value;
    report.productTour = {
      pass: t.hasChapters && t.speed15Ok && t.speed1Ok && t.allJumpsOk && t.allPacingOk && exceptions.length === 0,
      details: t,
      exceptions
    };
    console.log(`Product Tour: Speed Controls=${t.speed15Ok && t.speed1Ok ? 'PASS' : 'FAIL'}, Quick Jump=${t.allJumpsOk ? 'PASS' : 'FAIL'}, Pacing=${t.allPacingOk ? 'PASS' : 'FAIL'}`);
  }

  // 4. Responsive Layout Audit (Horizontal Overflow)
  {
    console.log('\n[3/3] Testing Responsive Layout (Zero Horizontal Overflow)...');
    const pages = ['index.html', 'solutions.html', 'tour.html'];
    const viewports = [
      { name: 'mobile', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 }
    ];
    const audits = [];

    for (const pageName of pages) {
      const target = await (await fetch(`http://localhost:${CDP_PORT}/json/new?http://localhost:${PORT}/${pageName}`, { method: 'PUT' })).json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise(r => ws.onopen = r);
      let id = 0;
      const send = (m, p={}) => new Promise(res => {
        const mid = ++id;
        const h = (e) => { const d = JSON.parse(e.data); if (d.id === mid) { ws.removeEventListener('message', h); res(d.result); } };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id: mid, method: m, params: p }));
      });
      await send('Page.enable');
      await send('Runtime.enable');

      for (const vp of viewports) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.name === 'mobile'
        });
        await new Promise(r => setTimeout(r, 200));

        const res = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const vw = window.innerWidth;
              const scrollW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
              return { hasOverflow: scrollW > vw + 1, scrollW, vw };
            })()
          `,
          returnByValue: true
        });
        audits.push({ page: pageName, vp: vp.name, width: vp.width, ...res.result.value });
      }

      await fetch(`http://localhost:${CDP_PORT}/json/close/${target.id}`);
      ws.close();
    }

    const allResponsivePass = audits.every(a => !a.hasOverflow);
    report.responsiveLayout = {
      pass: allResponsivePass,
      audits
    };
    console.log(`Responsive Layout: Zero Overflow across all viewports = ${allResponsivePass ? 'PASS' : 'FAIL'}`);
  }

  // Verdict
  const hasCriticalBug = report.supplyChainMapReducedMotion?.hasTdzBug === true;
  report.verdict = hasCriticalBug ? 'REJECT' : 'APPROVE';

  console.log('\n======================================================');
  console.log(`FINAL CHALLENGER VERDICT: ${report.verdict}`);
  console.log('======================================================');

  server.close();
  return report;
}

run().catch(console.error);
