import { useSyncExternalStore } from "react";
import initialTeams from "./data/initial_teams.json";
import questionsBank from "./data/questions_bank.json";
import roundsMeta from "./data/rounds_metadata.json";
import defaultRules from "./data/default_rules.json";

export type Team = {
  id: string;
  name: string;
  school: string;
  shortName: string;
  color: string;
  logoIcon?: string;
  scoresByRound: number[];
  totalScore: number;
  hasPounced: boolean;
  pounceTimestamp: string | null;
};
export type Question = {
  id: string;
  tag: string;
  round: number;
  question: string;
  answer: string;
  source?: string;
  status: "available" | "drawn";
  mediaType?: string | null;
  mediaUrl?: string | null;
  drawnAt?: string;
};
export type Round = { id: number; name: string; category: string; badge: string };
export type Rules = {
  correctPoints: number;
  wrongPoints: number;
  pounceCorrectPoints: number;
  pounceIncorrectPoints: number;
  defaultTimerDuration: number;
  warningTimerThreshold: number;
  soundEnabled: boolean;
  speechRate?: number;
  allowAudiencePass?: boolean;
};
export type Settings = {
  theme: string;
  eventTitle: string;
  schoolName: string;
  tagline: string;
  instagram: string;
  logoUrl: string;
  questionDelay: number; // seconds before the question appears
  answerDelay: number; // seconds of suspense before answer appears
  sandEffect: boolean;
};
export type MarkEntry = {
  timestamp: string;
  type: string;
  teamId: string;
  teamName: string;
  pointsDelta: number;
  questionTag: string | null;
  round: number;
  reason: string;
};
export type DrawEntry = {
  timestamp: string;
  questionId: string;
  questionTag: string;
  round: number;
  method: string;
  teamId: string;
  teamName: string;
};
export type QuizState = {
  teams: Team[];
  questions: Question[];
  rounds: Round[];
  rules: Rules;
  settings: Settings;
  activeRound: number;
  activeTeamId: string;
  currentQuestionId: string | null;
  isAnswerRevealed: boolean;
  hasBeenScored: boolean;
  timer: { running: boolean; endsAt: number | null; remaining: number };
  marksHistory: MarkEntry[];
  drawHistory: DrawEntry[];
  lastScore: { teamId: string; delta: number; at: number; label: string } | null;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "navy-gold",
  eventTitle: "EGS Quizit!",
  schoolName: "Espee Global School",
  tagline: "Inter-school Quiz Arena",
  instagram: "https://www.instagram.com/espeeglobal",
  logoUrl: "",
  questionDelay: 2,
  answerDelay: 2,
  sandEffect: true,
};

export function createInitialState(): QuizState {
  const rules = { ...(defaultRules as Rules) };
  const teams = (initialTeams as Team[]).map((t) => ({ ...t, scoresByRound: [...t.scoresByRound] }));
  return {
    teams,
    questions: (questionsBank as Question[]).map((q) => ({ ...q })),
    rounds: roundsMeta as Round[],
    rules,
    settings: { ...DEFAULT_SETTINGS },
    activeRound: 1,
    activeTeamId: teams[0]?.id ?? "",
    currentQuestionId: null,
    isAnswerRevealed: false,
    hasBeenScored: false,
    timer: { running: false, endsAt: null, remaining: rules.defaultTimerDuration },
    marksHistory: [],
    drawHistory: [],
    lastScore: null,
  };
}

/* ---------------- Pure rules (tested) ---------------- */

export function timerSecondsLeft(s: QuizState, now = Date.now()) {
  if (s.timer.running && s.timer.endsAt) return Math.max(0, Math.ceil((s.timer.endsAt - now) / 1000));
  return s.timer.remaining;
}

function addPoints(s: QuizState, teamId: string, round: number, delta: number) {
  return s.teams.map((t) => {
    if (t.id !== teamId) return t;
    const sbr = [...t.scoresByRound];
    sbr[round - 1] = (sbr[round - 1] || 0) + delta;
    return { ...t, scoresByRound: sbr, totalScore: t.totalScore + delta };
  });
}

function currentTag(s: QuizState) {
  return s.questions.find((q) => q.id === s.currentQuestionId)?.tag ?? null;
}

function pausedTimer(s: QuizState) {
  return { running: false, endsAt: null, remaining: timerSecondsLeft(s) };
}

export function applyQuestion(s: QuizState, q: Question, method: string): QuizState {
  const team = s.teams.find((t) => t.id === s.activeTeamId);
  return {
    ...s,
    currentQuestionId: q.id,
    isAnswerRevealed: false,
    hasBeenScored: false,
    timer: { running: false, endsAt: null, remaining: s.rules.defaultTimerDuration },
    teams: s.teams.map((t) => ({ ...t, hasPounced: false, pounceTimestamp: null })),
    questions: s.questions.map((x) =>
      x.id === q.id ? { ...x, status: "drawn", drawnAt: new Date().toISOString() } : x,
    ),
    drawHistory: [
      {
        timestamp: new Date().toISOString(),
        questionId: q.id,
        questionTag: q.tag,
        round: q.round,
        method,
        teamId: s.activeTeamId,
        teamName: team?.name ?? "Unknown",
      },
      ...s.drawHistory,
    ],
  };
}

export function drawRandom(s: QuizState, rand = Math.random): QuizState {
  let questions = s.questions;
  let pool = questions.filter((q) => q.round === s.activeRound && q.status === "available");
  if (!pool.length) {
    questions = questions.map((q) => (q.round === s.activeRound ? { ...q, status: "available" } : q));
    pool = questions.filter((q) => q.round === s.activeRound);
  }
  if (!pool.length) return s;
  const pick = pool[Math.floor(rand() * pool.length)];
  return pick ? applyQuestion({ ...s, questions }, pick, "fair_random_reel") : s;
}

export function findByTag(s: QuizState, tag: string) {
  const clean = tag.trim().toUpperCase();
  const strip = (v: string) => v.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return (
    s.questions.find((q) => q.tag.toUpperCase() === clean) ??
    s.questions.find((q) => strip(q.tag) === strip(clean)) ??
    null
  );
}

export function awardRegular(s: QuizState, teamId: string, type: "correct" | "wrong"): QuizState {
  if (s.hasBeenScored) throw new Error("This question has already been scored.");
  const delta = type === "correct" ? s.rules.correctPoints : s.rules.wrongPoints;
  const team = s.teams.find((t) => t.id === teamId);
  if (!team) return s;
  return {
    ...s,
    timer: pausedTimer(s),
    teams: addPoints(s, teamId, s.activeRound, delta),
    hasBeenScored: true,
    lastScore: { teamId, delta, at: Date.now(), label: type === "correct" ? "Correct" : "Wrong" },
    marksHistory: [
      {
        timestamp: new Date().toISOString(),
        type,
        teamId,
        teamName: team.name,
        pointsDelta: delta,
        questionTag: currentTag(s),
        round: s.activeRound,
        reason: `Direct ${type} answer`,
      },
      ...s.marksHistory,
    ],
  };
}

export function togglePounce(s: QuizState, teamId: string): QuizState {
  if (teamId === s.activeTeamId) throw new Error("The answering team cannot pounce on its own question.");
  return {
    ...s,
    teams: s.teams.map((t) =>
      t.id === teamId
        ? { ...t, hasPounced: !t.hasPounced, pounceTimestamp: t.hasPounced ? null : new Date().toISOString() }
        : t,
    ),
  };
}

export function awardPounce(s: QuizState, teamId: string, correct: boolean): QuizState {
  const delta = correct ? s.rules.pounceCorrectPoints : s.rules.pounceIncorrectPoints;
  const team = s.teams.find((t) => t.id === teamId);
  if (!team) return s;
  return {
    ...s,
    teams: addPoints(s, teamId, s.activeRound, delta).map((t) =>
      t.id === teamId ? { ...t, hasPounced: false } : t,
    ),
    hasBeenScored: correct ? true : s.hasBeenScored,
    lastScore: { teamId, delta, at: Date.now(), label: correct ? "Pounce correct" : "Pounce wrong" },
    marksHistory: [
      {
        timestamp: new Date().toISOString(),
        type: correct ? "pounce_correct" : "pounce_incorrect",
        teamId,
        teamName: team.name,
        pointsDelta: delta,
        questionTag: currentTag(s),
        round: s.activeRound,
        reason: `Pounce ${correct ? "correct" : "incorrect"}`,
      },
      ...s.marksHistory,
    ],
  };
}

export function manualAdjust(s: QuizState, teamId: string, delta: number, reason: string): QuizState {
  const team = s.teams.find((t) => t.id === teamId);
  if (!team || !delta) return s;
  return {
    ...s,
    teams: addPoints(s, teamId, s.activeRound, delta),
    lastScore: { teamId, delta, at: Date.now(), label: "Adjustment" },
    marksHistory: [
      {
        timestamp: new Date().toISOString(),
        type: "manual_adjustment",
        teamId,
        teamName: team.name,
        pointsDelta: delta,
        questionTag: currentTag(s),
        round: s.activeRound,
        reason: `Manual correction: ${reason || "—"}`,
      },
      ...s.marksHistory,
    ],
  };
}

export function rankTeams(teams: Team[]) {
  return [...teams].sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
}

/* ---------------- Store with cross-tab sync ---------------- */

const KEY = "egs-quizit-state-v1";
const serverState = createInitialState();
let state: QuizState = serverState;
let loaded = false;
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as QuizState;
      state = { ...createInitialState(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
  } catch {
    /* ignore corrupted save */
  }
  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(KEY);
    channel.onmessage = (e) => {
      state = e.data as QuizState;
      listeners.forEach((l) => l());
    };
  }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY && e.newValue) {
      state = JSON.parse(e.newValue);
      listeners.forEach((l) => l());
    }
  });
}

export function getState() {
  ensureLoaded();
  return state;
}

export function setState(updater: (s: QuizState) => QuizState) {
  ensureLoaded();
  state = updater(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  channel?.postMessage(state);
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  ensureLoaded();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useQuiz<T = QuizState>(select?: (s: QuizState) => T): T {
  const s = useSyncExternalStore(subscribe, getState, () => serverState);
  return (select ? select(s) : s) as T;
}

export function currentQuestion(s: QuizState) {
  return s.questions.find((q) => q.id === s.currentQuestionId) ?? null;
}

/* Action helpers used by the UI */
export const actions = {
  draw: () => setState((s) => drawRandom(s)),
  revealTag: (tag: string) => {
    const q = findByTag(getState(), tag);
    if (!q) return false;
    setState((s) => applyQuestion(s, q, "physical_chit"));
    return true;
  },
  toggleAnswer: () => setState((s) => ({ ...s, isAnswerRevealed: !s.isAnswerRevealed })),
  award: (teamId: string, type: "correct" | "wrong") => setState((s) => awardRegular(s, teamId, type)),
  pounce: (teamId: string) => setState((s) => togglePounce(s, teamId)),
  awardPounce: (teamId: string, correct: boolean) => setState((s) => awardPounce(s, teamId, correct)),
  adjust: (teamId: string, delta: number, reason: string) => setState((s) => manualAdjust(s, teamId, delta, reason)),
  nextTeam: () =>
    setState((s) => {
      const i = s.teams.findIndex((t) => t.id === s.activeTeamId);
      return { ...s, activeTeamId: s.teams[(i + 1) % s.teams.length]?.id ?? s.activeTeamId };
    }),
  selectTeam: (id: string) => setState((s) => ({ ...s, activeTeamId: id })),
  selectRound: (id: number) => setState((s) => ({ ...s, activeRound: id })),
  startTimer: () =>
    setState((s) => {
      const left = timerSecondsLeft(s);
      if (s.timer.running || left <= 0) return s;
      return { ...s, timer: { running: true, endsAt: Date.now() + left * 1000, remaining: left } };
    }),
  pauseTimer: () => setState((s) => ({ ...s, timer: pausedTimer(s) })),
  resetTimer: () =>
    setState((s) => ({ ...s, timer: { running: false, endsAt: null, remaining: s.rules.defaultTimerDuration } })),
  adjustTimer: (d: number) =>
    setState((s) => {
      const left = Math.max(0, timerSecondsLeft(s) + d);
      return {
        ...s,
        timer: s.timer.running
          ? { running: true, endsAt: Date.now() + left * 1000, remaining: left }
          : { running: false, endsAt: null, remaining: left },
      };
    }),
  clearStage: () => setState((s) => ({ ...s, currentQuestionId: null, isAnswerRevealed: false })),
  updateSettings: (p: Partial<Settings>) => setState((s) => ({ ...s, settings: { ...s.settings, ...p } })),
  updateRules: (p: Partial<Rules>) => setState((s) => ({ ...s, rules: { ...s.rules, ...p } })),
  updateTeam: (id: string, p: Partial<Team>) =>
    setState((s) => ({ ...s, teams: s.teams.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
  setQuestions: (questions: Question[]) => setState((s) => ({ ...s, questions })),
  resetScores: () =>
    setState((s) => ({
      ...s,
      teams: s.teams.map((t) => ({ ...t, scoresByRound: [0, 0, 0, 0, 0, 0], totalScore: 0, hasPounced: false })),
      marksHistory: [],
      hasBeenScored: false,
      lastScore: null,
    })),
  factoryReset: () => setState((s) => ({ ...createInitialState(), settings: s.settings })),
};
