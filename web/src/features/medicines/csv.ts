/** Pure CSV helpers for the medicine import. No DOM, no React: unit-testable. */

export interface CsvRecord {
  /** 1-based line in the file where the record starts (header is line 1). */
  line: number;
  cells: string[];
}

/**
 * RFC 4180 style parser: quoted fields, "" escapes, commas and newlines inside
 * quotes, CRLF/LF/CR line breaks, optional BOM. Single pass, O(n).
 */
export function parseCsv(text: string): CsvRecord[] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const out: CsvRecord[] = [];
  let cells: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let startLine = 1;
  let touched = false;

  const endField = () => {
    cells.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    out.push({ line: startLine, cells });
    cells = [];
    touched = false;
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else {
        if (c === "\n") line++;
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      touched = true;
    } else if (c === ",") {
      endField();
      touched = true;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      if (touched || field !== "" || cells.length > 0) endRecord();
      line++;
      startLine = line;
    } else {
      field += c;
      touched = true;
    }
  }
  if (touched || field !== "" || cells.length > 0) endRecord();
  return out;
}

export interface MedicineCsvItem {
  manufacturer: string;
  brandName: string;
  genericName: string;
  strength: string | null;
  dosage: string;
  dar: string;
  isChronic: boolean;
}

export const MEDICINE_COLUMNS = [
  "manufacturer",
  "brandName",
  "genericName",
  "strength",
  "dosage",
  "dar",
  "isChronic",
] as const;
type ColumnKey = (typeof MEDICINE_COLUMNS)[number];

const ALIASES: Record<ColumnKey, string[]> = {
  manufacturer: ["manufacturer", "manufacturername", "company", "companyname"],
  brandName: ["brandname", "brand", "name", "medicinename"],
  genericName: ["genericname", "generic"],
  strength: ["strength"],
  dosage: ["dosage", "dosageform", "form"],
  dar: ["dar"],
  isChronic: ["ischronic", "chronic"],
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Maps header cells to column keys, ignoring case, spaces and punctuation. */
export function matchHeaders(
  header: string[],
): Partial<Record<ColumnKey, number>> {
  const map: Partial<Record<ColumnKey, number>> = {};
  header.forEach((h, idx) => {
    const n = norm(h);
    for (const key of MEDICINE_COLUMNS) {
      if (map[key] === undefined && ALIASES[key].includes(n)) {
        map[key] = idx;
        return;
      }
    }
  });
  return map;
}

export const parseBool = (v: string) =>
  ["true", "yes", "y", "1", "chronic"].includes(v.trim().toLowerCase());

export interface RowIssue {
  line: number;
  message: string;
}

export interface ParsedMedicines {
  /** Header columns that were not found among the required ones. */
  missingColumns: ColumnKey[];
  items: MedicineCsvItem[];
  /** CSV line of each entry in `items` (same order). */
  lines: number[];
  /** Rows dropped before upload because required values were missing. */
  issues: RowIssue[];
}

const REQUIRED: ColumnKey[] = [
  "manufacturer",
  "brandName",
  "genericName",
  "dosage",
  "dar",
];

export function parseMedicineCsv(text: string): ParsedMedicines {
  const records = parseCsv(text);
  const result: ParsedMedicines = {
    missingColumns: [],
    items: [],
    lines: [],
    issues: [],
  };
  if (records.length === 0) {
    result.missingColumns = [...REQUIRED];
    return result;
  }
  const cols = matchHeaders(records[0].cells);
  result.missingColumns = REQUIRED.filter((k) => cols[k] === undefined);
  if (result.missingColumns.length > 0) return result;

  const get = (cells: string[], key: ColumnKey) => {
    const idx = cols[key];
    return idx === undefined ? "" : (cells[idx] ?? "").trim();
  };

  for (let r = 1; r < records.length; r++) {
    const { line, cells } = records[r];
    if (cells.every((c) => c.trim() === "")) continue;
    const item: MedicineCsvItem = {
      manufacturer: get(cells, "manufacturer"),
      brandName: get(cells, "brandName"),
      genericName: get(cells, "genericName"),
      strength: get(cells, "strength") || null,
      dosage: get(cells, "dosage"),
      dar: get(cells, "dar"),
      isChronic: parseBool(get(cells, "isChronic")),
    };
    const missing = REQUIRED.filter((k) => item[k] === "");
    if (missing.length > 0) {
      result.issues.push({
        line,
        message: `Missing required value: ${missing.join(", ")}`,
      });
      continue;
    }
    result.items.push(item);
    result.lines.push(line);
  }
  return result;
}

const quote = (v: string) =>
  /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function medicineTemplateCsv(): string {
  const rows = [
    [...MEDICINE_COLUMNS],
    [
      "Square Pharmaceuticals",
      "Napa",
      "Paracetamol",
      "500 mg",
      "Tablet",
      "Oral",
      "false",
    ],
    [
      "Beximco Pharma",
      "Amlodin",
      "Amlodipine",
      "5 mg",
      "Tablet",
      "Oral",
      "true",
    ],
  ];
  return rows.map((r) => r.map(quote).join(",")).join("\r\n") + "\r\n";
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
