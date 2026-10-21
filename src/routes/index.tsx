import { createFileRoute, Link } from "@tanstack/react-router";
import { MonitorPlay, Radio, Trophy, Layers, ListChecks, Hourglass } from "lucide-react";
import { SiteHeader } from "@/components/quiz/SiteHeader";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { InstagramIcon } from "@/components/quiz/Brand";
import { SandText } from "@/components/quiz/SandText";
import { useTimerSeconds } from "@/components/quiz/hooks";
import { Button } from "@/components/ui/button";
import { currentQuestion, rankTeams, useQuiz } from "@/quiz/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EGS Quizit! — Live Inter-school Quiz by Espee Global School" },
      { name: "description", content: "Follow the EGS Quizit! inter-school quiz live: current question, standings and stats." },
      { property: "og:title", content: "EGS Quizit! — Live Inter-school Quiz" },
      { property: "og:description", content: "Current question, live standings and stats from Espee Global School's quiz arena." },
    ],
  }),
  component: Index,
});

function Index() {
  const s = useQuiz();
  const q = currentQuestion(s);
  const round = s.rounds.find((r) => r.id === s.activeRound);
  const active = s.teams.find((t) => t.id === s.activeTeamId);
  const leader = rankTeams(s.teams)[0];
  const seconds = useTimerSeconds();
  const drawn = s.questions.filter((x) => x.status === "drawn").length;

  return (
    <div className="min-h-screen bg-stage-glow">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/15 px-3 py-1 text-sm font-semibold text-destructive">
            <Radio className="size-4 animate-pulse" /> Live
          </span>
          {round && (
            <span className="rounded-full glass px-3 py-1 text-sm">
              <b className="text-primary">{round.badge}</b> · {round.name} — {round.category}
            </span>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl glass p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Current question</h2>
              <span className="inline-flex items-center gap-1.5 tabular text-2xl font-bold">
                <Hourglass className="size-5 text-primary" /> {seconds}s
              </span>
            </div>
            {q ? (
              <>
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="tabular rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{q.tag}</span>
                  {active && (
                    <>
                      <span className="size-2.5 rounded-full" style={{ background: active.color }} /> {active.name} answering
                    </>
                  )}
                </div>
                <p key={q.id} className="font-display text-2xl font-semibold leading-snug sm:text-3xl">
                  <SandText text={q.question} plain={!s.settings.sandEffect} />
                </p>
                <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-primary">Answer</p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {s.isAnswerRevealed ? <SandText text={q.answer} plain={!s.settings.sandEffect} /> : <span className="text-muted-foreground">Not revealed yet…</span>}
                  </p>
                </div>
              </>
            ) : (
              <p className="py-12 text-center font-display text-3xl font-bold text-gradient-brand">Next question coming up</p>
            )}
          </section>

          <section className="rounded-3xl glass p-6">
            <h2 className="mb-4 text-sm uppercase tracking-[0.25em] text-muted-foreground">Live standings</h2>
            <Leaderboard />
          </section>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat icon={<Trophy />} label="Leading" value={leader?.name ?? "—"} />
          <Stat icon={<Layers />} label="Round" value={`${s.activeRound} of ${s.rounds.length}`} />
          <Stat icon={<ListChecks />} label="Questions asked" value={`${drawn}`} />
          <Stat icon={<Radio />} label="Scores given" value={`${s.marksHistory.length}`} />
        </div>

        <section className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:flex-row">
          <div>
            <p className="font-display text-2xl font-bold">Follow {s.settings.schoolName}</p>
            <p className="opacity-80">Highlights, results and behind-the-scenes from the quiz arena.</p>
          </div>
          <Button variant="secondary" size="xl" asChild>
            <a href={s.settings.instagram} target="_blank" rel="noreferrer"><InstagramIcon /> @espeeglobal</a>
          </Button>
        </section>

        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link to="/present"><MonitorPlay /> Open presentation stage</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground [&_svg]:size-4 [&_svg]:text-primary">
        {icon} {label}
      </div>
      <p className="mt-1 truncate font-display text-xl font-bold">{value}</p>
    </div>
  );
}
