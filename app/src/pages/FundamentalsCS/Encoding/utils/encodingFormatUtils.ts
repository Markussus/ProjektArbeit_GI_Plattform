export function byteToHex(b: number): string {
  return b.toString(16).toUpperCase().padStart(2, "0");
}

export function bytesToHex(bytes: number[]): string {
  return bytes.map(byteToHex).join(" ");
}

export function byteToBinary(b: number): string {
  return b.toString(2).padStart(8, "0");
}

export function bytesToBinary(bytes: number[]): string {
  return bytes.map(byteToBinary).join(" ");
}
