import type { ISimulatorTransferCodec } from "@/types/simulatorTransfer";
import { BitReader, BitWriter } from "@/lib/trainingCenter";
import type { AutomatonType, FAProgram, FATransitionMap } from "./faTypes";
import { faProgramTransferCodec } from "./faProgramTransfer";

const DRAFT_INVALID = "fa_draft_transfer_invalid";
const PAYLOAD_INVALID = "fa_draft_transfer_payload_invalid";
const MAX_DRAFT_BYTES = 1_000_000;

/**
 * Marks a payload as a draft. A slot can also hold a compact transfer payload —
 * a save written before this codec existed, or a string imported from someone
 * else — so the marker is what tells the two formats apart before either one
 * gets parsed.
 */
const DRAFT_FORMAT_MARKER = 0x4641; // "FA"
const DRAFT_FORMAT_MARKER_BITS = 16;

/**
 * Transfer codec for an automaton in progress.
 *
 * {@link faProgramTransferCodec} encodes the automaton a learner means to
 * share, and refuses anything that is not a well-formed program: no repeated
 * alphabet symbol, no start state outside the state set. Those are the right
 * rules for a string handed to somebody else, and the wrong ones for an
 * autosave — a draft is half-built for as long as it is being built, and a
 * codec that rejects it makes every save of that exercise fail silently, since
 * nothing in the save path reports an error.
 *
 * So this codec never judges the automaton. It writes the draft as JSON and
 * reads back only enough to be sure the editor can render what it got.
 */
export const faProgramDraftCodec: ISimulatorTransferCodec<FAProgram> = {
  async exportValue(program) {
    const bytes = new TextEncoder().encode(JSON.stringify(program));
    if (bytes.length > MAX_DRAFT_BYTES) {
      throw new Error(DRAFT_INVALID);
    }

    const writer = new BitWriter(DRAFT_INVALID);
    writer.writeBits(DRAFT_FORMAT_MARKER, DRAFT_FORMAT_MARKER_BITS);
    for (const byte of bytes) {
      writer.writeBits(byte, 8);
    }
    return writer.toBase64Url();
  },

  async importValue(serializedValue) {
    const trimmedValue = serializedValue.trim();
    if (!trimmedValue) {
      throw new Error(PAYLOAD_INVALID);
    }

    const draft = readDraftPayload(trimmedValue);
    if (draft) {
      return draft;
    }

    // Not a draft: either a slot saved by an older build or a transfer string
    // someone shared. Reading those here is what carries saved work across the
    // format change instead of quietly dropping it.
    return faProgramTransferCodec.importValue(trimmedValue);
  },
};

/**
 * Read a draft payload, or return null for anything that is not one — a
 * corrupt payload included, so the compact codec gets its turn and reports the
 * failure in its own terms.
 */
function readDraftPayload(payload: string): FAProgram | null {
  let reader: BitReader;
  try {
    reader = BitReader.fromBase64Url(payload, PAYLOAD_INVALID);
  } catch {
    return null;
  }

  if (
    reader.remainingBitCount < DRAFT_FORMAT_MARKER_BITS ||
    reader.readBits(DRAFT_FORMAT_MARKER_BITS) !== DRAFT_FORMAT_MARKER
  ) {
    return null;
  }

  // Whole bytes only; the trailing Base64 character contributes pad bits,
  // which `assertOnlyPaddingRemains` then requires to be zero.
  const byteCount = Math.floor(reader.remainingBitCount / 8);
  if (byteCount === 0 || byteCount > MAX_DRAFT_BYTES) {
    return null;
  }

  try {
    const bytes = Uint8Array.from({ length: byteCount }, () =>
      reader.readBits(8),
    );
    reader.assertOnlyPaddingRemains();
    const json: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    return toDraftProgram(json);
  } catch {
    return null;
  }
}

/**
 * Check the shape the editor needs, and only that. Whether the automaton is
 * sensible is the validator's business and the learner's; whether it is an
 * object with the right fields is this codec's, because the payload comes out
 * of browser storage and could be anything at all.
 */
function toDraftProgram(value: unknown): FAProgram | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const type = candidate.type;
  if (type !== "DFA" && type !== "NFA") {
    return null;
  }

  const states = toStringArray(candidate.states);
  const alphabet = toStringArray(candidate.alphabet);
  const acceptStates = toStringArray(candidate.acceptStates);
  const transitions = toTransitionMap(candidate.transitions);

  if (
    !states ||
    !alphabet ||
    !acceptStates ||
    !transitions ||
    typeof candidate.startState !== "string"
  ) {
    return null;
  }

  return {
    type: type satisfies AutomatonType,
    states,
    alphabet,
    transitions,
    startState: candidate.startState,
    acceptStates,
  };
}

function toStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.every((entry) => typeof entry === "string")
    ? (value as string[])
    : null;
}

function toTransitionMap(value: unknown): FATransitionMap | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const transitions: FATransitionMap = {};
  for (const [fromState, row] of Object.entries(value)) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      return null;
    }

    const parsedRow: Record<string, string[]> = {};
    for (const [symbol, targets] of Object.entries(row)) {
      const parsedTargets = toStringArray(targets);
      if (!parsedTargets) {
        return null;
      }
      parsedRow[symbol] = parsedTargets;
    }
    transitions[fromState] = parsedRow;
  }

  return transitions;
}
