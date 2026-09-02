import { useCallback, useEffect, useState } from "react";
import { isUnauthorized } from "./format";

export function useApi<T>(fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setError(res.error);
        setData(null);
      } else {
        setData(res.data);
      }
    } catch (err) {
      if (isUnauthorized(err)) {
        setError("signin");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
