import { useQuiz } from "@/quiz/store";
import { cn } from "@/lib/utils";

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-4", className)} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({ size = "md" }: { size?: "md" | "lg" }) {
  const settings = useQuiz((s) => s.settings);
  const big = size === "lg";
  return (
    <div className="flex items-center gap-3">
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt={settings.schoolName} className={cn("rounded-lg object-contain", big ? "size-14" : "size-10")} />
      ) : (
        <div
          className={cn(
            "grid place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground shadow-glow",
            big ? "size-14 text-xl" : "size-10 text-sm",
          )}
        >
          EGS
        </div>
      )}
      <div className="leading-tight">
        <div className={cn("font-display font-bold text-gradient-brand", big ? "text-2xl" : "text-lg")}>{settings.eventTitle}</div>
        <div className={cn("text-muted-foreground", big ? "text-sm" : "text-xs")}>{settings.schoolName}</div>
      </div>
    </div>
  );
}

export function InstaLink({ className }: { className?: string }) {
  const url = useQuiz((s) => s.settings.instagram);
  return (
    <a href={url} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary", className)}>
      <InstagramIcon />
      @espeeglobal
    </a>
  );
}
