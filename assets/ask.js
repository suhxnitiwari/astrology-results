/* Ask My Chart: a deterministic question set. Each question is included only if the chart
   actually has the feature it asks about; each answer cites its evidence and lights the wheel. */
(function () {
  const { SIGNS, PG, T, esc, ord, planetsIn, drawWheel } = window.Charted;

  function init() {
    const { C, K, X, P } = window.CH;
    const E = C.elements, sunSign = C.sun_sign, moonSign = C.moon_sign, rising = C.rising_sign;
    const elOf = s => ["Fire", "Earth", "Air", "Water"][SIGNS.indexOf(s) % 4];
    const inSign = s => C.planets.filter(p => p.sign === s).map(p => p.planet);
    const personal = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
    const tight = [...C.aspects].filter(a => a.orb != null).sort((a, b) => a.orb - b.orb)[0];
    const aspTitle = a => (K.aspects[`${a.a}-${a.b}-${a.type}`] || {}).title || `${a.a} ${a.type} ${a.b}`;
    const busiest = C.houses.reduce((m, h) => h.planets.length > m.planets.length ? h : m, C.houses[0]);
    const missing = Object.entries(E).filter(([, v]) => !v.length).map(([k]) => k);
    const sunMoon = C.aspects.find(a => a.a === "Sun" && a.b === "Moon");
    const ruler = C.rulers.chart_ruler[0];

    const Q = [];
    const add = (cond, q, a, ev) => { if (cond) Q.push({ q, a, ev }); };

    add(K.wait.sun && K.glance.find(g => g.label === "Main character")?.value !== "Sun", "Why isn't the Sun the main character in my chart?", K.wait.sun.text,
      [`Jupiter in the ${ord(P.Jupiter.house)} house (angular)`, `Jupiter rules ${sunSign}, the Sun's sign`, "Sun △ Jupiter", "Jupiter □ Neptune, within half a degree", "Jupiter is the benefic of the day sect", "Jupiter anchors the rulership loop"]);
    add(moonSign !== sunSign && inSign(moonSign).filter(n => personal.includes(n)).length >= 2, `Why might I feel more ${moonSign} than ${sunSign}?`,
      `Two personal planets, the Moon and Mars, sit together in ${moonSign}, and their ruler Mercury makes the chart's tightest aspect. ${sunSign} still holds ${inSign(sunSign).length} planets including the Sun, so the fair answer is that ${moonSign} is how you react and act, while ${sunSign} is who you are underneath.`,
      [`Moon in ${moonSign}`, `Mars in ${moonSign}`, `Moon ☌ Mars`, "Mercury rules both", `${aspTitle(tight)}, the tightest aspect`, `${inSign(sunSign).join(", ")} in ${sunSign}`]);
    add(elOf(rising) !== elOf(sunSign) && elOf(rising) !== elOf(moonSign), "Why do I come across differently than I feel?",
      `The rising sign is ${rising} (${elOf(rising).toLowerCase()}), while the Sun and Moon are ${elOf(sunSign).toLowerCase()} and ${elOf(moonSign).toLowerCase()}. ${K.bigThreeFrame.result}`,
      [`${rising} Rising`, missing.includes(elOf(rising)) ? `No planets in ${elOf(rising).toLowerCase()} signs` : `${elOf(rising)} rising sign`, `Sun in ${sunSign}`, `Moon in ${moonSign}`, `Chart ruler ${ruler} in ${P[ruler].sign}`]);
    add(sunMoon && ["square", "opposition"].includes(sunMoon.type), "Why do my head and heart pull in different directions?",
      `The Sun (who you're becoming) and the Moon (what you need) are in a ${sunMoon.type}. ${K.contradictions.find(c => c.poles.includes("Idealistic"))?.both || ""}`,
      [`Sun in ${sunSign}`, `Moon in ${moonSign}`, `Sun ${sunMoon.type === "square" ? "□" : "☍"} Moon`, "Both in mutable signs"]);
    const top = K.repeats[0];
    add(top && top.factors.length >= 4, `Why does ${top.theme.toLowerCase()} keep appearing in my reading?`, `${top.factors.length} separate chart factors point the same way. ${K.repeatsNote}`, top.factors);
    add(busiest.planets.length >= 3, `Why is my ${ord(busiest.house)} house so important?`, K.houseNotes[busiest.house] || "", busiest.planets.map(n => `${n} in the ${ord(busiest.house)}`));
    missing.forEach(m => add(m === "Earth" && K.wait.earth, `What does having no ${m.toLowerCase()} mean for me?`, `${K.wait.earth.text} ${K.wait.earth.not.join(" ")}`, K.wait.earth.compensates));
    add(C.modalities.Cardinal.length === 0 && K.wait.cardinal, "Where does initiative come from, with no cardinal planets?", K.wait.cardinal.text, ["No cardinal planets", "Moon ☌ Mars", "Sun ☌ Uranus", "North Node in Aries", "Jupiter–Mars–Mercury loop"]);
    add(tight && tight.orb < 1, "What's the tightest link in my chart?", (K.aspects[`${tight.a}-${tight.b}-${tight.type}`] || {}).text || "", [`${aspTitle(tight)} (${tight.orb}°)`, `${tight.a} in ${P[tight.a].sign}`, `${tight.b} in ${P[tight.b].sign}`]);
    add(!!ruler, "What's my chart ruler, and why does it matter?", `${rising} Rising is ruled by ${ruler}, so ${ruler}'s placement colours the whole chart. ${K.planets[ruler]}`,
      [`${rising} Rising`, `${ruler} in ${P[ruler].sign}`, `${ruler} in the ${ord(P[ruler].house)} house`, ...C.aspects.filter(a => a.a === ruler || a.b === ruler).map(aspTitle)]);
    add(C.houses[6].planets.length > 0, "Why are relationships such a major theme?", `The partnership house holds ${C.houses[6].planets.join(" and ")}, the chart's main character, and the chart ruler Venus opposes Saturn across the private/public axis. ${K.life.love.items[0].a}`,
      [...C.houses[6].planets.map(n => `${n} in ${P[n].sign} in the 7th`), "Venus ☍ Saturn", "Moon △ Venus", "Sun △ Jupiter"]);
    const big = K.contradictions[0];
    add(!!big, "What's the biggest contradiction in my chart?", `${big.poles[0]} / ${big.poles[1]}. ${big.both}`, [...big.a, ...big.b]);

    const host = document.getElementById("askList");
    host.innerHTML = `<div class="ask-q" role="list">${Q.map((x, i) => `<button role="listitem" data-i="${i}">${esc(x.q)}</button>`).join("")}</div><div class="ask-a" id="askA" aria-live="polite"></div>`;
    const inner = C.planets.map(p => ({ n: p.planet, lon: SIGNS.indexOf(p.sign) * 30 + ("degree" in p ? p.degree + .5 : 15) }));
    const show = i => {
      const x = Q[i], planets = [...new Set(x.ev.flatMap(planetsIn))];
      host.querySelectorAll(".ask-q button").forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i));
      const box = host.querySelector("#askA");
      box.innerHTML = `<div class="label">Ask my chart</div><h3>${esc(x.q)}</h3><p data-c="interp">${esc(x.a)}</p>
        <div class="ask-ev"><div class="ask-wheel"></div><div><p class="evd-n">${x.ev.length} chart factor${x.ev.length > 1 ? "s" : ""}:</p><ul data-c="calc">${x.ev.map(e => `<li>${esc(e)}</li>`).join("")}</ul>
        <div class="evd-go">${planets.map(n => `<button data-p="${n}"><span class="g">${T(PG[n])}</span> ${n}</button>`).join("")}</div></div></div>`;
      box.querySelector(".ask-wheel").appendChild(drawWheel({ inner, aspects: C.aspects.map(a => ({ ...a, hl: planets.includes(a.a) && planets.includes(a.b) })), centreSign: SIGNS.indexOf(rising), highlight: planets.length ? planets : null, size: 380 }));
      box.querySelectorAll(".evd-go button").forEach(b => b.onclick = () => { location.hash = "#chart"; setTimeout(() => window.CH.showPlanet(b.dataset.p), 60); });
    };
    host.querySelectorAll(".ask-q button").forEach(b => b.onclick = () => show(+b.dataset.i));
    if (Q.length) show(0);
  }
  if (window.CH) init(); else document.addEventListener("chart-ready", init);
})();
