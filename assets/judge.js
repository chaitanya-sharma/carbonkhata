/* Carbon Khata · judge mode: live rail, stress-test console, checks, guided panel demo */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const K = () => CK.PRICE_2026 * CK.FX;

  /* ---------- 01 stakeholder tabs ---------- */
  const tabs = $$("#sTabs button");
  function showTab(t) {
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.t === t)));
    $$(".sv").forEach((v) => (v.hidden = v.dataset.v !== t));
    if (t === "stockist" && !split) setTimeout(runSplit, 350);
  }
  tabs.forEach((b) => b.addEventListener("click", () => showTab(b.dataset.t)));

  $("#millPub").addEventListener("click", (e) => { e.currentTarget.innerHTML = icon("check") + " Published"; e.currentTarget.disabled = true; $("#millSt").textContent = "Live · 4 stockists, 31 exporters"; });

  /* stockist mass balance */
  const KIDS = [["Sample Fasteners, Ludhiana", 20, "8f9d1c…3a1c", "var(--good)"], ["Sample Forgings, Ludhiana", 30, "b71e04…92de", "#5AA9E6"], ["Sample Bolts, Ludhiana", 50, "2c81d0…7f40", "var(--amber)"]];
  let split = false;
  function drawMB(n) {
    $("#mbBar").innerHTML = KIDS.map(([, t, , c], i) => `<div style="width:${i < n ? t : 0}%;background:${c}"><span>${i < n ? t + " t" : ""}</span></div>`).join("");
    const used = KIDS.slice(0, n).reduce((a, k) => a + k[1], 0);
    $("#mbLegend").innerHTML = `<span>${used} of 100 t allocated</span><span>${100 - used} t left</span>`;
    $("#mbRows").innerHTML = KIDS.slice(0, n).map(([to, t, irn]) => `<tr><td>${to}</td><td class="mono">${irn}</td><td class="r">${t}</td></tr>`).join("") || `<tr><td colspan="3" class="muted">No onward sales yet</td></tr>`;
  }
  function runSplit() { split = true; $("#mbMsg").innerHTML = ""; [1, 2, 3].forEach((n, i) => setTimeout(() => drawMB(n), i * 520)); }
  $("#mbSplit").addEventListener("click", () => { drawMB(0); setTimeout(runSplit, 120); });
  $("#mbReset").addEventListener("click", () => { split = false; drawMB(0); $("#mbMsg").innerHTML = ""; });
  $("#mbOver").addEventListener("click", () => {
    $("#mbMsg").innerHTML = `<div class="alert error">${icon("alert")}<span><b>Blocked.</b> Onward sales of 110 t cannot exceed the 100 t parent lot. The mill's report covers only the tonnes the stockist bought.</span></div>`;
    $("#mbBar").classList.remove("shake"); void $("#mbBar").offsetWidth; $("#mbBar").classList.add("shake");
  });
  drawMB(0);

  /* exporter mixed lot */
  let mixed = 0;
  function drawMix() {
    const precDef = CK.PRODUCTS.bolts.precursorDef * (1 + CK.MARKUP[2026]);
    const lots = [["WR-5.5-A", "Stockist ST-7781 · IRN 9f3a21…", 72, 2.38, true], ["WR-5.5-B", mixed ? "Unverified trader" : "Direct from mill · IRN 44c0de…", 54, mixed ? precDef : 2.31, !mixed]];
    const w = lots.reduce((a, l) => a + l[2] * l[3], 0) / 126, see = w + 0.05;
    const cost = Math.max(see - CK.BENCH.actual * CK.CBAM_FACTOR[2026], 0) * K() * 120, def = CK.perTonne().def * 120;
    $("#mixTbl").innerHTML = `<thead><tr><th>Lot</th><th>Source</th><th class="r">t</th><th class="r">tCO₂/t</th></tr></thead><tbody>${lots.map(([l, s, t, e, ok]) => `<tr><td class="mono">${l}</td><td>${s}</td><td class="r">${t}</td><td class="r">${ok ? fmt.t2(e) : `<span class="badge red plain">default ${fmt.t2(e)}</span>`}</td></tr>`).join("")}
      <tr><td colspan="3">Weighted by tonnes, plus own heat treatment 0.05</td><td class="r"><b>${fmt.t2(see)}</b></td></tr>
      <tr class="total"><td colspan="3">CBAM on 120 t (vs ${fmt.lakh(def)} on India's default)</td><td class="r" style="color:var(--green)">${fmt.lakh(cost)}</td></tr></tbody>`;
  }
  $$("#mixSeg button").forEach((b) => b.addEventListener("click", () => { mixed = +b.dataset.v; $$("#mixSeg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); drawMix(); }));
  drawMix();

  /* exception queue */
  $$("#exc [data-r]").forEach((b) => b.addEventListener("click", () => {
    $("#exc").innerHTML = `${icon("check")}<div><b>Resolved by reviewer</b><p>${b.dataset.r}. Logged with name and time.</p></div>`; $("#exc").classList.add("ok");
    $("#exBadge").textContent = "0 open"; $("#exBadge").className = "badge green";
    $("#lock").classList.add("ok"); $("#lockTxt").innerHTML = `Ready to lock for the verifier <button class="btn btn-primary btn-sm" id="lockBtn" style="margin-left:8px">Lock file</button>`;
    $("#lockBtn").addEventListener("click", () => { $("#lockTxt").textContent = "Locked · evidence pack sent to the verifier campaign, week 3"; });
  }));

  /* verifier and importer */
  const MP = ["Installation and production processes", "Goods and CN codes (7318 15)", "Precursors, suppliers and mill reports", "Fuel and material source streams", "Measurement and calculation methods", "Data flow and record keeping", "Control activities and review", "Responsibilities and sign-off"];
  $("#mpList").innerHTML = MP.map((m) => `<div class="chk ok">${icon("check")}<span>${m}</span></div>`).join("");
  const VC = ["Site visit and meter inspection", "Mass balance of precursor lots", "Fuel use against production", "Mill reports verified at source", "Calculation and default use", "Signature by the accredited body"];
  $("#vcList").innerHTML = VC.map((m, i) => `<div class="chk ${i < 5 ? "ok" : ""}">${i < 5 ? icon("check") : "<i></i>"}<span>${m}</span></div>`).join("");
  $("#xmlBtn").addEventListener("click", () => {
    const x = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Simplified sample for illustration; not the EU CBAM Registry schema -->\n<CbamGood>\n  <ShipmentRef>EU-2391</ShipmentRef>\n  <CnCode>73181588</CnCode>\n  <CountryOfOrigin>IN</CountryOfOrigin>\n  <NetMassTonnes>120</NetMassTonnes>\n  <SpecificEmbeddedEmissions unit="tCO2e/t" type="actual">2.40</SpecificEmbeddedEmissions>\n  <Precursors>\n    <Precursor lot="WR-5.5-A" tonnes="72" see="2.38" report="RPT-2026-0142"/>\n    <Precursor lot="WR-5.5-B" tonnes="54" see="2.31" report="RPT-2026-0151"/>\n  </Precursors>\n  <MeltAndPour>IN</MeltAndPour>\n  <Verification status="pending" campaign="Ludhiana week 3"/>\n</CbamGood>\n`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([x], { type: "application/xml" })); a.download = "carbon-khata-EU-2391-sample.xml"; a.click();
  });

  /* ---------- 02 stress test ---------- */
  const S = { t: $("#sT"), r: $("#sR"), p: $("#sP"), v: $("#sV"), a: $("#sA"), f: $("#sF") };
  if (window.matchMedia("(max-width: 900px)").matches) $("#stGrid").style.gridTemplateColumns = "1fr";
  function venture(adopt, fee) {
    const end = [100, 250, 600, 1000, 1400].map((x) => x * adopt), avg = [60, 180, 430, 800, 1200].map((x) => x * adopt), c2c = [0, .15, .5, 1.5, 3];
    let cum = 0, mn = 0, y3 = 0;
    for (let i = 0; i < 5; i++) {
      const nw = i ? end[i] - end[i - 1] : end[0];
      const rev = avg[i] * 120000 / 1e7 + avg[i] * 350 * fee / 1e7 + c2c[i] * adopt;
      const opex = [1.6, 2.2, 3, 3.8, 4.6][i] + [.8, 1.2, 1.8, 2.6, 3.2][i] * (.5 + .5 * adopt) + nw * 45000 / 1e7 + [1.4, 1.6, 1.9, 2.4, 2.9][i] + [.5, 0, 0, 0, 0][i];
      const e = rev - avg[i] * 40000 / 1e7 - opex; cum += e; mn = Math.min(mn, cum); if (i === 2) y3 = e;
    }
    return { y3, peak: -mn };
  }
  function calc() {
    const t = +S.t.value, tr = +S.r.value / 100, price = +S.p.value, ver = +S.v.value * 1e5, adopt = +S.a.value / 100, fee = +S.f.value;
    const r = CK.perTonne({ product: "bolts", year: 2026, price, traced: tr }), full = CK.perTonne({ product: "bolts", year: 2026, price, traced: 1 });
    const D = r.def * t, A = full.act * t, C = r.act * t, save = D - C;
    const fees = 120000 + fee * t, stock = 50 * t * tr, allin = fees + stock + ver;
    return { t, tr, price, ver, adopt, fee, D, A, C, save, fees, allin, roi: save / fees, all: save / allin, keep: 1 - allin / save, v: venture(adopt, fee) };
  }
  function draw() {
    const c = calc();
    $("#oT").textContent = c.t + " t"; $("#oR").textContent = Math.round(c.tr * 100) + "%"; $("#oP").textContent = "€" + c.price.toFixed(2);
    $("#oV").textContent = c.ver ? fmt.lakh(c.ver) : "not counted"; $("#oA").textContent = Math.round(c.adopt * 100) + "%"; $("#oF").textContent = "₹" + c.fee;
    const pct = (x) => (x / c.D * 100).toFixed(2) + "%";
    $(".pc-a").style.width = pct(c.A); $(".pc-r").style.width = pct(c.C - c.A); $(".pc-g").style.width = pct(c.save);
    $("#lA").textContent = fmt.lakh(c.A); $("#lR").textContent = fmt.lakh(c.C - c.A); $("#lG").textContent = fmt.lakh(c.save);
    $("#pcNote").textContent = `Full bar = ${fmt.lakh(c.D)}, the CBAM on India's default value for ${c.t} t. Raise the traced share and the red segment shrinks.`;
    const k = (l, v, s, cls = "") => `<div class="kpi"><div class="l">${l}</div><div class="v ${cls}">${v}</div><div class="s">${s}</div></div>`;
    $("#kpiRow").innerHTML = k("Saved a year", fmt.lakh(c.save), "vs India's default", "green") + k("Return on our fees", c.roi.toFixed(1) + "×", fmt.lakh(c.fees, 2) + " fees") + k("All-in return", c.all.toFixed(1) + "×", "incl. verifier, stockist") + k("Exporter keeps", Math.round(c.keep * 100) + "%", "after all costs");
    $("#venRow").innerHTML = k("Year-3 EBITDA", (c.v.y3 >= 0 ? "+" : "−") + "₹" + Math.abs(c.v.y3).toFixed(1) + " cr", c.v.y3 >= 0 ? "positive" : "still negative", c.v.y3 >= 0 ? "green" : "red") + k("Peak burn", "₹" + c.v.peak.toFixed(1) + " cr", "cumulative, before turning positive") + k("Against ₹10 cr seed", c.v.peak <= 10 ? "Covered" : "Short", c.v.peak <= 10 ? `₹${(10 - c.v.peak).toFixed(1)} cr headroom` : `₹${(c.v.peak - 10).toFixed(1)} cr gap`, c.v.peak <= 10 ? "green" : "red");
  }
  Object.values(S).forEach((el) => el.addEventListener("input", () => { $$("#chips button").forEach((b) => b.removeAttribute("aria-pressed")); draw(); }));
  const P = { base: { t: 300, r: 100, v: 6, a: 100 }, allin: { t: 300, r: 100, v: 17.5, a: 100 }, partial: { t: 300, r: 70, v: 6, a: 100 }, down: { t: 300, r: 100, v: 6, a: 50 } };
  function preset(k) {
    const p = P[k]; S.t.value = p.t; S.r.value = p.r; S.v.value = p.v; S.a.value = p.a; S.p.value = 75.28; S.f.value = 400;
    $$("#chips button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === k))); draw();
  }
  $$("#chips button").forEach((b) => b.addEventListener("click", () => preset(b.dataset.p)));
  // chip results computed from the same model
  const remember = (k) => { preset(k); return calc(); };
  const rb = remember("base"), ra = remember("allin"), rp = remember("partial"), rd = remember("down");
  $("#cBase").textContent = rb.roi.toFixed(0) + "× on fees · " + rb.all.toFixed(1) + "× all-in"; $("#cAll").textContent = ra.all.toFixed(1) + "× all-in, still positive";
  $("#cPart").textContent = fmt.lakh(rp.save) + " saved"; $("#cDown").textContent = "₹" + rd.v.peak.toFixed(1) + " cr peak burn, under ₹10 cr";
  preset("base");

  /* ---------- 03 checks ---------- */
  const CH = [["Mass balance", "Onward tonnes never exceed the parent lot"], ["Heat number", "Lot heat matches the mill certificate"], ["Invoice match", "Each sale tied to a registered GST e-invoice"], ["CN code", "Goods code matches the product and the default used"], ["Reporting period", "Mill report and fuel data fall in calendar 2026"], ["Precursor weighting", "Lots weighted by tonnes; untraced share on default"], ["Scope", "Direct emissions only for iron and steel"], ["Fuel against output", "Fuel per tonne within the plant's own range"], ["Weighbridge against invoice", "Gaps flagged to a reviewer before lock"], ["Signature", "Accredited verifier signs; Carbon Khata never verifies"]];
  $("#checks").innerHTML = `<thead><tr><th>#</th><th>Check</th><th>Rule it enforces</th></tr></thead><tbody>${CH.map(([a, b], i) => `<tr><td class="mono">${String(i + 1).padStart(2, "0")}</td><td><b style="font-weight:600">${a}</b></td><td>${b}</td></tr>`).join("")}</tbody>`;

  /* ---------- mode bar highlight ---------- */
  const modes = $$(".modes a");
  new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) modes.forEach((m) => m.classList.toggle("on", m.dataset.m === e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" }).observe($("#demo"));
  ["stress", "rules"].forEach((id) => new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) modes.forEach((m) => m.classList.toggle("on", m.dataset.m === id)); }), { rootMargin: "-45% 0px -50% 0px" }).observe($("#" + id)));

  /* ---------- guided panel demo ---------- */
  const STEPS = [
    ["The bolt penalty: ₹30,400 a tonne on India's default. The red segment is the data penalty; the green is what Carbon Khata protects.", () => { preset("base"); S.r.value = 0; draw(); setTimeout(() => { S.r.value = 100; draw(); }, 900); return "#pcCard"; }],
    ["The stockist splits a 100 t lot across three GST invoices. The ledger blocks any sale beyond what was bought.", () => { showTab("stockist"); drawMB(0); setTimeout(runSplit, 300); setTimeout(() => $("#mbOver").click(), 2300); return '.sv[data-v="stockist"]'; }],
    ["A Punjabi weighbridge slip is read automatically. The gap is flagged and a person must resolve it before the file can lock.", () => { showTab("exporter"); return '.sv[data-v="exporter"]'; }],
    ["Downside: half the planned exporters. Peak burn stays inside the ₹10 crore seed.", () => { preset("down"); return "#venRow"; }],
  ];
  let gi = -1;
  function step(i) {
    if (i < 0 || i >= STEPS.length) return;
    gi = i; $$(".spot").forEach((e) => e.classList.remove("spot"));
    const sel = STEPS[i][1](), el = $(sel);
    el.classList.add("spot"); el.scrollIntoView({ behavior: "smooth", block: "center" });
    $("#gdN").textContent = `${i + 1} / ${STEPS.length}`; $("#gdT").textContent = STEPS[i][0];
  }
  function stop() { $("#gd").hidden = true; gi = -1; $$(".spot").forEach((e) => e.classList.remove("spot")); }
  $("#gdStart").addEventListener("click", () => { $("#gd").hidden = false; step(0); });
  $("#gdNext").addEventListener("click", () => (gi === STEPS.length - 1 ? stop() : step(gi + 1)));
  $("#gdPrev").addEventListener("click", () => step(gi - 1));
  $("#gdExit").addEventListener("click", stop);
  document.addEventListener("keydown", (e) => {
    if (gi < 0 || e.target.closest("input, select, textarea")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); gi === STEPS.length - 1 ? stop() : step(gi + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(gi - 1); }
    if (e.key === "Escape") stop();
  });

  showTab("mill");
})();
