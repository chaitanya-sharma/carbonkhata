/* Carbon Khata · guided product tour. Eight scripted chapters; each builds a scene and returns a GSAP timeline. */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $("#stage"), cursor = $("#cursor");

  /* scene-internal styles */
  const css = document.createElement("style");
  css.textContent = `
  .sc { width: 100%; height: 100%; font-size: 13.5px; }
  .sc .appbar { height: 44px; display: flex; align-items: center; gap: 10px; padding: 0 16px; border-bottom: 1px solid var(--line); background: var(--surface-2); }
  .sc .appbar b { font-weight: 500; font-size: 14px; }
  .sc .appbar .sp { margin-left: auto; }
  .sc .wrap { display: grid; grid-template-columns: 170px 1fr; height: calc(100% - 44px); }
  .sc .side { background: var(--subtle); border-right: 1px solid var(--line); padding: 12px 10px; display: grid; align-content: start; gap: 4px; }
  .sc .side i { font-style: normal; padding: 7px 10px; border-radius: 7px; color: var(--text-2); }
  .sc .side i.on { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
  .sc .main { padding: 18px; overflow: hidden; display: grid; gap: 14px; align-content: start; }
  .sc .row2 { display: grid; grid-template-columns: 1.1fr 1fr; gap: 14px; }
  .sc .box { border: 1px solid var(--line); border-radius: 12px; background: var(--surface); padding: 14px; }
  .sc .box h4 { font-weight: 500; font-size: 13.5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .sc .f { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed var(--line); }
  .sc .f:last-child { border-bottom: 0; }
  .sc .f span { color: var(--text-3); }
  .sc .f b { font-family: var(--mono); font-weight: 500; }
  .sc .tg { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px dashed var(--line); }
  .sc .tg:last-child { border-bottom: 0; }
  .sc .sw { width: 34px; height: 20px; border-radius: 99px; background: var(--line-strong); position: relative; flex: none; }
  .sc .sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: left .25s; }
  .sc .sw.on { background: var(--green); } .sc .sw.on::after { left: 17px; }
  .sc .sw.lock { opacity: .4; }
  .sc .btnx { display: inline-flex; align-items: center; justify-content: center; height: 34px; padding: 0 14px; border-radius: 99px; background: var(--text); color: #fff; font-weight: 500; font-size: 13px; }
  .sc .btnx.ok { background: var(--green); }
  .sc .big { font: 500 30px var(--mono); letter-spacing: -0.03em; }
  .sc .pill { display: inline-flex; gap: 6px; align-items: center; font-size: 12px; padding: 3px 9px; border-radius: 99px; background: var(--subtle); color: var(--text-2); }
  .sc .pill.g { background: var(--green-tint); color: var(--green); } .sc .pill.r { background: var(--khata-tint); color: var(--khata); } .sc .pill.a { background: var(--amber-tint); color: var(--amber); }
  .sc .meterx { height: 10px; border-radius: 99px; background: var(--subtle); overflow: hidden; } .sc .meterx > div { height: 100%; width: 0; background: var(--text); border-radius: 99px; }
  .ring { width: 84px; height: 84px; margin: 0 auto; display: block; }
  .ring circle { fill: none; stroke-width: 7; } .ring .bg { stroke: var(--line); } .ring .fg { stroke: var(--green); stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%; } .ring-wrap { position: relative; } .ring-wrap .rv { position: absolute; inset: 0; display: grid; place-items: center; color: var(--green); } .ring-wrap .rv svg { width: 26px; height: 26px; }
  .sc .toastx { position: absolute; left: 50%; top: 54px; transform: translateX(-50%); background: var(--text); color: #fff; padding: 9px 16px; border-radius: 99px; font-size: 13px; opacity: 0; white-space: nowrap; }
  .tallyx { height: 100%; display: grid; grid-template-columns: 1fr 250px; background: #FFFEF6; color: #1d2733; font: 12.5px/1.5 var(--mono); }
  .tallyx .l { border-right: 1px solid #d9d2bd; } .tallyx .hd { background: #1F4E79; color: #fff; padding: 8px 14px; display: flex; justify-content: space-between; }
  .tallyx .bd { padding: 14px; display: grid; gap: 6px; } .tallyx .ln { display: flex; justify-content: space-between; border-bottom: 1px dotted #d9d2bd; padding: 4px 0; }
  .tallyx .ln .typ::after { content: "▍"; animation: blink 1s steps(1) infinite; opacity: .6; } @keyframes blink { 50% { opacity: 0; } }
  .tallyx .ck { background: #0B1F17; color: #CFF5E3; font-family: var(--font); padding: 14px; display: grid; gap: 10px; align-content: start; }
  .tallyx .ck h5 { margin: 0; font: 500 13px var(--font); display: flex; gap: 8px; align-items: center; }
  .tallyx .ck .m { height: 8px; border-radius: 99px; background: rgba(255,255,255,.12); overflow: hidden; } .tallyx .ck .m > div { height: 100%; width: 0; background: #3DDC97; }
  .tallyx .ck .blk { background: rgba(255,91,31,.18); color: #FFB59B; border-radius: 8px; padding: 9px 10px; font-size: 12.5px; opacity: 0; }
  .tallyx .ck .sale { display: flex; justify-content: space-between; font-size: 12.5px; color: #9FD9BF; }
  .wk { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; } .wk .c { background: var(--subtle); border-radius: 10px; padding: 8px; min-height: 150px; } .wk h6 { margin: 0 0 6px; font: 500 11px var(--mono); color: var(--text-3); }
  .wk .it { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 7px 8px; font-size: 12px; margin-bottom: 6px; } .wk .it em { font-style: normal; display: block; font-size: 11px; color: var(--text-3); }
  .wk .it.done { border-color: var(--green); } .wk .it.done em { color: var(--green); }
  .eu { font-family: var(--font); } .eu .flag { width: 22px; height: 16px; border-radius: 3px; background: #1F3D99; display: grid; place-items: center; color: #FFD34D; font-size: 9px; }
  .chk { display: flex; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px dashed var(--line); } .chk:last-child { border-bottom: 0; }
  .chk i { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--line-strong); display: grid; place-items: center; font-style: normal; font-size: 11px; color: transparent; flex: none; }
  .chk.ok i { background: var(--green); border-color: var(--green); color: #fff; }
  .end { text-align: center; max-width: 640px; }
  .end .bigx { font: 700 clamp(56px, 8vw, 110px)/.9 var(--display); letter-spacing: -0.06em; background: linear-gradient(120deg, var(--accent-2), var(--accent) 50%, var(--good)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .end p { color: var(--text-2); font-size: 18px; margin-top: 18px; }
  .end .btns { display: flex; gap: 12px; justify-content: center; margin-top: 30px; flex-wrap: wrap; }
  @media (max-width: 760px) { .sc .wrap { grid-template-columns: 1fr; } .sc .side { display: none; } .sc .row2 { grid-template-columns: 1fr; } .tallyx { grid-template-columns: 1fr; } .tallyx .l { display: none; } .wk { grid-template-columns: repeat(3, 1fr); } .wk .c:nth-child(n+4) { display: none; } }
  `;
  document.head.appendChild(css);

  /* ---------- helpers ---------- */
  const laptop = (inner, url) => `<div class="laptop"><div class="lid"><div class="scr light"><div class="screen-top" style="border-radius:0"><i></i><i></i><i></i><span>${url}</span></div><div style="height:calc(100% - 38px);position:relative">${inner}</div></div></div><div class="base"></div></div>`;
  const tablet = (inner) => `<div class="tablet"><div class="scr light" style="position:relative;height:auto">${inner}</div></div>`;
  const side = (items, on) => `<div class="side">${items.map((t, i) => `<i class="${i === on ? "on" : ""}">${t}</i>`).join("")}</div>`;
  const ring = (id) => `<svg class="ring" viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="32"/><circle class="fg" id="${id}" cx="40" cy="40" r="32" stroke-dasharray="201" stroke-dashoffset="201"/></svg>`;
  function pos(el) {
    const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - s.left + r.width * 0.55, y: r.top - s.top + r.height * 0.55 };
  }
  function moveTo(tl, sel, at, dur = 0.9) { tl.to(cursor, { autoAlpha: 1, duration: 0.25 }, at); tl.to(cursor, { x: () => pos($(sel, stage)).x, y: () => pos($(sel, stage)).y, duration: dur, ease: "power2.inOut" }, at); }
  function click(tl, sel, at) {
    tl.to(cursor, { scale: 0.82, duration: 0.09, yoyo: true, repeat: 1 }, at)
      .fromTo($(".ripple", cursor), { scale: 0.3, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.55, ease: "power2.out" }, at)
      .to(sel, { scale: 0.96, duration: 0.09, yoyo: true, repeat: 1, transformOrigin: "50% 50%" }, at);
  }
  const countTo = (tl, sel, from, to, at, dur = 1.2, fmt = (v) => Math.round(v).toLocaleString("en-IN")) => {
    const o = { v: from };
    tl.to(o, { v: to, duration: dur, ease: "power3.out", onUpdate: () => { const el = $(sel, stage); if (el) el.textContent = fmt(o.v); } }, at);
  };
  const type = (tl, sel, text, at, cps = 22) => {
    const o = { n: 0 };
    tl.add(() => $(sel, stage).classList.add("typ"), at);
    tl.to(o, { n: text.length, duration: text.length / cps, ease: "none", onUpdate: () => ($(sel, stage).textContent = text.slice(0, Math.round(o.n))) }, at);
    tl.add(() => $(sel, stage).classList.remove("typ"));
  };

  /* ---------- chapters ---------- */
  const CH = [
    {
      t: "Mill", kicker: "01 · Steel mill", title: "The mill publishes the report it already makes",
      text: "Sample Integrated Steel verifies its emissions for its own EU customers. On Carbon Khata it publishes that report once, picks the fields that travel, and keeps prices private.",
      stat: ["₹0", "cost to the mill"], who: ["factory", "Sample Integrated Steel", "Odisha · BF-BOF route"],
      build() {
        stage.insertAdjacentHTML("beforeend", `<div class="scene">${laptop(`<div class="sc"><div class="appbar"><b>Reports</b><span class="pill">Wire rod · CN 7213</span><span class="sp"></span><span class="pill g">Verified by EU-accredited body</span></div><div class="wrap">${side(["Reports", "Sharing", "Downstream reach"], 0)}<div class="main">
          <div class="row2"><div class="box"><h4>RPT-2026-0142 <span class="pill a" id="m-st">Draft</span></h4>
            <div class="f"><span>Direct emissions</span><b>2.38 tCO₂/t</b></div><div class="f"><span>Free allocation data</span><b>attached</b></div><div class="f"><span>Period</span><b>Jan–Dec 2026</b></div><div class="f"><span>Heats</span><b>H-24K101–160</b></div></div>
            <div class="box"><h4>Fields buyers can see</h4>
              <div class="tg"><span>Emissions, route, period</span><span class="sw" id="m-s1"></span></div><div class="tg"><span>Heat numbers</span><span class="sw" id="m-s2"></span></div><div class="tg"><span>Prices and discounts</span><span class="sw lock"></span></div><div class="tg"><span>Customer list</span><span class="sw lock"></span></div></div></div>
          <div class="box" style="display:flex;justify-content:space-between;align-items:center"><div><div style="color:var(--text-3);font-size:12.5px">Downstream reach</div><div style="display:flex;gap:28px;margin-top:4px"><div><span class="big" id="m-r1">0</span> <span style="color:var(--text-3)">stockists</span></div><div><span class="big" id="m-r2">0</span> <span style="color:var(--text-3)">exporters</span></div></div></div><span class="btnx" id="m-pub">Publish to buyers</span></div>
        </div></div></div>`, "carbonkhata · mill · reports")}</div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .laptop", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
        moveTo(tl, "#m-s1", 0.6); click(tl, "#m-s1", 1.5); tl.add(() => $("#m-s1").classList.add("on"), 1.55);
        moveTo(tl, "#m-s2", 1.8, 0.6); click(tl, "#m-s2", 2.45); tl.add(() => $("#m-s2").classList.add("on"), 2.5);
        moveTo(tl, "#m-pub", 2.8, 0.9); click(tl, "#m-pub", 3.8);
        tl.add(() => { $("#m-pub").textContent = "Published ✓"; $("#m-pub").classList.add("ok"); $("#m-st").textContent = "Live"; $("#m-st").className = "pill g"; }, 3.9);
        countTo(tl, "#m-r1", 0, 4, 4.0, 1.4); countTo(tl, "#m-r2", 0, 31, 4.0, 1.8);
        tl.to({}, { duration: 2.2 });
        return tl;
      },
    },
    {
      t: "Stockist", kicker: "02 · Stockist", title: "The lot splits. The report goes with every piece.",
      text: "In Mandi Gobindgarh the stockist bills from Tally as usual. The add-on tags each sale with lot ST-7781 and the mill's report, and stops any sale beyond the 100 t bought.",
      stat: ["₹50/t", "earned for each traced tonne"], who: ["store", "Sample Steel Traders", "Stockist · Mandi Gobindgarh"],
      build() {
        stage.insertAdjacentHTML("beforeend", `<div class="scene">${laptop(`<div class="tallyx"><div class="l"><div class="hd"><span>Accounting Voucher Creation · Sales</span><span>T-4473</span></div><div class="bd">
          <div class="ln"><span>Party A/c</span><span id="s-p"></span></div><div class="ln"><span>Item</span><span id="s-i"></span></div><div class="ln"><span>Quantity</span><span id="s-q"></span></div><div class="ln"><span>e-Invoice IRN</span><span id="s-irn"></span></div></div></div>
          <div class="ck"><h5><svg width="16" height="16" viewBox="0 0 28 28"><rect x="2" y="3" width="20" height="23" rx="3.5" fill="#F2EFE8"/><rect x="2" y="3" width="5.5" height="23" rx="2.5" fill="#FF5B1F"/></svg>Carbon Khata</h5>
            <div style="font-size:12px;opacity:.8">Lot ST-7781 · wire rod 5.5 mm · mill report 2.38 tCO₂/t · heat H-24K118</div>
            <div><div style="display:flex;justify-content:space-between;font-size:12px"><span>Mass balance</span><span id="s-mb">40 / 100 t</span></div><div class="m"><div id="s-mbf" style="width:40%"></div></div></div>
            <div class="sale">Sample Fasteners · 40 t ✓</div><div class="sale" id="s-sale2" style="opacity:0">Sample Forgings · 35 t ✓</div>
            <div class="blk" id="s-blk">Blocked: 30 t requested, 25 t left on ST-7781. The mill's report can't cover more than was bought.</div>
          </div></div>`, "Tally Prime · Carbon Khata add-on")}</div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .laptop", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
        type(tl, "#s-p", "Sample Forgings, Ludhiana", 0.6); type(tl, "#s-i", "Wire rod 5.5 mm", ">"); type(tl, "#s-q", "35 t", ">"); type(tl, "#s-irn", "…b71e04", ">");
        tl.to("#s-sale2", { opacity: 1, duration: 0.4 }, ">0.2").to("#s-mbf", { width: "75%", duration: 0.8, ease: "power3.out" }, "<").add(() => ($("#s-mb").textContent = "75 / 100 t"), "<");
        tl.add(() => { ["#s-p", "#s-i", "#s-q", "#s-irn"].forEach((s) => ($(s).textContent = "")); }, ">0.6");
        type(tl, "#s-p", "Sample Bolts, Ludhiana", ">"); type(tl, "#s-i", "Wire rod 5.5 mm", ">"); type(tl, "#s-q", "30 t", ">");
        tl.to("#s-blk", { opacity: 1, duration: 0.4 }, ">0.1").fromTo("#s-blk", { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }, "<");
        tl.to({}, { duration: 2.4 });
        return tl;
      },
    },
    {
      t: "WhatsApp", kicker: "03 · Bolt workshop, Ludhiana", title: "The owner sends a photo of the bill, in Punjabi",
      text: "No portal, no forms. The workshop owner sends the month's fuel bill on WhatsApp. Software reads it; a reviewer approves every field before it counts. Nothing is guessed.",
      stat: ["0", "forms to fill"], who: ["phone", "Sample Fasteners", "18 people · 300 t a year to the EU"],
      build() {
        stage.insertAdjacentHTML("beforeend", `<div class="scene" style="grid-template-columns:auto auto;gap:28px;align-content:center;justify-content:center">
          <div class="phone"><div class="phone-screen"><div class="phone-notch"></div><div class="wa-top"><div class="av"><svg width="22" height="22" viewBox="0 0 28 28"><rect x="2" y="3" width="20" height="23" rx="3.5" fill="#0A0C0B"/><rect x="2" y="3" width="5.5" height="23" rx="2.5" fill="#FF5B1F"/></svg></div><div><b>Carbon Khata</b><span>business account</span></div></div><div class="wa-body" id="w-b"></div><div class="wa-input"><div></div><i></i></div></div></div>
          <div class="light screen" id="w-rev" style="width:250px;align-self:center;opacity:0"><div class="screen-body" style="padding:16px"><div style="font-size:12px;color:var(--text-3)">Review desk</div><div style="font-weight:500;margin:4px 0 10px">Furnace oil bill, Oct 2026</div>
            <div class="chk" id="w-c1"><i>✓</i>Quantity 3,200 L</div><div class="chk" id="w-c2"><i>✓</i>Period matches production log</div><div class="chk" id="w-c3"><i>✓</i>Fuel per tonne within range</div></div></div></div>`);
        const msgs = [["in", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! Send this month's fuel bill here."], ["out", '<div class="img">PUNJAB FUELS<br>Tax invoice 4471<br>Furnace oil … 3,200 L<br>Period 01–31 Oct 2026</div>'], ["in", '<b>ਬਿੱਲ ਮਿਲ ਗਿਆ</b> · bill received<div class="kv2"><span>Fuel</span><b>Furnace oil</b><span>Quantity</span><b>3,200 L</b><span>Period</span><b>Oct 2026</b></div><div class="btns"><i>ਸਹੀ ਹੈ ✓</i><i>Edit</i></div>'], ["out", "ਸਹੀ ਹੈ ✓"], ["in", "Checked by a reviewer. EU-2391 evidence is 92% ready for the verifier."]];
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .phone", { y: 50, opacity: 0, duration: 0.8, ease: "power3.out" });
                msgs.forEach(([d, h], i) => tl.add(() => {
          const b = document.createElement("div"); b.className = "bub " + d; b.innerHTML = h + `<span class="t">10:0${i + 2}${d === "out" ? " ✓✓" : ""}</span>`;
          const body = $("#w-b"); body.appendChild(b); gsap.from(b, { y: 14, opacity: 0, scale: 0.95, duration: 0.4, ease: "back.out(1.6)" });
          while (body.scrollHeight > body.clientHeight + 4 && body.children.length > 1) body.removeChild(body.firstChild);
        }, 0.7 + i * 1.25));
        tl.to("#w-rev", { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, 4.2).from("#w-rev", { x: 30, duration: 0.6 }, 4.2);
        ["#w-c1", "#w-c2", "#w-c3"].forEach((c, i) => tl.add(() => $(c).classList.add("ok"), 4.9 + i * 0.45));
        tl.to({}, { duration: 2.2 });
        return tl;
      },
    },
    {
      t: "Shipment", kicker: "04 · Exporter dashboard", title: "Every lot adds up to one number the EU accepts",
      text: "Two mill lots, weighted by tonnes, plus the workshop's own heat treatment. Shipment EU-2391 files at 2.40 tCO₂ per tonne instead of India's default of 6.29.",
      stat: ["₹36.4 L", "kept on one 120 t shipment"], who: ["bolt", "Sample Fasteners", "Exporter · Ludhiana"],
      build() {
        stage.insertAdjacentHTML("beforeend", `<div class="scene">${laptop(`<div class="sc"><div class="appbar"><b>EU-2391 · 120 t of M10 bolts to Hamburg</b><span class="sp"></span><span class="pill a">Verifier visit, week 3</span></div><div class="wrap">${side(["Overview", "Shipments", "Evidence inbox"], 1)}<div class="main"><div class="row2">
          <div class="box"><h4>Where the steel came from</h4><div class="f x1" style="opacity:0"><span>WR-5.5-A · 72 t · via ST-7781</span><b>2.38</b></div><div class="f x2" style="opacity:0"><span>WR-5.5-B · 54 t · direct</span><b>2.31</b></div><div class="f x3" style="opacity:0"><span>Weighted average (Art. 14)</span><b>2.35</b></div><div class="f x4" style="opacity:0"><span>+ own heat treatment</span><b>0.05</b></div><div class="f x5" style="opacity:0"><span style="color:var(--text)">Embedded per tonne</span><b style="color:var(--green)">2.40</b></div></div>
          <div class="box"><h4>CBAM cost, 2026</h4><div class="bars">
            <div class="bar-row"><span>India default 6.29</span><span class="val">₹46.8 L</span><div class="track"><div class="fill e1" style="width:0;background:#C2410C"></div></div></div>
            <div class="bar-row"><span>Own plant only 4.78</span><span class="val">₹33.6 L</span><div class="track"><div class="fill e2" style="width:0;background:#E8915F"></div></div></div>
            <div class="bar-row"><span>This file 2.40</span><span class="val">₹10.4 L</span><div class="track"><div class="fill e3" style="width:0;background:#0E7A52"></div></div></div></div>
            <div style="margin-top:14px;padding:10px 12px;border-radius:10px;background:var(--green-tint);color:var(--green);display:flex;justify-content:space-between"><span>Kept</span><b class="mono" id="e-k">₹0.0 L</b></div></div>
        </div><div class="box x6" style="opacity:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px"><div><span class="pill g">Done</span><div style="margin-top:6px">Mill reports linked</div></div><div><span class="pill g">Done</span><div style="margin-top:6px">Evidence approved</div></div><div><span class="pill a">Week 3</span><div style="margin-top:6px">Verifier site visit</div></div><div><span class="pill">By 30 Sep 2027</span><div style="margin-top:6px">Importer declares</div></div></div></div></div></div>`, "carbonkhata · shipments · EU-2391")}</div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .laptop", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
                [".x1", ".x2", ".x3", ".x4", ".x5"].forEach((s, i) => tl.to(s, { opacity: 1, duration: 0.35 }, 0.7 + i * 0.45).from(s, { x: -10, duration: 0.35 }, "<"));
        tl.to(".e1", { width: "100%", duration: 0.8, ease: "power3.out" }, 3.2).to(".e2", { width: "71.8%", duration: 0.8, ease: "power3.out" }, 3.5).to(".e3", { width: "22.2%", duration: 0.8, ease: "power3.out" }, 3.8);
        countTo(tl, "#e-k", 0, 36.4, 4.0, 1.6, (v) => "₹" + v.toFixed(1) + " L");
        tl.to(".x6", { opacity: 1, duration: 0.5 }, 5.0).from(".x6", { y: 12, duration: 0.5 }, 5.0);
        tl.to({}, { duration: 2.4 });
        return tl;
      },
    },
    {
      t: "Verifier", kicker: "05 · Verifier campaign", title: "Ten sites a week, each signed by an accredited body",
      text: "Every site still gets its own year-1 visit. Booking the cluster as one campaign shares travel, uses one monitoring plan per product family and brings evidence packs ready.",
      stat: ["₹6 L", "per site, down from ₹17.5 L"], who: ["shield", "Accredited verifier", "India branch · EU-accredited body signs"],
      build() {
        const days = [["MON", "Sample Fasteners", "Sample Bolts"], ["TUE", "Sample Nuts", "Sample Washers"], ["WED", "Sample Rivets", "Sample Forgings"], ["THU", "Sample Studs", "Sample Screws"], ["FRI", "Sample Anchors", "Sample Tools"]];
        stage.insertAdjacentHTML("beforeend", `<div class="scene">${tablet(`<div class="sc" style="padding:16px;display:grid;gap:14px;align-content:start"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-weight:500;font-size:15px">Ludhiana campaign · week 3</b><span class="pill g" id="v-ct">0 of 10 visited</span></div>
          <div class="wk">${days.map(([d, a, b], i) => `<div class="c"><h6>${d}</h6><div class="it" id="v${i * 2}">${a}<em>pack ready</em></div><div class="it" id="v${i * 2 + 1}">${b}<em>pack ready</em></div></div>`).join("")}</div>
          <div class="box"><h4>Cost per site</h4><div class="bars"><div class="bar-row"><span>Alone</span><span class="val">₹17.5 L</span><div class="track"><div class="fill" style="width:100%;background:#C2410C"></div></div></div><div class="bar-row"><span>Batched</span><span class="val" id="v-c">₹17.5 L</span><div class="track"><div class="fill" id="v-f" style="width:100%;background:#0E7A52"></div></div></div></div></div></div>`)}</div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .tablet", { y: 40, opacity: 0, rotateX: 8, duration: 0.8, ease: "power3.out" });
                for (let i = 0; i < 10; i++) tl.add(() => { const it = $("#v" + i); it.classList.add("done"); $("em", it).textContent = "visited ✓"; $("#v-ct").textContent = `${i + 1} of 10 visited`; gsap.from(it, { scale: 0.9, duration: 0.3, ease: "back.out(2)" }); }, 0.8 + i * 0.32);
        tl.to("#v-f", { width: "34.3%", duration: 1.2, ease: "power3.out" }, 4.3);
        countTo(tl, "#v-c", 17.5, 6.0, 4.3, 1.2, (v) => "₹" + v.toFixed(1) + " L");
        tl.to({}, { duration: 2.2 });
        return tl;
      },
    },
    {
      t: "EU importer", kicker: "06 · EU importer, Hamburg", title: "The file arrives signed, traced and ready to declare",
      text: "The importer sees the verifier's signature, both precursors traced and Indian melt-and-pour origin. It buys 128 certificates instead of 576 for the same container of bolts.",
      stat: ["€33,700", "fewer certificates bought, one shipment"], who: ["ship", "Sample Importer GmbH", "Authorised CBAM declarant · Hamburg"],
      build() {
        stage.insertAdjacentHTML("beforeend", `<div class="scene">${laptop(`<div class="sc eu"><div class="appbar"><span class="flag">★</span><b>Supplier file · EU-2391 · Sample Fasteners, India</b><span class="sp"></span><span class="pill">CN 7318 15 · 120 t</span></div><div class="main" style="padding:18px"><div class="row2">
          <div class="box"><h4>Checks</h4><div class="chk" id="i1"><i>✓</i>Signed by an EU-accredited verifier</div><div class="chk" id="i2"><i>✓</i>2 of 2 precursor lots traced to mill reports</div><div class="chk" id="i3"><i>✓</i>Melt and pour: India (heat H-24K118)</div><div class="chk" id="i4"><i>✓</i>Direct emissions 2.40 tCO₂/t</div></div>
          <div class="box"><h4>Certificates to surrender</h4><div style="display:flex;gap:24px;align-items:flex-end"><div><div style="color:var(--text-3);font-size:12px">On India's default</div><div class="big" style="color:#C2410C;text-decoration:line-through;text-decoration-thickness:2px">576</div></div><div><div style="color:var(--text-3);font-size:12px">On this file</div><div class="big" style="color:var(--green);font-size:44px" id="i-n">576</div></div></div>
            <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center"><span style="color:var(--text-3)">at €75.28</span><span class="btnx" id="i-add">Add to 2026 declaration</span></div></div>
        </div><div class="box i5" style="opacity:0;margin-top:14px"><h4>Supplier record · Sample Fasteners</h4><div class="f"><span>Verified for 2026</span><b style="font-family:var(--font)">Yes, site visited in week 3</b></div><div class="f"><span>Mill reports on file</span><b>RPT-2026-0142 · RPT-2026-0151</b></div></div></div><div class="toastx" id="i-t">Added to the 2026 CBAM declaration, due 30 Sep 2027</div></div>`, "eu-importer · CBAM supplier files")}</div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .laptop", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
        ["#i1", "#i2", "#i3", "#i4"].forEach((c, i) => tl.add(() => $(c).classList.add("ok"), 0.9 + i * 0.4));
        countTo(tl, "#i-n", 576, 128, 2.6, 1.4);
        tl.to(".i5", { opacity: 1, duration: 0.5 }, 2.4).from(".i5", { y: 12, duration: 0.5 }, 2.4);
        moveTo(tl, "#i-add", 3.2, 0.9); click(tl, "#i-add", 4.2);
        tl.add(() => { $("#i-add").textContent = "Added ✓"; $("#i-add").classList.add("ok"); }, 4.3).to("#i-t", { opacity: 1, y: 6, duration: 0.4 }, 4.35);
        tl.to({}, { duration: 2.2 });
        return tl;
      },
    },
    {
      t: "Lender", kicker: "07 · Green loan", title: "A year of signed data makes the next loan cheaper to give",
      text: "With twelve months of verified records, a lender can fund the switch to lower-carbon steel without its own emissions audit. The same records serve the UK CBAM from January 2027.",
      stat: ["2.40 → 1.79", "tCO₂/t after 30% scrap-EAF steel"], who: ["bank", "Green lending desk", "Partner bank"],
      build() {
        stage.insertAdjacentHTML("beforeend", `<div class="scene">${laptop(`<div class="sc"><div class="appbar"><b>Applications</b><span class="sp"></span><span class="pill" id="l-s">In review</span></div><div class="wrap">${side(["Applications", "Portfolio"], 0)}<div class="main"><div class="row2">
          <div class="box"><h4>Sample Fasteners · ₹40 L</h4><div class="f"><span>Purpose</span><b style="font-family:var(--font)">30% scrap-EAF steel</b></div><div class="f"><span>Verified history</span><b>12 months</b></div><div class="f"><span>CBAM saving banked</span><b>₹91.1 L / yr</b></div><div class="f"><span>Origination fee</span><b>0.5% · ₹20,000</b></div><div style="margin-top:12px"><span class="btnx" id="l-ap">Approve</span></div></div>
          <div class="box"><h4>Emissions per tonne</h4><div class="bars"><div class="bar-row"><span>Today</span><span class="val">2.40</span><div class="track"><div class="fill" style="width:100%;background:#80837E"></div></div></div><div class="bar-row"><span>After the switch</span><span class="val" id="l-v">2.40</span><div class="track"><div class="fill" id="l-f" style="width:100%;background:#0E7A52"></div></div></div></div><p style="color:var(--text-3);font-size:12px;margin:12px 0 0">70% at 2.35 · 30% at about 0.3 · plus 0.05 own process</p></div>
        </div><div class="box l5" style="opacity:0"><h4>Disbursement linked to verified data</h4><div class="f"><span>Tranche 1 · on approval</span><b>₹25 L</b></div><div class="f"><span>Tranche 2 · when the next signed report shows under 2.0 tCO₂/t</span><b>₹15 L</b></div></div></div></div></div>`, "lender · green loans")}</div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from(".scene .laptop", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
        tl.to("#l-f", { width: "74.6%", duration: 1.2, ease: "power3.out" }, 1);
        countTo(tl, "#l-v", 2.4, 1.79, 1, 1.2, (v) => v.toFixed(2));
        moveTo(tl, "#l-ap", 1.8, 0.9); click(tl, "#l-ap", 2.8);
        tl.to(".l5", { opacity: 1, duration: 0.5 }, 3.2).from(".l5", { y: 12, duration: 0.5 }, 3.2);
        tl.add(() => { $("#l-ap").textContent = "Approved ✓"; $("#l-ap").classList.add("ok"); $("#l-s").textContent = "Approved"; $("#l-s").className = "pill g"; }, 2.9);
        tl.to({}, { duration: 2.6 });
        return tl;
      },
    },
    {
      t: "Cluster", kicker: "08 · Ludhiana pilot", title: "The cluster crosses every pilot gate together",
      text: "EEPC tracks the pilot against its gates: fifty exporters, two mills, fifteen stockists and at least 70% of lots traced by March 2027. Below 50%, we stop.",
      stat: ["~₹500 cr", "a year of EU margin protected by Year 3"], who: ["chart", "EEPC cluster cell", "Ludhiana pilot · Dec 2026 to Mar 2027"],
      build() {
        const g = [["c1", "Exporters", "50 / 50", 1], ["c2", "Lots traced", "74%", 0.74], ["c3", "Mills", "2 / 2", 1], ["c4", "Stockists", "15 / 15", 1]];
        stage.insertAdjacentHTML("beforeend", `<div class="scene"><div class="light screen" style="width:min(100%,760px)" id="c-box"><div class="screen-top"><i></i><i></i><i></i><span>eepc · ludhiana pilot</span></div><div class="screen-body" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;text-align:center">
          ${g.map(([id, l, v, f]) => `<div><div class="ring-wrap">${ring(id)}<div class="rv">${icon("check")}</div></div><div style="font-weight:600;margin-top:10px">${v}</div><div style="color:var(--text-3);font-size:12.5px">${l}</div></div>`).join("")}
          <div style="grid-column:1/-1;margin-top:6px;padding:12px;border-radius:12px;background:var(--green-tint);color:var(--green)">Gate met: 74% of lots traced, against a 70% target</div></div></div>
          <div class="end" id="c-end" style="position:absolute;opacity:0"><div class="bigx">₹500 cr</div><p>a year of EU margin protected by Year 3, across 600 exporters. Fix the data now; cut the carbon next.</p><div class="btns"><a class="btn btn-primary btn-lg" href="/platform">Try the platform</a><a class="btn btn-secondary btn-lg" href="/pilot">Join the pilot</a></div></div></div>`);
        const tl = gsap.timeline({ paused: true });
        tl.from("#c-box", { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" });
                g.forEach(([id, , , f], i) => tl.to("#" + id, { strokeDashoffset: 201 * (1 - f), duration: 1, ease: "power3.out" }, 0.8 + i * 0.3));
        tl.to("#c-box", { opacity: 0, scale: 0.94, duration: 0.6, ease: "power2.in" }, 4.2).to("#c-end", { opacity: 1, duration: 0.8, ease: "power3.out" }, 4.6).from("#c-end .bigx", { y: 30, duration: 0.8, ease: "power3.out" }, 4.6);
        tl.to({}, { duration: 1.5 });
        return tl;
      },
    },
  ];

  /* ---------- player ---------- */
  let cur = -1, tl = null, playing = !reduce, waitT = null, speed = 1.0;
  window.chapters = CH;
  window.CH = CH;

  const bar = $("#tChapters");
  bar.innerHTML = CH.map((c, i) => `<button role="tab" data-i="${i}" aria-label="Chapter ${i + 1}: ${c.t}"><span class="bar"><i></i></span><span class="t">${String(i + 1).padStart(2, "0")} ${c.t}</span></button>`).join("");
  const btns = [...bar.children];
  btns.forEach((b) => b.addEventListener("click", () => go(+b.dataset.i)));

  // Speed controls
  const speedBtns = [...document.querySelectorAll(".speed-btn")];
  speedBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      speed = parseFloat(btn.dataset.speed) || 1.0;
      speedBtns.forEach((b) => {
        const match = b === btn;
        b.classList.toggle("on", match);
        b.setAttribute("aria-pressed", String(match));
      });
      if (tl) tl.timeScale(speed);
    });
  });

  // Chapter quick jump buttons
  const jumpBtns = [...document.querySelectorAll(".jump-btn")];
  jumpBtns.forEach((jb) => {
    jb.addEventListener("click", () => go(+jb.dataset.i));
  });

  function setPlayIcon() { $("#tPlay").innerHTML = icon(playing ? "pause" : "play"); $("#tPlay").setAttribute("aria-label", playing ? "Pause" : "Play"); }
  function go(i) {
    if (i < 0 || i >= CH.length) return;
    clearTimeout(waitT);
    if (tl) tl.kill();
    cur = i; const c = CH[i];
    btns.forEach((b, j) => { b.classList.toggle("on", j === i); b.classList.toggle("done", j < i); b.setAttribute("aria-selected", String(j === i)); $(".bar i", b).style.width = j < i ? "100%" : "0"; });
    jumpBtns.forEach((jb, j) => jb.classList.toggle("on", j === i));
    stage.querySelectorAll(".scene").forEach((s) => s.remove());
    gsap.set(cursor, { x: stage.clientWidth * 0.62, y: stage.clientHeight * 0.88, scale: 1, autoAlpha: 0 });
    $("#tChap").textContent = c.kicker; $("#tTitle").textContent = c.title; $("#tText").textContent = c.text;
    $("#tStat").innerHTML = `${c.stat[0]}<small>${c.stat[1]}</small>`;
    $("#tWhoIco").innerHTML = icon(c.who[0]); $("#tWho").textContent = c.who[1]; $("#tWhoRole").textContent = c.who[2];
    gsap.fromTo([".tour-copy .chap", "#tTitle", "#tText", "#tStat", ".tour-copy .who"], { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.07 });
    tl = c.build();
    if (tl && speed !== 1.0) tl.timeScale(speed);
    tl.eventCallback("onUpdate", () => ($(".bar i", btns[i]).style.width = tl.progress() * 100 + "%"));
    tl.eventCallback("onComplete", () => { if (playing && cur < CH.length - 1) waitT = setTimeout(() => go(cur + 1), 900 / speed); else if (cur === CH.length - 1) { playing = false; setPlayIcon(); } });
    if (reduce) tl.progress(1); else if (playing) tl.play(); else tl.progress(0).pause();
  }
  function toggle() {
    if (cur === CH.length - 1 && tl && tl.progress() === 1) { playing = true; setPlayIcon(); return go(0); }
    playing = !playing; setPlayIcon();
    if (playing) { if (tl.progress() === 1) go(cur + 1); else tl.play(); } else { tl.pause(); clearTimeout(waitT); }
  }
  $("#tPlay").addEventListener("click", toggle);
  $("#tPrev").addEventListener("click", () => go(cur - 1));
  $("#tNext").addEventListener("click", () => go(cur + 1));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, select, textarea")) return;
    if (e.key === " ") { e.preventDefault(); toggle(); }
    if (e.key === "ArrowRight") go(cur + 1);
    if (e.key === "ArrowLeft") go(cur - 1);
  });
  window.setTourSpeed = (s) => {
    speed = s;
    if (tl) tl.timeScale(speed);
    speedBtns.forEach((b) => {
      const match = parseFloat(b.dataset.speed) === s;
      b.classList.toggle("on", match);
      b.setAttribute("aria-pressed", String(match));
    });
  };
  const start = Math.max(0, Math.min(CH.length - 1, (+new URLSearchParams(location.search).get("chapter") || 1) - 1));
  setPlayIcon();
  requestAnimationFrame(() => go(start));
})();
