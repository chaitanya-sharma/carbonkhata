/* Carbon Khata · home page motion */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 1. molten flow field behind the hero ---------- */
  (function flow() {
    const c = $("#flow"); if (!c || reduce) return;
    const ctx = c.getContext("2d");
    let w, h, dpr, parts = [], t = 0, running = true;
    const N = window.innerWidth < 700 ? 70 : 150;
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#0A0C0B"; ctx.fillRect(0, 0, w, h); }
    function spawn(p) { p.x = Math.random() * w * 0.5 + w * 0.45; p.y = Math.random() * h; p.life = 120 + Math.random() * 220; p.age = 0; p.hue = Math.random(); return p; }
    size(); for (let i = 0; i < N; i++) parts.push(spawn({}));
    window.addEventListener("resize", size);
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) loop(); }).observe(c);
    function loop() {
      if (!running) return;
      t += 0.0025;
      ctx.fillStyle = "rgba(10,12,11,0.085)"; ctx.fillRect(0, 0, w, h);
      for (const p of parts) {
        const a = Math.sin(p.x * 0.0032 + t * 2) * 1.6 + Math.cos(p.y * 0.0041 - t) * 1.6 + 2.3;
        const nx = p.x + Math.cos(a) * 1.25, ny = p.y + Math.sin(a) * 1.25;
        const k = p.age / p.life, alpha = Math.sin(Math.PI * k) * 0.55;
        ctx.strokeStyle = p.hue > 0.82 ? `rgba(61,220,151,${alpha * 0.6})` : p.hue > 0.45 ? `rgba(255,181,71,${alpha})` : `rgba(255,91,31,${alpha})`;
        ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.age++;
        if (p.age > p.life || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) spawn(p);
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------- 2. WhatsApp conversation loop (Punjabi) ---------- */
  const chat = [
    ["in", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! Send this month's fuel bill and weighbridge slips here.", "10:02"],
    ["out", '<div class="img">PUNJAB FUELS<br>Tax invoice 4471<br>Furnace oil … 3,200 L<br>Period 01–31 Oct 2026<br>Amount ₹2,94,400</div>', "10:04"],
    ["in", '<b>ਬਿੱਲ ਮਿਲ ਗਿਆ</b> · bill received<div class="kv2"><span>Fuel</span><b>Furnace oil</b><span>Quantity</span><b>3,200 L</b><span>Period</span><b>Oct 2026</b></div><div class="btns"><i>ਸਹੀ ਹੈ ✓</i><i>Edit</i></div>', "10:04"],
    ["out", "ਸਹੀ ਹੈ ✓", "10:05"],
    ["in", "Checked by a reviewer. Shipment EU-2391 evidence is now 92% ready for the verifier visit in week 3.", "10:07"],
  ];
  (function wa() {
    const body = $("#waBody"); if (!body) return;
    let i = 0, timer;
    const add = () => {
      if (i === chat.length) { timer = setTimeout(() => { body.innerHTML = ""; i = 0; add(); }, 3600); return; }
      const [dir, html, time] = chat[i++];
      const b = document.createElement("div"); b.className = "bub " + dir; b.innerHTML = html + `<span class="t">${time}${dir === "out" ? " ✓✓" : ""}</span>`;
      body.appendChild(b);
      if (!reduce && hasGsap) gsap.from(b, { y: 14, opacity: 0, scale: 0.96, duration: 0.45, ease: "back.out(1.6)", transformOrigin: dir === "in" ? "0 100%" : "100% 100%" });
      while (body.scrollHeight > body.clientHeight + 4 && body.children.length > 1) body.removeChild(body.firstChild);
      timer = setTimeout(add, dir === "in" ? 2100 : 1300);
    };
    if (reduce) { chat.forEach(([d, h, t]) => { const b = document.createElement("div"); b.className = "bub " + d; b.innerHTML = h + `<span class="t">${t}</span>`; body.appendChild(b); }); return; }
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { add(); o.disconnect(); } }, { threshold: 0.3 }).observe(body);
  })();

  /* ---------- 3. count-ups ---------- */
  function countUp(el) {
    const to = +el.dataset.to, from = el.dataset.from !== undefined ? +el.dataset.from : 0, dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const put = (v) => (el.textContent = pre + v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf);
    if (reduce || !hasGsap) return put(to);
    const o = { v: from }; gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", onUpdate: () => put(o.v) });
  }
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: 0.5 });
  $$(".count").forEach((el) => cio.observe(el));

  /* tally tag + verifier ticks on view */
  const once = (el, fn) => el && new IntersectionObserver(([e], o) => { if (e.isIntersecting) { fn(); o.disconnect(); } }, { threshold: 0.5 }).observe(el);
  once($("#tallyTag"), () => hasGsap && !reduce ? gsap.fromTo("#tallyTag", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: "power3.out" }) : ($("#tallyTag").style.opacity = 1));

  /* hero bars */
  const heroBars = () => $$(".hb").forEach((b, i) => setTimeout(() => (b.style.width = b.dataset.w + "%"), 500 + i * 220));

  if (!hasGsap || reduce) {
    heroBars();
    $$(".statement .w").forEach((w) => (w.style.opacity = 1));
    $$(".cost-row .tr > div").forEach((d, i) => (d.style.width = [100, 71.8, 22.2][i] + "%"));
    $("#bigFig").innerHTML = '₹10.4<small>lakh</small>';
    $$(".route-svg .node").forEach((n) => n.classList.add("on"));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 4. hero entrance and parallax ---------- */
  gsap.from("#heroTitle .split-line > span", { yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09, delay: 0.1 });
  gsap.from(".hero-fade", { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.55 });
  gsap.from("#heroStage .float", { y: 60, opacity: 0, rotateX: 12, duration: 1.2, ease: "power3.out", stagger: 0.12, delay: 0.35, onComplete: heroBars });
  const stage = $("#heroStage");
  if (stage && window.matchMedia("(pointer: fine)").matches) {
    const floats = $$(".float", stage).map((el) => ({ el, d: +el.dataset.depth, x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }) }));
    const main = $(".f-main", stage);
    window.addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      floats.forEach((f) => { f.x(nx * 22 * f.d); f.y(ny * 18 * f.d); });
      gsap.to(main, { rotateY: nx * 8, rotateX: -ny * 6, duration: 1, ease: "power3.out" });
    });
  }
  gsap.to(".hero-grid", { yPercent: -8, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- 5. statement: words light up with scroll ---------- */
  const st = $("#statement");
  if (st) {
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => { if (/^\s+$/.test(w) || !w) frag.appendChild(document.createTextNode(w)); else { const s = document.createElement("span"); s.className = "w"; s.textContent = w; frag.appendChild(s); } });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(st);
    gsap.to("#statement .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: st, start: "top 78%", end: "bottom 42%", scrub: true } });
  }

  /* ---------- 6. cost reveal ---------- */
  const rows = $$(".cost-row"), fills = rows.map((r) => $(".tr > div", r));
  const widths = [100, 71.8, 22.2], figs = [46.8, 33.6, 10.4];
  const caps = ["On India's default value of 6.29 tonnes of CO₂ per tonne of bolts.", "With the exporter's own plant verified, but its wire rod still on India's default.", "With both mill reports carried through the stockist. ₹36.4 lakh stays with the exporter."];
  gsap.set(rows, { opacity: 0.25 });
  const fig = { v: 46.8 };
  const showStep = (i) => {
    rows.forEach((r, j) => gsap.to(r, { opacity: j <= i ? 1 : 0.25, duration: 0.4 }));
    gsap.to(fills[i], { width: widths[i] + "%", duration: 1, ease: "power3.out" });
    gsap.to(fig, { v: figs[i], duration: 1, ease: "power3.out", onUpdate: () => ($("#bigFig").innerHTML = "₹" + fig.v.toFixed(1) + "<small>lakh</small>") });
    $("#bigCap").textContent = caps[i];
    $("#bigFig").style.color = i === 2 ? "var(--mint)" : "";
  };
  if (window.matchMedia("(min-width: 901px)").matches) {
    let cur = -1;
    ScrollTrigger.create({ trigger: "#reveal", start: "top top", end: "bottom bottom", onUpdate: (s) => { const i = Math.min(2, Math.floor(s.progress * 3.2)); if (i !== cur) { for (let k = cur + 1; k <= i; k++) showStep(k); cur = i; } } });
  } else {
    ScrollTrigger.create({ trigger: "#reveal", start: "top 70%", once: true, onEnter: () => [0, 1, 2].forEach((i) => setTimeout(() => showStep(i), i * 700)) });
  }

  /* ---------- 7. journey ---------- */
  const lit = $("#routeLit"), puck = $("#puck");
  if (lit && window.matchMedia("(min-width: 961px)").matches) {
    const L = lit.getTotalLength();
    lit.style.strokeDasharray = L; lit.style.strokeDashoffset = L;
    const nodes = $$(".route-svg .node"), stops = $$(".stop");
    const at = nodes.map((n) => { const m = n.getAttribute("transform").match(/([\d.]+)[ ,]+([\d.]+)/); const x = +m[1], y = +m[2]; let best = 0, bd = 1e9; for (let l = 0; l <= L; l += 4) { const p = lit.getPointAtLength(l); const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = l; } } return best / L; });
    let cur = 0;
    ScrollTrigger.create({
      trigger: "#journey", start: "top top", end: "bottom bottom", scrub: 0.6,
      onUpdate: (s) => {
        const p = Math.min(1, s.progress * 1.04);
        const seg = Math.min(4, Math.floor(p * 5)), local = Math.min(1, p * 5 - seg);
        const move = local < 0.4 ? 0 : (local - 0.4) / 0.6;
        const eased = move < 0.5 ? 2 * move * move : 1 - Math.pow(-2 * move + 2, 2) / 2;
        const frac = at[seg] + (at[seg + 1] - at[seg]) * eased;
        const len = Math.min(L, frac * L);
        lit.style.strokeDashoffset = L - len;
        const pt = lit.getPointAtLength(len); puck.setAttribute("cx", pt.x); puck.setAttribute("cy", pt.y);
        let idx = 0; at.forEach((a, i) => { if (frac >= a - 0.002) idx = i; });
        nodes.forEach((n, i) => n.classList.toggle("on", i <= idx));
        if (idx !== cur) { stops[cur].classList.remove("on"); stops[idx].classList.add("on"); cur = idx; $("#jProg").innerHTML = `<b>0${idx + 1}</b> / 06`; }
      },
    });
    nodes[0].classList.add("on");
  } else {
    $$(".route-svg .node").forEach((n) => n.classList.add("on"));
    if (lit) lit.style.strokeDasharray = "none";
  }

  /* ---------- 8. section reveals with stagger ---------- */
  $$(".tile .stage").forEach((s) => gsap.from(s, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: s, start: "top 88%" } }));
  gsap.utils.toArray(".vchk").forEach((b, i) => gsap.from(b, { scale: 0.6, opacity: 0, duration: 0.5, delay: i * 0.25, ease: "back.out(2)", scrollTrigger: { trigger: b, start: "top 90%" } }));
})();
