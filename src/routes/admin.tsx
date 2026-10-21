import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Download, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/quiz/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { actions, useQuiz, type Rules } from "@/quiz/store";
import { THEMES } from "@/quiz/themes";
import { csvToQuestions, download, questionsToCsv } from "@/quiz/csv";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Controls — EGS Quizit!" },
      { name: "description", content: "Configure EGS Quizit! colours, branding, teams, scoring rules and the question bank." },
      { property: "og:title", content: "Admin Controls — EGS Quizit!" },
      { property: "og:description", content: "Colours, branding, teams, rules and questions for EGS Quizit!." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const s = useQuiz();
  const set = s.settings;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Admin controls</h1>
        <Tabs defaultValue="look">
          <TabsList>
            <TabsTrigger value="look">Look & branding</TabsTrigger>
            <TabsTrigger value="stage">Stage timing</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="look" className="mt-6 space-y-8">
            <section>
              <h2 className="mb-3 font-bold">Colour theme</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => actions.updateSettings({ theme: t.id })}
                    className={cn("rounded-2xl border bg-card p-3 text-left transition hover:border-primary", set.theme === t.id && "shadow-glow")}
                  >
                    <div className="flex h-12 overflow-hidden rounded-lg">
                      {t.colors.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-semibold">
                      {t.name} {set.theme === t.id && <Check className="size-4 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="grid gap-4 sm:grid-cols-2">
              <Field label="Event title" value={set.eventTitle} onChange={(v) => actions.updateSettings({ eventTitle: v })} />
              <Field label="School name" value={set.schoolName} onChange={(v) => actions.updateSettings({ schoolName: v })} />
              <Field label="Tagline" value={set.tagline} onChange={(v) => actions.updateSettings({ tagline: v })} />
              <Field label="Instagram link" value={set.instagram} onChange={(v) => actions.updateSettings({ instagram: v })} />
              <Field label="Logo image link (optional)" value={set.logoUrl} onChange={(v) => actions.updateSettings({ logoUrl: v })} />
            </section>
          </TabsContent>

          <TabsContent value="stage" className="mt-6 max-w-lg space-y-8">
            <Range label="Pause before question appears" value={set.questionDelay} max={6} onChange={(v) => actions.updateSettings({ questionDelay: v })} />
            <Range label="Suspense before answer appears" value={set.answerDelay} max={6} onChange={(v) => actions.updateSettings({ answerDelay: v })} />
            <div className="flex items-center justify-between">
              <Label>Sand-to-text effect</Label>
              <Switch checked={set.sandEffect} onCheckedChange={(v) => actions.updateSettings({ sandEffect: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Sounds on stage</Label>
              <Switch checked={s.rules.soundEnabled} onCheckedChange={(v) => actions.updateRules({ soundEnabled: v })} />
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-6 space-y-3">
            {s.teams.map((t) => (
              <div key={t.id} className="grid items-end gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[auto_1fr_1fr_6rem]">
                <div>
                  <Label className="text-xs">Colour</Label>
                  <input type="color" value={t.color} onChange={(e) => actions.updateTeam(t.id, { color: e.target.value })} className="mt-1 block h-9 w-14 cursor-pointer rounded border bg-transparent" />
                </div>
                <Field label="Team name" value={t.name} onChange={(v) => actions.updateTeam(t.id, { name: v })} />
                <Field label="School" value={t.school} onChange={(v) => actions.updateTeam(t.id, { school: v })} />
                <Field label="Short" value={t.shortName} onChange={(v) => actions.updateTeam(t.id, { shortName: v.toUpperCase().slice(0, 4) })} />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="rules" className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
            {([
              ["correctPoints", "Correct answer points"],
              ["wrongPoints", "Wrong answer points"],
              ["pounceCorrectPoints", "Pounce correct points"],
              ["pounceIncorrectPoints", "Pounce wrong points"],
              ["defaultTimerDuration", "Timer length (seconds)"],
              ["warningTimerThreshold", "Warning from (seconds left)"],
            ] as [keyof Rules, string][]).map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input type="number" className="mt-1" value={Number(s.rules[k])} onChange={(e) => actions.updateRules({ [k]: Number(e.target.value) })} />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-3 pt-4">
              <Confirm label="Reset all scores" text="All team scores and the scoring history will be cleared." onConfirm={() => { actions.resetScores(); toast.success("Scores reset"); }} />
              <Confirm label="Reset everything" text="Teams, questions and scores go back to the original data. Look & branding are kept." onConfirm={() => { actions.factoryReset(); toast.success("Quiz reset"); }} />
            </div>
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function QuestionsTab() {
  const qs = useQuiz((s) => s.questions);
  const [search, setSearch] = useState("");
  const list = qs.filter((q) => `${q.tag} ${q.question} ${q.answer}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search by chit, question or answer" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            <Upload /> Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const imported = csvToQuestions(await f.text());
                if (!imported.length) { toast.error("No questions found in that file"); return; }
                actions.setQuestions([...qs.filter((q) => !imported.some((i) => i.tag === q.tag)), ...imported]);
                toast.success(`${imported.length} questions imported`);
              }}
            />
          </label>
        </Button>
        <Button variant="outline" onClick={() => download("egs-questions.csv", questionsToCsv(qs))}><Download /> Export CSV</Button>
        <Button variant="ghost" onClick={() => actions.setQuestions(qs.map((q) => ({ ...q, status: "available" })))}><RotateCcw /> Mark all unused</Button>
      </div>
      <p className="text-sm text-muted-foreground">{qs.length} questions · {qs.filter((q) => q.status === "drawn").length} used</p>
      <ul className="divide-y rounded-2xl border bg-card">
        {list.map((q) => (
          <li key={q.id} className="flex gap-3 p-3 text-sm">
            <span className="tabular w-16 shrink-0 font-semibold">{q.tag}</span>
            <div className="min-w-0 flex-1">
              <p>{q.question}</p>
              <p className="text-primary">{q.answer}</p>
            </div>
            <span className={cn("h-fit rounded-full px-2 py-0.5 text-xs", q.status === "drawn" ? "bg-muted text-muted-foreground" : "bg-success/15 text-success")}>
              {q.status === "drawn" ? "Used" : "Ready"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Range({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-3 flex justify-between"><Label>{label}</Label><span className="tabular text-primary">{value}s</span></div>
      <Slider value={[value]} min={0} max={max} step={0.5} onValueChange={([v]) => onChange(v ?? 0)} />
    </div>
  );
}

function Confirm({ label, text, onConfirm }: { label: string; text: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Button variant="destructive">{label}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{label}?</AlertDialogTitle><AlertDialogDescription>{text}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
