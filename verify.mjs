import {
  activeCageId,
  firstSunday,
  formatLong,
  isoWeekKey,
  lifeQuarter,
  lifeYear,
  weekDates,
  wednesdaysInMonth,
} from "./js/dates.js";
import { THIS_WEEK } from "./js/this-week.js";

const fails = [];
function eq(name, got, want) {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) fails.push(`${name}: got ${a}, want ${b}`);
}

eq("first Sunday Sep 2026", firstSunday(2026, 9), "2026-09-06");
eq("Wednesdays Sep 2026", wednesdaysInMonth(2026, 9), [
  "2026-09-02",
  "2026-09-09",
  "2026-09-16",
  "2026-09-23",
  "2026-09-30",
]);
eq("week key Sun 20 Sep 2026", isoWeekKey(2026, 9, 20), "2026-W38");
eq("week Mon", weekDates(2026, 9, 20)[0].iso, "2026-09-14");
eq("week Sun", weekDates(2026, 9, 20)[6].iso, "2026-09-20");
eq("life year Sep", lifeYear(2026, 9).key, "2026-2027");
eq("life year Aug", lifeYear(2026, 8).key, "2025-2026");
eq("Q1 Sep", lifeQuarter(2026, 9).q, 1);
eq("Q2 Dec", lifeQuarter(2026, 12).q, 2);
eq("Q3 Mar", lifeQuarter(2026, 3).q, 3);
eq("Q4 Jun", lifeQuarter(2026, 6).q, 4);
eq("formatLong", formatLong("2026-09-20"), "Sunday 20 Sep 2026");
eq("cage 4:05", activeCageId(4 * 60 + 5, false), "up");
eq("cage 6:00", activeCageId(6 * 60, false), "shift");
eq("cage 15:00", activeCageId(15 * 60, false), "finish");
eq("cage 17:30", activeCageId(17 * 60 + 30, false), "admin");
eq("cage 19:00", activeCageId(19 * 60, false), "body");
eq("cage 20:40 career off", activeCageId(20 * 60 + 40, false), "wind");
eq("cage 20:40 career on", activeCageId(20 * 60 + 40, true), "career");
eq("cage 3:00", activeCageId(3 * 60, false), "wind");

eq("this week starts Sat", formatLong(THIS_WEEK.start), "Saturday 26 Sep 2026");
eq("this week ends Fri", formatLong(THIS_WEEK.end), "Friday 2 Oct 2026");
eq("this week take-home confirmed", THIS_WEEK.takeHome.startsWith("$949.16"), true);
eq("this week must-dos", THIS_WEEK.mustDo.length, 3);
eq("this week due items", THIS_WEEK.due.length, 3);
eq("this week confirmed", THIS_WEEK.confirmed, ["First Express leave payout: $325.37 (paid 24 Sep)", "Next pay likely Thu 1 Oct: pending payslip"]);
eq("RACQ tel", THIS_WEEK.due.find((d) => d.id === "racq").tel.href, "tel:1800620712");

if (fails.length) {
  console.error(fails.join("\n"));
  process.exit(1);
}
console.log("dates ok");
