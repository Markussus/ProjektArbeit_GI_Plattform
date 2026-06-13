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
  it("round-trips an expression transfer value", async () => {
    const exportedValue =
      await dnfExpressionTransferCodec.exportValue("a & (!b | c)");
    const importedValue =
      await dnfExpressionTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^D[A-Za-z0-9_-]+$/u);
    expect(importedValue).toBe("a & (!b | c)");
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const exportedValue = await dnfExpressionTransferCodec.exportValue("a | b");

    await expect(
      dnfExpressionTransferCodec.importValue(` \n${exportedValue}\n `),
    ).resolves.toBe("a | b");
  });

  it("round-trips a truth-table transfer value", async () => {
    const exportedValue = await dnfTruthTableTransferCodec.exportValue({
      variableCount: 3,
      resultValues: [false, true, false, true, true, false, false, true],
    });
    const importedValue =
      await dnfTruthTableTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^D[A-Za-z0-9_-]+$/u);
    expect(importedValue).toEqual({
      variableCount: 3,
      resultValues: [false, true, false, true, true, false, false, true],
    });
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
    const exportedValue = await dnfExpressionTransferCodec.exportValue("a &");

    await expect(
      dnfExpressionTransferCodec.importValue(exportedValue),
    ).resolves.toBe("a &");
  });

  it("rejects truth tables with a mismatching result count", async () => {
    expect(() =>
      dnfTruthTableTransferCodec.exportValue({
        variableCount: 3,
        resultValues: [true, false],
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

  it("rejects transfers imported through the wrong mode adapter", async () => {
    const exportedTable = await dnfTruthTableTransferCodec.exportValue({
      variableCount: 1,
      resultValues: [false, true],
    });

    await expect(
      dnfExpressionTransferCodec.importValue(exportedTable),
    ).rejects.toThrow("dnf_transfer_mode_invalid");
  });
});
