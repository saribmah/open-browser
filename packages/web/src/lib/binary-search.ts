/**
 * Binary search utility for finding insertion points in sorted arrays
 * Returns the index where the item is found or should be inserted
 */

export interface SearchResult {
  found: boolean
  index: number
}

/**
 * Performs binary search on a sorted array
 * @param array - The sorted array to search
 * @param target - The value to search for
 * @param accessor - Function to get the comparable value from array items
 * @returns SearchResult with found flag and index
 */
export function binarySearch<T>(
  array: T[],
  target: string,
  accessor: (item: T) => string
): SearchResult {
  let left = 0
  let right = array.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const midValue = accessor(array[mid]!)

    if (midValue === target) {
      return { found: true, index: mid }
    }

    if (midValue < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  // Not found, return insertion point
  return { found: false, index: left }
}
