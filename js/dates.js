/** Brisbane calendar + clock. No DST in Queensland. */

export const TZ = "Australia/Brisbane";
export const TZ_LABEL = "AEST";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function isoDate(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseIso(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

export function weekdayIndex(y, m, d) {
  return utcDate(y, m, d).getUTCDay();
}

export function zonedParts(date = new Date()) {
  const bag = {};
  for (const part of new Intl.DateTimeFormat("en-AU", {
    timeZone: TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday: bag.weekday,
  };
}

export function todayInfo(date = new Date()) {
  const p = zonedParts(date);
  const weekday = weekdayIndex(p.year, p.month, p.day);
  return {
    ...p,
    weekday,
    weekdayShort: WEEKDAYS[weekday],
    weekdayLong: WEEKDAYS_LONG[weekday],
    iso: isoDate(p.year, p.month, p.day),
    minutes: p.hour * 60 + p.minute,
    clock: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

export function formatClock(info) {
  return `${info.clock} ${TZ_LABEL}`;
}

export function formatLong(iso) {
  const { y, m, d } = parseIso(iso);
  const wd = weekdayIndex(y, m, d);
  return `${WEEKDAYS_LONG[wd]} ${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

export function formatShort(iso) {
  const { y, m, d } = parseIso(iso);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

export function formatMonth(y, m) {
  return `${MONTHS_SHORT[m - 1]} ${y}`;
}

/** Monday-start week containing the Brisbane calendar date. */
export function weekDates(y, m, d) {
  const date = utcDate(y, m, d);
  const day = date.getUTCDay() || 7;
  const monday = utcDate(y, m, d);
  monday.setUTCDate(date.getUTCDate() - (day - 1));
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const x = new Date(monday);
    x.setUTCDate(monday.getUTCDate() + i);
    const yy = x.getUTCFullYear();
    const mm = x.getUTCMonth() + 1;
    const dd = x.getUTCDate();
    days.push({
      year: yy,
      month: mm,
      day: dd,
      iso: isoDate(yy, mm, dd),
      weekday: x.getUTCDay(),
      weekdayShort: WEEKDAYS[x.getUTCDay()],
      weekdayLong: WEEKDAYS_LONG[x.getUTCDay()],
    });
  }
  return days;
}

export function isoWeekKey(y, m, d) {
  const date = utcDate(y, m, d);
  const day = date.getUTCDay() || 7;
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + 4 - day);
  const isoYear = thursday.getUTCFullYear();
  const yearStart = utcDate(isoYear, 1, 1);
  const week = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
  return `${isoYear}-W${pad(week)}`;
}

export function daysInMonth(y, m) {
  return utcDate(y, m + 1, 0).getUTCDate();
}

export function wednesdaysInMonth(y, m) {
  const out = [];
  const last = daysInMonth(y, m);
  for (let d = 1; d <= last; d += 1) {
    if (weekdayIndex(y, m, d) === 3) out.push(isoDate(y, m, d));
  }
  return out;
}

export function firstSunday(y, m) {
  const last = daysInMonth(y, m);
  for (let d = 1; d <= last; d += 1) {
    if (weekdayIndex(y, m, d) === 0) return isoDate(y, m, d);
  }
  return isoDate(y, m, 1);
}

/** Life year runs Sept → Sept. */
export function lifeYear(y, m) {
  if (m >= 9) return { start: y, end: y + 1, key: `${y}-${y + 1}` };
  return { start: y - 1, end: y, key: `${y - 1}-${y}` };
}

/** Q1 Sep–Nov, Q2 Dec–Feb, Q3 Mar–May, Q4 Jun–Aug. */
export function lifeQuarter(y, m) {
  const year = lifeYear(y, m);
  let q;
  let span;
  if (m >= 9 && m <= 11) {
    q = 1;
    span = `Sep–Nov ${year.start}`;
  } else if (m === 12) {
    q = 2;
    span = `Dec ${year.start} – Feb ${year.end}`;
  } else if (m <= 2) {
    q = 2;
    span = `Dec ${year.start} – Feb ${year.end}`;
  } else if (m <= 5) {
    q = 3;
    span = `Mar–May ${year.end}`;
  } else {
    q = 4;
    span = `Jun–Aug ${year.end}`;
  }
  return { q, span, year, key: `${year.key}-Q${q}` };
}

/**
 * Daily cage clock. Career only wins the "now" slot when the toggle is on.
 * Times in minutes from midnight (Brisbane).
 */
export function activeCageId(minutes, careerOn) {
  if (minutes < 4 * 60) return "wind";
  if (minutes < 4 * 60 + 10) return "up";
  if (minutes < 5 * 60) return "prep";
  if (minutes < 14 * 60) return "shift";
  if (minutes < 17 * 60) return "finish";
  if (minutes < 18 * 60 + 30) return "admin";
  if (minutes < 20 * 60 + 30) return "body";
  if (careerOn && minutes < 21 * 60) return "career";
  if (minutes < 21 * 60 + 30) return "wind";
  return "wind";
}

export function compareIso(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
