/** Escape a CSV cell (RFC 4180-ish) */
export function csvCell(value: unknown): string {
  if (value == null) return "";
  const str =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<unknown>>
): string {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  // BOM helps Excel open UTF-8 correctly
  return `\uFEFF${lines.join("\r\n")}`;
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
