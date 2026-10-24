import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/db';
import { PatternTraceTelemetryService } from '@/services/patternTraceTelemetry';
import { BiographicalTelemetryService } from '@/services/biographicalTelemetry';
import { shapeGameApi } from '@/services/api/shapeGameApi';
import { telemetryApi } from '@/services/api/telemetryApi';



export function useCaretakerAnalytics(patientId = 1, trigger = null) {
  const [analyticsData, setAnalyticsData] = useState([]);
  const [patternAnalytics, setPatternAnalytics] = useState(null);
  const [biographicalAnalytics, setBiographicalAnalytics] = useState(null);
  const [shapeAnalytics, setShapeAnalytics] = useState(null);
  const [unifiedTimeline, setUnifiedTimeline] = useState([]);
  const [driftMetrics, setDriftMetrics] = useState({
    drift_percent: 18.4,
    current_latency: 940,
    baseline_latency: 800,
    jitter: 14.2,
    accuracy: 88.5,
    alert: false
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch PatternTrace motor & working memory analytics (Game 2)
      const patternData = await PatternTraceTelemetryService.getLongitudinalAnalytics(patientId);
      setPatternAnalytics(patternData);

      // Group PatternTrace trials into daily trend map
      const patternTrendMap = new Map();
      try {
        if (db.patterntrace_trials) {
          const ptTrials = await db.patterntrace_trials
            .where('patient_id')
            .equals(Number(patientId) || 1)
            .toArray();

          const ptDailyGroups = new Map();
          ptTrials.forEach(t => {
            if (!t.timestamp) return;
            const dateKey = new Date(t.timestamp).toISOString().slice(0, 10);
            if (!ptDailyGroups.has(dateKey)) {
              ptDailyGroups.set(dateKey, { total: 0, accSum: 0, latencySum: 0, maxLevel: 1 });
            }
            const group = ptDailyGroups.get(dateKey);
            group.total += 1;
            group.accSum += (t.accuracy_score != null ? Math.round(t.accuracy_score * 100) : 85);
            group.latencySum += (t.initiation_latency_ms || 800);
            group.maxLevel = Math.max(group.maxLevel, t.level || 1);
          });

          ptDailyGroups.forEach((val, dateKey) => {
            patternTrendMap.set(dateKey, {
              accuracy: Math.round(val.accSum / val.total),
              avgLatency: Math.round(val.latencySum / val.total),
              maxLevel: val.maxLevel,
              count: val.total
            });
          });
        }
      } catch (err) {
        console.warn('PatternTrace daily trend calculation error:', err);
      }

      // 2. Fetch Biographical memory analytics (Family & Relational Recall - Game 1)
      let bioSummary = null;
      let bioTrends = [];
      let bioBreakdown = [];
      let bioConfusion = [];
      let bioFatigue = null;
      let bioSpatial = [];

      try {
        const [summary, trends, breakdown, confusion, fatigue, spatial] = await Promise.all([
          BiographicalTelemetryService.getExecutiveSummary(patientId),
          BiographicalTelemetryService.getLongitudinalTrends(patientId),
          BiographicalTelemetryService.getRelationalMemoryBreakdown(patientId),
          BiographicalTelemetryService.getConfusionFrequencyMatrix(patientId),
          BiographicalTelemetryService.getCognitiveFatigueMetric(patientId),
          BiographicalTelemetryService.getSpatialDistribution(patientId)
        ]);
        bioSummary = summary;
        bioTrends = trends;
        bioBreakdown = breakdown;
        bioConfusion = confusion;
        bioFatigue = fatigue;
        bioSpatial = spatial;
      } catch (err) {
        console.warn('Biographical telemetry fetch error:', err);
      }

      setBiographicalAnalytics({
        summary: bioSummary,
        trends: bioTrends,
        breakdown: bioBreakdown,
        confusion: bioConfusion,
        fatigue: bioFatigue,
        spatial: bioSpatial
      });

      // 3. Fetch Shape Match Progress Analytics (Game 3)
      let shapeData = null;
      let liveShapeSummary = null;
      try {
        liveShapeSummary = await shapeGameApi.getCaregiverSummary(patientId, '30d');
        if (liveShapeSummary && liveShapeSummary.metrics && (liveShapeSummary.shapeRankings?.length > 0 || liveShapeSummary.metrics.totalSessionsInRange > 0)) {
          shapeData = {
            ...liveShapeSummary,
            metrics: {
              ...liveShapeSummary.metrics,
              averageIndependenceScore: liveShapeSummary.metrics.averageIndependenceScore ?? 0,
              overallAccuracyPct: liveShapeSummary.metrics.overallAccuracyPct ?? 0,
              medianSolveTimeMs: liveShapeSummary.metrics.medianSolveTimeMs ?? 0,
              medianLatencyMs: liveShapeSummary.metrics.medianLatencyMs ?? 0,
              medianJitterPx: liveShapeSummary.metrics.medianJitterPx ?? 0
            },
            shapeRankings: (liveShapeSummary.shapeRankings && liveShapeSummary.shapeRankings.length > 0)
              ? liveShapeSummary.shapeRankings
              : [],
            confusionPairs: (liveShapeSummary.confusionPairs && liveShapeSummary.confusionPairs.length > 0)
              ? liveShapeSummary.confusionPairs
              : []
          };
        }
      } catch (err) {
        console.warn('Live shape analytics summary fetch error, checking local store:', err);
      }

      // Check local Dexie shape sessions if backend summary is empty
      const shapeTrendMap = new Map();
      if (liveShapeSummary?.timeline && Array.isArray(liveShapeSummary.timeline)) {
        liveShapeSummary.timeline.forEach(st => {
          let dateStr = '';
          if (st.fullDate) {
            dateStr = st.fullDate.slice(0, 10);
          } else if (st.date) {
            const parsed = new Date(st.date);
            if (!isNaN(parsed.getTime())) dateStr = parsed.toISOString().slice(0, 10);
          }
          if (dateStr) {
            shapeTrendMap.set(dateStr, {
              accuracy: Math.round(st.accuracyPct ?? 0),
              independence: Math.round(st.independenceScore ?? 0),
              solveTimeMs: Math.round(st.solveTimeMs ?? 0)
            });
          }
        });
      }

      // Check local Dexie shape sessions ONLY if backend summary is empty/offline
      if (!shapeData) {
        try {
          if (db.shape_game_sessions) {
            const localSessions = await db.shape_game_sessions
              .where('patientId')
              .equals(Number(patientId) || 1)
              .toArray();

            // Deduplicate by sessionId and filter test/seed artifacts
            const uniqueMap = new Map();
            localSessions.forEach(s => {
              if (s && s.sessionId && typeof s.sessionId === 'string' &&
                  !s.sessionId.startsWith('seed-') &&
                  !s.sessionId.startsWith('test-') &&
                  !s.sessionId.startsWith('e2e-')) {
                uniqueMap.set(s.sessionId, s);
              }
            });
            const validLocalSessions = Array.from(uniqueMap.values());

            if (validLocalSessions.length > 0) {
              const total = validLocalSessions.length;
              const avgInd = Math.round(validLocalSessions.reduce((acc, s) => acc + (s.independenceScore ?? 100), 0) / total);
              const validAccSessions = validLocalSessions.filter(s => s.accuracyPct != null);
              const avgAcc = validAccSessions.length > 0
                ? Math.round(validAccSessions.reduce((acc, s) => acc + s.accuracyPct, 0) / validAccSessions.length)
                : 100;
              const validSolveTimes = validLocalSessions.map(s => s.medianSolveTimeMs).filter(t => t > 0);
              const medianSolve = validSolveTimes.length > 0
                ? validSolveTimes.sort((a, b) => a - b)[Math.floor(validSolveTimes.length / 2)]
                : 0;
              const lastSession = validLocalSessions[validLocalSessions.length - 1];

              shapeData = {
                patientId,
                rangeDays: 30,
                metrics: {
                  lastSessionDate: lastSession.startedAt ? new Date(lastSession.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
                  sessionsThisWeek: validLocalSessions.length,
                  totalSessionsInRange: validLocalSessions.length,
                  averageIndependenceScore: avgInd,
                  overallAccuracyPct: avgAcc,
                  medianSolveTimeMs: medianSolve,
                  medianLatencyMs: 0,
                  medianJitterPx: 0
                },
                shapeRankings: [],
                confusionPairs: [],
                activeAlerts: [],
                timeOfDayDistribution: []
              };

              validLocalSessions.forEach(s => {
                if (!s.startedAt) return;
                const dateKey = new Date(s.startedAt).toISOString().slice(0, 10);
                const indScore = Math.round(s.independenceScore ?? 100);
                const accScore = Math.round(s.accuracyPct ?? 100);
                const solveTime = Math.round(s.medianSolveTimeMs ?? 0);
                const existing = shapeTrendMap.get(dateKey);
                if (!existing) {
                  shapeTrendMap.set(dateKey, {
                    accuracy: accScore,
                    independence: indScore,
                    solveTimeMs: solveTime
                  });
                } else {
                  existing.independence = Math.round((existing.independence + indScore) / 2);
                  existing.accuracy = Math.round((existing.accuracy + accScore) / 2);
                  if (solveTime > 0) existing.solveTimeMs = Math.round((existing.solveTimeMs + solveTime) / 2);
                }
              });
            }
          }
        } catch (err) {
          console.warn('Local shape sessions lookup error:', err);
        }
      }

      if (!shapeData) {
        shapeData = {
          patientId,
          rangeDays: 30,
          metrics: {
            lastSessionDate: 'None',
            sessionsThisWeek: 0,
            totalSessionsInRange: 0,
            averageIndependenceScore: 0,
            overallAccuracyPct: 0,
            medianSolveTimeMs: 0,
            medianLatencyMs: 0,
            medianJitterPx: 0
          },
          shapeRankings: [],
          confusionPairs: [],
          activeAlerts: [],
          timeOfDayDistribution: []
        };
      }
      setShapeAnalytics(shapeData);

      // 4. Check if ANY game has actually been played
      const bioTotal = bioSummary?.totalTrials || 0;
      const ptTotal = patternData?.totalTrials || 0;
      const shapeTotal = shapeData?.metrics?.totalSessionsInRange || 0;
      const hasAnyGameData = bioTotal > 0 || ptTotal > 0 || shapeTotal > 0;

      if (!hasAnyGameData) {
        // Completely empty initial state until first game is played
        setDriftMetrics({
          drift_percent: 0,
          current_latency: 0,
          baseline_latency: 0,
          jitter: 0,
          accuracy: 0,
          alert: false
        });
        setUnifiedTimeline([]);
        setAnalyticsData([]);
        return;
      }

      // 5. If games HAVE been played, fetch live drift or compute from real trials
      let liveDrift = null;
      try {
        liveDrift = await telemetryApi.getDrift(patientId);
      } catch {
        // Backend offline
      }

      const baseline = 800;
      let computedDrift = 0;
      let recentLatency = 0;
      let currentAcc = 0;

      if (liveDrift && liveDrift.cognitive_drift_percent !== undefined) {
        computedDrift = liveDrift.cognitive_drift_percent;
        recentLatency = liveDrift.current_mean_latency_ms || 0;
        currentAcc = liveDrift.current_accuracy_pct || 0;
      }

      setDriftMetrics({
        drift_percent: Math.round(computedDrift * 10) / 10,
        current_latency: Math.round(recentLatency),
        baseline_latency: baseline,
        jitter: liveDrift?.current_mean_jitter_px || 0,
        accuracy: currentAcc,
        alert: computedDrift > 35.0
      });

      // 6. Construct Timeline strictly from ACTUAL game session dates
      const allActiveDates = new Set([
        ...bioTrendMap.keys(),
        ...patternTrendMap.keys(),
        ...shapeTrendMap.keys()
      ]);

      const sortedDates = Array.from(allActiveDates).sort();
      const timeline = sortedDates.map(dateIso => {
        const d = new Date(dateIso + 'T12:00:00');
        const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const bioDay = bioTrendMap.get(dateIso);
        const ptDay = patternTrendMap.get(dateIso);
        const shapeDay = shapeTrendMap.get(dateIso);

        const familyAccuracy = bioDay ? bioDay.accuracy : null;
        const familyLatencyMs = bioDay ? bioDay.avgLatency : null;

        const patternAccuracy = ptDay ? ptDay.accuracy : null;
        const patternLatencyMs = ptDay ? ptDay.avgLatency : null;

        const shapeAccuracy = shapeDay ? shapeDay.accuracy : null;
        const shapeIndependence = shapeDay ? shapeDay.independence : null;
        const shapeSolveTimeMs = shapeDay ? shapeDay.solveTimeMs : null;

        const scores = [];
        if (familyAccuracy != null) scores.push(familyAccuracy);
        if (patternAccuracy != null) scores.push(patternAccuracy);
        if (shapeAccuracy != null) scores.push(shapeAccuracy);
        const compositeScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        const speeds = [];
        if (familyLatencyMs != null) speeds.push(familyLatencyMs);
        if (patternLatencyMs != null) speeds.push(patternLatencyMs);
        if (shapeSolveTimeMs != null) speeds.push(shapeSolveTimeMs);
        const compositeSpeedMs = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : null;

        return {
          date: dateIso,
          day: dayLabel,
          familyAccuracy,
          patternAccuracy,
          shapeAccuracy,
          shapeIndependence,
          compositeScore,
          familySpeedSec: familyLatencyMs != null && familyLatencyMs > 0 ? Number((familyLatencyMs / 1000).toFixed(2)) : null,
          patternSpeedSec: patternLatencyMs != null && patternLatencyMs > 0 ? Number((patternLatencyMs / 1000).toFixed(2)) : null,
          shapeSpeedSec: shapeSolveTimeMs != null && shapeSolveTimeMs > 0 ? Number((shapeSolveTimeMs / 1000).toFixed(2)) : null,
          compositeSpeedSec: compositeSpeedMs != null && compositeSpeedMs > 0 ? Number((compositeSpeedMs / 1000).toFixed(2)) : null,
          latency_ms: compositeSpeedMs,
          accuracy_pct: compositeScore,
          jitter_px: 12,
          baseline: 800,
          drift_pct: 0
        };
      });

      setUnifiedTimeline(timeline);
      setAnalyticsData(timeline);

    } catch (err) {
      console.warn('Caretaker analytics comprehensive load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData, trigger]);

  // Real-time listener: refresh analytics immediately when any game is completed or window gains focus
  useEffect(() => {
    const handleGameCompleted = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('smritisetu:game_completed', handleGameCompleted);
      window.addEventListener('focus', handleGameCompleted);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('smritisetu:game_completed', handleGameCompleted);
        window.removeEventListener('focus', handleGameCompleted);
      }
    };
  }, [loadData]);

  return {
    analyticsData,
    patternAnalytics,
    biographicalAnalytics,
    shapeAnalytics,
    unifiedTimeline,
    driftMetrics,
    isLoading,
    refetch: loadData
  };
}
