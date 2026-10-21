import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

function rnd(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Letters drift in as grains of sand and settle into readable text. */
export function SandText({
  text,
  className,
  plain = false,
  duration = 1.6,
}: {
  text: string;
  className?: string;
  plain?: boolean;
  duration?: number;
}) {
  const words = text.split(/\s+/);
  const total = text.replace(/\s/g, "").length || 1;
  const step = Math.min(0.03, duration / total);
  let idx = 0;
  return (
    <span className={cn("relative", plain && "sand-plain", className)} aria-label={text} role="text">
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="inline-block whitespace-nowrap" aria-hidden>
            {[...w].map((c) => {
              const i = idx++;
              const style = {
                "--dx": `${(rnd(i, 1) - 0.5) * 160}px`,
                "--dy": `${(rnd(i, 2) - 0.2) * 120}px`,
                "--rot": `${(rnd(i, 3) - 0.5) * 120}deg`,
                "--delay": `${i * step}s`,
              } as CSSProperties;
              return (
                <span key={i} className="sand-char" style={style}>
                  {c}
                </span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
      {!plain && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 36 }).map((_, i) => (
            <span
              key={i}
              className="sand-grain"
              style={
                {
                  left: `${rnd(i, 9) * 100}%`,
                  top: `${rnd(i, 7) * 20}%`,
                  "--delay": `${rnd(i, 5) * duration}s`,
                  "--dur": `${1 + rnd(i, 4)}s`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
    </span>
  );
}
