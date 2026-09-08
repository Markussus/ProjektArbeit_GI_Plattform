import type { StateName } from "./faTypes";

/**
 * Snaps typed transition targets onto the automaton's real state names, ignoring
 * case: "s0" becomes "S0" because that state exists. Deliberately not a plain
 * uppercase — that would rewrite the grammar converter's `sF` and its verbatim
 * non-terminal states. A token matching no state, or several, is left as typed
 * for validation to report.
 */
export function canonicalizeTargetStates(
  value: string,
  states: StateName[],
): string {
  const byLowerName = new Map<string, StateName | null>();
  for (const state of states) {
    const key = state.toLowerCase();
    // Two states differing only in case make the match ambiguous; record the
    // collision so neither claims the token.
    byLowerName.set(key, byLowerName.has(key) ? null : state);
  }

  let didChange = false;
  const tokens = value.split(",").map((token) => {
    const trimmed = token.trim();
    if (!trimmed) {
      return token;
    }

    const match = byLowerName.get(trimmed.toLowerCase());
    if (!match || match === trimmed) {
      return token;
    }

    didChange = true;
    return token.replace(trimmed, match);
  });

  return didChange ? tokens.join(",") : value;
}
