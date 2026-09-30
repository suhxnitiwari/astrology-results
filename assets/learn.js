/* Learn by doing: the grammar builder, an aspect-angle toy and a house wheel. */
(function () {
  const { SIGNS, SG, PG, PLANETS, AG, TONE, TONEC, T, esc, ord, ROMAN, el } = window.Charted;
  const WHAT = { Sun: "core identity", Moon: "emotional needs", Mercury: "thinking and speech", Venus: "affection and values", Mars: "drive and action", Jupiter: "growth and faith",
    Saturn: "discipline and limits", Uranus: "need for freedom", Neptune: "imagination and ideals", Pluto: "capacity for transformation" };
  const HOW = { Aries: "boldly and directly", Taurus: "steadily and sensually", Gemini: "curiously, through words", Cancer: "protectively, through care", Leo: "warmly and expressively",
    Virgo: "precisely and helpfully", Libra: "gracefully, seeking balance", Scorpio: "intensely and privately", Sagittarius: "expansively, seeking meaning", Capricorn: "ambitiously, with discipline",
    Aquarius: "originally, with independence", Pisces: "intuitively and imaginatively" };
  const WHERE = ["", "in how they present themselves", "around money and self-worth", "in everyday communication and learning", "at home and with family", "in romance, creativity and play",
    "in daily work and routines", "in close partnerships", "in shared resources and intimacy", "in travel, study and belief", "in career and public life", "among friends and communities", "in solitude and the unseen"];
  const REL = { conjunction: "fused with", sextile: "supported by", square: "in productive friction with", trine: "flowing easily with", opposition: "balancing against" };
  const ASPECT_NOTE = { conjunction: "0°: two planets act as one.", sextile: "60°: a cooperative link that rewards effort.", square: "90°: friction that pushes toward action.", trine: "120°: natural ease and talent.", opposition: "180°: a see-saw asking for balance." };

  function init() {
    const { C, K, P } = window.CH;
    // ---------- grammar builder ----------
    const g = document.getElementById("grammar");
    const opt = (arr, sel, lab = x => x) => arr.map(x => `<option value="${x}" ${x === sel ? "selected" : ""}>${lab(x)}</option>`).join("");
    g.innerHTML = `<div class="gram">
      <label><span class="label">Planet = what</span><select id="gP">${opt(PLANETS, "Moon", x => `${T(PG[x])} ${x}`)}</select></label>
      <label><span class="label">Sign = how</span><select id="gS">${opt(SIGNS, "Gemini", x => `${T(SG[SIGNS.indexOf(x)])} ${x}`)}</select></label>
      <label><span class="label">House = where</span><select id="gH">${opt([1,2,3,4,5,6,7,8,9,10,11,12], 11, x => `${ord(x)} house`)}</select></label>
      <label><span class="label">Aspect = relationship</span><select id="gA"><option value="">none</option>${opt(Object.keys(REL), "square")}</select></label>
      <label><span class="label">…to</span><select id="gB">${opt(PLANETS, "Mars", x => `${T(PG[x])} ${x}`)}</select></label>
    </div>
    <div class="gram-out" id="gOut" aria-live="polite"></div>
    <p class="gram-tools"><button id="gMine">Load a real placement from this chart</button> <span class="muted">The default is just an example.</span></p>`;
    const $ = s => g.querySelector(s);
    const draw = () => {
      const p = $("#gP").value, s = $("#gS").value, h = +$("#gH").value, a = $("#gA").value, b = $("#gB").value;
      $("#gB").disabled = !a;
      $("#gOut").innerHTML = `<div class="gnote"><span class="g">${T(PG[p])}</span> ${p} in <span class="g">${T(SG[SIGNS.indexOf(s)])}</span> ${s} in the ${ord(h)} house${a ? ` <span class="g">${T(AG[a])}</span> ${b}` : ""}</div>
        <ol class="gsteps">
          <li data-c="astro"><b>${p}</b><span>what: their ${WHAT[p]}</span><small>Astronomy: where ${p} was</small></li>
          <li data-c="calc"><b>${s}</b><span>how: ${HOW[s]}</span><small>Convention: the zodiac sign</small></li>
          <li data-c="calc"><b>${ord(h)} house</b><span>where: ${WHERE[h]}</span><small>Convention: the house system</small></li>
          ${a ? `<li data-c="calc"><b>${a} ${b}</b><span>relationship: ${REL[a]} their ${WHAT[b]}</span><small>Geometry: ${ASPECT_NOTE[a]}</small></li>` : ""}
        </ol>
        <p class="gsentence" data-c="interp">Read together: their ${WHAT[p]}, expressed ${HOW[s]}, shows up ${WHERE[h]}${a ? `, ${REL[a]} their ${WHAT[b]}` : ""}.</p>`;
    };
    g.querySelectorAll("select").forEach(x => x.onchange = draw);
    $("#gMine").onclick = () => {
      const m = C.aspects.find(x => x.a === "Moon" && x.b === "Mars") || C.aspects[0];
      $("#gP").value = m.a; $("#gS").value = P[m.a].sign; $("#gH").value = P[m.a].house; $("#gA").value = m.type; $("#gB").value = m.b; draw();
    };
    draw();

    // ---------- aspect angle toy ----------
    const at = document.getElementById("angleToy");
    at.innerHTML = `<svg viewBox="0 0 320 320" class="toy" aria-label="Two planets separated by an angle"></svg>
      <label class="rng"><span class="label">Separation</span><input type="range" id="ang" min="0" max="180" value="90"><output id="angOut">90°</output></label>
      <p class="toy-out" id="angRes" aria-live="polite"></p>`;
    const svg = at.querySelector("svg"), cx = 160, cy = 160, r = 120;
    el("circle", { cx, cy, r, fill: "none", stroke: "currentColor", "stroke-opacity": .25 }, svg);
    [0, 60, 90, 120, 180].forEach(d => { const a = Math.PI - d * Math.PI / 180; el("circle", { cx: cx + r * Math.cos(a), cy: cy - r * Math.sin(a), r: 3, fill: "currentColor", "fill-opacity": .35 }, svg); });
    const line = el("line", { x1: cx - r, y1: cy, "stroke-width": 3 }, svg);
    const arc = el("path", { fill: "none", stroke: "currentColor", "stroke-opacity": .4 }, svg);
    const A = el("g", {}, svg); el("circle", { cx: cx - r, cy, r: 16, fill: "#fbf6ee", stroke: "#cfa95e" }, A); const ta = el("text", { x: cx - r, y: cy + 6, "text-anchor": "middle", "font-size": 17, fill: "#10333a", class: "g" }, A); ta.textContent = T(PG.Moon);
    const Bg = el("g", {}, svg), Bc = el("circle", { r: 16, fill: "#fbf6ee", stroke: "#cfa95e" }, Bg), tb = el("text", { "text-anchor": "middle", "font-size": 17, fill: "#10333a", class: "g" }, Bg); tb.textContent = T(PG.Mars);
    const upd = () => {
      const d = +at.querySelector("#ang").value, a = Math.PI - d * Math.PI / 180, x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
      Bc.setAttribute("cx", x); Bc.setAttribute("cy", y); tb.setAttribute("x", x); tb.setAttribute("y", y + 6);
      const hit = Object.entries({ conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 }).map(([k, v]) => [k, Math.abs(d - v)]).sort((p, q) => p[1] - q[1])[0];
      const on = hit[1] <= (hit[0] === "sextile" ? 5 : 8);
      line.setAttribute("x2", x); line.setAttribute("y2", y);
      line.setAttribute("stroke", on ? TONEC[TONE[hit[0]]] : "#8a9a9a"); line.setAttribute("stroke-dasharray", on ? "" : "4 6");
      arc.setAttribute("d", `M${cx - 40},${cy} A40,40 0 0 1 ${cx + 40 * Math.cos(a)},${cy - 40 * Math.sin(a)}`);
      at.querySelector("#angOut").textContent = d + "°";
      at.querySelector("#angRes").innerHTML = on ? `<b style="color:${TONEC[TONE[hit[0]]]}">${T(AG[hit[0]])} ${hit[0]}</b>${hit[1] ? `${hit[1]}° from exact. ` : "Exact. "}${ASPECT_NOTE[hit[0]]}` : "No major aspect at this angle. Astrologers only name certain angles, and allow a few degrees either side (the orb).";
    };
    at.querySelector("#ang").oninput = upd; upd();

    // ---------- house wheel ----------
    const ht = document.getElementById("houseToy"), HH = K.houseHistory;
    ht.innerHTML = `<svg viewBox="0 0 320 320" class="toy" aria-label="The twelve houses"></svg><div class="toy-out" id="hRes" aria-live="polite"></div>`;
    const hs = ht.querySelector("svg"), c2 = 160, r1 = 150, r0 = 56;
    const hA = h => Math.PI + (h - 1) * Math.PI / 6, hp = (a, rr) => [c2 + rr * Math.cos(a), c2 - rr * Math.sin(a)];
    const wedges = [];
    for (let h = 1; h <= 12; h++) {
      const a1 = hA(h) - Math.PI / 12, a2 = hA(h) + Math.PI / 12, [x1, y1] = hp(a1, r1), [x2, y2] = hp(a2, r1), [x3, y3] = hp(a2, r0), [x4, y4] = hp(a1, r0);
      const g2 = el("g", { class: "hw", tabindex: 0, role: "button", "aria-label": `House ${h}` }, hs);
      el("path", { d: `M${x1},${y1} A${r1},${r1} 0 0 0 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 1 ${x4},${y4} Z`, fill: [1, 4, 7, 10].includes(h) ? "#e3c27e" : "#6fc1bb", "fill-opacity": .18, stroke: "currentColor", "stroke-opacity": .3 }, g2);
      const [lx, ly] = hp(hA(h), (r1 + r0) / 2); const t = el("text", { x: lx, y: ly + 6, "text-anchor": "middle", "font-size": 18, fill: "currentColor", "font-family": "Cormorant Garamond, serif", "font-style": "italic" }, g2); t.textContent = ROMAN[h - 1];
      const pick = () => {
        wedges.forEach((w, i) => w.querySelector("path").setAttribute("fill-opacity", i === h - 1 ? .7 : .18));
        const ax = HH.axes.find(x => x.a === h || x.b === h), here = C.houses[h - 1].planets;
        ht.querySelector("#hRes").innerHTML = `<b>${ord(h)} house · ${esc(K.houses[h].name)}</b><span data-c="doctrine">${esc(K.houses[h].about)} Ancient name: ${esc(HH.names[h])}. ${[1, 4, 7, 10].includes(h) ? "An angle" : [2, 5, 8, 11].includes(h) ? "Follows an angle" : "Falls away from an angle"}; ${esc(HH.toAsc[h])}. Axis: ${esc(ax.name)}.</span><small>In this chart: ${here.length ? here.map(n => `${T(PG[n])} ${n}`).join(", ") : "no planets"}</small>`;
      };
      g2.addEventListener("mouseenter", pick); g2.addEventListener("click", pick); g2.addEventListener("focus", pick);
      wedges.push(g2);
    }
    const hz = el("line", { x1: c2 - r1 - 6, y1: c2, x2: c2 + r1 + 6, y2: c2, stroke: "currentColor", "stroke-opacity": .35, "stroke-dasharray": "3 5" }, hs);
    const l1 = el("text", { x: 6, y: c2 - 6, "font-size": 10, fill: "currentColor", "fill-opacity": .6, "font-family": "DM Sans" }, hs); l1.textContent = "ASC";
    wedges[0].dispatchEvent(new Event("click"));
  }
  if (window.CH) init(); else document.addEventListener("chart-ready", init);
})();
