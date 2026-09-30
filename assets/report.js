/* Builds the full Charted report from the same published data as the site.
   The same privacy rules apply: no birth time, no Moon or Ascendant degree, no house cusps. */
(async function () {
  const { SIGNS, SG, PG, AG, TONE, T, esc, ord, ROMAN, TRULER, weightLevel, drawWheel } = window.Charted;
  const load = u => fetch(u).then(r => r.json());
  const [C, K, M, X] = await Promise.all(["results/chart.json", "data/content.json", "results/personality_match.json", "results/techniques.json"].map(load));
  const P = Object.fromEntries(C.planets.map(p => [p.planet, p]));
  const ORDER = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
  const HH = K.houseHistory;
  const aspText = a => K.aspects[`${a.a}-${a.b}-${a.type}`] || { title: `${a.a} ${a.type} ${a.b}`, text: "" };
  const aspectsOf = n => C.aspects.filter(a => a.a === n || a.b === n);
  const other = (a, n) => a.a === n ? a.b : a.a;
  const dots = n => "●".repeat(weightLevel(n)) + "○".repeat(4 - weightLevel(n));
  const houseKind = h => [1, 4, 7, 10].includes(h) ? "angular" : [2, 5, 8, 11].includes(h) ? "succedent" : "cadent";
  const fmtDate = d => new Date(d + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const deg = p => "degree" in p ? `${p.degree}°` : "degree private";
  const list = arr => `<ul class="ev">${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
  let chapter = 0;
  const chap = (title, sub) => `<div class="chap"><span class="rn">${ROMAN[chapter++]}</span><div><div class="kicker">${esc(sub)}</div><h2>${title}</h2></div></div>`;
  const page = (folio, html, cls = "") => `<section class="page ${cls}" data-folio="Charted · ${esc(folio)}">${html}</section>`;
  const wheel = theme => drawWheel({ inner: C.planets.map(p => ({ n: p.planet, lon: SIGNS.indexOf(p.sign) * 30 + ("degree" in p ? p.degree + .5 : 15) })), aspects: C.aspects, centreSign: SIGNS.indexOf(C.rising_sign), theme, size: 640 }).outerHTML;

  function tradReading(n) {
    const p = P[n], d = X.dignities.find(x => x.planet === n), h = p.house;
    if (!d) return `Not one of the seven classical planets, so traditional astrologers never used it; it may be noted for its house (${ord(h)}, ${houseKind(h)}).`;
    const good = ["domicile", "exaltation", "triplicity", "bound", "face"].filter(k => d[k]), bad = ["detriment", "fall"].filter(k => d[k]);
    const S = X.sect;
    const role = n === S.light ? "the light of the sect" : n === S.benefic ? "the benefic of the sect" : n === S.malefic ? "the malefic of the sect" : n === S.contrary_benefic ? "the benefic out of sect" : n === S.contrary_malefic ? "the malefic out of sect" : "";
    return `${good.length ? "Essential dignity by " + good.join(" and ") : "Peregrine"}${bad.length ? `, in its ${bad.join(" and ")}` : ""}. ${role ? `In this day chart it is ${role}. ` : ""}In the ${ord(h)} place (${HH.names[h]}), a ${houseKind(h)} house; ${HH.toAsc[h]}. Dispositor: ${TRULER[p.sign]}.`;
  }

  // main characters: the same transparent heuristic as the site
  const loop = (() => { const jp = X.dispositors.traditional.chains.Jupiter, l = jp[jp.length - 1]; return jp.slice(jp.indexOf(l), -1); })();
  const cast = ORDER.map(n => {
    const p = P[n], why = []; let pts = 0; const add = (v, t) => { pts += v; why.push(t); };
    if (C.rulers.chart_ruler.includes(n)) add(3, "chart ruler");
    if (n === "Sun" || n === "Moon") add(2, "luminary");
    if ([1, 4, 7, 10].includes(p.house)) add(2, `angular (${ord(p.house)})`);
    if (C.rulers.sun_sign_rulers.includes(n)) add(1, "rules the Sun's sign");
    if (C.rulers.moon_sign_rulers.includes(n)) add(1, "rules the Moon's sign");
    if (loop.includes(n)) add(2, "rulership loop");
    if ([X.sect.light, X.sect.benefic, X.sect.malefic].includes(n)) add(1, "sect role");
    const st = X.fixed_stars.find(f => f.planet === n); if (st) add(1, `on ${st.star}`);
    const as = aspectsOf(n); if (as.length) add(as.length * .5, `${as.length} aspects`);
    const ex = as.filter(a => (a.orb ?? 9) < 1).length; if (ex) add(ex, `${ex} near-exact`);
    return { n, pts, why };
  }).sort((a, b) => b.pts - a.pts);

  const out = [];

  // ---------- cover ----------
  out.push(page("Cover", `<div><div class="kicker">A Western natal chart · full report</div><h1>Charted</h1><p class="tag">${esc(K.hero.promise)}</p></div>
    <div class="wheel">${wheel("dark")}</div>
    <div><div class="b3">${[["☉ Sun", C.sun_sign, K.labels.Sun], ["☽ Moon", C.moon_sign, K.labels.Moon], ["↑ Rising", C.rising_sign, K.labels.Rising]].map(([a, b, c]) => `<div><small>${esc(c)}</small><b>${b}</b><small style="margin-top:2px">${a}</small></div>`).join("")}</div>
    <p class="foot" style="margin-top:10mm">Tropical zodiac · ${C.house_system} houses · Swiss Ephemeris. Birth time kept private: the rising sign and Moon are shown without degrees. ${esc(K.footer)}</p></div>`, "cover"));

  // ---------- contents ----------
  const chapters = ["At a glance", "The Big Three", "The portrait", "Life areas", "The planets", "The houses", "The aspects", "Patterns", "Chart mechanics", "Timing", "Bonus experiment", "Method, glossary & history"];
  out.push(page("Contents", `<div class="kicker">Contents</div><h2 style="font-size:34pt;margin:6px 0 18px">What's <em>inside</em></h2>
    <ol class="toc" style="list-style:none;padding:0">${chapters.map((c, i) => `<li>${ROMAN[i]} · ${c}<span>${["Headline findings", "Sun · Moon · Rising", "Themes & contradictions", "Love · work · people", "All ten, in full", "All twelve", "Major & minor", "Elements · modes · rulers", "Dignity · sect · stars", "Now & later", "Personality tests", "How it was made"][i]}</span></li>`).join("")}</ol>
    <div class="note" style="margin-top:14mm"><b>How to read this report.</b> Astronomy calculates the sky; mathematics builds the chart; astrology interprets it. Positions and angles are measurable. Interpretations belong to astrological tradition and are not established scientific findings. ${esc(K.layers.evidence)}</div>`));

  // ---------- I. at a glance ----------
  out.push(page("At a glance", chap("At a <em>glance</em>", "Headline findings") +
    `<div class="glance">${K.glance.map(g => `<div><small>${esc(g.label)}</small><b>${esc(g.value)}</b><div class="ev">${esc(g.note)}</div></div>`).join("")}</div>
    <h4>If you remember five things</h4><ol class="five">${K.five.map(f => `<li>${esc(f.text)} <span class="dots">${dots(f.evidence.length)}</span><span class="ev">${esc(f.evidence.join(" · "))}</span></li>`).join("")}</ol>
    <h4>What stands out</h4><div class="cols">${Object.values(K.wait).map(w => `<div class="item"><b class="t">${esc(w.title.replace(/^Wait\. /, ""))}</b><p>${esc(w.text)}</p>${w.not ? `<p class="ev"><b>What it doesn't mean:</b> ${esc(w.not.join(" "))}</p><p class="ev"><b>How the chart compensates:</b> ${esc(w.compensates.join(" · "))}</p>` : ""}</div>`).join("")}</div>`));

  // ---------- II. big three ----------
  const F = K.bigThreeFrame, B = K.bigThree;
  out.push(page("The Big Three", chap("The Big <em>Three</em>", "Sun · Moon · Rising") +
    `<div class="glance" style="grid-template-columns:repeat(3,1fr)">${[["sun", C.sun_sign], ["moon", C.moon_sign], ["rising", C.rising_sign]].map(([k, s]) => `<div><small>${esc(F[k].head)}</small><b>${s}</b><div class="ev">${esc(F[k].line)}</div></div>`).join("")}</div>
    ${["sun", "moon", "rising"].map(k => `<h3>${esc(B[k].title)} · <em>${esc(B[k].line)}</em></h3><p>${esc(B[k].text)}</p>`).join("")}
    <h4>When they agree</h4><p>${esc(F.agree)}</p>
    <h4>When they fight</h4><p>${F.fight.map(([a, b]) => `<b>${esc(a)}</b> ${esc(b)}.`).join(" ")} <em>${esc(F.result)}</em></p>
    <h4>The wiring between them</h4>${B.together.map(t => `<p><b>${esc(t.pair)}.</b> ${esc(t.note)}</p>`).join("")}`));

  // ---------- III. portrait ----------
  const E = C.elements, Mo = C.modalities, H = C.hemispheres, HT = C.house_types;
  const bar = (l, n) => `<div><span>${l}</span><span>${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span><b>${n || "—"}</b></div>`;
  out.push(page("The portrait", chap("The <em>portrait</em>", "Themes & contradictions") +
    `<p class="muted">${esc(K.charactersIntro)}</p>
    <table><tr><th>#</th><th>Planet</th><th>Points</th><th>Why</th></tr>${cast.map((r, i) => `<tr><td>${i + 1}</td><td><span class="g">${T(PG[r.n])}</span> ${r.n}</td><td>${r.pts}</td><td class="ev">${esc(r.why.join(" · "))}</td></tr>`).join("")}</table>
    <p class="ev"><b>Quiet but important:</b> ${esc(K.charactersNotes.quiet.join(". "))} <b>Loud but less structural:</b> ${esc(K.charactersNotes.loud.join(". "))}</p>
    <h4>Chart DNA</h4><div class="bars">${[["Water", E.Water.length], ["Air", E.Air.length], ["Fire", E.Fire.length], ["Earth", E.Earth.length], ["Mutable", Mo.Mutable.length], ["Fixed", Mo.Fixed.length], ["Cardinal", Mo.Cardinal.length], ["Above horizon", H.above.length], ["Below horizon", H.below.length], ["East", H.east.length], ["West", H.west.length], ["Angular", HT.angular.length], ["Succedent", HT.succedent.length], ["Cadent", HT.cadent.length], ["Yang (fire + air)", E.Fire.length + E.Air.length], ["Yin (earth + water)", E.Earth.length + E.Water.length]].map(([l, n]) => bar(l, n)).join("")}</div>
    <h4>What repeats</h4><p class="ev">${esc(K.repeatsNote)}</p><div class="cols">${K.repeats.map(r => `<div class="item"><b class="t">${esc(r.theme)} ×${r.factors.length} <span class="dots">${dots(r.factors.length)}</span></b>${list(r.factors)}</div>`).join("")}</div>
    <h4>Where the chart argues with itself</h4>${K.contradictions.map(c => `<div class="item"><b class="t">${esc(c.poles.join(" / "))}</b><p class="ev">${esc(c.poles[0])}: ${esc(c.a.join(" · "))}<br>${esc(c.poles[1])}: ${esc(c.b.join(" · "))}</p><p><em>How both can be true:</em> ${esc(c.both)}</p></div>`).join("")}<p class="ev">${esc(K.contradictionsNote)}</p>
    <h4>Themes, read together</h4>${K.themes.map((t, i) => `<div class="item"><b class="t">${ROMAN[i]}. ${esc(t.title)}</b><p>${esc(t.text)}</p><p class="ev">${esc(t.evidence)}</p></div>`).join("")}`));

  // ---------- IV. life ----------
  out.push(page("Life areas", chap("Life <em>areas</em>", "Love · work · people") + Object.values(K.life).map(L => `<h3>${esc(L.title)}</h3><p class="muted">${esc(L.intro)}</p>
    <div class="cols">${L.items.map(it => `<div class="item"><b class="t">${esc(it.q)} <span class="dots">${dots(it.f.length)}</span></b><p>${esc(it.a)}</p><p class="ev">${esc(it.f.join(" · "))}</p></div>`).join("")}</div>`).join("")));

  // ---------- V. planets ----------
  out.push(page("The planets", chap("The <em>planets</em>", "All ten, in full") + `<p class="muted">Planet = what · sign = how · house = where. Each entry gives the modern reading, the traditional (Hellenistic/medieval) reading and an evolutionary framing, plus what was measured.</p>` +
    ORDER.map(n => { const p = P[n]; return `<div class="item"><div class="kicker">${esc(K.labels[n])}</div><h3 style="margin-top:2px"><span class="g">${T(PG[n])}</span> ${n} in <em>${p.sign}</em></h3>
      <div class="meta">${deg(p)} · ${ord(p.house)} house · ${p.element} · ${p.modality}${p.retrograde ? " · retrograde" : ""}</div>
      <p>${esc(K.planets[n])}</p><p class="ev"><b>Traditional:</b> ${esc(tradReading(n))}</p><p class="ev"><b>Evolutionary:</b> ${esc(K.evolutionary[n])}</p>
      <p class="ev"><b>Symbolism:</b> ${esc(K.significations[n])}</p><p class="ev"><b>Aspects:</b> ${aspectsOf(n).map(a => `${AG[a.type]} ${other(a, n)}${a.orb != null ? ` (${a.orb}°)` : ""}`).join(" · ") || "none"}</p></div>`; }).join("")));

  // ---------- VI. houses ----------
  out.push(page("The houses", chap("The <em>houses</em>", "All twelve") + `<p>${esc(HH.intro)}</p><div class="note">${esc(HH.notSigns)}</div>
    <div class="cols">${C.houses.map(h => `<div class="item"><b class="t">${ord(h.house)} house · ${esc(K.houses[h.house].name)}</b>
      <div class="meta">${esc(HH.names[h.house])} · ${houseKind(h.house)} · ${esc(HH.toAsc[h.house])}${HH.joys[h.house] ? ` · joy of ${HH.joys[h.house]}` : ""}</div>
      <p><b>${h.planets.length ? h.planets.map(p => `${T(PG[p])} ${p}`).join(", ") : "No planets"}.</b> ${esc(K.houses[h.house].about)}</p>${K.houseNotes[h.house] ? `<p class="ev">${esc(K.houseNotes[h.house])}</p>` : ""}</div>`).join("")}</div>
    <h4>The six axes</h4>${HH.axes.map(a => `<p><b>${ROMAN[a.a - 1]} ↔ ${ROMAN[a.b - 1]} · ${esc(a.name)}.</b> ${esc(a.text)}</p>`).join("")}
    <h4>Joys, empty houses and house systems</h4><p>${esc(HH.joysNote)}</p><p>${esc(K.houseNotes.empty)}</p><p>${esc(HH.systems)}</p><p>${esc(K.patterns.cluster)}</p>`));

  // ---------- VII. aspects ----------
  const major = X.aspects.filter(a => a.class === "major"), minor = X.aspects.filter(a => a.class === "minor");
  out.push(page("The aspects", chap("The <em>aspects</em>", "Major & minor") + `<div class="wheelbox">${wheel("light")}</div>
    <table><tr><th>Aspect</th><th>Orb</th><th>Motion</th><th>Tone</th></tr>${major.map(a => `<tr><td><span class="g">${T(PG[a.a])}</span> ${a.a} <span class="${TONE[a.type]}">${AG[a.type]} ${a.type}</span> <span class="g">${T(PG[a.b])}</span> ${a.b}</td><td>${a.orb != null ? a.orb + "°" : "private"}</td><td>${a.applying ? "applying" : "separating"}</td><td class="${TONE[a.type]}">${TONE[a.type]}</td></tr>`).join("")}</table>
    ${C.aspects.map(a => { const t = aspText(a); return `<div class="item"><b class="t">${esc(t.title)}</b><p>${esc(t.text)}</p></div>`; }).join("")}
    <h4>Minor aspects</h4><p class="ev">${minor.map(a => `${a.a} ${a.type} ${a.b}${a.orb != null ? ` (${a.orb}°)` : ""}, ${a.applying ? "applying" : "separating"}`).join(" · ")}</p>
    <h4>Patterns & shape</h4><p>${esc(K.aspectPattern)}</p><p>Checked for ${esc(X.patterns.checked.join(", "))}: ${X.patterns.found.length ? esc(X.patterns.found.map(f => f.type).join(", ")) : "none found"}. Chart shape: <b>${X.shape.shape}</b> (empty stretches of ${X.shape.gaps_over_60.join("° and ")}°).</p>`));

  // ---------- VIII. patterns ----------
  const PT = K.patterns;
  out.push(page("Patterns", chap("<em>Patterns</em>", "Elements · modes · rulers") +
    `<table><tr><th>Element</th><th>Planets</th></tr>${["Fire", "Earth", "Air", "Water"].map(e => `<tr><td>${e}</td><td>${E[e].join(", ") || "—"}${e === C.rising_element ? " (+ rising sign)" : ""}</td></tr>`).join("")}</table><p>${esc(PT.elements)}</p>
    <table><tr><th>Modality</th><th>Planets</th></tr>${["Cardinal", "Fixed", "Mutable"].map(m => `<tr><td>${m}</td><td>${Mo[m].join(", ") || "—"}${m === C.rising_modality ? " (+ rising sign)" : ""}</td></tr>`).join("")}</table><p>${esc(PT.modalities)}</p>
    <h4>Polarity</h4><p>Yang (fire + air): ${E.Fire.length + E.Air.length} · Yin (earth + water): ${E.Earth.length + E.Water.length}.</p>
    <h4>Hemispheres & house types</h4><p>${esc(PT.hemispheres)}</p><p>${esc(PT.houseTypes)}</p>
    <h4>Rulers</h4>${PT.rulers.map(r => `<p><b>${esc(r.from)} → ${esc(r.to)}</b> (${esc(r.where)}). ${esc(r.note)}</p>`).join("")}
    <h4>Retrogrades</h4><p>${esc(PT.retrogrades.intro)}</p>${C.planets.filter(p => p.retrograde).map(p => `<p><b>${p.planet} in ${p.sign}:</b> ${esc(PT.retrogrades[p.planet] || "")}</p>`).join("")}
    <h4>Nodes</h4><p>${esc(PT.nodes)}</p>`));

  // ---------- IX. mechanics ----------
  const MX = K.mechanics, yn = v => v ? "✓" : "·";
  out.push(page("Chart mechanics", chap("Chart <em>mechanics</em>", "Dignity · sect · stars") + `<p>${esc(MX.dignityIntro)}</p>
    <table><tr><th>Planet</th><th>Sign</th><th>Dom.</th><th>Exalt.</th><th>Trip.</th><th>Bound</th><th>Face</th><th>Detr.</th><th>Fall</th><th>Score</th></tr>${X.dignities.map(d => `<tr><td>${d.planet}</td><td>${d.sign}</td><td>${yn(d.domicile)}</td><td>${yn(d.exaltation)}</td><td>${yn(d.triplicity)}</td><td>${yn(d.bound)}</td><td>${yn(d.face)}</td><td>${d.detriment ? "✕" : "·"}</td><td>${d.fall ? "✕" : "·"}</td><td>${d.score > 0 ? "+" : ""}${d.score}${d.peregrine ? " peregrine" : ""}</td></tr>`).join("")}</table>
    <p><em>${esc(MX.dignityRead)}</em></p><h4>Sect</h4><p>${esc(MX.sect)}</p>
    <h4>Dispositors</h4><p>${esc(MX.dispositorsTrad)}</p><p class="ev">${Object.entries(X.dispositors.traditional.chains).map(([n, c]) => `${n}: ${c.join(" → ")}`).join(" · ")}</p><p>${esc(MX.dispositorsMod)}</p>
    <h4>Decans</h4><p>${esc(MX.decans)}</p><table><tr><th>Planet</th><th>Decan</th><th>Face ruler</th><th>Modern ruler</th></tr>${X.decans.map(d => `<tr><td>${d.planet}</td><td>${ord(d.decan)} of ${d.sign}</td><td>${d.face_ruler}</td><td>${d.modern_ruler}</td></tr>`).join("")}</table>
    <h4>Fixed stars</h4><p>${esc(MX.stars)}</p>
    <h4>Points & variations</h4><p>${esc(MX.lilith)}</p><p class="ev">True node ${X.points.true_node.degree}° ${X.points.true_node.sign} · mean node ${X.points.mean_node.degree}° ${X.points.mean_node.sign} · mean Lilith ${X.points.mean_lilith.degree}° ${X.points.mean_lilith.sign} · true Lilith ${X.points.true_lilith.degree}° ${X.points.true_lilith.sign}</p>
    <p>${esc(MX.draconic)}</p><p class="ev">${X.draconic.map(d => `${d.planet} ${"degree" in d ? d.degree + "° " : ""}${d.sign}`).join(" · ")}</p><p>${esc(MX.sidereal)}</p><div class="note">${esc(MX.withheld)}</div>`));

  // ---------- X. timing ----------
  const TM = X.timing, KT = K.time, prof = TM.profections[X.age];
  out.push(page("Timing", chap("<em>Timing</em>", `As of ${fmtDate(X.as_of)}`) + `<p>${esc(KT.intro)}</p>
    <h4>The sky now</h4><p class="ev">${Object.entries(TM.sky_now).map(([n, v]) => `${n} ${v.degree}° ${v.sign}${TM.retrograde_now.includes(n) ? " ℞" : ""}`).join(" · ")} · Moon in ${TM.moon_now.sign}, ${TM.moon_now.phase.toLowerCase()} (${TM.moon_now.illumination}% lit)</p>
    <h4>Transits now</h4><p>${TM.transits_now.map(t => `Transiting ${t.transit} ${AG[t.type]} natal ${t.natal} (${t.orb}°)`).join(" · ") || "None within 2°."}</p>
    <h4>Transit windows, next twelve months</h4><table><tr><th>Transit</th><th>Enters 1°</th><th>Exact</th><th>Leaves 1°</th></tr>${(TM.windows || []).map(w => `<tr><td>${w.transit} ${AG[w.type]} natal ${w.natal}</td><td>${w.start ? fmtDate(w.start) : "already in orb"}</td><td>${w.exact.map(fmtDate).join("; ")}</td><td>${w.end ? fmtDate(w.end) : "beyond 12 months"}</td></tr>`).join("") || TM.upcoming.map(t => `<tr><td>${t.transit} ${AG[t.type]} natal ${t.natal}</td><td></td><td>${fmtDate(t.date)}</td><td></td></tr>`).join("")}</table>
    <p class="ev">${esc(KT.transits)}</p>
    <h4>Profection & time lords</h4><p>${esc(KT.profection)}</p><p>${esc(KT.firdaria)}</p>
    <h4>Progressions & solar arc</h4><p>${esc(KT.progressions)} Progressed Sun ${TM.progressions.Sun.degree}° ${TM.progressions.Sun.sign}; progressed Moon in ${TM.progressions.Moon.sign}. ${esc(KT.solarArc)}</p><p class="ev">${TM.solar_arc.contacts.map(a => `Solar-arc ${a.directed} ${AG[a.type]} natal ${a.natal} (${a.orb}°)`).join(" · ")}</p>
    <h4>Returns & cycles</h4><p>${esc(KT.returns)}</p><table><tr><th>Cycle</th><th>Dates</th></tr>${[["Jupiter return", TM.returns.jupiter], ["Saturn return", TM.returns.saturn], ["Nodal return", TM.returns.nodal], ["Nodal opposition", TM.returns.nodal_opposition], ["Uranus opposition", TM.returns.uranus_opposition]].map(([l, d]) => `<tr><td>${l}</td><td class="ev">${d.map(x => x.slice(0, 7)).join(" · ")}</td></tr>`).join("")}</table>
    <p>${esc(KT.solarReturn)} ${fmtDate(TM.solar_return)}.</p>`));

  // ---------- XI. bonus ----------
  out.push(page("Bonus experiment", chap("Bonus <em>experiment</em>", "Personality tests") + `<p>If personality-test strengths alone had to pick a zodiac sign, which would they choose? Each sign is scored on the qualities astrology links to it, using only top strengths. Just for fun; it changes nothing above.</p>
    <table><tr><th>#</th><th>Sign</th><th>Match</th></tr>${M.signs.map((s, i) => `<tr><td>${i + 1}</td><td><span class="g">${T(s.glyph)}</span> ${s.name}</td><td>${s.match}%</td></tr>`).join("")}</table>`));

  // ---------- XII. method, glossary, history ----------
  out.push(page("Method", chap("Method, glossary <em>& history</em>", "How it was made") +
    `<h4>Three layers</h4>${K.layers.items.map(l => `<p><b>${esc(l.name)} (${esc(l.tag)}).</b> ${esc(l.text)}</p>`).join("")}
    <h4>How a chart is built</h4><ol class="ev" style="font-size:10pt">${K.build.map(b => `<li><b>${esc(b.step)}</b> (${esc(b.tag)}): ${esc(b.text)}</li>`).join("")}</ol>
    <h4>Why websites disagree</h4>${K.debugger.map(d => `<p><b>${esc(d.q)}.</b> ${esc(d.a)}</p>`).join("")}
    <h4>Glossary</h4><div class="cols">${Object.values(K.glossary).map(g => `<div class="item"><b class="t">${esc(g.t)}</b><p>${esc(g.def)} ${esc(g.calc)}</p><p class="ev">${esc(g.hist)} ${esc(g.debate)}</p></div>`).join("")}</div>
    <h4>Four thousand years, briefly</h4>${K.history.map(h => `<p><b>${esc(h.when)} · ${esc(h.where)}.</b> ${esc(h.what)}</p>`).join("")}
    <h4>Which astrology?</h4><p>${esc(K.schools)}</p>
    <div class="note"><b>What science says.</b> ${esc(K.layers.evidence)}</div>
    <p class="ev">${esc(K.footer)}</p>`));

  document.getElementById("report").innerHTML = out.join("");
  document.getElementById("save").onclick = () => window.print();
  if (new URLSearchParams(location.search).has("print")) {
    await document.fonts.ready;
    setTimeout(() => window.print(), 300);
  }
})();
