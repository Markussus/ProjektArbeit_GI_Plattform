import { describe, expect, it } from "vitest";
import {
  dnfTransferCodec,
  type DnfTransferValue,
} from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfTransfer";
import {
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
} from "@/lib/trainingCenter";

describe("DNF transfer codec", () => {
  it("round-trips a complete expression session", async () => {
    const session: DnfTransferValue = {
      mode: "expression_to_truth_table",
      expression: "a & (!b | c)",
      committed: true,
      truthTableAnswers: [true, null, false],
      dnfAnswer: "a & !b",
      simplificationAnswer: "a",
    };
    const exportedValue = await dnfTransferCodec.exportValue(session);
    const importedValue = dnfTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^D[A-Za-z0-9_-]+$/u);
    expect(importedValue).toEqual(session);
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const session: DnfTransferValue = {
      mode: "expression_to_truth_table",
      expression: "a | b",
      committed: false,
      ...emptyAttempt,
    };
    const exportedValue = await dnfTransferCodec.exportValue(session);

    expect(dnfTransferCodec.importValue(` \n${exportedValue}\n `)).toEqual(
      session,
    );
  });

  it("round-trips a complete truth-table session", async () => {
    const session: DnfTransferValue = {
      mode: "truth_table_to_dnf",
      variableCount: 3,
      resultValues: [false, true, false, true, true, false, false, true],
      committed: true,
      truthTableAnswers: [],
      dnfAnswer: "(!a & !b & c) | (a & !b & !c)",
      simplificationAnswer: "(!a & c) | (a & !c)",
    };
    const exportedValue = await dnfTransferCodec.exportValue(session);
    const importedValue = dnfTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^D[A-Za-z0-9_-]+$/u);
    expect(importedValue).toEqual(session);
  });

  it("round-trips a truth-table session at the four-variable limit", async () => {
    const session: DnfTransferValue = {
      mode: "truth_table_to_dnf",
      variableCount: 4,
      resultValues: Array.from({ length: 16 }, (_value, index) => index === 0),
      committed: false,
      truthTableAnswers: [],
      dnfAnswer: "",
      simplificationAnswer: "",
    };

    const exportedValue = await dnfTransferCodec.exportValue(session);
    const importedValue = dnfTransferCodec.importValue(exportedValue);

    expect(importedValue).toEqual(session);
  });

  it("round-trips an exercise attempt with unanswered rows", async () => {
    const session: DnfTransferValue = {
      mode: "exercise_attempt",
      truthTableAnswers: [true, null, false],
      dnfAnswer: "a | b",
      simplificationAnswer: "a",
    };
    const exportedValue = await dnfTransferCodec.exportValue(session);

    expect(dnfTransferCodec.importValue(exportedValue)).toEqual(session);
  });

  it("binds a transfer string to its training-center context", async () => {
    const firstExerciseCodec = createTrainingCenterTransferCodec(
      createTrainingCenterIdentifier(5, 0),
      dnfTransferCodec,
    );
    const secondExerciseCodec = createTrainingCenterTransferCodec(
      createTrainingCenterIdentifier(5, 1),
      dnfTransferCodec,
    );
    const session: DnfTransferValue = {
      mode: "exercise_attempt",
      truthTableAnswers: [],
      dnfAnswer: "a",
      simplificationAnswer: "",
    };
    const exportedValue = await firstExerciseCodec.exportValue(session);

    await expect(
      firstExerciseCodec.importValue(exportedValue),
    ).resolves.toEqual(session);
    await expect(
      secondExerciseCodec.importValue(exportedValue),
    ).rejects.toThrow("training_center_transfer_identifier_invalid");
  });

  it("round-trips an unfinished expression draft", async () => {
    const draft: DnfTransferValue = {
      mode: "expression_to_truth_table",
      expression: "a &",
      committed: false,
      ...emptyAttempt,
    };
    const exportedValue = await dnfTransferCodec.exportValue(draft);

    expect(dnfTransferCodec.importValue(exportedValue)).toEqual(draft);
  });

  it("rejects truth tables with a mismatching result count", () => {
    expect(() =>
      dnfTransferCodec.exportValue({
        mode: "truth_table_to_dnf",
        variableCount: 3,
        resultValues: [true, false],
        committed: false,
        ...emptyAttempt,
      }),
    ).toThrow("dnf_transfer_value_invalid");
  });

  it("rejects malformed payloads", () => {
    expect(() => dnfTransferCodec.importValue("not-base64")).toThrow(
      "dnf_transfer_payload_invalid",
    );
    expect(() => dnfTransferCodec.importValue("D*")).toThrow(
      "dnf_transfer_payload_invalid",
    );
  });

  it("rejects obsolete version-two payloads", () => {
    expect(() => dnfTransferCodec.importValue("DQCsJATEDE")).toThrow(
      "dnf_transfer_payload_invalid",
    );
  });
});

const emptyAttempt = {
  truthTableAnswers: [],
  dnfAnswer: "",
  simplificationAnswer: "",
};
