import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Eye, EyeOff, Shuffle, ArrowRight, Pause, Play, RotateCcw, Plus, Minus, Zap, MonitorPlay } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/quiz/SiteHeader";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { useTimerSeconds } from "@/components/quiz/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions, currentQuestion, useQuiz } from "@/quiz/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Operator Desk — EGS Quizit!" },
      { name: "description", content: "Quizmaster controls for EGS Quizit!: draw questions, run the timer and award points." },
      { property: "og:title", content: "Operator Desk — EGS Quizit!" },
      { property: "og:description", content: "Quizmaster controls for the EGS Quizit! arena." },
    ],
  }),
  component: Operator,
});

function Operator() {
  const s = useQuiz();
  const q = currentQuestion(s);
  const seconds = useTimerSeconds();
  const [chit, setChit] = useState("");
  const [adj, setAdj] = useState({ team: "", pts: "", reason: "" });
  const safe = (fn: () => void) => { try { fn(); } catch (e) { toast.error((e as Error).message); } };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl glass p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={String(s.activeRound)} onValueChange={(v) => actions.selectRound(Number(v))}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {s.rounds.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.badge} · {r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (actions.revealTag(chit)) setChit(""); else toast.error("Chit not found"); }}>
                <Input value={chit} onChange={(e) => setChit(e.target.value.toUpperCase())} placeholder="Chit e.g. R1-004" className="w-40 tabular" />
                <Button type="submit" variant="outline">Open</Button>
              </form>
              <Button variant="hero" onClick={actions.draw}><Shuffle /> Draw random</Button>
              <Button variant="ghost" asChild className="ml-auto"><Link to="/present"><MonitorPlay /> Stage</Link></Button>
            </div>
            <div className="mt-5 min-h-32 rounded-2xl bg-muted/50 p-5">
              {q ? (
                <>
                  <p className="tabular text-sm text-muted-foreground">{q.tag} · {s.questions.filter((x) => x.round === s.activeRound && x.status === "available").length} left in round</p>
                  <p className="mt-2 font-display text-xl font-semibold">{q.question}</p>
                  <p className="mt-3 text-primary"><b>Answer:</b> {q.answer}</p>
                </>
              ) : <p className="text-muted-foreground">No question on stage.</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={actions.toggleAnswer} disabled={!q}>{s.isAnswerRevealed ? <><EyeOff /> Hide answer</> : <><Eye /> Reveal answer</>}</Button>
              <Button variant="ghost" onClick={actions.clearStage} disabled={!q}>Clear stage</Button>
            </div>
          </section>

          <section className="rounded-3xl glass p-5">
            <h2 className="mb-3 font-bold">Timer</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("tabular w-24 text-5xl font-bold", seconds <= s.rules.warningTimerThreshold && "text-destructive")}>{seconds}</span>
              {s.timer.running ? <Button onClick={actions.pauseTimer}><Pause /> Pause</Button> : <Button onClick={actions.startTimer}><Play /> Start</Button>}
              <Button variant="outline" size="icon" onClick={() => actions.adjustTimer(5)} aria-label="Add 5 seconds"><Plus /></Button>
              <Button variant="outline" size="icon" onClick={() => actions.adjustTimer(-5)} aria-label="Remove 5 seconds"><Minus /></Button>
              <Button variant="ghost" onClick={actions.resetTimer}><RotateCcw /> Reset</Button>
            </div>
          </section>

          <section className="rounded-3xl glass p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Scoring</h2>
              <Button variant="outline" size="sm" onClick={actions.nextTeam}><ArrowRight /> Next team</Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {s.teams.map((t) => {
                const active = t.id === s.activeTeamId;
                return (
                  <div key={t.id} className={cn("rounded-xl border bg-card p-3", active && "shadow-glow")}>
                    <button className="flex w-full items-center gap-2 text-left" onClick={() => actions.selectTeam(t.id)}>
                      <span className="size-3 rounded-full" style={{ background: t.color }} />
                      <span className="flex-1 truncate font-semibold">{t.name}</span>
                      <span className="tabular font-bold">{t.totalScore}</span>
                    </button>
                    <div className="mt-2 flex gap-1.5">
                      {active ? (
                        <>
                          <Button size="sm" variant="success" disabled={s.hasBeenScored} onClick={() => safe(() => actions.award(t.id, "correct"))}><Check /> +{s.rules.correctPoints}</Button>
                          <Button size="sm" variant="destructive" disabled={s.hasBeenScored} onClick={() => safe(() => actions.award(t.id, "wrong"))}><X /> {s.rules.wrongPoints}</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant={t.hasPounced ? "default" : "outline"} onClick={() => safe(() => actions.pounce(t.id))}><Zap /> Pounce</Button>
                          {t.hasPounced && (
                            <>
                              <Button size="sm" variant="success" onClick={() => actions.awardPounce(t.id, true)}>+{s.rules.pounceCorrectPoints}</Button>
                              <Button size="sm" variant="destructive" onClick={() => actions.awardPounce(t.id, false)}>{s.rules.pounceIncorrectPoints}</Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              className="mt-4 flex flex-wrap gap-2 border-t pt-4"
              onSubmit={(e) => { e.preventDefault(); actions.adjust(adj.team, Number(adj.pts), adj.reason); setAdj({ team: "", pts: "", reason: "" }); toast.success("Score corrected"); }}
            >
              <Select value={adj.team} onValueChange={(v) => setAdj({ ...adj, team: v })}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Correct a score" /></SelectTrigger>
                <SelectContent>{s.teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="number" placeholder="± pts" value={adj.pts} onChange={(e) => setAdj({ ...adj, pts: e.target.value })} className="w-24" />
              <Input placeholder="Reason" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} className="flex-1" />
              <Button type="submit" variant="outline" disabled={!adj.team || !Number(adj.pts)}>Apply</Button>
            </form>
          </section>
        </div>
        <aside className="rounded-3xl glass p-5">
          <h2 className="mb-3 font-bold">Standings</h2>
          <Leaderboard />
        </aside>
      </main>
    </div>
  );
}
