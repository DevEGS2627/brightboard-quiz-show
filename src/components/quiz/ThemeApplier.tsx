import { useEffect } from "react";
import { useQuiz } from "@/quiz/store";

export function ThemeApplier() {
  const theme = useQuiz((s) => s.settings.theme);
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);
  return null;
}
