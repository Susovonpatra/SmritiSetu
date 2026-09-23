import { useState, useEffect, useCallback } from 'react';

/**
 * useMotionDetector:
 * - Binds to HTML5 devicemotion API
 * - Triggers emergency alert if acceleration exceeds 25 m/s^2 (tablet drop/fall)
 * - Includes simulateDrop() method for testing
 */
export function useMotionDetector(threshold = 25.0) {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [peakAcceleration, setPeakAcceleration] = useState(0);
  const [lastDropTime, setLastDropTime] = useState(null);

  const triggerAlert = useCallback((magnitude) => {
    setIsAlertActive(true);
    setPeakAcceleration(Math.round(magnitude * 10) / 10);
    setLastDropTime(new Date().toLocaleTimeString());
  }, []);

  const dismissAlert = useCallback(() => {
    setIsAlertActive(false);
  }, []);

  const simulateDrop = useCallback(() => {
    triggerAlert(28.4);
  }, [triggerAlert]);

  useEffect(() => {
    const handleMotion = (event) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;

      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 0;

      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

      if (magnitude >= threshold) {
        triggerAlert(magnitude);
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [threshold, triggerAlert]);

  return {
    isAlertActive,
    peakAcceleration,
    lastDropTime,
    dismissAlert,
    simulateDrop
  };
}
