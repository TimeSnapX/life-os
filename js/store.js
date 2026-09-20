const KEY = "life-os-v1";

function empty() {
  return { v: 1, checks: {}, notes: {}, flags: {} };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) return empty();
    return {
      v: 1,
      checks: data.checks && typeof data.checks === "object" ? data.checks : {},
      notes: data.notes && typeof data.notes === "object" ? data.notes : {},
      flags: data.flags && typeof data.flags === "object" ? data.flags : {},
    };
  } catch {
    return empty();
  }
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify({
    v: 1,
    checks: state.checks,
    notes: state.notes,
    flags: state.flags,
  }));
}

export function resetChecks() {
  localStorage.removeItem(KEY);
  return empty();
}

export function isOn(state, id) {
  return Boolean(state.checks[id]);
}

export function setCheck(state, id, value) {
  if (value) state.checks[id] = true;
  else delete state.checks[id];
  save(state);
}

export function noteOf(state, id) {
  return state.notes[id] || "";
}

export function setNote(state, id, value) {
  const next = String(value ?? "");
  if (next) state.notes[id] = next;
  else delete state.notes[id];
  save(state);
}

export function flagOf(state, id) {
  return state.flags[id];
}

export function setFlag(state, id, value) {
  if (value === undefined || value === null || value === false) delete state.flags[id];
  else state.flags[id] = value;
  save(state);
}
