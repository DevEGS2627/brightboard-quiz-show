import type { Question, QuizState } from "./store";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

export function csvToQuestions(text: string): Question[] {
  const [header = [], ...rows] = parseCsv(text);
  const idx = (n: string) => header.findIndex((h) => h.trim().toLowerCase() === n);
  const [t, r, qu, a, s, m] = ["tag", "round", "question", "answer", "source", "media_url"].map(idx) as [number, number, number, number, number, number];
  return rows
    .filter((row) => row[qu]?.trim())
    .map((row, i) => ({
      id: `q-imp-${Date.now()}-${i}`,
      tag: row[t]?.trim() || `R${row[r]}-${i + 1}`,
      round: Number(row[r]) || 1,
      question: (row[qu] ?? "").trim(),
      answer: row[a]?.trim() ?? "",
      source: row[s]?.trim() ?? "",
      status: "available" as const,
      mediaType: row[m]?.trim() ? "image" : null,
      mediaUrl: row[m]?.trim() || null,
    }));
}

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export function questionsToCsv(qs: Question[]) {
  return ["Tag,Round,Question,Answer,Source,Media_URL", ...qs.map((q) => [q.tag, q.round, q.question, q.answer, q.source, q.mediaUrl].map(esc).join(","))].join("\n");
}

export function resultsToCsv(s: QuizState) {
  const head = ["Rank", "Team", "School", ...s.rounds.map((r) => r.badge), "Total"];
  const ranked = [...s.teams].sort((a, b) => b.totalScore - a.totalScore);
  return [head.join(","), ...ranked.map((t, i) => [i + 1, t.name, t.school, ...s.rounds.map((_, ri) => t.scoresByRound[ri] ?? 0), t.totalScore].map(esc).join(","))].join("\n");
}

export function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
