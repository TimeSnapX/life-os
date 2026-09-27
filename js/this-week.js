/**
 * "This week" card data. Edit this one object each week.
 * - weekKey scopes the must-do ticks: change it and the ticks reset.
 * - takeHome: confirmed payslip figures only. Never put an estimate here.
 */
export const THIS_WEEK = {
  weekKey: "2026-09-26",
  start: "2026-09-26",
  end: "2026-10-02",
  label: "Sat 26 Sep – Fri 2 Oct 2026",

  takeHome: "$949.16 net · BevChain 14–20 Sep (paid Thu 24, payslip confirmed)",
  takeHomePending: "Pending Randstad pay advice",
  // Confirmed amounts only (already paid). Shown under take-home.
  confirmed: ["First Express leave payout: $325.37 (paid 24 Sep)", "Next pay likely Thu 1 Oct: pending payslip"],

  due: [
    {
      id: "superloop",
      title: "Superloop internet",
      amount: "$104",
      status: "Payment failed 25 Sep",
      detail: "$10 late fee goes on the next invoice. They retry Tue 6 Oct and suspend the service if that fails.",
      fix: "Update the expiring card in the Superloop app.",
    },
    {
      id: "racq",
      title: "RACQ insurance",
      amount: "$40.86",
      status: "Payment dishonoured (due 18 Sep)",
      detail: "Fire, Theft & Third Party car policy. Auto-retry Sat 3 Oct. From about Fri 2 Oct (14 days overdue) RACQ can refuse a claim.",
      fix: "Pay early: call {tel} to close the gap, or make sure $40.86 is in the account on Sat 3 Oct.",
      tel: { label: "1800 620 712", href: "tel:1800620712" },
    },
    {
      id: "payday",
      title: "Payday ritual",
      status: "Thu 1 Oct (likely payday) · after work",
      detail: "Pay Ledger + GreenLedger. Randstad paid on a Thursday last week, so the ritual moves to Thursday. Pay RACQ from what's in the account now if you can, since the claim risk starts Fri 2 Oct.",
      links: ["pay", "green"],
    },
  ],

  note: "Telstra $114.93 deferred to Fri 9 Oct. MoneySpot $38.89 already paid 24 Sep. Labour Day Mon 5 Oct: pay for w/e 4 Oct will be at least a day late, so submit that timesheet early.",

  mustDo: [
    { id: "superloop", title: "Update the Superloop card" },
    { id: "racq", title: "Pay RACQ $40.86 before Fri 2 Oct" },
    { id: "randstad", title: "Randstad login so Home Ops can check the timesheet (17–25 Sep)" },
  ],
};
