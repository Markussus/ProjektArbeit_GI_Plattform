import { describe, expect, it } from "vitest";
import { encodeBase64Utf8, toBase64Url } from "@/lib/utils";
import { tmProgramTransferCodec } from "@/pages/FundamentalsCS/TuringMachine/components/Simulator/domain/tmProgramTransfer";
import { defaultTMProgram } from "./fixtures/defaultTMProgram";

describe("Turing Machine program transfer codec", () => {
  it("round-trips a program through export and import", async () => {
    const exportedValue =
      await tmProgramTransferCodec.exportValue(defaultTMProgram);
    const importedProgram =
      await tmProgramTransferCodec.importValue(exportedValue);

    expect(exportedValue).toMatch(/^tm[01]\./u);
    expect(importedProgram).toEqual(defaultTMProgram);
  });

  it("accepts transfer strings with surrounding whitespace", async () => {
    const exportedValue =
      await tmProgramTransferCodec.exportValue(defaultTMProgram);
    const importedProgram = await tmProgramTransferCodec.importValue(
      ` \n${exportedValue}\n `,
    );

    expect(importedProgram).toEqual(defaultTMProgram);
  });

  it("rejects unsupported transfer prefixes", async () => {
    await expect(
      tmProgramTransferCodec.importValue("j1.invalid-transfer"),
    ).rejects.toThrow("tm_transfer_prefix_invalid");
  });

  it("rejects payloads that are not Turing Machine programs", async () => {
    await expect(
      tmProgramTransferCodec.importValue(encodePlainPayload({ states: [] })),
    ).rejects.toThrow("tm_transfer_shape_invalid");
  });

  it("rejects structurally valid but invalid programs", async () => {
    await expect(
      tmProgramTransferCodec.importValue(
        encodePlainPayload({
          ...defaultTMProgram,
          initialState: "missing",
        }),
      ),
    ).rejects.toThrow("tm_transfer_program_invalid");
  });
});

function encodePlainPayload(value: unknown): string {
  return `tm0.${toBase64Url(encodeBase64Utf8(JSON.stringify(value)))}`;
}
