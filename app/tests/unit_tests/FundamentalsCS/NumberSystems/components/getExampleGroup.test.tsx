/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { getExampleGroup } from "@/pages/FundamentalsCS/NumberSystems/components/getExampleGroup";
import type { ExerciseDefinition } from "@/types/exercise";
import type { LucideIcon } from "lucide-react";

describe("getExampleGroup", () => {
  function buildExample(titleKey: string): ExerciseDefinition {
    return {
      titleKey: titleKey as ExerciseDefinition["titleKey"],
      descriptionKey:
        `${titleKey}_desc` as ExerciseDefinition["descriptionKey"],
      icon: "Calculator" as unknown as LucideIcon,
      difficulty: "easy",
    };
  }

  it("groups examples by unit numbers 03-06 into lecture group", () => {
    const examples = [
      buildExample("example_u03_first"),
      buildExample("example_u04_second"),
      buildExample("example_u05_third"),
      buildExample("example_u06_fourth"),
    ];

    const groups = getExampleGroup(examples);

    expect(groups.lecture).toHaveLength(4);
    expect(groups.lecture.map((ex) => ex.titleKey)).toEqual(
      examples.map((ex) => ex.titleKey),
    );
    expect(groups["07"]).toBeUndefined();
  });

  it("places unit 07 examples into the 07 group", () => {
    const examples = [
      buildExample("example_u07_first"),
      buildExample("example_u07_second"),
    ];

    const groups = getExampleGroup(examples);

    expect(groups["07"]).toHaveLength(2);
    expect(groups["07"].map((ex) => ex.titleKey)).toEqual(
      examples.map((ex) => ex.titleKey),
    );
    expect(groups.lecture).toBeUndefined();
  });
});
