import { describe, expect, it } from "vitest";
import { javaCodeTransferCodec } from "../../../../../src/pages/Programming1/Java/components/Simulator/domain/javaCodeTransfer";

describe("Java code transfer codec", () => {
  describe("when Java source code is moved through the transfer format", () => {
    it("round-trips the source code through export and import", async () => {
      const sourceCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello transfer");
  }
}
`;

      const exportedValue = await javaCodeTransferCodec.exportValue(sourceCode);
      const importedValue =
        await javaCodeTransferCodec.importValue(exportedValue);

      expect(exportedValue).toMatch(/^j[01]\./u);
      expect(importedValue).toBe(sourceCode);
    });

    it("accepts pasted transfer strings with surrounding whitespace", async () => {
      const sourceCode = `public class Main {
  public static void main(String[] args) {
    System.out.println("Trim me");
  }
}
`;

      const exportedValue = await javaCodeTransferCodec.exportValue(sourceCode);
      const importedValue = await javaCodeTransferCodec.importValue(
        `  \n${exportedValue}\n  `,
      );

      expect(importedValue).toBe(sourceCode);
    });
  });

  describe("when the incoming transfer string is not from the Java simulator", () => {
    it("rejects unsupported transfer prefixes", async () => {
      await expect(
        javaCodeTransferCodec.importValue("tm1.invalid-transfer"),
      ).rejects.toThrow("java_transfer_prefix_invalid");
    });
  });
});
