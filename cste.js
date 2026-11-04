// Coronado Swim Team Elite, read live from Pool Relay.
//
// Everything schedule-like on the page comes from here: each group's next practice and coming
// week, the pool and lane count on each, any notice Pool Relay carries for these pools, and
// what the calendar holds on each day the club's old "Exceptions" list names. The HTML types
// only group names, ages and days-per-week. Adapted from pool_sanramon/finder.js.
(function () {
  const TOKEN = "EbEgsHHb3IfFI1rQYekJ7F";
  const API = "https://www.poolrelay.com/api/public/views/";
  const TZ = "America/Los_Angeles";

  // ── Time, in the pools' own zone ─────────────────────────────────────────────
  const parts = (d) => Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d).map((p) => [p.type, p.value]));
  const P = parts(new Date());
  const TODAY = `${P.year}-${P.month}-${P.day}`;
  const NOW = +P.hour * 60 + +P.minute;
  const addDays = (iso, n) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const mins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const clock = (hhmm) => {
    let [h, m] = hhmm.split(":").map(Number); const ap = h >= 12 && h < 24 ? "pm" : "am"; h = h % 12 || 12;
    return m ? `${h}:${String(m).padStart(2, "0")}${ap}` : `${h}${ap}`;
  };
  const span = (a, b) => {
    const ap = (t) => (+t.split(":")[0] >= 12 ? "pm" : "am");
    return ap(a) === ap(b) ? `${clock(a).replace(/[ap]m$/, "")}–${clock(b)}` : `${clock(a)}–${clock(b)}`;
  };
  const dayFmt = (iso, opts) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
  const shortDay = (iso) => iso === TODAY ? "Today" : iso === addDays(TODAY, 1) ? "Tomorrow" : dayFmt(iso, { weekday: "short", month: "short", day: "numeric" });
  const longDay = (iso) => iso === TODAY ? "Today" : iso === addDays(TODAY, 1) ? "Tomorrow" : dayFmt(iso, { weekday: "long", month: "long", day: "numeric" });

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ── The places and groups the feed names ─────────────────────────────────────
  function indexFeed(feed) {
    const area = new Map(); // id → { facility, pool, isLane }
    for (const f of feed.facilities || []) {
      const walk = (n, pool) => {
        for (const c of n.children || []) {
          const p = c.type === "pool" ? c : pool;
          area.set(c.id, { facility: f, pool: p, isLane: c.type === "lane" });
          walk(c, p);
        }
      };
      area.set(f.id, { facility: f, pool: null, isLane: false });
      walk(f, null);
    }
    const group = new Map();
    const walkG = (n) => { group.set(n.id, n); (n.children || []).forEach(walkG); };
    (feed.groups || []).forEach(walkG);
    return { area, group };
  }

  const where = (o, ix) => {
    const hits = o.areaIds.map((id) => ix.area.get(id)).filter(Boolean);
    if (!hits.length) return "";
    const f = hits[0].facility;
    const pools = [...new Set(hits.map((h) => h.pool && h.pool.longName).filter(Boolean))];
    const lanes = hits.filter((h) => h.isLane).length;
    return `${f.shortName}${pools.length ? " · " + pools.join(", ") : ""}${lanes ? ` · ${lanes} lane${lanes === 1 ? "" : "s"}` : ""}`;
  };
  const groupName = (o, ix) => {
    const names = o.groupIds.map((id) => ix.group.get(id)).filter(Boolean)
      .map((g) => (g.type === "org" ? "Whole club" : g.longName));
    return names.join(", ") || o.title;
  };

  const isNotice = (o) => o.notice || o.allDay;
  const ended = (o) => o.date < TODAY || (o.date === TODAY && !o.allDay && mins(o.end) <= NOW);

  // ── Renderers ────────────────────────────────────────────────────────────────
  function renderNotices(occ, ix) {
    const box = document.getElementById("notices");
    const soon = occ.filter((o) => isNotice(o) && o.date >= TODAY && o.date <= addDays(TODAY, 14));
    box.innerHTML = soon.map((o) =>
      `<div class="notice"><b>${esc(longDay(o.date))}:</b> ${esc(o.title)}${where(o, ix) ? ` <span>(${esc(where(o, ix))})</span>` : ""}</div>`).join("");
  }

  function renderFacilities(feed) {
    for (const el of document.querySelectorAll("[data-fac]")) {
      const f = (feed.facilities || []).find((x) => x.id === el.dataset.fac);
      if (!f) { el.remove(); continue; }
      const q = encodeURIComponent(`${f.longName}, ${f.address || ""}`);
      el.innerHTML = `${esc(f.longName)}${f.address ? ` · <a href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener noreferrer">${esc(f.address)}</a>` : ""}`;
    }
  }

  function renderCards(occ, ix) {
    for (const card of document.querySelectorAll(".card[data-group]")) {
      const id = card.dataset.group;
      const g = ix.group.get(id);
      if (g) card.style.setProperty("--c", g.effectiveColor || g.color || "#999");
      const mine = occ.filter((o) => !isNotice(o) && o.groupIds.includes(id));
      const ahead = mine.filter((o) => !ended(o));
      const next = ahead[0];
      const week = ahead.filter((o) => o.date <= addDays(TODAY, 6));
      const slot = card.querySelector(".slot");
      slot.classList.remove("loading");
      const last = mine.length ? mine[mine.length - 1].date : null;
      let html = next
        ? `<div class="next"><b>Next practice</b>${esc(longDay(next.date))}, ${esc(span(next.start, next.end))}<br><span style="color:var(--muted);font-size:14px">${esc(where(next, ix))}</span></div>`
        : `<div class="next"><b>Next practice</b><span class="none">Not on the calendar yet${last ? ` &mdash; the pool has published practices through ${esc(longDay(last))}` : ""}.</span></div>`;
      if (week.length) {
        html += `<ul aria-label="${esc(g ? g.longName : "")} in the next 7 days">` + week.map((o) =>
          `<li><span class="d">${esc(shortDay(o.date))}</span><span>${esc(span(o.start, o.end))}</span><span class="w">${esc(where(o, ix).replace(/ · \d+ lanes?$/, ""))}</span></li>`).join("") + "</ul>";
      } else if (next) {
        html += `<p class="none">No practice in the next 7 days.</p>`;
      }
      slot.innerHTML = html;
    }
  }

  function renderExceptions(occ, ix, firstDate) {
    let pastCount = 0;
    const rows = document.querySelectorAll("#exceptions .xrow[data-date]");
    for (const row of rows) {
      const date = row.dataset.date;
      const now = row.querySelector(".now");
      const past = date < TODAY;
      if (past) { row.classList.add("past"); pastCount++; }
      const that = occ.filter((o) => o.date === date && !isNotice(o));
      const notes = occ.filter((o) => o.date === date && isNotice(o));
      if (past && (!firstDate || date < firstDate)) {
        now.innerHTML = `<b>Already past</b>This day has gone. The list still carries it.`;
        continue;
      }
      const head = past ? "Already past · the calendar held" : "On the live calendar that day";
      const items = [...notes.map((o) => `<li><strong>${esc(o.title)}</strong></li>`),
        ...that.map((o) => `<li><strong>${esc(groupName(o, ix))}</strong> ${esc(span(o.start, o.end))} · ${esc(where(o, ix))}</li>`)];
      now.innerHTML = `<b>${head}</b>` + (items.length ? `<ul>${items.join("")}</ul>` : `<span class="none">No practice on the calendar.</span>`);
    }
    if (rows.length && pastCount) {
      const why = document.getElementById("why");
      const lead = document.createElement("span");
      lead.innerHTML = `<b>${pastCount} of the ${rows.length} exceptions listed are already in the past.</b> `;
      why.prepend(lead);
    }
  }

  function fail(msg) {
    for (const s of document.querySelectorAll(".card .slot")) { s.classList.remove("loading"); s.innerHTML = `<span class="none">${esc(msg)}</span>`; }
    for (const n of document.querySelectorAll("#exceptions .now")) n.textContent = "";
  }

  // ── Load ─────────────────────────────────────────────────────────────────────
  const quoted = [...document.querySelectorAll("#exceptions [data-date]")].map((e) => e.dataset.date).sort();
  const from = quoted.length && quoted[0] < TODAY ? quoted[0] : addDays(TODAY, -7);
  const to = addDays(TODAY, 70);
  fetch(`${API}${TOKEN}/project?from=${from}&to=${to}`)
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((feed) => {
      const ix = indexFeed(feed);
      const occ = (feed.occurrences || []).slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
      const firstDate = occ.length ? occ[0].date : null;
      renderNotices(occ, ix);
      renderFacilities(feed);
      renderCards(occ, ix);
      renderExceptions(occ, ix, firstDate);
    })
    .catch(() => fail("The live schedule could not be loaded just now. The calendar above has it."));
})();
