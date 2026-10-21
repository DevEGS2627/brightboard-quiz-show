import { describe, expect, it } from "vitest";
import { awardPounce, awardRegular, createInitialState, drawRandom, findByTag, togglePounce } from "@/quiz/store";

describe("quiz scoring rules", () => {
  it("correct answer gives 10 points to the team and the active round", () => {
    const s = awardRegular(drawRandom(createInitialState(), () => 0), "team-1", "correct");
    const t = s.teams.find((x) => x.id === "team-1")!;
    expect(t.totalScore).toBe(10);
    expect(t.scoresByRound[0]).toBe(10);
  });
  it("a question cannot be scored twice", () => {
    const s = awardRegular(createInitialState(), "team-1", "correct");
    expect(() => awardRegular(s, "team-1", "correct")).toThrow();
  });
  it("wrong pounce costs 5 points", () => {
    const s = awardPounce(createInitialState(), "team-2", false);
    expect(s.teams.find((x) => x.id === "team-2")!.totalScore).toBe(-5);
  });
  it("the answering team cannot pounce", () => {
    expect(() => togglePounce(createInitialState(), "team-1")).toThrow();
  });
  it("chit lookup ignores dashes and case", () => {
    expect(findByTag(createInitialState(), "r1001")?.tag).toBe("R1-001");
  });
});
