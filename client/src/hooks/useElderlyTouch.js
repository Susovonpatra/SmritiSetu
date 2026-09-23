import { useState, useRef, useCallback } from 'react';

/**
 * useElderlyTouch:
 * - 400ms software debounce to ignore tremors and double-taps
 * - Calculates latency (ttap - tprompt_end)
 * - Calculates coordinate jitter displacement sqrt(dx^2 + dy^2)
 */
export function useElderlyTouch({ debounceMs = 400, onValidTap } = {}) {
  const [promptEndTime, setPromptEndTime] = useState(Date.now());
  const [lastMetrics, setLastMetrics] = useState({ latencyMs: 0, jitterPx: 0 });

  const lastTapTimeRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0, time: 0 });

  // Call this whenever a voice/visual prompt finishes presenting
  const registerPromptEnd = useCallback((timestamp = Date.now()) => {
    setPromptEndTime(timestamp);
  }, []);

  const handlePointerDown = useCallback((e) => {
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    touchStartPosRef.current = {
      x: clientX,
      y: clientY,
      time: Date.now()
    };
  }, []);

  const handlePointerUp = useCallback((e, itemData) => {
    const now = Date.now();

    // 400ms software debounce to ignore tremors and involuntary secondary taps
    if (now - lastTapTimeRef.current < debounceMs) {
      return false;
    }
    lastTapTimeRef.current = now;

    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX) || touchStartPosRef.current.x;
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0]?.clientY) || touchStartPosRef.current.y;

    const dx = clientX - touchStartPosRef.current.x;
    const dy = clientY - touchStartPosRef.current.y;
    const jitter = Math.sqrt(dx * dx + dy * dy);

    // Latency = ttap - tprompt_end
    const latency = Math.max(0, now - promptEndTime);

    const metrics = {
      latencyMs: Math.round(latency),
      jitterPx: Math.round(jitter * 10) / 10,
      timestamp: new Date().toISOString()
    };

    setLastMetrics(metrics);

    if (onValidTap) {
      onValidTap(itemData, metrics);
    }

    return metrics;
  }, [debounceMs, promptEndTime, onValidTap]);

  return {
    registerPromptEnd,
    handlePointerDown,
    handlePointerUp,
    lastMetrics,
    promptEndTime
  };
}
