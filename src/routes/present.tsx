import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Check, X, Eye, Shuffle, ArrowRight, Pause, Play, MoreVertical, Maximize, Hash, Zap, RotateCcw,
  Gamepad2, Settings2, Home, Plus, Minus, Hourglass, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SandText } from "@/components/quiz/SandText";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { BrandMark, InstaLink } from "@/components/quiz/Brand";
import { useTimerSeconds } from "@/components/quiz/hooks";
import { actions, currentQuestion, useQuiz } from "@/quiz/store";
import { audioService } from "@/quiz/audio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/present")({
  head: () => ({
    meta: [
      { title: "Presentation Stage — EGS Quizit!" },
      { name: "description", content: "Projector view of the EGS Quizit! live quiz: question, timer and standings." },
      { property: "og:title", content: "Presentation Stage — EGS Quizit!" },
      { property: "og:description", content: "Projector view of the EGS Quizit! live quiz." },
    ],
  }),
  component: Present,
});

function questionSize(len: number) {
  if (len < 70) return "text-[clamp(2.2rem,4.6vw,6rem)]";
  if (len < 140) return "text-[clamp(2rem,3.6vw,4.8rem)]";
  if (len < 220) return "text-[clamp(1.7rem,2.9vw,3.8rem)]";
  return "text-[clamp(1.4rem,2.3vw,3rem)]";
}

function Present() {
  const s = useQuiz();
  const q = currentQuestion(s);
  const round = s.rounds.find((r) => r.id === (q?.round ?? s.activeRound));
  const activeTeam = s.teams.find((t) => t.id === s.activeTeamId);
  const seconds = useTimerSeconds();
  const { questionDelay, answerDelay, sandEffect } = s.settings;

  // Question phase: intro card -> question
  const [phase, setPhase] = useState<"idle" | "intro" | "question">("idle");
  useEffect(() => {
    if (!q) return setPhase("idle");
    setPhase("intro");
    const t = setTimeout(() => setPhase("question"), questionDelay * 1000);
    return () => clearTimeout(t);
  }, [q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Answer phase: suspense -> shown
  const [ans, setAns] = useState<"hidden" | "suspense" | "shown">("hidden");
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!s.isAnswerRevealed) return setAns("hidden");
    setAns("suspense");
    const total = Math.max(0, Math.round(answerDelay));
    setCount(total);
    if (total === 0) return setAns("shown");
    let n = total;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setAns("shown");
      } else setCount(n);
    }, 1000);
    return () => clearInterval(id);
  }, [s.isAnswerRevealed, q?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sounds
  const sound = s.rules.soundEnabled;
  const prevSec = useRef(seconds);
  useEffect(() => {
    if (sound && s.timer.running && seconds !== prevSec.current) {
      if (seconds === 0) audioService.playTimeUpBuzzer();
      else if (seconds <= s.rules.warningTimerThreshold) audioService.playUrgentTick();
    }
    prevSec.current = seconds;
  }, [seconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const [pop, setPop] = useState<typeof s.lastScore>(null);
  const lastAt = useRef(s.lastScore?.at);
  useEffect(() => {
    if (!s.lastScore || s.lastScore.at === lastAt.current) return;
    lastAt.current = s.lastScore.at;
    setPop(s.lastScore);
    if (sound) (s.lastScore.delta > 0 ? audioService.playCorrect() : audioService.playWrong());
    const t = setTimeout(() => setPop(null), 2600);
    return () => clearTimeout(t);
  }, [s.lastScore?.at]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "intro" && sound) audioService.playDrawSelected();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const popTeam = pop ? s.teams.find((t) => t.id === pop.teamId) : null;
  const urgent = s.timer.running && seconds <= s.rules.warningTimerThreshold;

  return (
    <div className="bg-stage-glow relative flex h-dvh w-full flex-col overflow-hidden text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-6 px-[2.5vw] pt-[2vh]">
        <BrandMark size="lg" />
        {round && (
          <div className="flex items-center gap-3 rounded-full glass px-5 py-2">
            <span className="rounded-full bg-primary px-3 py-1 font-display text-sm font-bold text-primary-foreground">{round.badge}</span>
            <span className="font-display text-lg font-semibold">{round.name}</span>
            <span className="hidden text-muted-foreground lg:inline">· {round.category}</span>
          </div>
        )}
        <div
          className={cn(
            "flex min-w-[9rem] items-center justify-center gap-2 rounded-2xl px-5 py-2 tabular text-5xl font-bold transition-colors",
            urgent ? "urgent-pulse bg-destructive text-destructive-foreground" : seconds === 0 ? "bg-destructive/20 text-destructive" : "glass",
          )}
          aria-label="Time left"
        >
          <Hourglass className={cn("size-7", s.timer.running && "hourglass-spin")} />
          {seconds}
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[1fr_minmax(20rem,30%)] gap-[2vw] px-[2.5vw] py-[2.5vh]">
        {/* Stage */}
        <section className="relative flex min-h-0 flex-col rounded-3xl glass p-[3vw]">
          {activeTeam && q && (
            <div className="mb-4 flex items-center gap-3">
              <span className="size-4 rounded-full" style={{ background: activeTeam.color }} />
              <span className="font-display text-2xl font-semibold">{activeTeam.name}</span>
              <span className="text-xl text-muted-foreground">to answer</span>
              <span className="ml-auto tabular text-xl text-muted-foreground">{q.tag}</span>
            </div>
          )}

          <div className="flex min-h-0 flex-1 items-center overflow-hidden">
            {phase === "idle" && (
              <div className="w-full text-center">
                <p className="font-display text-[clamp(2rem,4vw,5rem)] font-bold text-gradient-brand">Get ready!</p>
                <p className="mt-4 text-2xl text-muted-foreground">Next question coming up</p>
              </div>
            )}
            {phase === "intro" && q && (
              <div key={q.id} className="w-full text-center animate-in fade-in zoom-in-95 duration-500">
                <p className="text-2xl uppercase tracking-[0.3em] text-muted-foreground">Question</p>
                <p className="mt-3 font-display text-[clamp(4rem,10vw,12rem)] font-bold leading-none text-gradient-brand">{q.tag}</p>
                <Hourglass className="mx-auto mt-8 size-12 text-sand hourglass-spin" />
              </div>
            )}
            {phase === "question" && q && (
              <p key={q.id} className={cn("w-full font-display font-semibold leading-[1.15]", questionSize(q.question.length + (ans !== "hidden" ? 110 : 0)), "transition-[font-size] duration-700")}>
                <SandText text={q.question} plain={!sandEffect} duration={1.4} />
              </p>
            )}
          </div>

          {/* Answer */}
          {phase === "question" && ans !== "hidden" && q && (
            <div className="mt-6 rounded-2xl border-2 border-primary/60 bg-primary/10 px-8 py-5">
              <p className="text-lg uppercase tracking-[0.25em] text-primary">Answer</p>
              {ans === "suspense" ? (
                <p key={count} className="font-display text-[clamp(2rem,4vw,4.5rem)] font-bold text-sand animate-in zoom-in-50 fade-in duration-300">
                  {count}…
                </p>
              ) : (
                <p className="font-display text-[clamp(2rem,4vw,4.5rem)] font-bold leading-tight">
                  <SandText text={q.answer} plain={!sandEffect} duration={0.9} />
                </p>
              )}
            </div>
          )}

          {pop && popTeam && (
            <div key={pop.at} className="score-pop pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className={cn(
                  "rounded-3xl px-14 py-8 text-center shadow-2xl",
                  pop.delta > 0 ? "bg-success text-success-foreground" : pop.delta < 0 ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground",
                )}
              >
                <p className="font-display text-[clamp(3rem,7vw,8rem)] font-bold leading-none">
                  {pop.delta > 0 ? `+${pop.delta}` : pop.delta}
                </p>
                <p className="mt-2 font-display text-3xl font-semibold">{popTeam.name}</p>
                <p className="text-xl opacity-80">{pop.label}</p>
              </div>
            </div>
          )}
        </section>

        {/* Standings */}
        <aside className="flex min-h-0 flex-col">
          <h2 className="mb-3 text-lg uppercase tracking-[0.25em] text-muted-foreground">Live standings</h2>
          <div className="min-h-0 flex-1">
            <Leaderboard big />
          </div>
        </aside>
      </main>

      <footer className="flex items-center justify-between px-[2.5vw] pb-[1.5vh] text-lg">
        <span className="text-muted-foreground">{s.settings.tagline}</span>
        <InstaLink className="text-lg" />
      </footer>

      <StageControls />
    </div>
  );
}

function useIdle(ms = 3000) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), ms);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [ms]);
  return idle;
}

function StageControls() {
  const s = useQuiz();
  const q = currentQuestion(s);
  const idle = useIdle();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chitOpen, setChitOpen] = useState(false);
  const [chit, setChit] = useState("");

  const safe = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const nextAndClear = () => {
    actions.nextTeam();
    actions.clearStage();
  };

  let primary: React.ReactNode;
  if (!q) primary = (
    <Button variant="hero" size="xl" onClick={actions.draw}><Shuffle /> Draw question</Button>
  );
  else if (!s.isAnswerRevealed) primary = (
    <Button variant="hero" size="xl" onClick={() => { actions.pauseTimer(); actions.toggleAnswer(); }}><Eye /> Reveal answer</Button>
  );
  else if (!s.hasBeenScored) primary = (
    <>
      <Button variant="success" size="xl" onClick={() => safe(() => actions.award(s.activeTeamId, "correct"))}><Check /> Correct</Button>
      <Button variant="destructive" size="xl" onClick={() => safe(() => actions.award(s.activeTeamId, "wrong"))}><X /> Wrong</Button>
    </>
  );
  else primary = (
    <Button variant="hero" size="xl" onClick={nextAndClear}><ArrowRight /> Next team</Button>
  );

  // Keyboard: Space = primary-ish shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "t") s.timer.running ? actions.pauseTimer() : actions.startTimer();
      if (e.key === "f") document.documentElement.requestFullscreen?.();
      if (e.key === "d" && !q) actions.draw();
      if (e.key === "a" && q) actions.toggleAnswer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const others = s.teams.filter((t) => t.id !== s.activeTeamId);

  return (
    <>
      <div
        className={cn(
          "absolute bottom-[6vh] left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-2xl glass p-2 shadow-2xl transition-all duration-500",
          idle && !menuOpen && "pointer-events-none translate-y-8 opacity-0",
        )}
      >
        {primary}
        {q && (
          <Button variant="glass" size="xl" onClick={s.timer.running ? actions.pauseTimer : actions.startTimer} aria-label="Timer">
            {s.timer.running ? <Pause /> : <Play />}
          </Button>
        )}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="glass" size="xl" aria-label="More options"><MoreVertical /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-60">
            <DropdownMenuItem onClick={() => setChitOpen(true)}><Hash /> Open by chit number</DropdownMenuItem>
            <DropdownMenuItem onClick={actions.draw}><Shuffle /> Draw random question</DropdownMenuItem>
            {q && <DropdownMenuItem onClick={actions.toggleAnswer}><Eye /> {s.isAnswerRevealed ? "Hide answer" : "Reveal answer"}</DropdownMenuItem>}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Zap /> Pounce</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                {others.map((t) => (
                  <div key={t.id} className="flex items-center gap-1 px-2 py-1 text-sm">
                    <span className="size-2.5 rounded-full" style={{ background: t.color }} />
                    <span className="flex-1 truncate">{t.name}</span>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => actions.awardPounce(t.id, true)} aria-label="Pounce correct"><Check className="text-success" /></Button>
                    <Button size="icon" variant="ghost" className="size-7" onClick={() => actions.awardPounce(t.id, false)} aria-label="Pounce wrong"><X className="text-destructive" /></Button>
                  </div>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Hourglass /> Timer</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => actions.adjustTimer(5)}><Plus /> Add 5 seconds</DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.adjustTimer(-5)}><Minus /> Remove 5 seconds</DropdownMenuItem>
                <DropdownMenuItem onClick={actions.resetTimer}><RotateCcw /> Reset</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Layers /> Round</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {s.rounds.map((r) => (
                  <DropdownMenuItem key={r.id} onClick={() => actions.selectRound(r.id)} className={cn(r.id === s.activeRound && "text-primary")}>
                    {r.badge} · {r.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><ArrowRight /> Answering team</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {s.teams.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => actions.selectTeam(t.id)} className={cn(t.id === s.activeTeamId && "text-primary")}>
                    <span className="size-2.5 rounded-full" style={{ background: t.color }} /> {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {q && <DropdownMenuItem onClick={actions.clearStage}><X /> Clear stage</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => document.documentElement.requestFullscreen?.()}><Maximize /> Fullscreen</DropdownMenuItem>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Go to</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link to="/operator"><Gamepad2 /> Operator desk</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/admin"><Settings2 /> Admin controls</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to="/"><Home /> Visitor page</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={chitOpen} onOpenChange={setChitOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open question by chit number</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (actions.revealTag(chit)) {
                setChit("");
                setChitOpen(false);
              } else toast.error(`No question found for "${chit}"`);
            }}
            className="flex gap-2"
          >
            <Input autoFocus placeholder="e.g. R1-004" value={chit} onChange={(e) => setChit(e.target.value.toUpperCase())} className="tabular" />
            <Button type="submit">Open</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
