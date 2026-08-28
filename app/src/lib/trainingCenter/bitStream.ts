export const BASE64_URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const DEFAULT_WRITER_ERROR = "bit_writer_value_invalid";
const DEFAULT_READER_ERROR = "bit_reader_payload_invalid";

export class BitWriter {
  readonly bits: number[] = [];
  private readonly errorMessage: string;

  constructor(errorMessage = DEFAULT_WRITER_ERROR) {
    this.errorMessage = errorMessage;
  }

  writeBit(bit: number): void {
    this.bits.push(bit === 0 ? 0 : 1);
  }

  writeBits(value: number, bitCount: number): void {
    if (
      !Number.isSafeInteger(value) ||
      value < 0 ||
      !Number.isSafeInteger(bitCount) ||
      bitCount < 0 ||
      (bitCount === 0 ? value !== 0 : value >= 2 ** bitCount)
    ) {
      throw new Error(this.errorMessage);
    }

    for (let bitIndex = bitCount - 1; bitIndex >= 0; bitIndex--) {
      this.writeBit(Math.floor(value / 2 ** bitIndex) % 2);
    }
  }

  writeVarUint(value: number): void {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(this.errorMessage);
    }

    let remaining = value;
    do {
      const data = remaining % 128;
      remaining = Math.floor(remaining / 128);
      this.writeBits(data + (remaining > 0 ? 128 : 0), 8);
    } while (remaining > 0);
  }

  writeBitArray(bits: number[]): void {
    for (const bit of bits) {
      this.writeBit(bit);
    }
  }

  toBase64Url(): string {
    let result = "";

    for (let offset = 0; offset < this.bits.length; offset += 6) {
      let value = 0;
      for (let bitIndex = 0; bitIndex < 6; bitIndex++) {
        value = value * 2 + (this.bits[offset + bitIndex] ?? 0);
      }
      result += BASE64_URL_ALPHABET[value];
    }

    return result;
  }
}

export class BitReader {
  private offset = 0;
  private readonly bits: number[];
  private readonly errorMessage: string;

  private constructor(bits: number[], errorMessage: string) {
    this.bits = bits;
    this.errorMessage = errorMessage;
  }

  static fromBase64Url(
    value: string,
    errorMessage = DEFAULT_READER_ERROR,
  ): BitReader {
    if (!value || !/^[A-Za-z0-9_-]+$/u.test(value)) {
      throw new Error(errorMessage);
    }

    const bits: number[] = [];
    for (const character of value) {
      const valueIndex = BASE64_URL_ALPHABET.indexOf(character);
      for (let bitIndex = 5; bitIndex >= 0; bitIndex--) {
        bits.push(Math.floor(valueIndex / 2 ** bitIndex) % 2);
      }
    }

    return new BitReader(bits, errorMessage);
  }

  /** Bits not yet consumed, including any trailing Base64 padding. */
  get remainingBitCount(): number {
    return this.bits.length - this.offset;
  }

  readBit(): number {
    if (this.offset >= this.bits.length) {
      throw new Error(this.errorMessage);
    }

    return this.bits[this.offset++];
  }

  readBits(bitCount: number): number {
    if (!Number.isSafeInteger(bitCount) || bitCount < 0) {
      throw new Error(this.errorMessage);
    }

    let value = 0;

    for (let bitIndex = 0; bitIndex < bitCount; bitIndex++) {
      value = value * 2 + this.readBit();
    }

    return value;
  }

  readVarUint(): number {
    let value = 0;
    let multiplier = 1;

    for (let byteIndex = 0; byteIndex < 8; byteIndex++) {
      const byte = this.readBits(8);
      value += (byte % 128) * multiplier;

      if (!Number.isSafeInteger(value)) {
        throw new Error(this.errorMessage);
      }

      if (byte < 128) {
        return value;
      }

      multiplier *= 128;
    }

    throw new Error(this.errorMessage);
  }

  assertOnlyPaddingRemains(): void {
    const remainingBits = this.bits.slice(this.offset);
    if (remainingBits.length > 5 || remainingBits.some((bit) => bit !== 0)) {
      throw new Error(this.errorMessage);
    }
  }
}
