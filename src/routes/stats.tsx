import { createFileRoute } from "@tanstack/react-router";
import { Download, Crown } from "lucide-react";
import { SiteHeader } from "@/components/quiz/SiteHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rankTeams, useQuiz } from "@/quiz/store";
import { download, resultsToCsv } from "@/quiz/csv";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Stats & Results — EGS Quizit!" },
      { name: "description", content: "Podium, round-by-round scores and full scoring history of the EGS Quizit! quiz." },
      { property: "og:title", content: "Stats & Results — EGS Quizit!" },
      { property: "og:description", content: "Podium and round-by-round scores from the EGS Quizit! arena." },
    ],
  }),
  component: Stats,
});

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function Stats() {
  const s = useQuiz();
  const ranked = rankTeams(s.teams);
  const podium = [ranked[1], ranked[0], ranked[2]].filter((t): t is NonNullable<typeof t> => !!t);
  return (
    <div className="min-h-screen bg-stage-glow">
      <SiteHeader />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Stats & results</h1>
          <Button variant="outline" onClick={() => download("egs-quizit-results.csv", resultsToCsv(s))}>
            <Download /> Export CSV
          </Button>
        </div>

        <section className="grid grid-cols-3 items-end gap-4">
          {podium.map((t) => {
            const place = ranked.indexOf(t) + 1;
            return (
              <div key={t.id} className="text-center">
                <p className="font-display text-lg font-semibold">{t.name}</p>
                <p className="mb-2 text-sm text-muted-foreground">{t.school}</p>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center rounded-t-2xl border-t-4",
                    place === 1 ? "h-44 bg-primary text-primary-foreground" : place === 2 ? "h-32 bg-secondary" : "h-24 bg-muted",
                  )}
                  style={{ borderColor: t.color }}
                >
                  {place === 1 && <Crown className="size-7" />}
                  <span className="tabular text-4xl font-bold">{t.totalScore}</span>
                  <span className="text-sm opacity-80">#{place}</span>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl glass p-4">
          <h2 className="mb-3 px-2 text-lg font-bold">Round by round</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Team</TableHead>
                {s.rounds.map((r) => <TableHead key={r.id} className="text-right">{r.badge}</TableHead>)}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((t, i) => (
                <TableRow key={t.id}>
                  <TableCell className="tabular">{i + 1}</TableCell>
                  <TableCell>
                    <span className="mr-2 inline-block size-2.5 rounded-full" style={{ background: t.color }} />
                    {t.name}
                  </TableCell>
                  {s.rounds.map((r, ri) => <TableCell key={r.id} className="text-right tabular">{t.scoresByRound[ri] ?? 0}</TableCell>)}
                  <TableCell className="text-right tabular font-bold text-primary">{t.totalScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl glass p-4">
            <h2 className="mb-3 px-2 text-lg font-bold">Scoring history</h2>
            {s.marksHistory.length === 0 ? <p className="px-2 text-muted-foreground">No scores yet.</p> : (
              <ul className="max-h-96 space-y-1 overflow-auto">
                {s.marksHistory.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm odd:bg-muted/40">
                    <span className="tabular text-muted-foreground">{time(m.timestamp)}</span>
                    <span className="flex-1 truncate">{m.teamName} · <span className="text-muted-foreground">{m.reason}</span></span>
                    <span className="tabular text-muted-foreground">{m.questionTag}</span>
                    <span className={cn("tabular w-12 text-right font-bold", m.pointsDelta > 0 ? "text-success" : m.pointsDelta < 0 ? "text-destructive" : "")}>
                      {m.pointsDelta > 0 ? "+" : ""}{m.pointsDelta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-3xl glass p-4">
            <h2 className="mb-3 px-2 text-lg font-bold">Questions asked</h2>
            {s.drawHistory.length === 0 ? <p className="px-2 text-muted-foreground">No questions asked yet.</p> : (
              <ul className="max-h-96 space-y-1 overflow-auto">
                {s.drawHistory.map((d, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm odd:bg-muted/40">
                    <span className="tabular text-muted-foreground">{time(d.timestamp)}</span>
                    <span className="tabular font-semibold">{d.questionTag}</span>
                    <span className="flex-1 truncate">{d.teamName}</span>
                    <span className="text-xs text-muted-foreground">{d.method === "physical_chit" ? "Chit" : "Random"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
