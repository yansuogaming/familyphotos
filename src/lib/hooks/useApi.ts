"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type State<T> = { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: T };

/** Minimal loader: status, data and a reload function. */
export function useApi<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [nonce, setNonce] = useState(0);
  const key = `${JSON.stringify(deps)}:${nonce}`;
  const [result, setResult] = useState<{ key: string; state: State<T> } | null>(null);
  const loadRef = useRef(load);

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let alive = true;
    loadRef.current().then(
      (data) => alive && setResult({ key, state: { status: "ready", data } }),
      (error) => alive && setResult({ key, state: { status: "error", error } }),
    );
    return () => {
      alive = false;
    };
  }, [key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const state: State<T> = result?.key === key ? result.state : { status: "loading" };
  return { ...state, reload };
}
