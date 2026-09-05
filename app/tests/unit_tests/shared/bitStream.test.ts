import { describe, expect, it } from "vitest";
import {
  BASE64_URL_ALPHABET,
  BitReader,
  BitWriter,
} from "@/lib/trainingCenter/bitStream";

describe("BitWriter", () => {
  it("normalizes individual bits and writes fixed-width values most significant bit first", () => {
    const writer = new BitWriter();

    writer.writeBit(0);
    writer.writeBit(-1);
    writer.writeBits(5, 3);
    writer.writeBitArray([0, 2]);

    expect(writer.bits).toEqual([0, 1, 1, 0, 1, 0, 1]);
  });

  it("encodes six-bit groups with zero padding as Base64URL", () => {
    const writer = new BitWriter();

    writer.writeBits(62, 6);
    writer.writeBits(63, 6);
    writer.writeBit(1);

    expect(writer.toBase64Url()).toBe("-_g");
    expect(BASE64_URL_ALPHABET).toHaveLength(64);
  });

  it.each([0, 1, 127, 128, 16_383, Number.MAX_SAFE_INTEGER])(
    "round-trips variable-length unsigned integer %i",
    (value) => {
      const writer = new BitWriter();
      writer.writeVarUint(value);

      const reader = BitReader.fromBase64Url(writer.toBase64Url());

      expect(reader.readVarUint()).toBe(value);
      reader.assertOnlyPaddingRemains();
    },
  );

  it.each([
    () => new BitWriter().writeBits(-1, 1),
    () => new BitWriter().writeBits(2, 1),
    () => new BitWriter().writeBits(1, 0),
    () => new BitWriter().writeBits(1.5, 2),
    () => new BitWriter().writeBits(0, -1),
    () => new BitWriter().writeVarUint(-1),
    () => new BitWriter().writeVarUint(Number.MAX_SAFE_INTEGER + 1),
  ])("rejects invalid numeric input", (operation) => {
    expect(operation).toThrow("bit_writer_value_invalid");
  });

  it("uses a custom writer error message", () => {
    expect(() => new BitWriter("custom_writer_error").writeBits(4, 2)).toThrow(
      "custom_writer_error",
    );
  });
});

describe("BitReader", () => {
  it("reads bits and fixed-width values in their encoded order", () => {
    const reader = BitReader.fromBase64Url("pg");

    expect(reader.readBit()).toBe(1);
    expect(reader.readBits(3)).toBe(2);
    expect(reader.readBits(4)).toBe(6);
    expect(reader.readBits(0)).toBe(0);
  });

  it.each(["", "A=", "A+", "A/"])(
    "rejects invalid Base64URL payload %j",
    (payload) => {
      expect(() => BitReader.fromBase64Url(payload)).toThrow(
        "bit_reader_payload_invalid",
      );
    },
  );

  it("rejects reads beyond the payload and invalid bit counts", () => {
    const reader = BitReader.fromBase64Url("A");

    expect(() => reader.readBits(-1)).toThrow("bit_reader_payload_invalid");
    expect(() => reader.readBits(1.5)).toThrow("bit_reader_payload_invalid");
    expect(() => reader.readBits(7)).toThrow("bit_reader_payload_invalid");
  });

  it("accepts at most five zero padding bits", () => {
    const reader = BitReader.fromBase64Url("g");
    expect(reader.readBit()).toBe(1);

    expect(() => reader.assertOnlyPaddingRemains()).not.toThrow();
  });

  it("rejects non-zero padding and more than five remaining bits", () => {
    const nonZeroPadding = BitReader.fromBase64Url("h");
    nonZeroPadding.readBit();
    expect(() => nonZeroPadding.assertOnlyPaddingRemains()).toThrow(
      "bit_reader_payload_invalid",
    );

    expect(() =>
      BitReader.fromBase64Url("A").assertOnlyPaddingRemains(),
    ).toThrow("bit_reader_payload_invalid");
  });

  it("rejects a variable-length integer without a terminating byte", () => {
    const reader = BitReader.fromBase64Url("________________");

    expect(() => reader.readVarUint()).toThrow("bit_reader_payload_invalid");
  });

  it("uses a custom reader error message", () => {
    expect(() => BitReader.fromBase64Url("", "custom_reader_error")).toThrow(
      "custom_reader_error",
    );
  });
});
