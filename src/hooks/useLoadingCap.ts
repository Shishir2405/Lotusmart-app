import { useEffect, useRef, useState } from 'react';

/**
 * Gate a skeleton/loading indicator so it:
 *  - doesn't flash for sub-`minMs` loads (feels like jank),
 *  - never lingers past `maxMs` (after which we yield to content / empty state).
 *
 * Pass the query's `isPending` (or `isLoading`) flag; render skeletons only
 * while this returns true.
 */
export function useLoadingCap(
  loading: boolean,
  { minMs = 150, maxMs = 1500 }: { minMs?: number; maxMs?: number } = {},
): boolean {
  const [show, setShow] = useState(false);
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearAll = () => {
      if (minTimer.current) clearTimeout(minTimer.current);
      if (maxTimer.current) clearTimeout(maxTimer.current);
      minTimer.current = null;
      maxTimer.current = null;
    };

    if (loading) {
      clearAll();
      minTimer.current = setTimeout(() => {
        setShow(true);
        maxTimer.current = setTimeout(() => setShow(false), Math.max(0, maxMs - minMs));
      }, minMs);
    } else {
      clearAll();
      setShow(false);
    }
    return clearAll;
  }, [loading, minMs, maxMs]);

  return show;
}
