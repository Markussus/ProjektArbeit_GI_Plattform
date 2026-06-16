import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";

export type EncoderMode = "base64" | "utf8";
export type ConverterMode = "encode" | "decode";

export interface EncoderState {
  activeMode: EncoderMode;
  base64?: {
    inputValue: string;
    converterMode: ConverterMode;
  };
  utf8?: {
    inputValue: string;
    converterMode: ConverterMode;
  };
}

function parseEncoderState(serializedValue: string): EncoderState {
  let cleaned = serializedValue.replace(/[^A-Za-z0-9+/=_-]/g, "");
  const prefixIndex = cleaned.indexOf("djF8");
  if (prefixIndex > 0) {
    cleaned = cleaned.substring(prefixIndex);
  }
  let base64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const decodedStr = decodeURIComponent(escape(atob(base64)));

  if (decodedStr.startsWith("{")) {
    const parsed = JSON.parse(decodedStr) as Partial<EncoderState>;
    if (!parsed || !parsed.activeMode) {
      throw new Error("Invalid state");
    }
    return parsed as EncoderState;
  }

  const parts = decodedStr.split("|");
  if (parts[0] !== "v1") {
    throw new Error("Unsupported format version");
  }

  const modeChar = parts[1];
  const state: EncoderState = { activeMode: "base64" };

  if (modeChar === "b") {
    state.activeMode = "base64";
    if (parts.length >= 4) {
      state.base64 = {
        converterMode: parts[2] === "e" ? "encode" : "decode",
        inputValue: parts.slice(3).join("|"),
      };
    }
  } else if (modeChar === "u") {
    state.activeMode = "utf8";
    if (parts.length >= 4) {
      state.utf8 = {
        converterMode: parts[2] === "e" ? "encode" : "decode",
        inputValue: parts.slice(3).join("|"),
      };
    }
  } else {
    throw new Error("Invalid mode");
  }

  return state;
}

export const encTransferCodec: ISimulatorTransferCodec<EncoderState> = {
  async exportValue(value: EncoderState): Promise<string> {
    try {
      const parts: string[] = ["v1"];

      if (value.activeMode === "base64") {
        parts.push("b");
        if (value.base64) {
          parts.push(value.base64.converterMode === "encode" ? "e" : "d");
          parts.push(value.base64.inputValue);
        }
      } else if (value.activeMode === "utf8") {
        parts.push("u");
        if (value.utf8) {
          parts.push(value.utf8.converterMode === "encode" ? "e" : "d");
          parts.push(value.utf8.inputValue);
        }
      }

      const rawStr = parts.join("|");
      return btoa(unescape(encodeURIComponent(rawStr)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    } catch {
      throw new Error("Failed to export encoding state");
    }
  },

  async importValue(serializedValue: string): Promise<EncoderState> {
    try {
      return parseEncoderState(serializedValue);
    } catch {
      throw new Error("Failed to import encoding state");
    }
  },
};
