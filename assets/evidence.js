/* The wheel as the site's shared interface: hover previews, colour-by modes, and an evidence
   viewer that any "Show me why" can open with the relevant placements lit. */
(function () {
  const { PG, T, esc, planetsIn, drawWheel, SIGNS } = window.Charted;
  const ELC = { Fire: "#f1b48f", Earth: "#9fc79a", Air: "#b8c3f0", Water: "#6fc9c3" };
  const MODC = { Cardinal: "#f0a3b5", Fixed: "#e5c47d", Mutable: "#b9a8de" };

  function init() {
    const { C, K, P } = window.CH;
    const wheel = document.getElementById("wheel"), svg = wheel.querySelector("svg");

    // ---------- hover previews (click still locks the selection) ----------
    const snap = () => ({ w: wheel.className, els: [...svg.querySelectorAll(".pl, .asp, .sector")].map(e => [e, e.getAttribute("class")]) });
    const restore = st => { wheel.className = st.w; st.els.forEach(([e, c]) => e.setAttribute("class", c)); };
    let saved = null;
    const preview = (planets, lines) => {
      saved = saved || snap();
      wheel.classList.add("dim");
      svg.querySelectorAll(".pl").forEach(g => g.classList.toggle("hl", planets.includes(g.getAttribute("aria-label").split(" ")[0])));
      svg.querySelectorAll(".asp").forEach((l, i) => l.classList.toggle("hl", lines.includes(i)));
    };
    const end = () => { if (saved) { restore(saved); saved = null; } };
    const aspIdx = n => C.aspects.map((a, i) => (a.a === n || a.b === n) ? i : -1).filter(i => i >= 0);
    svg.querySelectorAll(".pl").forEach(g => {
      const n = g.getAttribute("aria-label").split(" ")[0];
      g.addEventListener("mouseenter", () => preview([n, ...C.aspects.filter(a => a.a === n || a.b === n).map(a => a.a === n ? a.b : a.a)], aspIdx(n)));
      g.addEventListener("mouseleave", end);
      g.addEventListener("click", () => { saved = null; });
    });
    svg.querySelectorAll(".sector").forEach((g, i) => {
      g.addEventListener("mouseenter", () => preview(C.planets.filter(p => p.sign === SIGNS[i]).map(p => p.planet), []));
      g.addEventListener("mouseleave", end);
      g.addEventListener("click", () => { saved = null; });
    });
    svg.querySelectorAll(".asp-hit").forEach((h, i) => {
      h.addEventListener("mouseenter", () => preview([C.aspects[i].a, C.aspects[i].b], [i]));
      h.addEventListener("mouseleave", end);
      h.addEventListener("click", () => { saved = null; });
    });

    // ---------- colour-by modes ----------
    const bar = document.createElement("div");
    bar.className = "filters modes"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Colour the wheel by");
    bar.innerHTML = `<span class="mlabel">Colour by</span>` + ["Planets", "Elements", "Modalities", "Houses", "Aspects"].map((m, i) => `<button data-m="${m}" aria-pressed="${i === 0}">${m}</button>`).join("");
    wheel.before(bar);
    const legend = document.createElement("p"); legend.className = "mlegend"; wheel.after(legend);
    bar.querySelectorAll("button").forEach(b => b.onclick = () => {
      const m = b.dataset.m;
      bar.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
      wheel.classList.toggle("show-houses", m === "Houses");
      wheel.classList.toggle("mode-aspects", m === "Aspects");
      svg.querySelectorAll(".pl").forEach(g => {
        const n = g.getAttribute("aria-label").split(" ")[0], p = P[n], c = g.querySelector("circle.b");
        c.setAttribute("fill", m === "Elements" ? ELC[p.element] : m === "Modalities" ? MODC[p.modality] : "#fbf6ee");
      });
      const count = (key, vals) => vals.map(v => `${v} ${C.planets.filter(p => p[key] === v).length}`).join(" · ");
      legend.innerHTML = m === "Elements" ? `<span style="color:${ELC.Water}">●</span> Water <span style="color:${ELC.Air}">●</span> Air <span style="color:${ELC.Fire}">●</span> Fire <span style="color:${ELC.Earth}">●</span> Earth: ${count("element", ["Water", "Air", "Fire", "Earth"])}`
        : m === "Modalities" ? `<span style="color:${MODC.Mutable}">●</span> Mutable <span style="color:${MODC.Fixed}">●</span> Fixed <span style="color:${MODC.Cardinal}">●</span> Cardinal: ${count("modality", ["Mutable", "Fixed", "Cardinal"])}`
        : m === "Houses" ? "Each planet shows its house number (Porphyry). Three planets share the 11th."
        : m === "Aspects" ? "Planets fade back so the web of aspects stands out. Thick lines are within 1° of exact."
        : "";
    });

    // ---------- evidence viewer ----------
    const drawer = document.createElement("aside");
    drawer.className = "evd"; drawer.hidden = true; drawer.setAttribute("role", "dialog"); drawer.setAttribute("aria-label", "Evidence");
    document.body.appendChild(drawer);
    const inner = C.planets.map(p => ({ n: p.planet, lon: SIGNS.indexOf(p.sign) * 30 + ("degree" in p ? p.degree + .5 : 15) }));
    window.showEvidence = (title, items) => {
      const planets = [...new Set(items.flatMap(planetsIn))];
      const lines = C.aspects.filter(a => planets.includes(a.a) && planets.includes(a.b)).map(a => ({ ...a, hl: true }));
      drawer.innerHTML = `<button class="x" aria-label="Close">×</button><div class="label">Show me why</div><h3>${esc(title)}</h3>
        <div class="evd-wheel"></div><p class="evd-n">${items.length} chart factor${items.length > 1 ? "s" : ""} contribute to this reading:</p>
        <ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
        <div class="evd-go">${planets.map(n => `<button data-p="${n}"><span class="g">${T(PG[n])}</span> ${n}</button>`).join("")}</div>
        <p class="evd-foot">Teach me more: tap a planet to open its full reading on the wheel, or see <a href="#/learn">how charts work</a>.</p>`;
      drawer.querySelector(".evd-wheel").appendChild(drawWheel({ inner, aspects: C.aspects.map(a => ({ ...a, hl: lines.some(l => l.a === a.a && l.b === a.b && l.type === a.type) })), centreSign: SIGNS.indexOf(C.rising_sign), highlight: planets, size: 420 }));
      drawer.hidden = false;
      drawer.querySelector(".x").onclick = () => drawer.hidden = true;
      drawer.querySelectorAll(".evd-go button").forEach(b => b.onclick = () => {
        drawer.hidden = true;
        location.hash = "#chart";
        setTimeout(() => window.CH.showPlanet(b.dataset.p), 60);
      });
      drawer.querySelector(".x").focus();
    };
    addEventListener("keydown", e => { if (e.key === "Escape") drawer.hidden = true; });

    // attach "Show on the chart" to every evidence list on the site
    const attach = (host, title, getItems) => {
      if (!host || host.querySelector(":scope > .why-btn")) return;
      const b = document.createElement("button");
      b.className = "why-btn"; b.type = "button"; b.textContent = "Show on the chart ↗";
      b.onclick = e => { e.preventDefault(); e.stopPropagation(); window.showEvidence(title(), getItems()); };
      host.appendChild(b);
    };
    const liTexts = el => [...el.querySelectorAll("li")].map(l => l.textContent.trim());
    document.querySelectorAll("#five > li, #fiveRecap > li").forEach(li => attach(li.querySelector(".ev-list"), () => li.querySelector(".t").textContent, () => liTexts(li.querySelector(".ev-list"))));
    const lifeObs = () => document.querySelectorAll(".life-card details").forEach(d => attach(d, () => d.closest(".life-card").querySelector(".lh b").textContent, () => liTexts(d)));
    lifeObs(); document.getElementById("lifeTabs").addEventListener("click", () => setTimeout(lifeObs, 0));
    document.querySelectorAll(".rp").forEach(rp => attach(rp.querySelector("ul")?.parentElement ? rp : null, () => rp.querySelector(".nm").firstChild.textContent, () => liTexts(rp.querySelector("ul"))));
    document.querySelectorAll("details.rcpt").forEach(d => attach(d, () => (d.closest(".lum")?.querySelector("h3") || d.closest(".theme-i")?.querySelector("h3"))?.textContent || "Evidence", () => liTexts(d)));
    document.querySelectorAll(".argues > li").forEach(li => attach(li, () => li.querySelector("b").textContent, () => liTexts(li)));
  }
  if (window.CH) init(); else document.addEventListener("chart-ready", init);
})();
