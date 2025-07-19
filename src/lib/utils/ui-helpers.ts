import { times } from "lodash";
import { ReactElement } from "react";

/**
 * Generate skeleton elements for loading states
 * Replaces [...Array(n)].map pattern with lodash times
 */
export function generateSkeletons(
  count: number,
  renderFunction: (index: number) => ReactElement
): ReactElement[] {
  return times(count, renderFunction);
}

/**
 * Generate placeholder items for empty states
 */
export function generatePlaceholders<T>(
  count: number,
  generator: (index: number) => T
): T[] {
  return times(count, generator);
}
