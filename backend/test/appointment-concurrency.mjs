#!/usr/bin/env node
/**
 * Concurrency check for the booking engine (not part of jest).
 *
 * Leaves exactly one free slot in a turn, then fires N parallel booking
 * requests (distinct patients) at it. Exactly one must answer 201; all others
 * must answer 409. Requires a running server and a turn with no live
 * appointments on the date.
 *
 *   BASE=http://localhost:3014 DOCTOR_ID=1 CHAMBER_ID=1 TURN_ID=12 \
 *   DATE=2026-10-09 PATIENT_IDS=1,2,3,4,5,6,7,8,9,10,11 \
 *   node test/appointment-concurrency.mjs
 *
 * PATIENT_IDS: the first (capacity - 1) fill the turn, the rest race.
 * Optional: ADMIN_LOGIN (default 01700000000), ADMIN_PASSWORD, RACERS_EXTRA_DUP=1
 * adds a duplicate request for the first racer.
 */
const BASE = process.env.BASE ?? 'http://localhost:3001';
const need = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
};
const doctorId = Number(need('DOCTOR_ID'));
const chamberId = Number(need('CHAMBER_ID'));
const turnId = Number(need('TURN_ID'));
const date = need('DATE');
const patientIds = need('PATIENT_IDS').split(',').map(Number);

async function call(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

const login = await call('POST', '/api/auth/admin/login', null, {
  identifier: process.env.ADMIN_LOGIN ?? '01700000000',
  password: process.env.ADMIN_PASSWORD ?? 'ChangeMe123!',
});
if (login.status !== 200) throw new Error(`Login failed: ${login.status}`);
const token = login.body.accessToken;

const book = (patientId) =>
  call('POST', '/api/admin/appointment', token, {
    patientId,
    doctorId,
    chamberId,
    turnId,
    date,
  });

const slots = await call(
  'GET',
  `/api/admin/appointment/slots?turnId=${turnId}&date=${date}`,
  token,
);
const capacity = slots.body.slots.length;
if (slots.body.slots.some((s) => s.status === 'BOOKED')) {
  throw new Error('Turn already has live appointments; use a clean turn/date');
}
if (patientIds.length < capacity + 1) {
  throw new Error(`Need at least ${capacity + 1} patient ids`);
}

for (const id of patientIds.slice(0, capacity - 1)) {
  const r = await book(id);
  if (r.status !== 201) throw new Error(`Prefill failed: ${r.status}`);
}
const racers = patientIds.slice(capacity - 1);
if (process.env.RACERS_EXTRA_DUP) racers.push(racers[0]);
console.log(`capacity ${capacity}, 1 free slot, ${racers.length} parallel requests`);

const results = await Promise.all(racers.map(book));
const tally = {};
for (const r of results) {
  const key = `${r.status} ${r.body?.message ?? `slot ${r.body?.slotNumber}`}`;
  tally[key] = (tally[key] ?? 0) + 1;
}
console.table(tally);

const after = await call(
  'GET',
  `/api/admin/appointment/slots?turnId=${turnId}&date=${date}`,
  token,
);
const booked = after.body.slots.filter((s) => s.status === 'BOOKED').length;
const created = results.filter((r) => r.status === 201).length;
const others = results.filter((r) => r.status !== 201 && r.status !== 409);
const ok = created === 1 && others.length === 0 && booked === capacity;
console.log(`created=${created} booked=${booked}/${capacity} unexpected=${others.length}`);
console.log(ok ? 'PASS: exactly one request won the last slot' : 'FAIL');
process.exit(ok ? 0 : 1);
