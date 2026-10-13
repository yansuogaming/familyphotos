"use client";

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";

type Guard = {
  mark: (key: string, dirty: boolean) => void;
  isDirty: () => boolean;
  clear: () => void;
};

const Ctx = createContext<Guard>({ mark: () => {}, isDirty: () => false, clear: () => {} });

/** Tracks which admin forms hold unsaved edits. A plain set: nothing re-renders. */
export function UnsavedProvider({ children }: { children: ReactNode }) {
  const [guard] = useState<Guard>(() => {
    const dirty = new Set<string>();
    return {
      mark: (key, d) => {
        if (d) dirty.add(key);
        else dirty.delete(key);
      },
      isDirty: () => dirty.size > 0,
      clear: () => dirty.clear(),
    };
  });
  return <Ctx.Provider value={guard}>{children}</Ctx.Provider>;
}

export const useUnsavedGuard = () => useContext(Ctx);

/** Call in a form: warns before closing the tab and before leaving via the admin menu. */
export function useUnsavedChanges(dirty: boolean) {
  const key = useId();
  const guard = useContext(Ctx);

  useEffect(() => {
    guard.mark(key, dirty);
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, guard, key]);

  useEffect(() => () => guard.mark(key, false), [guard, key]);
}
