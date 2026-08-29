/**
 * The workspace's reset/expand controls float over its top-right corner, so
 * whatever a topic renders as its first row has to keep that corner clear.
 */
export const SIMULATION_CONTROLS_INSET = {
  /**
   * For a first row that spans the full width, or ends in a right-aligned
   * button. The controls take a row of their own until the viewport is wide
   * enough that reserving a column beside them does not squeeze the row.
   */
  fullWidthRow: "pt-12 lg:pt-0 lg:pr-[7.25rem]",
  /**
   * For a narrow, left-aligned first row such as a tab strip: it only has to
   * step out of the way while the controls cannot fit beside it.
   */
  compactRow: "pt-12 sm:pt-0",
} as const;
