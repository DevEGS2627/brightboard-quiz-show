import { useEffect, useState } from "react";
import { timerSecondsLeft, useQuiz } from "@/quiz/store";

export function useTimerSeconds() {
  const s = useQuiz();
  const [, force] = useState(0);
  useEffect(() => {
    if (!s.timer.running) return;
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [s.timer.running]);
  return timerSecondsLeft(s);
}
