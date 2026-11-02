/* Carbon Khata · CBAM calculator */
(() => {
  const $ = (id) => document.getElementById(id);
  const st = { product: "bolts", year: 2026 };
  const defaults = { product: "bolts", year: 2026, tons: 120, price: 75.28, traced: 100 };

  // Responsive layout: assets/styles.css handles @media (max-width: 900px) #calcGrid;
  // removed redundant runtime trap: if (window.matchMedia("(max-width: 900px)").matches) $("calcGrid").style.gridTemplateColumns = "1fr";

  function seg(id, key) {
    $(id).querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      st[key] = key === "year" ? +b.dataset.v : b.dataset.v; sync(); draw();
    }));
  }
  function sync() {
    $("segProduct").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === st.product)));
    $("segYear").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === st.year)));
    $("cnHint").textContent = CK.PRODUCTS[st.product].cn;
    $("yearHint").textContent = `Default mark-up +${CK.MARKUP[st.year] * 100}%, CBAM factor ${(CK.CBAM_FACTOR[st.year] * 100).toFixed(1)}%`;
    $("tracedField").style.display = st.product === "bolts" ? "" : "none";
  }
  function valid(id) {
    const el = $(id), ok = +el.value > 0;
    el.setAttribute("aria-invalid", String(!ok)); el.closest(".field").classList.toggle("invalid", !ok);
    return ok;
  }

  function draw() {
    const okT = valid("tons"), okP = valid("price");
    const traced = +$("traced").value / 100;
    $("tracedOut").textContent = Math.round(traced * 100) + "%";
    if (!okT || !okP) return;
    const t = +$("tons").value, price = +$("price").value;
    const r = CK.perTonne({ product: st.product, year: st.year, price, traced: st.product === "bolts" ? traced : 1 });

    $("mDef").textContent = fmt.lakh(r.def * t);
    $("mAct").textContent = fmt.lakh(r.act * t);
    $("mSave").textContent = fmt.lakh(r.saving * t);
    $("mSaveL").textContent = `saved, ${fmt.inr100(r.saving)} per tonne`;

    const recEl = $("recoveryNotice");
    if (recEl) {
      if (st.product === "bolts" && traced < 0.70) {
        const target = 0.70;
        const needed = Math.ceil(Math.round((target - traced) * 1e4) / 1e4 * t);
        const r70 = CK.perTonne({ product: st.product, year: st.year, price, traced: target });
        const gap = (r70.saving - r.saving) * t;
        recEl.style.display = "";
        recEl.className = "card recovery-card";
        recEl.innerHTML = `
          <div class="recovery-badge"><span data-icon="spark"></span>Positive Mathematical Recovery</div>
          <div class="recovery-title">Target 70% cluster threshold: trace just <strong>${needed} more tonnes</strong> to unlock <strong>${fmt.lakh(gap)}</strong> in avoided CBAM liability.</div>
          <div class="recovery-sub">Every 10 tonnes of traced precursor cuts your certificate bill by ~₹3.0 Lakh.</div>
        `;
        if (typeof icon === "function") recEl.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
      } else if (st.product === "bolts") {
        recEl.style.display = "";
        recEl.className = "card recovery-card achieved";
        recEl.innerHTML = `
          <div class="recovery-achieved">
            <span class="badge green">Cluster threshold achieved: 100% of batched audit subsidy unlocked</span>
            <span class="muted xs">High-integrity batching eligible for Punjab 75% audit reimbursement.</span>
          </div>
        `;
      } else {
        recEl.style.display = "none";
      }
    }

    const rows = [["India default value", r.defSEE, r.def, "var(--khata)"]];
    if (st.product === "bolts") rows.push(["Own plant verified, no mill data", r.noMillSEE, r.noMill, "#D97757"]);
    rows.push([st.product === "bolts" && traced < 1 ? `Verified, ${Math.round(traced * 100)}% traced` : "Verified data", r.actSEE, r.act, "var(--green)"]);
    $("bars").innerHTML = rows.map(([l, see, c, col]) => `<div class="bar-row"><span>${l} <span class="muted mono xs">${fmt.t2(see)} tCO₂/t</span></span><span class="val">${fmt.lakh(c * t)}</span><div class="track"><div class="fill" style="width:${(c / r.def * 100).toFixed(1)}%;background:${col}"></div></div></div>`).join("");

    const benchA = st.product === "bolts" ? CK.BENCH.actual : CK.BENCH.actual;
    const p = CK.PRODUCTS[st.product];
    $("walk").innerHTML = `<thead><tr><th>Step</th><th class="r">Default</th><th class="r">Verified</th></tr></thead><tbody>
      <tr><td>Embedded emissions, tCO₂/t <span class="muted xs">(default ${p.def} + ${CK.MARKUP[st.year] * 100}%)</span></td><td class="r">${fmt.t2(r.defSEE)}</td><td class="r">${fmt.t2(r.actSEE)}</td></tr>
      <tr><td>EU benchmark, tCO₂/t</td><td class="r">${CK.BENCH.default}</td><td class="r">${benchA}</td></tr>
      <tr><td>CBAM factor</td><td class="r">${(r.factor * 100).toFixed(1)}%</td><td class="r">${(r.factor * 100).toFixed(1)}%</td></tr>
      <tr><td>Free-allocation adjustment = benchmark × factor</td><td class="r">${fmt.t2(CK.BENCH.default * r.factor)}</td><td class="r">${fmt.t2(benchA * r.factor)}</td></tr>
      <tr><td>Certificates per tonne</td><td class="r">${fmt.t2(r.defCerts)}</td><td class="r">${fmt.t2(r.actCerts)}</td></tr>
      <tr><td>Price × exchange rate, ₹ per certificate <span class="muted xs">(€${price} × ${CK.FX})</span></td><td class="r">${fmt.inr(r.k)}</td><td class="r">${fmt.inr(r.k)}</td></tr>
      <tr class="total"><td>Cost per tonne</td><td class="r">${fmt.inr100(r.def)}</td><td class="r">${fmt.inr100(r.act)}</td></tr>
      <tr class="total"><td>Cost for ${fmt.int(t)} t</td><td class="r">${fmt.lakh(r.def * t)}</td><td class="r">${fmt.lakh(r.act * t)}</td></tr></tbody>`;
    $("walkNote").textContent = st.product === "bolts"
      ? "Verified bolts: wire rod at 2.35 tCO₂/t from mill reports (weighted average, IR 2025/2547 Art. 14) plus 0.05 for the exporter's own heat treatment. Untraced rod takes India's default of about 4.3 plus the mark-up."
      : "Verified coil at 2.30 tCO₂/t, in line with Tata Steel (2.32) and JSW (2.36) per tonne of crude steel.";

    const q = new URLSearchParams({ p: st.product, y: st.year, t, eur: price, tr: Math.round(traced * 100) });
    history.replaceState(null, "", "?" + q.toString());
  }

  function load() {
    const q = new URLSearchParams(location.search);
    // Hardened against prototype chain traversal (formerly: if (q.get("p") in CK.PRODUCTS))
    if (Object.prototype.hasOwnProperty.call(CK.PRODUCTS, q.get("p"))) st.product = q.get("p");
    if (CK.MARKUP[+q.get("y")] !== undefined) st.year = +q.get("y");
    if (+q.get("t") > 0) $("tons").value = +q.get("t");
    if (+q.get("eur") > 0) $("price").value = +q.get("eur");
    if (q.get("tr") !== null && +q.get("tr") >= 0 && +q.get("tr") <= 100) $("traced").value = +q.get("tr");
  }

  seg("segProduct", "product"); seg("segYear", "year");
  ["tons", "price", "traced"].forEach((id) => $(id).addEventListener("input", draw));
  $("share").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); $("share").lastChild.textContent = "Link copied"; }
    catch { $("share").lastChild.textContent = "Copy the address bar"; }
    setTimeout(() => ($("share").lastChild.textContent = "Copy link to this result"), 2000);
  });
  $("reset").addEventListener("click", () => {
    Object.assign(st, { product: defaults.product, year: defaults.year });
    $("tons").value = defaults.tons; $("price").value = defaults.price; $("traced").value = defaults.traced; sync(); draw();
  });
  load(); sync(); draw();
})();
