import type { StateName } from "./faTypes";

/**
 * Snaps typed transition targets onto the automaton's real state names,
 * ignoring case: "s0" becomes "S0" because that state exists.
 *
 * Deliberately not a plain uppercase. States added in the editor are always
 * `S0`, `S1`, … , but the grammar converter names its final state `sF` (see
 * `uniqueFinalStateName`) and turns grammar non-terminals into states verbatim,
 * so uppercasing would rewrite `sF` to `SF` and break every automaton built
 * from a grammar. Matching against the state list gets the convenience without
 * inventing names — and fixes `sf` to `sF` too.
 *
 * A token that matches no state, or matches more than one, is left exactly as
 * typed so the existing validation can report it.
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
