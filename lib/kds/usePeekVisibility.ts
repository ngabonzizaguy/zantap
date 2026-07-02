"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HIDE_DELAY_MS = 3000;
const MOUSE_MOVE_DEBOUNCE_MS = 120;

export function usePeekVisibility() {
  const [visible, setVisible] = useState(false);
  const hoveringRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMoveRef = useRef(0);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      if (!hoveringRef.current) {
        setVisible(false);
      }
    }, HIDE_DELAY_MS);
  }, []);

  const reveal = useCallback(() => {
    setVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    const onTouch = () => reveal();

    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveRef.current < MOUSE_MOVE_DEBOUNCE_MS) {
        return;
      }
      lastMoveRef.current = now;
      reveal();
    };

    document.addEventListener("touchstart", onTouch, { passive: true });
    document.addEventListener("pointerdown", onTouch, { passive: true });
    document.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouch);
      document.removeEventListener("pointerdown", onTouch);
      document.removeEventListener("mousemove", onMouseMove);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [reveal]);

  const peekHandlers = {
    onMouseEnter: () => {
      hoveringRef.current = true;
      setVisible(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    onMouseLeave: () => {
      hoveringRef.current = false;
      scheduleHide();
    },
  };

  return { visible, peekHandlers };
}
