// Run with: node --experimental-strip-types --test src/features/medicines/csv.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error node needs the .ts extension, tsconfig forbids it
import { parseCsv, parseMedicineCsv } from "./csv.ts";

test("parses quotes, commas, escaped quotes and embedded newlines", () => {
  const rows = parseCsv('a,"b,c","d ""e"""\r\n"x\ny",2,3\n');
  assert.deepEqual(rows[0].cells, ["a", "b,c", 'd "e"']);
  assert.deepEqual(rows[1].cells, ["x\ny", "2", "3"]);
  assert.equal(rows[1].line, 2);
});

test("maps tolerant headers and reports line numbers", () => {
  const csv =
    "﻿Brand Name,Generic,Manufacturer,Dosage Form,DAR,Strength,Chronic\n" +
    "Napa,Paracetamol,Square,Tablet,Oral,500 mg,no\n" +
    ",,,,,,\n" +
    "Bad,,Square,Tablet,Oral,,\n" +
    "Amlodin,Amlodipine,Beximco,Tablet,Oral,5 mg,Yes\n";
  const r = parseMedicineCsv(csv);
  assert.deepEqual(r.missingColumns, []);
  assert.equal(r.items.length, 2);
  assert.deepEqual(r.lines, [2, 5]);
  assert.equal(r.items[1].isChronic, true);
  assert.equal(r.issues[0].line, 4);
});

test("reports missing columns", () => {
  assert.deepEqual(parseMedicineCsv("brandName\nx").missingColumns.length, 4);
});
