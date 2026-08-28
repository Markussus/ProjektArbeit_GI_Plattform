import { describe, expect, it } from "vitest";
import {
  dnfExerciseTransferCodec,
  dnfExpressionTransferCodec,
  dnfTransferCodec,
  dnfTruthTableTransferCodec,
} from "@/pages/FundamentalsCS/Dnf/components/DnfBuilder/domain/dnfTransfer";
import {
  createTrainingCenterIdentifier,
  createTrainingCenterTransferCodec,
} from "@/lib/trainingCenter";

describe("DNF transfer codec", () => {
  it("round-trips a complete expression session", async () => {
    const session = {
      expression: "a & (!b | c)",
      committed: true,
      truthTableAnswers: [true, null, false],
      dnfAnswer: "a & !b",
      simplificationAnswer: "a",
    };
    const exportedValue = await dnfExpressionTransferCodec.exportValue(session);
    const importedValue =
      await dnfExpressionTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^D[A-Za-z0-9_-]+$/u);
    expect(importedValue).toEqual(session);
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const session = {
      expression: "a | b",
      committed: false,
      ...emptyAttempt,
    };
    const exportedValue = await dnfExpressionTransferCodec.exportValue(session);

    await expect(
      dnfExpressionTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toEqual(session);
  });

  it("round-trips a complete truth-table session", async () => {
    const session = {
      variableCount: 3,
      resultValues: [false, true, false, true, true, false, false, true],
      committed: true,
      truthTableAnswers: [],
      dnfAnswer: "(!a & !b & c) | (a & !b & !c)",
      simplificationAnswer: "(!a & c) | (a & !c)",
    };
    const exportedValue = await dnfTruthTableTransferCodec.exportValue(session);
    const importedValue =
      await dnfTruthTableTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^D[A-Za-z0-9_-]+$/u);
    expect(importedValue).toEqual(session);
  });

  it("round-trips a truth-table session at the four-variable limit", async () => {
    const session = {
      variableCount: 4,
      resultValues: Array.from({ length: 16 }, (_value, index) => index === 0),
      committed: false,
      truthTableAnswers: [],
      dnfAnswer: "",
      simplificationAnswer: "",
    };

    const exportedValue = await dnfTruthTableTransferCodec.exportValue(session);
    const importedValue =
      await dnfTruthTableTransferCodec.importValue(exportedValue);

    expect(importedValue).toEqual(session);
  });

  it("round-trips an exercise attempt with unanswered rows", async () => {
    const exportedValue = await dnfExerciseTransferCodec.exportValue({
      truthTableAnswers: [true, null, false],
      dnfAnswer: "a | b",
      simplificationAnswer: "a",
    });

    await expect(
      dnfExerciseTransferCodec.importValue(exportedValue),
    ).resolves.toEqual({
      truthTableAnswers: [true, null, false],
      dnfAnswer: "a | b",
      simplificationAnswer: "a",
    });
  });

  it("binds a transfer string to its training-center context", async () => {
    const firstExerciseCodec = createTrainingCenterTransferCodec(
      createTrainingCenterIdentifier(5, 0),
      dnfExerciseTransferCodec,
    );
    const secondExerciseCodec = createTrainingCenterTransferCodec(
      createTrainingCenterIdentifier(5, 1),
      dnfExerciseTransferCodec,
    );
    const exportedValue = await firstExerciseCodec.exportValue({
      truthTableAnswers: [],
      dnfAnswer: "a",
      simplificationAnswer: "",
    });

    await expect(
      firstExerciseCodec.importValue(exportedValue),
    ).resolves.toEqual({
      truthTableAnswers: [],
      dnfAnswer: "a",
      simplificationAnswer: "",
    });
    await expect(
      secondExerciseCodec.importValue(exportedValue),
    ).rejects.toThrow("training_center_transfer_identifier_invalid");
  });

  it("round-trips an unfinished expression draft", async () => {
    const draft = {
      expression: "a &",
      committed: false,
      ...emptyAttempt,
    };
    const exportedValue = await dnfExpressionTransferCodec.exportValue(draft);

    await expect(
      dnfExpressionTransferCodec.importValue(exportedValue),
    ).resolves.toEqual(draft);
  });

  it("rejects truth tables with a mismatching result count", async () => {
    expect(() =>
      dnfTruthTableTransferCodec.exportValue({
        variableCount: 3,
        resultValues: [true, false],
        committed: false,
        ...emptyAttempt,
      }),
    ).toThrow("dnf_transfer_value_invalid");
  });

  it("rejects malformed payloads", async () => {
    expect(() => dnfTransferCodec.importValue("not-base64")).toThrow(
      "dnf_transfer_payload_invalid",
    );
    expect(() => dnfTransferCodec.importValue("D*")).toThrow(
      "dnf_transfer_payload_invalid",
    );
  });

  it("rejects obsolete version-two payloads", async () => {
    expect(() => dnfTransferCodec.importValue("DQCsJATEDE")).toThrow(
      "dnf_transfer_payload_invalid",
    );
  });

  it("rejects transfers imported through the wrong mode adapter", async () => {
    const exportedTable = await dnfTruthTableTransferCodec.exportValue({
      variableCount: 1,
      resultValues: [false, true],
      committed: false,
      ...emptyAttempt,
    });

    await expect(
      dnfExpressionTransferCodec.importValue(exportedTable),
    ).rejects.toThrow("dnf_transfer_mode_invalid");
  });
});

const emptyAttempt = {
  truthTableAnswers: [],
  dnfAnswer: "",
  simplificationAnswer: "",
};
