/* Compatibility: Sun-sign layer + full-chart comparison.
   The second person's chart is computed in the browser (astronomy-engine); their birth details
   are never uploaded or stored. Suhani's Moon degree is private, so contacts to her Moon are sign-based. */
(function () {
  const { SIGNS, SG, PG, PLANETS, EL, MOD, AG, TONE, TONEC, T, esc, ord, signOf, sep, weightLevel, drawWheel } = window.Charted;

  // ---------------- sign layer ----------------
  const SIGN = {
    Aries: ["courage and a fast start", "directness and room to lead", "as pushy, when they're simply eager"],
    Taurus: ["steadiness and loyalty", "consistency, comfort and time", "as immovable, when they're being careful"],
    Gemini: ["curiosity and quick wit", "conversation and variety", "as scattered, when they're exploring"],
    Cancer: ["care and protectiveness", "emotional safety and belonging", "as guarded, when they're protecting what matters"],
    Leo: ["warmth and generosity", "appreciation and loyalty", "as showy, when they're sharing joy"],
    Virgo: ["practical help and an eye for detail", "usefulness and order", "as critical, when they're trying to help"],
    Libra: ["grace and fairness", "harmony and partnership", "as indecisive, when they're weighing everyone"],
    Scorpio: ["depth and loyalty", "trust and honesty", "as secretive, when they're simply private"],
    Sagittarius: ["optimism and big-picture thinking", "freedom and meaning", "as careless, when they're being candid"],
    Capricorn: ["ambition and reliability", "respect and a plan", "as cold, when they're focused"],
    Aquarius: ["originality and friendship", "independence and ideas", "as detached, when they're thinking"],
    Pisces: ["empathy and imagination", "gentleness and meaning", "as vague, when they're feeling their way"],
  };
  const MODE_VERB = { Cardinal: "start things", Fixed: "hold steady", Mutable: "adapt" };
  const CTX = {
    romance: { label: "Romance", as: "as partners", work: "Say what you need out loud; don't assume your partner reads it the way you would." },
    friendship: { label: "Friendship", as: "as friends", work: "Protect the thing you most enjoy doing together." },
    family: { label: "Family", as: "in a family", work: "Separate the role (parent, sibling, child) from the person in it." },
    work: { label: "Work", as: "as colleagues", work: "Agree early on who owns which decision." },
  };
  function signReading(a, b, ctx) {
    const ia = SIGNS.indexOf(a), ib = SIGNS.indexOf(b), k = Math.min((ib - ia + 12) % 12, (ia - ib + 12) % 12);
    const ea = EL[ia % 4], eb = EL[ib % 4], ma = MOD[ia % 3], mb = MOD[ib % 3], c = CTX[ctx];
    const rel = [
      ["Same sign", `You recognise each other instantly ${c.as}: same element (${ea}), same mode, same instincts.`, "With so much in common, you can reinforce each other's habits without anyone offering a counterweight."],
      ["Neighbouring signs", `Different elements and modes, but each of you picks up where the other leaves off ${c.as}.`, `You approach things from genuinely different angles (${ea} and ${eb}); it takes translation.`],
      ["Sextile", `Compatible elements (${ea} and ${eb}): conversation flows and you energise each other ${c.as}.`, `Different modes (${ma} and ${mb}) mean different pacing.`],
      ["Square", `You share a ${ma.toLowerCase()} mode, so you both ${MODE_VERB[ma]} and understand each other's drive.`, `Your elements (${ea} and ${eb}) pull instincts in different directions: friction that also creates momentum.`],
      ["Trine", `Same element (${ea}): a shared basic outlook and real ease ${c.as}.`, "Ease can settle into comfort; growth may need a push from outside."],
      ["Quincunx", "Nothing in common by element or mode, so understanding takes deliberate effort, and often rewards you with genuine surprise.", `${ea} and ${eb}, ${ma.toLowerCase()} and ${mb.toLowerCase()}: you rarely assume the same thing.`],
      ["Opposite signs", `Magnetic and mirroring: you share a ${ma.toLowerCase()} mode, and each has what the other lacks.`, "You see the same situation from opposite ends."],
    ][k];
    return { k, name: rel[0], rows: [
      ["Where you naturally click", rel[1]],
      ["Where you differ", rel[2]],
      ["What each may need", `${a} tends to need ${SIGN[a][1]}; ${b} tends to need ${SIGN[b][1]}.`],
      ["Where misunderstandings happen", `${a} can be read ${SIGN[a][2]}; ${b} can be read ${SIGN[b][2]}.`],
      ["What makes it work", `Lean on ${a}'s ${SIGN[a][0]} and ${b}'s ${SIGN[b][0]}. ${c.work}`],
    ] };
  }

  // ---------------- chart engine (browser) ----------------
  const CITIES = [
    ["Lucknow, India", 26.85, 80.95, "Asia/Kolkata"], ["Delhi, India", 28.61, 77.21, "Asia/Kolkata"], ["Mumbai, India", 19.08, 72.88, "Asia/Kolkata"], ["Bengaluru, India", 12.97, 77.59, "Asia/Kolkata"],
    ["Kolkata, India", 22.57, 88.36, "Asia/Kolkata"], ["Chennai, India", 13.08, 80.27, "Asia/Kolkata"], ["Hyderabad, India", 17.39, 78.49, "Asia/Kolkata"], ["Pune, India", 18.52, 73.86, "Asia/Kolkata"],
    ["Ahmedabad, India", 23.02, 72.57, "Asia/Kolkata"], ["Jaipur, India", 26.91, 75.79, "Asia/Kolkata"], ["Kanpur, India", 26.45, 80.33, "Asia/Kolkata"], ["Varanasi, India", 25.32, 82.97, "Asia/Kolkata"],
    ["Patna, India", 25.59, 85.14, "Asia/Kolkata"], ["Chandigarh, India", 30.73, 76.78, "Asia/Kolkata"], ["Bhopal, India", 23.26, 77.41, "Asia/Kolkata"], ["Kochi, India", 9.93, 76.27, "Asia/Kolkata"],
    ["Karachi, Pakistan", 24.86, 67.01, "Asia/Karachi"], ["Lahore, Pakistan", 31.55, 74.34, "Asia/Karachi"], ["Dhaka, Bangladesh", 23.81, 90.41, "Asia/Dhaka"], ["Kathmandu, Nepal", 27.72, 85.32, "Asia/Kathmandu"],
    ["Colombo, Sri Lanka", 6.93, 79.86, "Asia/Colombo"], ["Dubai, UAE", 25.2, 55.27, "Asia/Dubai"], ["Singapore", 1.35, 103.82, "Asia/Singapore"], ["Hong Kong", 22.32, 114.17, "Asia/Hong_Kong"],
    ["Shanghai, China", 31.23, 121.47, "Asia/Shanghai"], ["Beijing, China", 39.9, 116.41, "Asia/Shanghai"], ["Tokyo, Japan", 35.68, 139.69, "Asia/Tokyo"], ["Seoul, South Korea", 37.57, 126.98, "Asia/Seoul"],
    ["Manila, Philippines", 14.6, 120.98, "Asia/Manila"], ["Bangkok, Thailand", 13.76, 100.5, "Asia/Bangkok"], ["Jakarta, Indonesia", -6.21, 106.85, "Asia/Jakarta"], ["Kuala Lumpur, Malaysia", 3.14, 101.69, "Asia/Kuala_Lumpur"],
    ["Sydney, Australia", -33.87, 151.21, "Australia/Sydney"], ["Melbourne, Australia", -37.81, 144.96, "Australia/Melbourne"], ["Auckland, New Zealand", -36.85, 174.76, "Pacific/Auckland"],
    ["London, UK", 51.51, -0.13, "Europe/London"], ["Manchester, UK", 53.48, -2.24, "Europe/London"], ["Dublin, Ireland", 53.35, -6.26, "Europe/Dublin"], ["Paris, France", 48.86, 2.35, "Europe/Paris"],
    ["Berlin, Germany", 52.52, 13.4, "Europe/Berlin"], ["Madrid, Spain", 40.42, -3.7, "Europe/Madrid"], ["Barcelona, Spain", 41.39, 2.17, "Europe/Madrid"], ["Rome, Italy", 41.9, 12.5, "Europe/Rome"],
    ["Milan, Italy", 45.46, 9.19, "Europe/Rome"], ["Amsterdam, Netherlands", 52.37, 4.9, "Europe/Amsterdam"], ["Stockholm, Sweden", 59.33, 18.07, "Europe/Stockholm"], ["Moscow, Russia", 55.76, 37.62, "Europe/Moscow"],
    ["Istanbul, Turkey", 41.01, 28.98, "Europe/Istanbul"], ["Athens, Greece", 37.98, 23.73, "Europe/Athens"], ["Cairo, Egypt", 30.04, 31.24, "Africa/Cairo"], ["Lagos, Nigeria", 6.52, 3.38, "Africa/Lagos"],
    ["Nairobi, Kenya", -1.29, 36.82, "Africa/Nairobi"], ["Johannesburg, South Africa", -26.2, 28.05, "Africa/Johannesburg"], ["Tel Aviv, Israel", 32.09, 34.78, "Asia/Jerusalem"], ["Riyadh, Saudi Arabia", 24.71, 46.68, "Asia/Riyadh"],
    ["Toronto, Canada", 43.65, -79.38, "America/Toronto"], ["Vancouver, Canada", 49.28, -123.12, "America/Vancouver"], ["Montreal, Canada", 45.5, -73.57, "America/Toronto"], ["Mexico City, Mexico", 19.43, -99.13, "America/Mexico_City"],
    ["New York, NY, USA", 40.71, -74.01, "America/New_York"], ["Boston, MA, USA", 42.36, -71.06, "America/New_York"], ["Washington, DC, USA", 38.91, -77.04, "America/New_York"], ["Philadelphia, PA, USA", 39.95, -75.17, "America/New_York"],
    ["Miami, FL, USA", 25.76, -80.19, "America/New_York"], ["Atlanta, GA, USA", 33.75, -84.39, "America/New_York"], ["Chicago, IL, USA", 41.88, -87.63, "America/Chicago"], ["Houston, TX, USA", 29.76, -95.37, "America/Chicago"],
    ["Austin, TX, USA", 30.27, -97.74, "America/Chicago"], ["Dallas, TX, USA", 32.78, -96.8, "America/Chicago"], ["San Antonio, TX, USA", 29.42, -98.49, "America/Chicago"], ["Minneapolis, MN, USA", 44.98, -93.27, "America/Chicago"],
    ["Denver, CO, USA", 39.74, -104.99, "America/Denver"], ["Phoenix, AZ, USA", 33.45, -112.07, "America/Phoenix"], ["Seattle, WA, USA", 47.61, -122.33, "America/Los_Angeles"], ["San Francisco, CA, USA", 37.77, -122.42, "America/Los_Angeles"],
    ["Los Angeles, CA, USA", 34.05, -118.24, "America/Los_Angeles"], ["San Diego, CA, USA", 32.72, -117.16, "America/Los_Angeles"], ["Honolulu, HI, USA", 21.31, -157.86, "Pacific/Honolulu"],
    ["São Paulo, Brazil", -23.55, -46.63, "America/Sao_Paulo"], ["Rio de Janeiro, Brazil", -22.91, -43.17, "America/Sao_Paulo"], ["Buenos Aires, Argentina", -34.6, -58.38, "America/Argentina/Buenos_Aires"],
    ["Bogotá, Colombia", 4.71, -74.07, "America/Bogota"], ["Lima, Peru", -12.05, -77.04, "America/Lima"], ["Santiago, Chile", -33.45, -70.67, "America/Santiago"],
  ];
  // UTC offset (minutes) of a time zone at a given local wall-clock time, using the browser's time-zone database
  function tzOffset(tz, y, mo, d, h, mi) {
    let guess = Date.UTC(y, mo - 1, d, h, mi);
    for (let i = 0; i < 3; i++) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(new Date(guess)).filter(p => p.type !== "literal").map(p => [p.type, +p.value]));
      const asUTC = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute);
      const off = (asUTC - guess) / 60000;
      guess = Date.UTC(y, mo - 1, d, h, mi) - off * 60000;
    }
    return (Date.UTC(y, mo - 1, d, h, mi) - guess) / 60000;
  }
  function eclLon(body, time) {
    const A = window.Astronomy;
    if (body === "Sun") return A.SunPosition(time).elon;
    if (body === "Moon") return A.EclipticGeoMoon(time).lon;
    const v = A.GeoVector(A.Body[body], time, true);
    return A.SphereFromVector(A.RotateVector(A.Rotation_EQJ_ECT(time), v)).lon;
  }
  function ascendant(time, lat, lon) {
    const A = window.Astronomy, r = Math.PI / 180;
    const ramc = ((A.SiderealTime(time) * 15 + lon) % 360 + 360) % 360, eps = A.e_tilt(time).tobl;
    const asc = Math.atan2(Math.cos(ramc * r), -(Math.sin(ramc * r) * Math.cos(eps * r) + Math.tan(lat * r) * Math.sin(eps * r))) / r;
    return (asc + 360) % 360;
  }
  function computeChart({ date, time, place }) {
    const [y, mo, d] = date.split("-").map(Number);
    const known = !!time;
    const [h, mi] = known ? time.split(":").map(Number) : [12, 0];
    const off = place.tz ? tzOffset(place.tz, y, mo, d, h, mi) : place.offset * 60;
    const utc = new Date(Date.UTC(y, mo - 1, d, h, mi) - off * 60000);
    const t = window.Astronomy.MakeTime(utc);
    const planets = PLANETS.map(n => ({ n, lon: eclLon(n, t) }));
    let moonUncertain = false;
    if (!known) {
      const m0 = eclLon("Moon", window.Astronomy.MakeTime(new Date(utc.getTime() - 12 * 3600e3))), m1 = eclLon("Moon", window.Astronomy.MakeTime(new Date(utc.getTime() + 12 * 3600e3)));
      moonUncertain = signOf(m0) !== signOf(m1);
    }
    const asc = known ? ascendant(t, place.lat, place.lon) : null;
    return { planets, known, moonUncertain, asc, ascSign: asc != null ? signOf(asc) : null };
  }

  // ---------------- synastry ----------------
  const FN = { Sun: "sense of self", Moon: "feelings and needs", Mercury: "way of thinking and talking", Venus: "affection and taste", Mars: "drive and directness",
    Jupiter: "generosity and growth", Saturn: "sense of duty and structure", Uranus: "need for independence", Neptune: "ideals and imagination", Pluto: "intensity and depth" };
  const ASKS = { Sun: "recognition of who they are", Moon: "emotional understanding", Mercury: "to be heard", Venus: "affection shown their way", Mars: "room to act",
    Jupiter: "room to grow", Saturn: "respect for their commitments", Uranus: "freedom", Neptune: "room to dream", Pluto: "depth and honesty" };
  const PERSONAL = ["Sun", "Moon", "Mercury", "Venus", "Mars"];
  // rank contacts: personal-to-personal first, slow outer planets last, tighter orbs first
  const rank = c => (c.orb ?? 3) + (OUTER.includes(c.a) || OUTER.includes(c.b) ? 3 : 0) - (PERSONAL.includes(c.a) && PERSONAL.includes(c.b) ? 1.5 : 0);
  const VERB = { conjunction: "fuses with", trine: "flows easily with", sextile: "cooperates with", square: "rubs against", opposition: "pulls against, and mirrors," };
  const OUTER = ["Uranus", "Neptune", "Pluto"];
  const ASPECTS = [["conjunction", 0], ["sextile", 60], ["square", 90], ["trine", 120], ["opposition", 180]];
  function crossAspects(A, B) {
    const out = [];
    A.planets.forEach(a => B.planets.forEach(b => {
      if (OUTER.includes(a.n) && OUTER.includes(b.n)) return;
      if (a.signOnly || b.signOnly) {
        const k = Math.min((SIGNS.indexOf(signOf(b.lon)) - SIGNS.indexOf(signOf(a.lon)) + 12) % 12, (SIGNS.indexOf(signOf(a.lon)) - SIGNS.indexOf(signOf(b.lon)) + 12) % 12);
        const m = { 0: "conjunction", 2: "sextile", 3: "square", 4: "trine", 6: "opposition" }[k];
        if (m) out.push({ a: a.n, b: b.n, type: m, orb: null, bySign: true });
        return;
      }
      const s = sep(a.lon, b.lon), lim = (["Sun", "Moon"].includes(a.n) || ["Sun", "Moon"].includes(b.n)) ? 8 : OUTER.includes(a.n) || OUTER.includes(b.n) ? 4 : 6;
      ASPECTS.forEach(([type, ang]) => { const o = Math.abs(s - ang); if (o <= lim) out.push({ a: a.n, b: b.n, type, orb: Math.round(o * 10) / 10 }); });
    }));
    return out.sort((x, y) => (x.orb ?? 3) - (y.orb ?? 3));
  }
  const RELS = {
    partner: { label: "Partner", group: "romance" }, dating: { label: "Someone I'm dating", group: "romance" }, friend: { label: "Friend", group: "friend" },
    parent: { label: "Parent", group: "family" }, sibling: { label: "Sibling", group: "family" }, coworker: { label: "Coworker", group: "work" }, other: { label: "Other", group: "friend" },
  };
  const has = (c, ...names) => names.includes(c.a) || names.includes(c.b);
  const DIMS = {
    romance: [["Emotional rhythm", c => has(c, "Moon")], ["Attraction", c => (c.a === "Venus" && c.b === "Mars") || (c.a === "Mars" && c.b === "Venus") || (has(c, "Venus") && has(c, "Sun", "Moon", "Venus", "Mars"))],
      ["Communication", c => has(c, "Mercury")], ["What feels effortless", c => TONE[c.type] === "flow"], ["What requires translation", c => TONE[c.type] === "tension" && has(c, "Mars", "Saturn", "Pluto", "Uranus", "Mercury")], ["Commitment themes", c => has(c, "Saturn") && has(c, "Sun", "Moon", "Venus", "Mars")]],
    friend: [["Communication", c => has(c, "Mercury")], ["Fun & energy", c => TONE[c.type] !== "tension" && has(c, "Jupiter", "Mars", "Sun", "Venus", "Uranus")], ["Trust", c => has(c, "Saturn", "Moon") && TONE[c.type] !== "tension"],
      ["Emotional support", c => has(c, "Moon") && has(c, "Venus", "Moon", "Jupiter", "Sun")], ["Where you may exhaust each other", c => TONE[c.type] === "tension" && has(c, "Mars", "Uranus", "Saturn", "Mercury")]],
    family: [["Communication", c => has(c, "Mercury")], ["Authority & expectations", c => has(c, "Saturn", "Sun") && has(c, "Saturn", "Sun", "Moon", "Mars")], ["Emotional understanding", c => has(c, "Moon")],
      ["Independence", c => has(c, "Uranus", "Mars") && has(c, "Sun", "Moon", "Venus", "Mars", "Saturn")], ["Where conflict escalates", c => TONE[c.type] === "tension" && has(c, "Mars", "Saturn", "Pluto")], ["Common ground", c => TONE[c.type] === "flow"]],
    work: [["Communication", c => has(c, "Mercury")], ["Work styles", c => has(c, "Mars", "Saturn", "Mercury") && has(c, "Mars", "Saturn", "Mercury", "Sun")], ["Ambition", c => has(c, "Sun", "Saturn", "Jupiter") && has(c, "Sun", "Saturn", "Jupiter", "Mars")],
      ["Ease", c => TONE[c.type] === "flow"], ["Friction", c => TONE[c.type] === "tension"]],
  };
  const QUESTIONS = [
    ["butt", "Why do we butt heads?", c => TONE[c.type] === "tension" && has(c, "Mars", "Saturn", "Mercury", "Sun", "Moon", "Pluto", "Uranus")],
    ["easy", "Why do we get along so easily?", c => TONE[c.type] === "flow" || (c.type === "conjunction" && has(c, "Venus", "Jupiter", "Moon", "Sun"))],
    ["misunderstood", "Why do I feel misunderstood by them?", c => has(c, "Mercury", "Moon") && TONE[c.type] === "tension"],
    ["drawn", "Why am I so drawn to them?", c => ["conjunction", "opposition", "trine"].includes(c.type) && has(c, "Venus", "Mars", "Sun", "Moon", "Pluto", "Neptune")],
    ["talk", "Where do we communicate differently?", c => has(c, "Mercury")],
    ["bringsout", "What does this relationship bring out in me?", c => ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(c.a)],
  ];
  const tone = c => TONE[c.type];
  const sentence = (c, an, bn) => `${an}'s ${c.a} (${FN[c.a]}) ${VERB[c.type]} ${bn}'s ${c.b} (${FN[c.b]})${c.bySign ? ", by sign" : c.orb != null ? `, ${c.orb}° from exact` : ""}.`;
  function summarise(list) {
    if (!list.length) return "No strong contacts here, so this area relies on other parts of the two charts.";
    const f = list.filter(c => tone(c) === "flow").length, t = list.filter(c => tone(c) === "tension").length, b = list.length - f - t;
    return f > t * 1.5 ? "Mostly easy. The contacts here are supportive." : t > f * 1.5 ? "Mostly friction. That's energy, not a verdict: it's where you push each other." : `Mixed: ${f} easy, ${t} challenging${b ? `, ${b} fused` : ""}. Both are real.`;
  }
  function answer(key, list, an, bn, rel) {
    const grp = RELS[rel].group, top = [...list].sort((x, y) => rank(x) - rank(y)).slice(0, 4);
    const lead = {
      butt: grp === "family" ? `Forget the Sun-sign stereotype: in a ${RELS[rel].label.toLowerCase()} relationship, these are the contacts where your charts push against each other.` : "Forget the Sun-sign stereotype. These are the contacts where your charts actually push against each other.",
      easy: "These contacts are traditionally read as natural ease: things you don't have to work at.",
      misunderstood: "Misunderstanding usually shows up in Mercury (how you think and talk) and Moon (what you feel and need).",
      drawn: "Attraction and fascination tend to come from conjunctions, oppositions and trines involving the personal planets.",
      talk: "Mercury describes how each person thinks and talks; its contacts show where you translate for each other.",
      bringsout: `Here is what ${bn}'s planets touch in ${an}'s chart, the parts of ${an} this relationship activates.`,
    }[key];
    let extra = "";
    if (key === "butt" && top.length) {
      const c = top[0];
      extra = `<p><b>What ${esc(an)} may be asking for:</b> ${ASKS[c.a]}. <b>What ${esc(bn)} may hear instead:</b> a challenge to their ${FN[c.b]}.</p>`;
    }
    return `<p>${esc(lead)}</p>${extra}${top.length ? `<ul>${top.map(c => `<li class="${tone(c)}">${esc(sentence(c, an, bn))}</li>`).join("")}</ul>` : "<p class='muted'>No contacts of this kind within orb. This question isn't strongly marked between your charts.</p>"}`;
  }

  // ---------------- UI ----------------
  function init() {
    const { C, P } = window.CH;
    const ME = { name: "Suhani", planets: C.planets.map(p => ({ n: p.planet, lon: SIGNS.indexOf(p.sign) * 30 + ("degree" in p ? p.degree + .5 : 15), signOnly: !("degree" in p) })), known: true, ascSign: C.rising_sign, private: true };

    // sign layer
    const sc = document.getElementById("signCompat");
    sc.innerHTML = `<div class="sc-controls"><label><span class="label">Sign one</span><select id="scA">${SIGNS.map(s => `<option ${s === C.sun_sign ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <span class="plus">+</span><label><span class="label">Sign two</span><select id="scB">${SIGNS.map(s => `<option ${s === "Taurus" ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <div class="ctx" role="tablist">${Object.entries(CTX).map(([k, v], i) => `<button data-c="${k}" aria-selected="${i === 0}">${v.label}</button>`).join("")}</div></div>
      <div id="scOut" aria-live="polite"></div>`;
    let ctx = "romance";
    const draw = () => {
      const a = sc.querySelector("#scA").value, b = sc.querySelector("#scB").value, r = signReading(a, b, ctx);
      sc.querySelector("#scOut").innerHTML = `<div class="sc-head"><span class="g">${T(SG[SIGNS.indexOf(a)])}</span> ${a} <i>&</i> ${b} <span class="g">${T(SG[SIGNS.indexOf(b)])}</span><small>${r.name} · ${CTX[ctx].label}</small></div>
        <dl class="sc-rows" data-c="doctrine">${r.rows.map(([q, t]) => `<dt>${q}</dt><dd>${esc(t)}</dd>`).join("")}</dl>
        <p class="sc-note">Sun signs are only one layer; a whole chart has ten planets. <a href="#full-compat">Compare your full charts ↓</a></p>`;
    };
    sc.querySelectorAll("select").forEach(s => s.onchange = draw);
    sc.querySelectorAll(".ctx button").forEach(b => b.onclick = () => { ctx = b.dataset.c; sc.querySelectorAll(".ctx button").forEach(x => x.setAttribute("aria-selected", x === b)); draw(); });
    draw();

    // full layer
    const fc = document.getElementById("fullCompat");
    const cityOpts = CITIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join("");
    const person = (id, title, isMe) => `<fieldset class="pf" id="${id}"><legend>${title}</legend>
      ${isMe ? `<label class="me-toggle"><input type="checkbox" class="useMe" checked> Use Suhani's chart</label>` : ""}
      <div class="pf-fields" ${isMe ? "hidden" : ""}>
        <label><span class="label">Name (optional)</span><input class="nm" type="text" maxlength="30" placeholder="${isMe ? "Me" : "Them"}"></label>
        <label><span class="label">Birth date</span><input class="dt" type="date" min="1900-01-01" max="2100-12-31"></label>
        <label><span class="label">Birth time</span><input class="tm" type="time"><span class="unk"><input type="checkbox" class="noTime"> Unknown</span></label>
        <label><span class="label">Birthplace</span><select class="city"><option value="">Choose a city…</option>${cityOpts}<option value="manual">Somewhere else: enter coordinates</option></select></label>
        <div class="manual" hidden><label><span class="label">Latitude</span><input class="lat" type="number" step="0.01" min="-90" max="90"></label><label><span class="label">Longitude</span><input class="lon" type="number" step="0.01" min="-180" max="180"></label><label><span class="label">UTC offset (hours)</span><input class="off" type="number" step="0.25" min="-12" max="14"></label></div>
      </div></fieldset>`;
    fc.innerHTML = `<p class="lede" style="margin:-20px 0 24px">Enter someone's birth details to see where your charts actually interact. <span class="priv">🔒 Their birth details stay on this device: calculated in your browser, never uploaded or saved.</span></p>
      <form class="fc-form" id="fcForm">
        ${person("pA", "Person one", true)}${person("pB", "Person two", false)}
        <div class="fc-rel"><span class="label">Who are they to you?</span><div class="rels">${Object.entries(RELS).map(([k, v], i) => `<label><input type="radio" name="rel" value="${k}" ${i === 0 ? "checked" : ""}> ${v.label}</label>`).join("")}</div></div>
        <button class="go" type="submit">Compare our charts</button>
        <p class="fc-err" id="fcErr" role="alert"></p>
      </form>
      <div id="fcOut" aria-live="polite"></div>`;
    fc.querySelector(".useMe").onchange = e => fc.querySelector("#pA .pf-fields").hidden = e.target.checked;
    fc.querySelectorAll(".city").forEach(s => s.onchange = () => s.closest(".pf").querySelector(".manual").hidden = s.value !== "manual");
    fc.querySelectorAll(".noTime").forEach(c => c.onchange = () => { const t = c.closest("label").querySelector(".tm"); t.disabled = c.checked; if (c.checked) t.value = ""; });

    const read = fs => {
      const q = s => fs.querySelector(s);
      if (!q(".dt").value) throw new Error("Add a birth date.");
      const cv = q(".city").value;
      let place;
      if (cv === "manual") {
        const lat = parseFloat(q(".lat").value), lon = parseFloat(q(".lon").value), off = parseFloat(q(".off").value);
        if ([lat, lon, off].some(isNaN)) throw new Error("Enter latitude, longitude and UTC offset, or choose a city.");
        place = { lat, lon, offset: off };
      } else if (cv !== "") { const c = CITIES[+cv]; place = { lat: c[1], lon: c[2], tz: c[3] }; }
      else throw new Error("Choose a birthplace.");
      const time = q(".noTime").checked ? "" : q(".tm").value;
      return { name: q(".nm").value.trim(), ...computeChart({ date: q(".dt").value, time, place }) };
    };

    fc.querySelector("#fcForm").onsubmit = e => {
      e.preventDefault();
      const err = fc.querySelector("#fcErr"); err.textContent = "";
      if (!window.Astronomy) { err.textContent = "The astronomy library is still loading. Try again in a moment."; return; }
      let A, B;
      try {
        A = fc.querySelector(".useMe").checked ? ME : read(fc.querySelector("#pA"));
        B = read(fc.querySelector("#pB"));
      } catch (x) { err.textContent = x.message; return; }
      const rel = fc.querySelector("input[name=rel]:checked").value;
      render(A, B, rel);
    };

    function render(A, B, rel) {
      const an = A.name || "Person one", bn = B.name || "Person two", grp = RELS[rel].group;
      const cross = crossAspects(A, B);
      const sunA = signOf(A.planets[0].lon), sunB = signOf(B.planets[0].lon);
      const sr = signReading(sunA, sunB, grp === "romance" ? "romance" : grp === "family" ? "family" : grp === "work" ? "work" : "friendship");
      const notes = [];
      if (!B.known) notes.push(`${bn}'s birth time is unknown, so their rising sign and houses aren't used${B.moonUncertain ? ", and their Moon may be in either of two signs that day" : ""}.`);
      if (A.private) notes.push(`${an}'s Moon degree is private, so contacts to it are judged by sign.`);
      const houseOf = (lon, ascSign) => ascSign ? ((SIGNS.indexOf(signOf(lon)) - SIGNS.indexOf(ascSign) + 12) % 12) + 1 : null;
      const overlays = A.ascSign ? B.planets.filter(p => ["Sun", "Moon", "Venus", "Mars", "Mercury"].includes(p.n)).map(p => `${bn}'s ${p.n} falls in ${an}'s ${ord(houseOf(p.lon, A.ascSign))} house`) : [];
      const dims = DIMS[grp].map(([label, f]) => [label, cross.filter(f)]);
      const out = document.getElementById("fcOut");
      out.innerHTML = `<div class="fc-res">
        <div class="fc-top">
          <div><div class="label">${esc(RELS[rel].label)}</div><h3>${esc(an)} <em>&</em> ${esc(bn)}</h3>
            <p class="fc-suns"><span class="g">${T(SG[SIGNS.indexOf(sunA)])}</span> ${sunA} Sun · <span class="g">${T(SG[SIGNS.indexOf(sunB)])}</span> ${sunB} Sun · ${sr.name.toLowerCase()}</p>
            <p>${cross.length} contacts between the two charts: ${cross.filter(c => tone(c) === "flow").length} easy, ${cross.filter(c => tone(c) === "tension").length} challenging, ${cross.filter(c => tone(c) === "blend").length} fused. No compatibility score: astrology doesn't have a valid one, so we show the contacts instead.</p>
            ${notes.map(n => `<p class="muted">${esc(n)}</p>`).join("")}</div>
          <div class="fc-wheel" id="fcWheel"></div>
        </div>
        <div class="label" style="margin-top:30px">Ask about this relationship</div>
        <div class="fc-q">${QUESTIONS.map(([k, q]) => `<button data-q="${k}">${q}</button>`).join("")}</div>
        <div class="fc-ans" id="fcAns" aria-live="polite"></div>
        <div class="label" style="margin-top:36px">Dimensions</div>
        <div class="fc-dims">${dims.map(([l, list], i) => `<article><div class="lh"><b>${esc(l)}</b><span class="dots sm">${Array.from({ length: 4 }, (_, j) => `<i class="${j < weightLevel(list.length) ? "on" : ""}"></i>`).join("")}</span></div>
          <p>${esc(summarise(list))}</p>${list.length ? `<ul>${[...list].sort((x, y) => rank(x) - rank(y)).slice(0, 3).map(c => `<li class="${tone(c)}">${esc(sentence(c, an, bn))}</li>`).join("")}</ul><button class="why-btn" data-d="${i}">Show on both charts ↗</button>` : ""}</article>`).join("")}</div>
        ${overlays.length ? `<div class="label" style="margin-top:30px">Where ${esc(bn)} lands in ${esc(an)}'s chart (whole-sign houses)</div><p class="muted">${esc(overlays.join(" · "))}.</p>` : ""}
        <p class="muted" style="margin-top:24px">Astrologically, these are the chart dynamics traditionally associated with each question; people are more complicated than charts.</p>
      </div>`;
      const wheelFor = hl => {
        const box = document.getElementById("fcWheel"); box.innerHTML = "";
        box.appendChild(drawWheel({ inner: A.planets, outer: B.planets, aspects: cross.map(c => ({ a: c.a, b: c.b, type: c.type, cross: true, hl: hl && hl.includes(c) })), centreSign: A.ascSign ? SIGNS.indexOf(A.ascSign) : 0, highlight: hl ? [...new Set(hl.flatMap(c => [c.a, "o:" + c.b]))] : null, size: 520, ascLabel: !!A.ascSign }));
        box.insertAdjacentHTML("beforeend", `<p class="fc-key"><span class="dot in"></span> ${esc(an)} (inner) <span class="dot out"></span> ${esc(bn)} (outer)</p>`);
      };
      wheelFor(null);
      out.querySelectorAll(".fc-q button").forEach(b => b.onclick = () => {
        const [k, q, f] = QUESTIONS.find(x => x[0] === b.dataset.q), list = cross.filter(f);
        out.querySelectorAll(".fc-q button").forEach(x => x.setAttribute("aria-pressed", x === b));
        out.querySelector("#fcAns").innerHTML = `<h4>${esc(q)}</h4>${answer(k, list, an, bn, rel)}${list.length ? `<button class="why-btn" id="ansWhy">Show on both charts ↗</button>` : ""}`;
        out.querySelector("#ansWhy")?.addEventListener("click", () => { wheelFor([...list].sort((x, y) => rank(x) - rank(y)).slice(0, 4)); document.getElementById("fcWheel").scrollIntoView({ block: "center", behavior: "smooth" }); });
      });
      out.querySelectorAll(".fc-dims .why-btn").forEach(b => b.onclick = () => { wheelFor([...dims[+b.dataset.d][1]].sort((x, y) => rank(x) - rank(y)).slice(0, 3)); document.getElementById("fcWheel").scrollIntoView({ block: "center", behavior: "smooth" }); });
      out.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }
  window.ChartedCompat = { signReading, computeChart, crossAspects };
  if (window.CH) init(); else document.addEventListener("chart-ready", init);
})();
