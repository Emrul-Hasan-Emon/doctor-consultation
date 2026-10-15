"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import type { MedicineImportResult } from "@/lib/types";
import {
  chunk,
  medicineTemplateCsv,
  parseMedicineCsv,
  type ParsedMedicines,
  type RowIssue,
} from "./csv";

const CHUNK_SIZE = 1000;

interface Summary {
  created: number;
  updated: number;
  skipped: number;
  errors: RowIssue[];
  aborted: string | null;
}

function downloadTemplate() {
  const blob = new Blob([medicineTemplateCsv()], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "medicine-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function MedicineImport({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedMedicines | null>(null);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const running = progress !== null && summary === null;

  const onFile = async (file: File | undefined) => {
    setSummary(null);
    setProgress(null);
    setParsed(null);
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    // Let the "Reading" state paint before the synchronous parse.
    await new Promise((r) => setTimeout(r, 0));
    try {
      setParsed(parseMedicineCsv(await file.text()));
    } finally {
      setParsing(false);
    }
  };

  const run = async () => {
    if (!parsed) return;
    const total = parsed.items.length;
    const out: Summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [...parsed.issues],
      aborted: null,
    };
    setProgress({ done: 0, total });
    const items = chunk(parsed.items, CHUNK_SIZE);
    let offset = 0;
    for (const part of items) {
      try {
        const res = await api<MedicineImportResult>("admin/medicine/import", {
          method: "POST",
          body: { items: part },
        });
        out.created += res.created;
        out.updated += res.updated;
        out.skipped += res.skipped;
        for (const e of res.errors) {
          out.errors.push({
            line: parsed.lines[offset + e.index] ?? 0,
            message: e.message,
          });
        }
      } catch (e) {
        out.aborted = `Rows from CSV line ${parsed.lines[offset]} onward were not imported: ${errorMessage(e)}`;
        break;
      }
      offset += part.length;
      setProgress({ done: offset, total });
    }
    out.errors.sort((a, b) => a.line - b.line);
    setSummary(out);
    await qc.invalidateQueries({ queryKey: ["medicines"] });
  };

  const total = parsed?.items.length ?? 0;
  const canImport = !!parsed && parsed.missingColumns.length === 0 && total > 0;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-zinc-600">
        Upload a CSV with a header row. Columns: manufacturer, brandName,
        genericName, strength, dosage, dar, isChronic. Existing medicines are
        updated, new ones are created.{" "}
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-1 text-teal-700 hover:underline"
        >
          <Download className="size-3.5" aria-hidden />
          Download template
        </button>
      </p>

      <label className="flex flex-col gap-1">
        <span className="font-medium text-zinc-700">CSV file</span>
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={running}
          onChange={(e) => onFile(e.target.files?.[0])}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
        />
      </label>
      {parsing && <p className="text-zinc-500">Reading {fileName}...</p>}

      {parsed && parsed.missingColumns.length > 0 && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700"
        >
          Missing required columns: {parsed.missingColumns.join(", ")}.
        </p>
      )}

      {parsed && parsed.missingColumns.length === 0 && !summary && (
        <div className="flex flex-col gap-2">
          <p className="text-zinc-700">
            <strong>{total}</strong> rows ready to import
            {parsed.issues.length > 0 &&
              `, ${parsed.issues.length} rows will be skipped (missing required values)`}
            . Preview of the first {Math.min(10, total)}:
          </p>
          <div className="overflow-x-auto rounded-md border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  {[
                    "Brand",
                    "Generic",
                    "Strength",
                    "Dosage",
                    "Manufacturer",
                    "DAR",
                    "Chronic",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {parsed.items.slice(0, 10).map((m, i) => (
                  <tr key={parsed.lines[i]}>
                    <td className="px-3 py-1.5">{m.brandName}</td>
                    <td className="px-3 py-1.5">{m.genericName}</td>
                    <td className="px-3 py-1.5">{m.strength}</td>
                    <td className="px-3 py-1.5">{m.dosage}</td>
                    <td className="px-3 py-1.5">{m.manufacturer}</td>
                    <td className="px-3 py-1.5">{m.dar}</td>
                    <td className="px-3 py-1.5">
                      {m.isChronic ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {progress && !summary && (
        <div aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full bg-teal-600 transition-all"
              style={{
                width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="mt-1 text-zinc-600">
            Imported {progress.done} of {progress.total}
          </p>
        </div>
      )}

      {summary && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="font-medium text-zinc-900">
            Created {summary.created}, updated {summary.updated}, skipped{" "}
            {summary.skipped}, errors {summary.errors.length}.
          </p>
          {summary.aborted && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700"
            >
              {summary.aborted}
            </p>
          )}
          {summary.errors.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-md border border-zinc-200 p-2 text-xs">
              {summary.errors.map((e, i) => (
                <li key={i} className="py-0.5">
                  <span className="font-medium">Line {e.line}:</span>{" "}
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={running}>
          {summary ? "Close" : "Cancel"}
        </Button>
        {!summary && (
          <Button
            onClick={run}
            disabled={!canImport || parsing}
            loading={running}
          >
            Import {canImport ? `${total} rows` : ""}
          </Button>
        )}
      </div>
    </div>
  );
}
