/* Carbon Khata · platform demo. Sample workspace data; rules and prices from the CBAM model in site.js. */
(() => {
  const Y = 2026, K = CK.PRICE_2026 * CK.FX;
  const actCost = (see) => Math.max(see - CK.BENCH.actual * CK.CBAM_FACTOR[Y], 0) * K;
  const def = CK.perTonne({ product: "bolts", year: Y });
  const $ = (id) => document.getElementById(id);
  const toast = (msg) => { const t = $("toast"); if (!t) return; t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2800); };

  /* ---------- sample data ---------- */
  const shipments = [
    { id: "EU-2391", t: 120, product: "M10 hex bolts", to: "Hamburg", status: ["Verification scheduled", "amber"], step: 2,
      lots: [{ lot: "WR-5.5-A", src: "Stockist lot ST-7781, Mandi Gobindgarh", irn: "…9f3a21", t: 72, see: 2.38 }, { lot: "WR-5.5-B", src: "Direct from mill", irn: "…44c0de", t: 54, see: 2.31 }], own: 0.05 },
    { id: "EU-2377", t: 80, product: "M12 hex bolts", to: "Rotterdam", status: ["Signed", "green"], step: 4,
      lots: [{ lot: "WR-6.5-C", src: "Stockist lot ST-7790, Mandi Gobindgarh", irn: "…2c81d0", t: 84, see: 2.31 }], own: 0.06 },
    { id: "EU-2402", t: 100, product: "M8 hex bolts", to: "Antwerp", status: ["Collecting data", "blue"], step: 1,
      lots: [{ lot: "WR-5.5-D", src: "Stockist lot ST-7781, Mandi Gobindgarh", irn: "…a0f612", t: 63, see: 2.38 }, { lot: "BR-12-E", src: "Secondary mill, no report", irn: "…7d33b9", t: 42, see: null }], own: 0.05 },
  ];
  const seeOf = (s) => {
    const tot = s.lots.reduce((a, l) => a + l.t, 0);
    const prec = s.lots.reduce((a, l) => a + l.t * (l.see ?? CK.PRODUCTS.bolts.precursorDef * (1 + CK.MARKUP[Y])), 0) / tot;
    return prec + s.own;
  };
  const traced = (s) => s.lots.filter((l) => l.see).reduce((a, l) => a + l.t, 0) / s.lots.reduce((a, l) => a + l.t, 0);

  const docs = [
    { id: 1, name: "Furnace oil bill, October 2026", src: "WhatsApp photo", fields: [["Supplier", "Punjab Fuels"], ["Quantity", "3,200 L"], ["Period", "1–31 Oct 2026"]], state: "review" },
    { id: 2, name: "Weighbridge slip, lot WR-5.5-A", src: "WhatsApp photo", fields: [["Net weight", "24.62 t"], ["Invoice weight", "25.00 t"], ["Gap", "0.38 t"]], state: "flag", note: "Weight is 0.38 t below the invoice. Confirm with the stockist before filing." },
    { id: 3, name: "Electricity bill, PSPCL, October 2026", src: "Email", fields: [["Units", "18,400 kWh"], ["Meter", "LS-04417"], ["Period", "Oct 2026"]], state: "review", note: "Kept on record. Indirect emissions are not counted for steel under CBAM." },
    { id: 4, name: "Mill test certificate, heat H-24K118", src: "From the ledger", fields: [["Grade", "SAE 1018"], ["Heat", "H-24K118"], ["Report", "RPT-2026-0142"]], state: "approved" },
    { id: 5, name: "Production log, October 2026", src: "Upload", fields: [["Bolts made", "26.1 t"], ["Scrap", "1.2 t"], ["Furnace hours", "212"]], state: "approved" },
  ];

  const lots = [
    { id: "ST-7781", item: "Wire rod 5.5 mm", t: 100, mill: "Sample Integrated Steel", report: "RPT-2026-0142", see: 2.38, heat: "H-24K118", sales: [{ to: "Sample Fasteners, Ludhiana", t: 40, irn: "…9f3a21" }, { to: "Sample Forgings, Ludhiana", t: 35, irn: "…b71e04" }] },
    { id: "ST-7790", item: "Wire rod 6.5 mm", t: 120, mill: "Sample Integrated Steel", report: "RPT-2026-0151", see: 2.31, heat: "H-31B044", sales: [{ to: "Sample Fasteners, Ludhiana", t: 84, irn: "…2c81d0" }] },
    { id: "ST-7802", item: "Bars 12 mm", t: 80, mill: "Secondary induction furnace", report: null, see: null, heat: "none", sales: [{ to: "Sample Fasteners, Ludhiana", t: 42, irn: "…7d33b9" }] },
  ];
  let activeLot = "ST-7781";

  const shareSettings = [
    ["Emissions per tonne, route and period", "Needed for every EU file", true, false],
    ["Free allocation data (SEFA)", "Required with the emissions figure", true, false],
    ["Heat numbers", "Proves melt-and-pour origin for the steel quota", true, false],
    ["Grade-level intensity for low-carbon steel", "Lets buyers find your cleaner grades", true, true],
    ["Prices and discounts", "Never shared", false, false],
    ["Customer list", "Never shared", false, false],
  ];
  let loan = "pending";

  /* ---------- roles ---------- */
  const ROLES = {
    exporter: { org: ["SF", "Sample Fasteners", "Exporter · Ludhiana"], views: [["overview", "Overview", "grid"], ["shipments", "Shipments", "ship"], ["evidence", "Evidence inbox", "doc"]] },
    stockist: { org: ["ST", "Sample Steel Traders", "Stockist · Mandi Gobindgarh"], views: [["lots", "Steel lots", "store"], ["earnings", "Tracing income", "rupee"]] },
    mill: { org: ["IS", "Sample Integrated Steel", "Mill · BF-BOF route"], views: [["reports", "Reports", "file"], ["sharing", "Sharing", "lock"], ["reach", "Downstream reach", "users"]] },
    verifier: { org: ["AV", "Accredited verifier", "India branch · EU-accredited body"], views: [["campaign", "Ludhiana campaign", "calendar"], ["sites", "Sites", "shield"]] },
    importer: { org: ["HI", "Sample Importer GmbH", "Authorised declarant · Hamburg"], views: [["imports", "Imports", "ship"], ["suppliers", "Suppliers", "users"]] },
    lender: { org: ["GL", "Green lending desk", "Partner bank"], views: [["applications", "Applications", "bank"]] },
    cluster: { org: ["EC", "EEPC cluster cell", "Ludhiana pilot"], views: [["pilot", "Pilot dashboard", "chart"], ["roadmap", "Roadmap", "calendar"]] },
  };
  const state = { role: "exporter", view: "overview" };
  let hasRendered = false;

  function setFromHash() {
    const [r, v] = location.hash.replace("#", "").split("/");
    if (ROLES[r]) {
      const targetView = ROLES[r].views.some(([k]) => k === v) ? v : ROLES[r].views[0][0];
      if (hasRendered && state.role === r && state.view === targetView) return; // Prevent duplicate render wipe
      state.role = r;
      state.view = targetView;
    }
    hasRendered = true;
    render();
  }
  function go(role, view) {
    const targetHash = view ? `${role}/${view}` : role;
    if (location.hash !== `#${targetHash}`) {
      location.hash = targetHash;
    }
    if (ROLES[role]) {
      state.role = role;
      state.view = view && ROLES[role].views.some(([k]) => k === view) ? view : ROLES[role].views[0][0];
      render();
    }
  }

  function render() {
    hasRendered = true;
    const R = ROLES[state.role];
    $("roleSel").value = state.role;
    $("orgAv").textContent = R.org[0]; $("orgName").textContent = R.org[1]; $("orgSub").textContent = R.org[2];
    $("appNav").innerHTML = R.views.map(([k, l, ic]) => `<button data-v="${k}" aria-current="${k === state.view}">${icon(ic)}<span>${l}</span>${k === "evidence" ? `<span class="count">${docs.filter((d) => d.state !== "approved").length}</span>` : ""}</button>`).join("");
    $("appNav").querySelectorAll("button").forEach((b) => b.onclick = () => go(state.role, b.dataset.v));
    $("viewTitle").textContent = R.views.find(([k]) => k === state.view)[1];
    $("appBody").innerHTML = VIEWS[state.role + "." + state.view]();
    (AFTER[state.role + "." + state.view] || (() => {}))();

    // Synchronize Persona Quick-Switch Dock buttons
    document.querySelectorAll("[data-dock-role]").forEach((btn) => {
      const active = btn.dataset.dockRole === state.role;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  const kpi = (l, v, s, cls = "") => `<div class="kpi"><div class="l">${l}</div><div class="v num ${cls}">${v}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
  const bars = (rows) => `<div class="bars">${rows.map(([l, v, w, c]) => `<div class="bar-row"><span>${l}</span><span class="val">${v}</span><div class="track"><div class="fill" style="width:${w}%;background:${c}"></div></div></div>`).join("")}</div>`;

  /* ---------- views ---------- */
  const VIEWS = {}, AFTER = {};

  VIEWS["exporter.overview"] = () => {
    const tons = shipments.reduce((a, s) => a + s.t, 0);
    const save = shipments.reduce((a, s) => a + (def.def - actCost(seeOf(s))) * s.t, 0);
    const tracedT = shipments.reduce((a, s) => a + traced(s) * s.t, 0);
    return `<div class="kpis">
      ${kpi("Shipped to the EU in 2026", fmt.int(tons) + " t", "3 shipments")}
      ${kpi("Tonnes traced to a mill report", Math.round(tracedT / tons * 100) + "%", "Target 70% in the pilot")}
      ${kpi("CBAM cost avoided", fmt.lakh(save), "vs India's default values", "green")}
      ${kpi("First EU declaration", "30 Sep 2027", "Covers all 2026 imports")}
    </div>
    <div class="two">
      <div class="panel"><div class="panel-h"><h3>Shipments</h3><button class="btn btn-ghost btn-sm" data-go="shipments">View all</button></div>
        <div class="table-wrap"><table class="data"><thead><tr><th>Shipment</th><th>Destination</th><th class="r">Tonnes</th><th>Status</th></tr></thead><tbody>
        ${shipments.map((s) => `<tr class="click" data-ship="${s.id}"><td class="mono">${s.id}</td><td>${s.to}</td><td class="r">${s.t}</td><td><span class="badge ${s.status[1]}">${s.status[0]}</span></td></tr>`).join("")}
        </tbody></table></div></div>
      <div class="panel"><div class="panel-h"><h3>Needs your attention</h3></div><div class="panel-b">
        <ul class="timeline">
          <li><div class="d now"></div><div><b>Weighbridge gap on lot WR-5.5-A</b><span>0.38 t below the invoice. Confirm with the stockist.</span></div></li>
          <li><div class="d now"></div><div><b>Lot BR-12-E has no mill report</b><span>42 t of EU-2402 will take the EU default unless the mill joins.</span></div></li>
          <li><div class="d"></div><div><b>Verifier visit, week 3</b><span>Ludhiana campaign. Evidence pack 92% ready.</span></div></li>
        </ul>
      </div></div>
    </div>`;
  };
  AFTER["exporter.overview"] = () => {
    document.querySelectorAll("[data-ship]").forEach((r) => r.onclick = () => openShipment(r.dataset.ship));
    document.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => go("exporter", b.dataset.go));
  };

  VIEWS["exporter.shipments"] = () => `<div class="panel"><div class="table-wrap"><table class="data">
    <thead><tr><th>Shipment</th><th>Product</th><th>Destination</th><th class="r">Tonnes</th><th class="r">tCO₂/t</th><th class="r">CBAM cost</th><th class="r">Avoided</th><th>Status</th></tr></thead><tbody>
    ${shipments.map((s) => { const see = seeOf(s), c = actCost(see) * s.t; return `<tr class="click" data-ship="${s.id}"><td class="mono">${s.id}</td><td>${s.product}</td><td>${s.to}</td><td class="r">${s.t}</td><td class="r">${fmt.t2(see)}</td><td class="r">${fmt.lakh(c)}</td><td class="r" style="color:var(--green)">${fmt.lakh(def.def * s.t - c)}</td><td><span class="badge ${s.status[1]}">${s.status[0]}</span></td></tr>`; }).join("")}
    </tbody></table></div></div>
    <p class="xs muted" style="margin-top:12px">Select a shipment to see where its steel came from and how the figure is built. Avoided cost is against India's 2026 default of 6.29 tCO₂ per tonne of bolts.</p>`;
  AFTER["exporter.shipments"] = () => document.querySelectorAll("[data-ship]").forEach((r) => r.onclick = () => openShipment(r.dataset.ship));

  function openShipment(id) {
    const s = shipments.find((x) => x.id === id), see = seeOf(s);
    const c = { def: def.def * s.t, nom: def.noMill * s.t, act: actCost(see) * s.t };
    const steps = [["Steel traced to mill reports", `${Math.round(traced(s) * 100)}% of tonnes linked`], ["Evidence checked by a reviewer", "Bills, slips and production log"], ["Verifier site visit", "Ludhiana campaign, week 3"], ["Signed in the EU CBAM Registry", "Importer files by 30 Sep 2027"]];
    $("drawerKicker").textContent = "SHIPMENT " + s.id;
    $("drawerTitle").textContent = `${s.t} t of ${s.product} to ${s.to}`;
    $("drawerBody").innerHTML = `
      <span class="badge ${s.status[1]}">${s.status[0]}</span>
      <h4 style="margin:24px 0 12px">CBAM cost, 2026</h4>
      ${bars([["India default <span class='muted mono xs'>6.29</span>", fmt.lakh(c.def), 100, "var(--khata)"], ["Own plant only <span class='muted mono xs'>" + fmt.t2(def.noMillSEE) + "</span>", fmt.lakh(c.nom), c.nom / c.def * 100, "#D97757"], ["This file <span class='muted mono xs'>" + fmt.t2(see) + "</span>", fmt.lakh(c.act), c.act / c.def * 100, "var(--green)"]])}
      <h4 style="margin:28px 0 8px">Where the steel came from</h4>
      <div class="table-wrap"><table class="data"><thead><tr><th>Lot</th><th>Source</th><th>Invoice</th><th class="r">t</th><th class="r">tCO₂/t</th></tr></thead><tbody>
      ${s.lots.map((l) => `<tr><td class="mono">${l.lot}</td><td>${l.src}</td><td class="mono">${l.irn}</td><td class="r">${l.t}</td><td class="r">${l.see ? fmt.t2(l.see) : `<span class="badge red plain">default ${fmt.t2(CK.PRODUCTS.bolts.precursorDef * 1.1)}</span>`}</td></tr>`).join("")}
      <tr><td colspan="4">Own process (heat treatment, from meter and fuel bill)</td><td class="r">+${fmt.t2(s.own)}</td></tr>
      <tr class="total"><td colspan="4">Embedded emissions per tonne of bolts</td><td class="r">${fmt.t2(see)}</td></tr>
      </tbody></table></div>
      <div class="callout" style="margin-top:12px;font-size:12.5px;line-height:1.45">
        <div style="font-weight:600;margin-bottom:3px">Provenance &amp; WhatsApp OCR Linkage:</div>
        <div>• <b>Mill Report Link:</b> <a href="#mill/reports" style="color:var(--brand-molten);text-decoration:underline">RPT-2026-0142 (Sample Integrated Steel)</a> — Melt &amp; Pour Heat #<b>H-24K118</b></div>
        <div style="margin-top:2px">• <b>WhatsApp Invoice OCR Tags:</b> <span class="badge blue plain xs">Punjab Fuels #INV-3200</span> <span class="badge plain xs">Weighbridge Slip WR-5.5-A (24.62 t)</span></div>
      </div>
      <p class="xs muted" style="margin-top:8px">Precursors from several sources are weighted by tonnes (IR 2025/2547 Art. 14). Untraced steel takes India's wire-rod default for its share only.</p>
      <h4 style="margin:28px 0 14px">Progress</h4>
      <ul class="timeline">${steps.map(([b, sp], i) => `<li><div class="d ${i < s.step ? "done" : i === s.step ? "now" : ""}">${i < s.step ? icon("check") : ""}</div><div><b>${b}</b><span>${sp}</span></div></li>`).join("")}</ul>
      <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" id="dl">${icon("download")} Download emissions data (JSON)</button></div>`;
    $("dl").onclick = () => {
      const pkg = { sample: true, shipment: s.id, cn_code: "7318 15", tonnes: s.t, destination: s.to, reporting_year: Y,
        precursors: s.lots.map((l) => ({ lot: l.lot, tonnes: l.t, invoice_ref: l.irn, see_direct_tco2_per_t: l.see ?? "default" })),
        own_process_tco2_per_t: s.own, see_direct_tco2_per_t: +see.toFixed(3), method: "IR 2025/2547 Art. 14 weighted average",
        benchmark_tco2_per_t: CK.BENCH.actual, cbam_factor: CK.CBAM_FACTOR[Y], certificates: +((see - CK.BENCH.actual * CK.CBAM_FACTOR[Y]) * s.t).toFixed(1), certificate_price_eur: CK.PRICE_2026 };
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" }));
      a.download = `carbon-khata-${s.id}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      toast("Emissions data downloaded");
    };
    openDrawer();
  }

  VIEWS["exporter.evidence"] = () => `<div class="panel">
    <div class="panel-h"><h3>Documents received</h3><span class="notice">${icon("eye")} Read automatically, approved by a person</span></div>
    ${docs.map((d) => `<div class="doc-row">
      <div class="doc-ico">${icon("doc")}</div>
      <div><b style="font-weight:500">${d.name}</b> <span class="xs muted">· ${d.src}</span>
        <div class="extract">${d.fields.map(([k, v]) => `<div><span>${k}</span> <b class="mono" style="font-weight:500">${v}</b></div>`).join("")}</div>
        ${d.note ? `<div class="xs" style="margin-top:6px;color:${d.state === "flag" ? "var(--khata)" : "var(--text-3)"}">${d.note}</div>` : ""}</div>
      <div class="actions">${d.state === "approved" ? `<span class="badge green">Approved</span>` : `${d.state === "flag" ? `<span class="badge red">Flagged</span>` : `<span class="badge amber">Needs review</span>`}<button class="btn btn-secondary btn-sm" data-ap="${d.id}">Approve</button>`}</div>
    </div>`).join("")}
  </div>
  <p class="xs muted" style="margin-top:12px">Software reads Punjabi, Hindi and English documents and flags gaps between fuel use and output. It never fills in missing values; every field is approved by a reviewer before filing.</p>`;
  AFTER["exporter.evidence"] = () => document.querySelectorAll("[data-ap]").forEach((b) => b.onclick = () => {
    const d = docs.find((x) => x.id === +b.dataset.ap); d.state = "approved"; render(); toast(`${d.name} approved`);
  });

  VIEWS["stockist.lots"] = () => {
    const L = lots.find((l) => l.id === activeLot), sold = L.sales.reduce((a, s) => a + s.t, 0), left = L.t - sold;
    return `<div class="panel"><div class="table-wrap"><table class="data"><thead><tr><th>Lot</th><th>Item</th><th>Mill report</th><th class="r">Bought</th><th class="r">Sold</th><th class="r">Left</th></tr></thead><tbody>
      ${lots.map((l) => { const s = l.sales.reduce((a, x) => a + x.t, 0); return `<tr class="click" data-lot="${l.id}" style="${l.id === activeLot ? "background:var(--pine-tint)" : ""}"><td class="mono">${l.id}</td><td>${l.item}</td><td>${l.report ? `<span class="badge green">${l.see} tCO₂/t</span>` : `<span class="badge red">No report</span>`}</td><td class="r">${l.t} t</td><td class="r">${s} t</td><td class="r">${l.t - s} t</td></tr>`; }).join("")}
    </tbody></table></div></div>
    <div class="two">
      <div class="panel"><div class="panel-h"><h3>Lot ${L.id} · ${L.item}</h3>${L.report ? `<span class="badge green">Report ${L.report}</span>` : `<span class="badge red">Untraced</span>`}</div><div class="panel-b">
        <div class="range-row small" style="margin-bottom:8px"><span>Mass balance</span><span class="mono">${sold} of ${L.t} t sold</span></div>
        <div class="meter"><div style="width:${sold / L.t * 100}%"></div></div>
        <div class="table-wrap" style="margin-top:16px"><table class="data"><thead><tr><th>Sold to</th><th>Invoice</th><th class="r">Tonnes</th></tr></thead><tbody>
        ${L.sales.map((s) => `<tr><td>${s.to}</td><td class="mono">${s.irn}</td><td class="r">${s.t}</td></tr>`).join("")}</tbody></table></div>
        ${L.report ? "" : `<div class="alert error" style="margin-top:14px">${icon("alert")}<span>This lot came from a mill that has not joined. Buyers' EU files will use India's default for these tonnes.</span></div>`}
      </div></div>
      <div class="panel"><div class="panel-h"><h3>Record a sale</h3></div><div class="panel-b">
        <form id="saleForm" class="form-inline" novalidate>
          <div class="field"><label for="buyer">Buyer</label><select id="buyer"><option>Sample Bolts, Ludhiana</option><option>Sample Hand Tools, Jalandhar</option><option>Sample Fasteners, Ludhiana</option></select></div>
          <div class="field"><label for="tons">Tonnes</label><input type="number" id="tons" min="1" step="1" value="20" inputmode="numeric"></div>
          <button class="btn btn-primary" type="submit">Record</button>
        </form>
        <div id="saleMsg"></div>
        <div class="divider"></div>
        <div class="xs muted mono" style="margin-bottom:8px">TALLY PRIME · SALES VOUCHER T-4471</div>
        <dl class="kv"><dt>Party</dt><dd>Sample Fasteners, Ludhiana</dd><dt>Item</dt><dd>${L.item}, 40 t</dd><dt>e-invoice</dt><dd class="mono">…9f3a21</dd><dt>Carbon Khata tag</dt><dd style="color:var(--green);font-weight:500">${L.id} · ${L.see ?? "no report"} · ${L.heat}</dd></dl>
        <p class="xs muted" style="margin-top:12px">The Tally add-on tags each sale while you bill. The invoice number is only a lookup key; emissions data stays in Carbon Khata.</p>
      </div></div>
    </div>`;
  };
  AFTER["stockist.lots"] = () => {
    document.querySelectorAll("[data-lot]").forEach((r) => r.onclick = () => { activeLot = r.dataset.lot; render(); });
    $("saleForm").onsubmit = (e) => {
      e.preventDefault();
      const L = lots.find((l) => l.id === activeLot), t = Math.round(+$("tons").value), left = L.t - L.sales.reduce((a, s) => a + s.t, 0);
      if (!(t > 0)) { $("saleMsg").innerHTML = `<div class="alert error">${icon("alert")}<span>Enter tonnes above zero.</span></div>`; return; }
      if (t > left) {
        $("saleMsg").innerHTML = `<div class="alert error" id="oversellAlert"><div class="alert-title">⚠️ MASS-BALANCE VIOLATION PREVENTED (EU CBAM Art. 14 / IR 2025/2547)</div><p>Blocked. Only ${left} t of ${L.id} is left, and its mill report can't cover more tonnes than you bought. Bill the rest from another lot.</p></div>`;
        return;
      }
      L.sales.push({ to: $("buyer").value, t, irn: "…" + Math.random().toString(16).slice(2, 8) });
      render(); toast(`${t} t recorded on ${L.id}${L.report ? ", with the mill's report attached" : ""}`);
    };
  };

  VIEWS["stockist.earnings"] = () => {
    const tracedT = lots.filter((l) => l.report).reduce((a, l) => a + l.sales.reduce((b, s) => b + s.t, 0), 0);
    const untr = lots.filter((l) => !l.report).reduce((a, l) => a + l.sales.reduce((b, s) => b + s.t, 0), 0);
    return `<div class="kpis">${kpi("Traced tonnes sold", tracedT + " t", "This quarter")}${kpi("Tracing income", fmt.inr(tracedT * 50), "₹50 per traced tonne", "green")}${kpi("Untraced tonnes", untr + " t", "From mills not yet on Carbon Khata", untr ? "red" : "")}${kpi("Listing", "Carbon-ready", "Shown to exporters choosing a supplier")}</div>
    <div class="two"><div class="panel"><div class="panel-h"><h3>Tracing income by buyer</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Buyer</th><th class="r">Traced tonnes</th><th class="r">Income</th></tr></thead><tbody>${(() => { const m = Object.create(null); lots.filter((l) => l.report).forEach((l) => l.sales.forEach((x) => (m[x.to] = (m[x.to] || 0) + x.t))); return Object.entries(m).map(([k, v]) => `<tr><td>${k}</td><td class="r">${v} t</td><td class="r">${fmt.inr(v * 50)}</td></tr>`).join(""); })()}</tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h3>Next payout</h3><span class="badge green">Monthly</span></div><div class="panel-b"><dl class="kv"><dt>Period</dt><dd>October 2026</dd><dt>Amount</dt><dd>${fmt.inr(tracedT * 50)}</dd><dt>Paid to</dt><dd>Current account ending 4471</dd><dt>Paid on</dt><dd>7 November 2026</dd></dl></div></div></div>
    <div class="panel" style="margin-top:16px"><div class="panel-b"><h3>How tracing pays</h3><p class="muted small" style="margin-top:8px;max-width:70ch">Exporters pay ₹50 for each tonne that arrives with its mill report, about 0.08% of a ₹62,000 coil. Ludhiana buyers already pay ₹1,800 to ₹2,300 a tonne more to buy locally, so a traced lot is a reason to choose you. Your buying prices, margins and other customers are never shown.</p></div></div>`;
  };

  VIEWS["mill.reports"] = () => `<div class="panel"><div class="table-wrap"><table class="data"><thead><tr><th>Report</th><th>Product</th><th>Period</th><th class="r">Direct tCO₂/t</th><th>Verification</th><th class="r">Reused</th></tr></thead><tbody>
    <tr><td class="mono">RPT-2026-0142</td><td>Wire rod 5.5 mm, CN 7213</td><td>Jan–Dec 2026</td><td class="r">2.38</td><td><span class="badge green">Verified</span></td><td class="r">1,240 t</td></tr>
    <tr><td class="mono">RPT-2026-0151</td><td>Wire rod 6.5 mm, CN 7213</td><td>Jan–Dec 2026</td><td class="r">2.31</td><td><span class="badge green">Verified</span></td><td class="r">620 t</td></tr>
    <tr><td class="mono">RPT-2026-0160</td><td>Hot-rolled coil, CN 7208</td><td>Jan–Dec 2026</td><td class="r">2.30</td><td><span class="badge amber">Verifier review</span></td><td class="r">–</td></tr>
  </tbody></table></div></div>
  <div class="two"><div class="panel"><div class="panel-b"><h3>What a buyer saves with your report</h3><p class="small muted" style="margin-top:8px">India's default for wire rod is about 4.3 tCO₂/t before the mark-up. A bolt maker using your 2.38 report instead pays about ${fmt.inr100(def.noMill - def.act)} less CBAM per tonne in 2026.</p></div></div>
  <div class="panel"><div class="panel-b"><h3>Cost to you</h3><p class="small muted" style="margin-top:8px">Nothing. You already prepare these reports for your own EU customers; Carbon Khata carries them to the buyers you reach through stockists.</p></div></div></div>`;

  VIEWS["mill.sharing"] = () => `<div class="panel"><div class="panel-h"><h3>Fields shared with downstream buyers</h3><span class="notice">${icon("lock")} DPDP consent recorded</span></div><div class="panel-b">
    ${shareSettings.map(([b, s, on, can], i) => `<div class="setting"><div><b>${b}</b><span>${s}</span></div><button class="switch" role="switch" aria-checked="${on}" aria-label="${b}" data-sw="${i}" ${can ? "" : "disabled"}></button></div>`).join("")}
  </div></div>`;
  AFTER["mill.sharing"] = () => document.querySelectorAll("[data-sw]").forEach((b) => b.onclick = () => { const s = shareSettings[+b.dataset.sw]; s[2] = !s[2]; render(); toast(`${s[0]}: ${s[2] ? "shared" : "not shared"}`); });

  VIEWS["mill.reach"] = () => `<div class="kpis">${kpi("Stockists carrying your reports", "4")}${kpi("Exporters using them", "31")}${kpi("Tonnes reused in EU files", "1,860 t", "2026 to date")}${kpi("Requests for low-carbon grades", "2", "This month")}</div>
    <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Stockists</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Stockist</th><th>Location</th><th class="r">Tonnes passed on</th><th class="r">Exporters reached</th></tr></thead><tbody>
    <tr><td>Sample Steel Traders</td><td>Mandi Gobindgarh</td><td class="r">980 t</td><td class="r">14</td></tr><tr><td>Sample Metals</td><td>Ludhiana</td><td class="r">520 t</td><td class="r">9</td></tr><tr><td>Sample Wire House</td><td>Ludhiana</td><td class="r">240 t</td><td class="r">5</td></tr><tr><td>Sample Rolling Stock</td><td>Jalandhar</td><td class="r">120 t</td><td class="r">3</td></tr></tbody></table></div></div>`;

  const sites = [["Sample Fasteners", "Bolts", 92, "Mon"], ["Sample Bolts", "Bolts", 100, "Mon"], ["Sample Nuts", "Nuts", 100, "Tue"], ["Sample Washers", "Washers", 85, "Tue"], ["Sample Rivets", "Rivets", 100, "Wed"], ["Sample Forgings", "Forgings", 78, "Wed"], ["Sample Studs", "Studs", 96, "Thu"], ["Sample Screws", "Screws", 88, "Thu"], ["Sample Anchors", "Anchors", 70, "Fri"], ["Sample Hand Tools", "Tools", 81, "Fri"]];
  VIEWS["verifier.campaign"] = () => `<div class="kpis">${kpi("Sites this week", "10", "Ludhiana, week 3")}${kpi("Evidence packs ready", sites.filter((s) => s[2] === 100).length + " of 10", "Rest due before the visit")}${kpi("Cost per site", "₹6.0 L", "₹17.5 L if done alone", "green")}${kpi("Signing entity", "EU body", "Field work by the India branch")}</div>
    <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Week 3 schedule</h3><span class="notice">${icon("shield")} Every site gets its own year-1 visit (IR 2025/2546)</span></div><div class="panel-b"><div class="board">
    ${["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => `<div class="col"><h4>${d.toUpperCase()}</h4>${sites.filter((s) => s[3] === d).map((s) => `<div class="item"><b>${s[0]}</b><span class="muted">${s[1]} · pack ${s[2]}%</span></div>`).join("")}</div>`).join("")}
    </div></div></div>`;

  VIEWS["verifier.sites"] = () => `<div class="two" style="margin-top:0">
    <div class="panel"><div class="panel-h"><h3>Evidence readiness</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Site</th><th>Product</th><th class="r">Pack</th><th>Status</th></tr></thead><tbody>
    ${sites.map((s) => `<tr><td>${s[0]}</td><td>${s[1]}</td><td class="r">${s[2]}%</td><td>${s[2] === 100 ? '<span class="badge green">Ready</span>' : s[2] >= 85 ? '<span class="badge amber">Minor gaps</span>' : '<span class="badge red">Missing items</span>'}</td></tr>`).join("")}
    </tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h3>Cost per site (₹ lakh)</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Item</th><th class="r">Alone</th><th class="r">Batched</th></tr></thead><tbody>
      <tr><td>Verifier fee, simple site</td><td class="r">5.4</td><td class="r">4.2</td></tr><tr><td>Year-1 visit travel</td><td class="r">4.3</td><td class="r">0.6</td></tr><tr><td>Monitoring plan and data</td><td class="r">7.8</td><td class="r">1.2</td></tr><tr class="total"><td>Total</td><td class="r">17.5</td><td class="r" style="color:var(--green)">6.0</td></tr>
    </tbody></table></div><div class="panel-b"><p class="xs muted" style="margin:0">Fee from €5,000 for a simple site less a 15–25% multi-site discount. Carbon Khata prepares evidence and never verifies; impartiality rules keep the roles apart.</p></div></div>
  </div>`;

  VIEWS["importer.imports"] = () => {
    const rows = shipments.map((s) => { const see = seeOf(s), cd = def.defCerts * s.t, ca = Math.max(see - CK.BENCH.actual * CK.CBAM_FACTOR[Y], 0) * s.t; return { s, see, cd, ca }; });
    const tot = rows.reduce((a, r) => a + (r.cd - r.ca), 0);
    return `<div class="kpis">${kpi("Certificates on defaults", fmt.int(rows.reduce((a, r) => a + r.cd, 0)))}${kpi("Certificates on actual data", fmt.int(rows.reduce((a, r) => a + r.ca, 0)), "", "green")}${kpi("Saved at €75.28", fmt.eur(tot * CK.PRICE_2026), "Q2 2026 price", "green")}${kpi("Certificate sales open", "1 Feb 2027")}</div>
    <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Imports from Sample Fasteners</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Shipment</th><th class="r">Tonnes</th><th class="r">tCO₂/t</th><th class="r">Certificates, default</th><th class="r">Certificates, actual</th><th>Origin evidence</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td class="mono">${r.s.id}</td><td class="r">${r.s.t}</td><td class="r">${fmt.t2(r.see)}</td><td class="r">${fmt.int(r.cd)}</td><td class="r">${fmt.int(r.ca)}</td><td>${traced(r.s) === 1 ? '<span class="badge green">Heat numbers, India</span>' : '<span class="badge amber">Partly traced</span>'}</td></tr>`).join("")}
    </tbody></table></div></div>
    <div class="callout" style="margin-top:16px">Since 1 July 2026, steel above a country's quota pays a 50% duty and must show where it was first melted and poured (Reg. 2026/1384). Mill heat numbers in the ledger provide that evidence.</div>`;
  };
  VIEWS["importer.suppliers"] = () => `<div class="kpis" style="margin-bottom:16px">${kpi("Indian suppliers", "4", "Fasteners and tools")}${kpi("Verified for 2026", "2 of 4", "Third visit scheduled", "green")}${kpi("Average verified tCO₂/t", "2.42", "vs 6.29 on India's default")}${kpi("Next declaration", "30 Sep 2027", "Covers 2026 imports")}</div>
  <div class="two" style="margin-top:0;margin-bottom:16px"><div class="panel"><div class="panel-h"><h3>tCO₂ per tonne by supplier</h3></div><div class="panel-b">${bars([["India default, bolts", "6.29", 100, "#C2410C"], ["Sample Forgings", "2.52", 40.1, "var(--green)"], ["Sample Bolts", "2.44", 38.8, "var(--green)"], ["Sample Fasteners", "2.40", 38.2, "var(--green)"]])}</div></div>
  <div class="panel"><div class="panel-h"><h3>Ask a supplier to join</h3></div><div class="panel-b"><p class="small" style="color:var(--text-2);margin:0 0 14px">Suppliers without a verified file are billed on India's default. Send them an invite and Carbon Khata's Ludhiana team follows up in person.</p><button class="btn btn-primary btn-sm" id="inv">Invite Sample Hand Tools</button></div></div></div>
  <div class="panel"><div class="table-wrap"><table class="data"><thead><tr><th>Supplier</th><th>Cluster</th><th>Products</th><th class="r">tCO₂/t</th><th>Status</th></tr></thead><tbody>
    <tr><td>Sample Fasteners</td><td>Ludhiana</td><td>Bolts</td><td class="r">2.40</td><td><span class="badge green">Verified 2026</span></td></tr>
    <tr><td>Sample Bolts</td><td>Ludhiana</td><td>Bolts</td><td class="r">2.44</td><td><span class="badge green">Verified 2026</span></td></tr>
    <tr><td>Sample Forgings</td><td>Ludhiana</td><td>Forgings</td><td class="r">2.52</td><td><span class="badge amber">Visit scheduled</span></td></tr>
    <tr><td>Sample Hand Tools</td><td>Jalandhar</td><td>Hand tools</td><td class="r">–</td><td><span class="badge blue">Onboarding</span></td></tr>
  </tbody></table></div></div>`;

  AFTER["importer.suppliers"] = () => { $("inv").onclick = () => { $("inv").textContent = "Invite sent ✓"; $("inv").disabled = true; toast("Invite sent to Sample Hand Tools, Jalandhar"); }; };

  VIEWS["lender.applications"] = () => `<div class="two" style="margin-top:0">
    <div class="panel"><div class="panel-h"><h3>Sample Fasteners · ₹40 L green loan</h3>${loan === "approved" ? '<span class="badge green">Approved</span>' : loan === "info" ? '<span class="badge amber">Information requested</span>' : '<span class="badge blue">In review</span>'}</div><div class="panel-b">
      <dl class="kv"><dt>Purpose</dt><dd>Move 30% of wire rod to scrap-based EAF steel; working capital for the price gap</dd>
      <dt>Verified history</dt><dd>12 months, 300 t, 2.40 tCO₂/t, signed by an accredited verifier</dd>
      <dt>CBAM saving banked</dt><dd class="mono">${fmt.lakh(def.saving * 300)} a year</dd>
      <dt>Expected intensity</dt><dd class="mono">about 1.8 tCO₂/t</dd>
      <dt>Origination fee</dt><dd class="mono">₹20,000 (0.5%)</dd></dl>
      <div style="display:flex;gap:10px;margin-top:20px"><button class="btn btn-primary btn-sm" id="ap">Approve</button><button class="btn btn-secondary btn-sm" id="inf">Request information</button></div>
    </div></div>
    <div class="panel"><div class="panel-h"><h3>Emissions after the switch</h3></div><div class="panel-b">
      ${bars([["Today", "2.40", 100, "var(--text-3)"], ["After 30% scrap EAF", "1.79", 74.6, "var(--green)"]])}
      <p class="xs muted" style="margin-top:14px">Estimate: 70% at 2.35, 30% at about 0.3 for scrap EAF steel, plus 0.05 own process. The lender reads the same signed records the EU importer files, so no separate emissions check is needed.</p>
    </div></div></div>
    <div class="panel" style="margin-top:16px" id="sidbiChecklist">
      <div class="panel-h">
        <h3>SIDBI Green Concession Checklist</h3>
        <span class="badge green">50 bps Concession Unlocked</span>
      </div>
      <div class="panel-b">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:12px">
          <div style="border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--subtle)">
            <div class="xs muted">Certified Emissions Threshold</div>
            <div style="font-weight:600;font-size:15px;color:var(--green);margin-top:4px">1.06 tCO₂e/t Certified</div>
            <div class="xs muted" style="margin-top:2px">Benchmarked under SIDBI green criteria</div>
          </div>
          <div style="border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--subtle)">
            <div class="xs muted">Precursor Traceability</div>
            <div style="font-weight:600;font-size:15px;color:var(--green);margin-top:4px">100% Traced &amp; Audited</div>
            <div class="xs muted" style="margin-top:2px">Melt-and-pour heat numbers in ledger</div>
          </div>
          <div style="border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--subtle)">
            <div class="xs muted">Audit Certification</div>
            <div style="font-weight:600;font-size:15px;color:var(--green);margin-top:4px">IR 2025/2546 Verified</div>
            <div class="xs muted" style="margin-top:2px">Signed audit report &amp; monitoring plan</div>
          </div>
          <div style="border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--subtle)">
            <div class="xs muted">Interest Rebate Value</div>
            <div style="font-weight:600;font-size:15px;color:var(--text);margin-top:4px">-50 bps (₹2.0 L/yr)</div>
            <div class="xs muted" style="margin-top:2px">Working capital interest discount</div>
          </div>
        </div>
        <p class="xs muted" style="margin:0">SIDBI green concession checklist: Verified emissions of 1.06 tCO₂e/t unlock 50 bps interest rate concession on ₹40 L working capital facility without separate auditing costs.</p>
      </div>
    </div>
    <div class="two"><div class="panel"><div class="panel-h"><h3>Disbursement linked to verified data</h3></div><div class="table-wrap"><table class="data"><tbody>
      <tr><td>Tranche 1 · on approval</td><td class="r">₹25 L</td></tr><tr><td>Tranche 2 · when the next signed report shows under 2.0 tCO₂/t</td><td class="r">₹15 L</td></tr></tbody></table></div></div>
    <div class="panel"><div class="panel-h"><h3>Portfolio on verified records</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Borrower</th><th class="r">Loan</th><th>Status</th></tr></thead><tbody>
      <tr><td>Sample Fasteners</td><td class="r">₹40 L</td><td>${loan === "approved" ? '<span class="badge green">Approved</span>' : '<span class="badge blue">In review</span>'}</td></tr>
      <tr><td>Sample Bolts</td><td class="r">₹25 L</td><td><span class="badge green">Tranche 1 paid</span></td></tr>
      <tr><td>Sample Forgings</td><td class="r">₹15 L</td><td><span class="badge amber">Awaiting site visit</span></td></tr></tbody></table></div></div></div>`;
  AFTER["lender.applications"] = () => { $("ap").onclick = () => { loan = "approved"; render(); toast("Loan approved"); }; $("inf").onclick = () => { loan = "info"; render(); toast("Request sent to Sample Fasteners"); }; };

  VIEWS["cluster.pilot"] = () => {
    const g = [["Exporters onboarded", 50, 50, ""], ["Lots traced to a mill report", 74, 70, "%"], ["Mills publishing", 2, 2, ""], ["Stockists on the ledger", 15, 15, ""]];
    return `<div class="kpis">${g.map(([l, v, t, u]) => kpi(l, v + u, `Gate ${t}${u} · ${v >= t ? "met" : "open"}`, v >= t ? "green" : "")).join("")}</div>
    <div class="two"><div class="panel"><div class="panel-h"><h3>Exporters by stage</h3></div><div class="panel-b">${bars([["Signed up", "50", 100, "var(--pine)"], ["Evidence complete", "41", 82, "var(--pine)"], ["Visited by verifier", "18", 36, "var(--pine)"], ["File signed", "6", 12, "var(--green)"]])}</div></div>
    <div class="panel"><div class="panel-h"><h3>Kill criterion</h3></div><div class="panel-b"><p class="small muted" style="margin:0">If fewer than 50% of pilot lots trace to a mill report by March 2027, the pilot stops and Carbon Khata becomes a verifier-scheduling service. Current: 74%.</p></div></div></div>`;
  };
  VIEWS["cluster.roadmap"] = () => `<div class="panel"><div class="panel-b"><ul class="timeline">
    <li><div class="d now"></div><div><b>Pilot · December 2026 to March 2027</b><span>50 exporters, 2 mills, 15 stockists; verifier slots booked in December. Gate: 70% of lots traced.</span></div></li>
    <li><div class="d"></div><div><b>Verify · April to September 2027</b><span>Batched campaign; 2026 files signed before 30 September 2027. Gate: audit at or under ₹7 L a site.</span></div></li>
    <li><div class="d"></div><div><b>Scale · 2028</b><span>250 exporters across Ludhiana, Jalandhar, Howrah and Faridabad.</span></div></li>
    <li><div class="d"></div><div><b>Decarbonise · 2029</b><span>600 exporters; matching to lower-carbon steel; 15% lower tCO₂/t for members.</span></div></li>
  </ul></div></div>
  <div class="panel" style="margin-top:16px"><div class="panel-h"><h3>Gates</h3><span class="notice">Below 50% of lots traced by March 2027, the pilot stops</span></div><div class="table-wrap"><table class="data"><thead><tr><th>Phase</th><th>Gate</th><th class="r">Today</th><th>Status</th></tr></thead><tbody>
    <tr><td>Pilot</td><td>At least 70% of lots traced to a mill report</td><td class="r">74%</td><td><span class="badge green">Met</span></td></tr>
    <tr><td>Verify</td><td>Audit at or under ₹7 L a site</td><td class="r">₹6.0 L planned</td><td><span class="badge amber">On track</span></td></tr>
    <tr><td>Scale</td><td>Peak cumulative burn at or under ₹5 cr</td><td class="r">₹5.0 cr base case</td><td><span class="badge amber">On track</span></td></tr>
    <tr><td>Decarbonise</td><td>15% lower tCO₂/t for members</td><td class="r">–</td><td><span class="badge plain">Not started</span></td></tr>
  </tbody></table></div></div>`;

  /* ---------- 3 Judge Guided Scenarios ---------- */
  function runScenario1() {
    activeLot = "ST-7781";
    go("stockist", "lots");
    const tonsInput = $("tons");
    if (tonsInput) tonsInput.value = "99";
    const saleForm = $("saleForm");
    if (saleForm) saleForm.dispatchEvent(new Event("submit", { cancelable: true }));
    toast("Mass-balance guard: 99t sale strictly blocked");
  }

  function runScenario2() {
    go("exporter", "shipments");
    openShipment("EU-2391");
    toast("Opened EU-2391: WhatsApp receipt linked to mill heat number");
  }

  function runScenario3() {
    go("lender", "applications");
    const el = $("sidbiChecklist");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    toast("Lender view: verified 1.06 tCO2e/t unlocks green loan");
  }

  /* ---------- drawer ---------- */
  function openDrawer() { $("drawer").dataset.open = "true"; document.body.style.overflow = "hidden"; $("drawer").querySelector(".icon-btn").focus(); }
  function closeDrawer() { $("drawer").dataset.open = "false"; document.body.style.overflow = ""; }
  document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeDrawer));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  $("roleSel").addEventListener("change", (e) => go(e.target.value));
  document.querySelectorAll("[data-dock-role]").forEach((b) => b.addEventListener("click", () => go(b.dataset.dockRole)));

  const s1 = $("demoScenario1"); if (s1) s1.addEventListener("click", runScenario1);
  const s2 = $("demoScenario2"); if (s2) s2.addEventListener("click", runScenario2);
  const s3 = $("demoScenario3"); if (s3) s3.addEventListener("click", runScenario3);

  window.addEventListener("hashchange", setFromHash);
  setFromHash();

  window.CK_DEMO = { scenario1: runScenario1, scenario2: runScenario2, scenario3: runScenario3, go };
})();
