"use client";

import { type RefObject, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ---------------------------------------------- remembered on/off choices */

const prefListeners = new Set<() => void>();

function subscribePref(cb: () => void) {
  prefListeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    prefListeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Boolean preference kept in localStorage, shared by every component that reads it. */
export function usePref(key: string, fallback: boolean): [boolean, (value: boolean) => void] {
  const storageKey = `fp:${key}`;
  const value = useSyncExternalStore(
    subscribePref,
    () => {
      const raw = localStorage.getItem(storageKey);
      return raw === null ? fallback : raw === "1";
    },
    () => fallback,
  );
  const set = useCallback(
    (next: boolean) => {
      localStorage.setItem(storageKey, next ? "1" : "0");
      prefListeners.forEach((l) => l());
    },
    [storageKey],
  );
  return [value, set];
}

/* --------------------------------------------------------------- fullscreen */

function subscribeFullscreen(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  return () => document.removeEventListener("fullscreenchange", cb);
}

/**
 * Focus reading mode. Uses the Fullscreen API when it exists; otherwise
 * `pseudo` is set and the caller covers the page with a fixed layer.
 */
export function useFocusMode(ref: RefObject<HTMLElement | null>) {
  const native = useSyncExternalStore(subscribeFullscreen, () => !!ref.current && document.fullscreenElement === ref.current, () => false);
  const [pseudo, setPseudo] = useState(false);
  const active = native || pseudo;

  const enter = useCallback(() => {
    const el = ref.current;
    if (el && document.fullscreenEnabled && el.requestFullscreen) {
      el.requestFullscreen().catch(() => setPseudo(true));
    } else {
      setPseudo(true);
    }
  }, [ref]);

  const exit = useCallback(() => {
    setPseudo(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    if (!pseudo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPseudo(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [pseudo]);

  return { active, enter, exit };
}

/* ------------------------------------------------------- dialog behaviour */

const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,iframe,[tabindex]:not([tabindex="-1"])';

/** Esc closes, Tab stays inside, focus returns to the opener on close. */
export function useDialogA11y(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const closeRef = useCallbackRef(onClose);
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const first = ref.current?.querySelector<HTMLElement>("[data-autofocus]") ?? ref.current?.querySelector<HTMLElement>(focusable);
      first?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(focusable)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey, true);
      opener?.focus?.();
    };
  }, [open, ref, closeRef]);
}

function useCallbackRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/* ---------------------------------------------------------------- scrollspy */

/** Id of the section currently being read. Uses IntersectionObserver, no scroll listeners. */
export function useScrollSpy(ids: string[], key: string) {
  const [state, setState] = useState<{ key: string; id: string | null }>({ key, id: null });
  const joined = ids.join("|");

  useEffect(() => {
    const list = joined ? joined.split("|") : [];
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting);
        const first = list.find((id) => visible.get(id));
        if (first) setState({ key, id: first });
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [joined, key]);

  return state.key === key ? state.id : null;
}
