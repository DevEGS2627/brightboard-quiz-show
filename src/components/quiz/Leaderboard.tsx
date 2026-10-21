import { Crown, Zap } from "lucide-react";
import { rankTeams, useQuiz } from "@/quiz/store";
import { cn } from "@/lib/utils";

export function Leaderboard({ big = false }: { big?: boolean }) {
  const teams = useQuiz((s) => s.teams);
  const activeId = useQuiz((s) => s.activeTeamId);
  const ranked = rankTeams(teams);
  const top = Math.max(1, ...ranked.map((t) => t.totalScore));
  return (
    <ol className={cn("flex flex-col", big ? "h-full gap-2.5" : "gap-2")}>
      {ranked.map((t, i) => {
        const active = t.id === activeId;
        return (
          <li
            key={t.id}
            className={cn(
              "relative flex items-center gap-3 overflow-hidden rounded-xl border bg-card px-3 transition-all duration-700",
              big ? "flex-1 py-2" : "py-2.5",
              active && "shadow-glow",
            )}
          >
            <span
              className="absolute inset-y-0 left-0 opacity-20 transition-all duration-700"
              style={{ width: `${Math.max(0, (t.totalScore / top) * 100)}%`, background: t.color }}
            />
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: t.color }} />
            <span
              className={cn(
                "relative grid shrink-0 place-items-center rounded-lg font-display font-bold",
                big ? "size-11 text-xl" : "size-8 text-sm",
                i === 0 && t.totalScore > 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {i === 0 && t.totalScore > 0 ? <Crown className={big ? "size-6" : "size-4"} /> : i + 1}
            </span>
            <div className="relative min-w-0 flex-1">
              <div className={cn("truncate font-display font-semibold", big ? "text-xl" : "text-sm")}>{t.name}</div>
              {big ? null : <div className="truncate text-xs text-muted-foreground">{t.school}</div>}
            </div>
            {t.hasPounced && <Zap className="relative size-5 fill-primary text-primary" aria-label="Pounced" />}
            {active && (
              <span className="relative rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Turn
              </span>
            )}
            <span className={cn("relative tabular font-bold", big ? "text-4xl" : "text-xl")}>{t.totalScore}</span>
          </li>
        );
      })}
    </ol>
  );
}
