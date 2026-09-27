import {
  activeCageId,
  compareIso,
  firstSunday,
  formatClock,
  formatLong,
  formatMonth,
  formatShort,
  isoWeekKey,
  lifeQuarter,
  lifeYear,
  todayInfo,
  weekDates,
  wednesdaysInMonth,
} from "./dates.js";
import { flagOf, isOn, load, noteOf, resetChecks, setCheck, setFlag, setNote } from "./store.js";
import { THIS_WEEK } from "./this-week.js";

const VIEWS = ["today", "week", "month", "quarter", "year"];

const CAGE = [
  { id: "up", time: "4:00", title: "Up", hint: "Out of bed." },
  { id: "prep", time: "4:00–4:50", title: "Light body + food + leave", hint: "Keep it light. Be gone before 5." },
  { id: "shift", time: "5:00", title: "Shift starts", hint: "Gate-to-gate. Unpaid break default 30 min." },
  { id: "finish", time: "2:00–5:00", title: "Finish (variable)", hint: "Home after this. Don't start the whole debt plan." },
  { id: "admin", time: "Home", title: "Short money / admin", hint: "Today's list only. Stop when it is empty." },
  { id: "body", time: "Next", title: "Body next", hint: "Stretch / walk / karate if scheduled." },
  { id: "career", time: "Some days", title: "Career", hint: "Skip most work nights. Sunday + one midweek pocket.", optional: true },
  { id: "wind", time: "9:00–9:30", title: "Wind-down → bed", hint: "Protect bedtime on work nights." },
];

const MONEY = [
  { id: "hours", title: "Log hours in Pay Ledger", hint: "Today's shift only.", href: "https://timesnapx.github.io/pay-ledger/" },
  { id: "bills", title: "Due bills", hint: "Pay what is due today. Nothing extra." },
  { id: "green", title: "One GreenLedger check", hint: "Look once. Do not rebuild the plan.", href: "https://timesnapx.github.io/green-ledger/" },
];

const PAYDAY = [
  { id: "slip", title: "Pay Ledger — slip when it lands", href: "https://timesnapx.github.io/pay-ledger/" },
  { id: "alloc", title: "GreenLedger weekly allocations", href: "https://timesnapx.github.io/green-ledger/" },
  { id: "leave", title: "Confirm what leaves the account before weekend OT spend" },
];

const SUNDAY = [
  { id: "green", title: "GreenLedger / bills calendar", hint: "Week money and dates, not a full rebuild." },
  { id: "career", title: "MC career study", hint: "Main career block for the week." },
  { id: "reset", title: "Meal / life reset", hint: "Food, laundry, the week ahead." },
  { id: "body", title: "Optional longer body", hint: "Only if the week left room." },
];

const MONTH_REVIEW = [
  { id: "money", title: "Money", hint: "Pay Ledger vs payslips, GreenLedger balances, snowball target for the month." },
  { id: "bills", title: "Bills calendar", hint: "Home Ops: rent, phone, insurance, lender dates confirmed." },
  { id: "career", title: "Career checkpoint", hint: "One licence/ticket step or seat-time log toward HC/MC." },
  { id: "body", title: "Body check", hint: "Smokes / stretch / karate: what stuck, what to cut." },
  { id: "buffer", title: "Buffer rule", hint: "If OT spiked, park surplus to buffer/debt before lifestyle." },
  { id: "admin", title: "Admin catch-all", hint: "Paperwork that didn't fit daily lists." },
];

const APPS = {
  pay: "https://timesnapx.github.io/pay-ledger/",
  green: "https://timesnapx.github.io/green-ledger/",
  takehome: "https://timesnapx.github.io/bevchain-take-home/",
  mc: "https://timesnapx.github.io/mc-career-tracker/",
  pulse: "https://timesnapx.github.io/pulseboard/",
  pulseReset: "https://timesnapx.github.io/pulseboard/reset-heatmaps.html",
  pulseBlank: "https://timesnapx.github.io/pulseboard/blank-slate.html",
};

const els = {
  clock: document.querySelector("#clock"),
  date: document.querySelector("#clock-date"),
  badges: document.querySelector("#badges"),
  tabs: document.querySelectorAll(".tab"),
  views: {
    today: document.querySelector("#view-today"),
    week: document.querySelector("#view-week"),
    month: document.querySelector("#view-month"),
    quarter: document.querySelector("#view-quarter"),
    year: document.querySelector("#view-year"),
  },
  resetDlg: document.querySelector("#dlg-reset"),
  toast: document.querySelector("#toast"),
};

let state = load();
let view = readHash();
let now = todayInfo();
let toastTimer = 0;

function readHash() {
  const raw = (location.hash || "#today").slice(1);
  return VIEWS.includes(raw) ? raw : "today";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

function keys() {
  const weekKey = isoWeekKey(now.year, now.month, now.day);
  const monthKey = `${now.year}-${String(now.month).padStart(2, "0")}`;
  const q = lifeQuarter(now.year, now.month);
  const y = lifeYear(now.year, now.month);
  return {
    day: now.iso,
    week: weekKey,
    month: monthKey,
    quarter: q.key,
    year: y.key,
    q,
    y,
  };
}

function tId(id) {
  return `t:${now.iso}:${id}`;
}

function wId(id) {
  return `w:${keys().week}:${id}`;
}

function careerOn() {
  return Boolean(flagOf(state, `career:${now.iso}`));
}

function cageIds() {
  return CAGE.filter((item) => !item.optional || careerOn()).map((item) => item.id);
}

function count(ids) {
  const done = ids.filter((id) => isOn(state, id)).length;
  return { done, total: ids.length };
}

function checkRow({ id, time, title, hint, nowId, optional, extraClass = "" }) {
  const on = isOn(state, id);
  const isNow = Boolean(nowId) && id.split(":").pop() === nowId;
  const cls = [
    "check",
    on ? "done" : "",
    isNow ? "now" : "",
    optional ? "optional" : "",
    optional && careerOn() ? "on" : "",
    extraClass,
  ].filter(Boolean).join(" ");
  const timeCell = time ? `<span class="t">${escapeHtml(time)}</span>` : "";
  const cols = time ? "" : " style=\"grid-template-columns:22px 1fr auto\"";
  return `
    <label class="${cls}"${cols}>
      <input type="checkbox" data-check="${escapeHtml(id)}" ${on ? "checked" : ""} />
      ${timeCell}
      <span class="copy">
        <b>${escapeHtml(title)}</b>
        ${hint ? `<span>${escapeHtml(hint)}</span>` : ""}
      </span>
      ${isNow ? `<span class="tag">Now</span>` : ""}
    </label>
  `;
}

function listChecks(items, idFn, nowId) {
  return `<div class="list">${items.map((item) => checkRow({
    id: idFn(item.id),
    title: item.title,
    hint: item.hint,
    nowId,
  })).join("")}</div>`;
}

function noteField(id, placeholder) {
  return `<textarea class="note" data-note="${escapeHtml(id)}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(noteOf(state, id))}</textarea>`;
}

function link(href, label) {
  return `<a class="chip-link" href="${href}">${escapeHtml(label)}</a>`;
}

function progressBox(done, total, label) {
  return `
    <div class="progress">
      <div class="progress-n">${done}/${total}</div>
      <small>${escapeHtml(label)}</small>
    </div>
  `;
}

function renderClock() {
  now = todayInfo();
  els.clock.textContent = formatClock(now);
  els.date.textContent = formatLong(now.iso);
  const bits = [];
  if (now.weekday === 3) bits.push(`<span class="badge payday">Wednesday payday</span>`);
  if (now.weekday === 6) bits.push(`<span class="badge ot">Saturday OT</span>`);
  if (now.weekday === 0) bits.push(`<span class="badge sun">Sunday deep work</span>`);
  if (now.minutes < 4 * 60 || now.minutes >= 21 * 60 + 30) {
    bits.push(`<span class="badge sleep">Protect sleep</span>`);
  }
  els.badges.innerHTML = bits.join("");
}

function twId(id) {
  return `tw:${THIS_WEEK.weekKey}:${id}`;
}

function twFix(item) {
  if (!item.fix) return "";
  const parts = escapeHtml(item.fix).split("{tel}");
  const tel = item.tel
    ? `<a class="tel-link" href="${escapeHtml(item.tel.href)}">${escapeHtml(item.tel.label)}</a>`
    : "";
  return `<p class="tw-fix"><b>Fix</b> ${parts.join(tel)}</p>`;
}

function renderThisWeek() {
  const w = THIS_WEEK;
  const ids = w.mustDo.map((m) => twId(m.id));
  const { done, total } = count(ids);
  const over = compareIso(now.iso, w.end) > 0;
  const takeHome = w.takeHome === null || w.takeHome === undefined
    ? `<span class="tw-pending">${escapeHtml(w.takeHomePending)}</span>`
    : `<strong>${escapeHtml(w.takeHome)}</strong>`;
  return `
    <article class="card amber-edge this-week" data-this-week>
      <div class="tw-head">
        <div>
          <h3>This week</h3>
          <p class="lede">${escapeHtml(w.label)}</p>
        </div>
        <div class="progress">
          <div class="progress-n tw-n">${done}/${total}</div>
          <small>must-dos</small>
        </div>
      </div>
      ${over ? `<p class="tw-stale">This week has ended. Update js/this-week.js for the next one.</p>` : ""}
      <div class="tw-take">
        <span class="tw-label">Take-home</span>
        ${takeHome}
        ${(w.confirmed || []).map((line) => `<span class="tw-confirmed">${escapeHtml(line)}</span>`).join("")}
      </div>
      <p class="tw-label">3 must-dos</p>
      <div class="list tw-must">
        ${w.mustDo.map((m) => checkRow({ id: twId(m.id), title: m.title, hint: m.hint, extraClass: "big" })).join("")}
      </div>
      <p class="tw-label">Bills + admin due</p>
      <ol class="tw-due">
        ${w.due.map((item) => `
          <li class="tw-item">
            <header>
              <b>${escapeHtml(item.title)}</b>
              ${item.amount ? `<span class="tw-amt">${escapeHtml(item.amount)}</span>` : ""}
            </header>
            ${item.status ? `<p class="tw-status">${escapeHtml(item.status)}</p>` : ""}
            ${item.detail ? `<p>${escapeHtml(item.detail)}</p>` : ""}
            ${twFix(item)}
            ${item.links?.length ? `<div class="links">${item.links.map((k) => link(APPS[k], k === "pay" ? "Pay Ledger" : "GreenLedger")).join("")}</div>` : ""}
          </li>
        `).join("")}
      </ol>
      ${w.note ? `<p class="tw-note">${escapeHtml(w.note)}</p>` : ""}
    </article>
  `;
}

function renderToday() {
  const k = keys();
  const onCareer = careerOn();
  const nowId = now.weekday === 0 ? null : activeCageId(now.minutes, onCareer);
  const required = cageIds().map((id) => tId(id));
  const moneyIds = MONEY.map((m) => tId(`money-${m.id}`));
  const extra = [];
  if (now.weekday === 3) extra.push(...PAYDAY.map((p) => wId(`pay-${p.id}`)));
  if (now.weekday === 0) extra.push(...SUNDAY.map((s) => wId(`sun-${s.id}`)));
  if (now.weekday === 6) extra.push(wId("sat-bed"));
  const all = [...required, ...moneyIds, ...extra];
  const { done, total } = count(all);

  const nowLabel = now.weekday === 0
    ? "Sunday is recovery + deep work, not the work cage."
    : nowId
      ? `Now: ${CAGE.find((c) => c.id === nowId)?.title || "cage"}`
      : "";

  const paydayBanner = now.weekday === 3 ? `
    <div class="banner payday">
      <div>
        <b>Wednesday payday</b>
        <p>After work: slip in Pay Ledger, GreenLedger allocations, then confirm what leaves the account before weekend OT spend temptation.</p>
      </div>
    </div>` : "";

  const satBanner = now.weekday === 6 ? `
    <div class="banner ot">
      <div>
        <b>Saturday OT — money win</b>
        <p>Keep the evening shorter. Protect 9:00–9:30 bed hard.</p>
      </div>
    </div>` : "";

  const sunBanner = now.weekday === 0 ? `
    <div class="banner sun">
      <div>
        <b>Sunday — main recovery + deep work</b>
        <p>GreenLedger / bills, MC study, meal/life reset, optional longer body. Career lives here, not every work night.</p>
      </div>
    </div>` : "";

  const sleepBanner = (now.minutes < 4 * 60) ? `
    <div class="banner sleep">
      <div>
        <b>Still night</b>
        <p>Cage starts at 4:00. Protect sleep until then.</p>
      </div>
    </div>` : "";

  const sundayBlock = now.weekday === 0 ? `
    <article class="card blue-edge">
      <h3>Sunday plan</h3>
      <p class="lede">Main career and money block for the week.</p>
      ${listChecks(SUNDAY, (id) => wId(`sun-${id}`))}
    </article>` : "";

  const paydayBlock = now.weekday === 3 ? `
    <article class="card amber-edge">
      <h3>Payday ritual</h3>
      <p class="lede">After work. Do not mix this with weekend OT spend.</p>
      ${listChecks(PAYDAY, (id) => wId(`pay-${id}`))}
    </article>` : "";

  els.views.today.innerHTML = `
    <div class="hero">
      <div>
        <p class="kicker">Daily cage</p>
        <h2>${escapeHtml(formatLong(now.iso))}</h2>
        <p class="now-line">${nowLabel ? `<strong>${escapeHtml(nowLabel)}</strong>` : `<span class="muted">Workdays run 4:00 up through 9:00–9:30 bed.</span>`}</p>
      </div>
      ${progressBox(done, total, "today")}
    </div>
    ${sleepBanner}${paydayBanner}${satBanner}${sunBanner}
    ${renderThisWeek()}
    <div class="grid grid-2">
      <article class="card">
        <h3>Workday cage</h3>
        <p class="lede">Mon–Sat. Hours given to Chrona are gate-to-gate.</p>
        <div class="timeline">
          ${CAGE.map((item) => checkRow({
            id: tId(item.id),
            time: item.time,
            title: item.title,
            hint: item.hint,
            nowId,
            optional: item.optional,
          })).join("")}
        </div>
      </article>
      <div class="grid">
        ${sundayBlock}
        <article class="card ${nowId === "admin" ? "now" : ""}">
          <h3>Short money / admin</h3>
          <p class="lede">Stop when this list is empty — not when the whole debt plan is done.</p>
          ${listChecks(MONEY, (id) => tId(`money-${id}`))}
          <div class="links">
            ${link(APPS.pay, "Pay Ledger")}
            ${link(APPS.green, "GreenLedger")}
          </div>
        </article>
        <article class="card ${nowId === "body" ? "now" : ""}">
          <h3>Body</h3>
          <p class="lede">After money/admin. Stretch / walk / karate if scheduled. Do not invent extra sessions.</p>
        </article>
        <article class="card">
          <div class="toggle">
            <div>
              <h3>Career today</h3>
              <p class="lede" style="margin:0">Off unless it is Sunday or a midweek pocket (Tue/Wed, finished by ~3pm).</p>
            </div>
            <button class="switch" type="button" data-career aria-pressed="${onCareer ? "true" : "false"}" aria-label="Career block today"></button>
          </div>
        </article>
        ${paydayBlock}
        ${now.weekday === 6 ? `
        <article class="card mint-edge">
          <h3>Saturday OT</h3>
          <p class="lede">Money win. Evening shorter. Bed still 9:00–9:30.</p>
          ${checkRow({ id: wId("sat-bed"), title: "Protected 9:00–9:30 bed", hint: "Hard rule on OT nights." })}
        </article>` : ""}
        <article class="card">
          <h3>Hard rules</h3>
          <ul class="rules">
            <li>Hours given to Chrona are <strong>gate-to-gate</strong> (start→finish); unpaid break default <strong>30 min</strong>.</li>
            <li>Protect bedtime on work nights.</li>
          </ul>
        </article>
      </div>
    </div>
  `;
}

function dayProgress(iso) {
  const ids = ["up", "prep", "shift", "finish", "admin", "body", "wind"];
  if (flagOf(state, `career:${iso}`)) ids.push("career");
  const done = ids.filter((id) => isOn(state, `t:${iso}:${id}`)).length;
  return { done, total: ids.length };
}

function renderWeek() {
  const k = keys();
  const days = weekDates(now.year, now.month, now.day).slice(0, 6);
  const sun = weekDates(now.year, now.month, now.day)[6];
  const sunIds = SUNDAY.map((s) => wId(`sun-${s.id}`));
  const payIds = PAYDAY.map((p) => wId(`pay-${p.id}`));
  const extra = [wId("pocket"), wId("sat-bed"), ...sunIds, ...payIds];
  const { done, total } = count(extra);

  els.views.week.innerHTML = `
    <div class="hero">
      <div>
        <p class="kicker">${escapeHtml(k.week)}</p>
        <h2>Weekly cage</h2>
        <p class="now-line">Mon–Sat run the daily cage. Career lives on Sunday + one optional midweek pocket.</p>
      </div>
      ${progressBox(done, total, "week extras")}
    </div>
    <div class="week-strip">
      ${days.map((d) => {
        const prog = dayProgress(d.iso);
        const isToday = d.iso === now.iso;
        const cls = [
          "day-card",
          isToday ? "today" : "",
          d.weekday === 3 ? "wed" : "",
          d.weekday === 6 ? "sat" : "",
        ].filter(Boolean).join(" ");
        let role = "Daily cage. Career light or skip.";
        if (d.weekday === 2 || d.weekday === 3) role = "Pocket day if finished by ~3pm.";
        if (d.weekday === 3) role = "Payday after work. Pocket only if done ~3pm.";
        if (d.weekday === 6) role = "OT money win. Shorter evening.";
        return `
          <article class="${cls}">
            <div class="dow">${escapeHtml(d.weekdayShort)}</div>
            <div class="dn">${d.day}</div>
            <p>${escapeHtml(role)}</p>
            <div class="frac">${prog.done}/${prog.total}</div>
          </article>
        `;
      }).join("")}
    </div>
    <div class="grid grid-2" style="margin-top:12px">
      <article class="card blue-edge ${sun.iso === now.iso ? "now" : ""}">
        <h3>Sunday · ${escapeHtml(formatShort(sun.iso))}</h3>
        <p class="lede">Main recovery + deep work. GreenLedger / bills calendar, MC career study, meal/life reset, optional longer body.</p>
        ${listChecks(SUNDAY, (id) => wId(`sun-${id}`))}
      </article>
      <div class="grid">
        <article class="card">
          <h3>Midweek career pocket</h3>
          <p class="lede">Tue/Wed only, and only if finished by ~3pm. Otherwise skip. Do not run career every work night.</p>
          ${checkRow({ id: wId("pocket"), title: "Took the pocket this week", hint: "Tick only if the shift ended in time." })}
          ${noteField(wId("pocket-note"), "What you did, or why you skipped.")}
        </article>
        <article class="card mint-edge">
          <h3>Saturday OT</h3>
          <p class="lede">Money win. Keep evening shorter. Protect 9:00–9:30 bed hard.</p>
          ${checkRow({ id: wId("sat-bed"), title: "Protected Saturday bedtime", hint: "9:00–9:30 still stands." })}
        </article>
        <article class="card amber-edge">
          <h3>Wednesday payday ritual</h3>
          <p class="lede">After work. Confirm outflows before weekend OT spend temptation.</p>
          ${listChecks(PAYDAY, (id) => wId(`pay-${id}`))}
        </article>
      </div>
    </div>
  `;
}

function renderMonth() {
  const k = keys();
  const reviewSunday = firstSunday(now.year, now.month);
  const weds = wednesdaysInMonth(now.year, now.month);
  const reviewIds = MONTH_REVIEW.map((item) => `m:${k.month}:${item.id}`);
  const payIds = weds.flatMap((iso) => PAYDAY.map((p) => `m:${k.month}:wed:${iso}:${p.id}`));
  const { done, total } = count([...reviewIds, ...payIds]);
  const reviewState = compareIso(now.iso, reviewSunday);

  els.views.month.innerHTML = `
    <div class="hero">
      <div>
        <p class="kicker">${escapeHtml(formatMonth(now.year, now.month))}</p>
        <h2>Monthly cage</h2>
        <p class="now-line">Anchor: first free Sunday (review) + every Wednesday payday (execute).</p>
      </div>
      ${progressBox(done, total, "month")}
    </div>
    <div class="grid grid-2">
      <article class="card blue-edge">
        <h3>First free Sunday</h3>
        <p class="lede">
          ${escapeHtml(formatLong(reviewSunday))}
          ${reviewState < 0 ? " — upcoming." : reviewState === 0 ? " — that's today." : " — this month's review window."}
          If that Sunday is a work day, use the next free one.
        </p>
        ${listChecks(MONTH_REVIEW, (id) => `m:${k.month}:${id}`)}
        <div class="links">
          ${link(APPS.pay, "Pay Ledger")}
          ${link(APPS.green, "GreenLedger")}
          ${link(APPS.mc, "MC career tracker")}
          ${link(APPS.pulse, "PulseBoard")}
        </div>
      </article>
      <article class="card amber-edge">
        <h3>Wednesday payday trail</h3>
        <p class="lede">Every Wednesday this month. Slip, allocate, then confirm what leaves the account.</p>
        <div class="trail">
          ${weds.map((iso) => {
            const rel = compareIso(now.iso, iso);
            const cls = ["trail-item", rel === 0 ? "today" : "", rel < 0 ? "future" : ""].filter(Boolean).join(" ");
            return `
              <div class="${cls}">
                <header>
                  <h4>${escapeHtml(formatLong(iso))}</h4>
                  <span class="when">${rel === 0 ? "today" : rel < 0 ? "upcoming" : "done or passed"}</span>
                </header>
                ${listChecks(PAYDAY, (id) => `m:${k.month}:wed:${iso}:${id}`)}
              </div>
            `;
          }).join("")}
        </div>
      </article>
    </div>
  `;
}

function renderQuarter() {
  const k = keys();
  const q = k.q;
  const cards = [
    {
      id: "debt",
      edge: "amber-edge",
      title: "Debt scoreboard",
      prompt: "Freeze status, what's cleared, what's next. Open GreenLedger — do not type balances in here.",
      items: [
        { id: "freeze", title: "Freeze status checked" },
        { id: "cleared", title: "What's cleared this quarter" },
        { id: "next", title: "What's next on the stack" },
      ],
      links: [link(APPS.green, "GreenLedger")],
    },
    {
      id: "career",
      edge: "blue-edge",
      title: "Career quarter",
      prompt: "Licence/ticket milestone: HR tenure clock, HC booking, courses budget.",
      items: [
        { id: "mile", title: "One licence / ticket step this quarter" },
        { id: "log", title: "Seat-time or study logged" },
      ],
      links: [link(APPS.mc, "MC career tracker")],
    },
    {
      id: "body",
      edge: "",
      title: "Body quarter",
      prompt: "Habits that survived six-day weeks. Cut what didn't.",
      items: [
        { id: "kept", title: "What stuck" },
        { id: "cut", title: "What to cut" },
      ],
      links: [link(APPS.pulse, "PulseBoard")],
    },
    {
      id: "money",
      edge: "mint-edge",
      title: "Money quarter",
      prompt: "Buffer months, OT average, take-home vs plan. Read them in Pay Ledger and GreenLedger.",
      items: [
        { id: "buffer", title: "Buffer vs plan checked" },
        { id: "ot", title: "OT average glanced (Pay Ledger)" },
        { id: "home", title: "Take-home vs plan (GreenLedger)" },
      ],
      links: [link(APPS.pay, "Pay Ledger"), link(APPS.takehome, "BevChain take-home"), link(APPS.green, "GreenLedger")],
    },
    {
      id: "ops",
      edge: "",
      title: "Life ops",
      prompt: "Rego / insurance / medical / DG path dates on the calendar.",
      items: [
        { id: "dates", title: "Dates are on the calendar" },
      ],
      links: [],
    },
  ];

  const ids = cards.flatMap((c) => c.items.map((i) => `q:${k.quarter}:${c.id}-${i.id}`));
  const { done, total } = count(ids);

  els.views.quarter.innerHTML = `
    <div class="hero">
      <div>
        <p class="kicker">Q${q.q} · ${escapeHtml(q.span)}</p>
        <h2>Quarterly cage</h2>
        <p class="now-line">~13 weeks. Scoreboard only — balances live in GreenLedger and Pay Ledger.</p>
      </div>
      ${progressBox(done, total, "quarter")}
    </div>
    <div class="grid grid-2">
      ${cards.map((c) => `
        <article class="card score ${c.edge}">
          <h3>${escapeHtml(c.title)}</h3>
          <p class="prompt">${escapeHtml(c.prompt)}</p>
          ${listChecks(c.items, (id) => `q:${k.quarter}:${c.id}-${id}`)}
          ${noteField(`q:${k.quarter}:${c.id}-note`, "Short note. No dollar figures unless you paste them from the ledger.")}
          ${c.links.length ? `<div class="links">${c.links.join("")}</div>` : ""}
        </article>
      `).join("")}
    </div>
  `;
}

function renderYear() {
  const k = keys();
  const y = k.y;
  const items = [
    { id: "income", title: "Income page checked in Pay Ledger", hint: "Do not copy balances into Life OS." },
    { id: "debt", title: "Debt delta checked in GreenLedger", hint: "What moved this life year." },
    { id: "licence", title: "Licence progress on the MC tracker", hint: "HR → HC → MC against the three-year map." },
    { id: "health", title: "Health / habits glance on PulseBoard", hint: "Pulse is a blank slate until you set it." },
    { id: "pulse", title: "Reset Pulse habits and yearly goals", hint: "Use blank slate / reset heatmaps when you mean it." },
    { id: "ticket", title: "Book next year's big ticket", hint: "Course, medical, or deposit target." },
  ];
  const ids = items.map((i) => `y:${k.year}:${i.id}`);
  const aimed = flagOf(state, `kenworth:${k.year}`);
  const { done, total } = count(ids);

  els.views.year.innerHTML = `
    <div class="hero">
      <div>
        <p class="kicker">${escapeHtml(y.start)}–${escapeHtml(String(y.end))} · Sept → Sept</p>
        <h2>Yearly cage</h2>
        <p class="now-line">One page. Aligns with the MC three-year map.</p>
      </div>
      ${progressBox(done, total, "year")}
    </div>
    <div class="grid grid-2">
      <article class="card">
        <h3>Year page</h3>
        <p class="lede">Income, debt delta, licence, health. Open the app that owns the number.</p>
        ${listChecks(items, (id) => `y:${k.year}:${id}`)}
        <div class="links">
          ${link(APPS.pay, "Pay Ledger")}
          ${link(APPS.green, "GreenLedger")}
          ${link(APPS.mc, "MC career tracker")}
          ${link(APPS.pulse, "PulseBoard")}
          ${link(APPS.pulseReset, "Reset heatmaps")}
          ${link(APPS.pulseBlank, "Blank slate")}
        </div>
      </article>
      <div class="grid">
        <article class="card blue-edge">
          <h3>Still aimed at the Kenworth?</h3>
          <p class="lede">If this drifts, fix the year now — don't wait for a new job story.</p>
          <div class="links" style="margin-top:0">
            <button class="btn ${aimed === true ? "primary" : ""}" type="button" data-kenworth="yes">Yes</button>
            <button class="btn ${aimed === "check" ? "primary" : ""}" type="button" data-kenworth="check">Needs a check</button>
            <button class="btn ${aimed === false ? "danger" : "ghost"}" type="button" data-kenworth="no">Off path</button>
          </div>
          ${noteField(`y:${k.year}:kenworth-note`, "One line on why.")}
        </article>
        <article class="card">
          <h3>Ops team</h3>
          <p class="lede">Who owns what. Chrona routes; the other bots execute.</p>
          <div class="ops">
            <span>Chrona — routes, daily lists, Life OS</span>
            <span>Work — BevChain seat</span>
            <span>Money — Pay Ledger, GreenLedger, payday</span>
            <span>Career Road — HR→HC→MC / Kenworth</span>
            <span>Body — sleep, stretch, smokes, Pulse</span>
            <span>Home Ops — bills, admin, appointments</span>
          </div>
        </article>
      </div>
    </div>
  `;
}

const renderers = {
  today: renderToday,
  week: renderWeek,
  month: renderMonth,
  quarter: renderQuarter,
  year: renderYear,
};

function setView(next, { push = true } = {}) {
  view = VIEWS.includes(next) ? next : "today";
  if (push && location.hash !== `#${view}`) location.hash = view;
  els.tabs.forEach((tab) => {
    tab.setAttribute("aria-selected", tab.dataset.view === view ? "true" : "false");
  });
  VIEWS.forEach((name) => {
    els.views[name].hidden = name !== view;
  });
  renderClock();
  renderers[view]();
}

function refreshNowMarker() {
  renderClock();
  if (view === "today") renderToday();
}

document.addEventListener("click", (e) => {
  const tab = e.target.closest("[data-view]");
  if (tab) {
    setView(tab.dataset.view);
    return;
  }
  const career = e.target.closest("[data-career]");
  if (career) {
    const next = !careerOn();
    setFlag(state, `career:${now.iso}`, next);
    renderToday();
    return;
  }
  const kenworth = e.target.closest("[data-kenworth]");
  if (kenworth) {
    const val = kenworth.dataset.kenworth;
    const mapped = val === "yes" ? true : val === "no" ? false : "check";
    setFlag(state, `kenworth:${keys().year}`, mapped);
    renderYear();
    return;
  }
  const resetBtn = e.target.closest("[data-reset]");
  if (resetBtn) {
    els.resetDlg.returnValue = "cancel";
    els.resetDlg.showModal();
  }
});

document.addEventListener("change", (e) => {
  const box = e.target.closest("[data-check]");
  if (!box) return;
  setCheck(state, box.dataset.check, box.checked);
  const row = box.closest(".check");
  if (row) row.classList.toggle("done", box.checked);
  const root = els.views[view];
  const tw = root.querySelector("[data-this-week]");
  const twN = tw?.querySelector(".tw-n");
  if (twN) {
    const { done, total } = count([...tw.querySelectorAll("[data-check]")].map((el) => el.dataset.check));
    twN.textContent = `${done}/${total}`;
  }
  const n = root.querySelector(".hero .progress-n");
  if (n) {
    const ids = [...root.querySelectorAll("[data-check]")]
      .filter((el) => !el.closest("[data-this-week]"))
      .filter((el) => !el.closest(".check.optional") || careerOn())
      .map((el) => el.dataset.check);
    const { done, total } = count(ids);
    n.textContent = `${done}/${total}`;
  }
});

document.addEventListener("input", (e) => {
  const area = e.target.closest("[data-note]");
  if (!area) return;
  setNote(state, area.dataset.note, area.value);
});

els.resetDlg.addEventListener("close", () => {
  if (els.resetDlg.returnValue !== "confirm") return;
  state = resetChecks();
  setView(view, { push: false });
  toast("Checklists reset");
});

window.addEventListener("hashchange", () => {
  const next = readHash();
  if (next !== view) setView(next, { push: false });
});

setView(view, { push: false });
if (!location.hash) location.hash = view;

setInterval(() => {
  const prev = now.iso;
  const prevMin = now.minutes;
  now = todayInfo();
  els.clock.textContent = formatClock(now);
  if (now.iso !== prev) {
    state = load();
    setView(view, { push: false });
    return;
  }
  if (now.minutes !== prevMin) refreshNowMarker();
}, 15000);
