import React, { useState } from 'react';
import {
  Brain,
  Heart,
  Layers,
  Shapes,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Repeat,
  Sparkles,
  Info,
  ChevronRight,
  Activity,
  Award,
  Sun,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Cell
} from 'recharts';
import { ShapeSvg } from '@/features/games/shapes/ShapeSvg';
import { SHAPES_BY_ID } from '@/features/games/shapes/shapeConfig';

export function UnifiedAnalyticsDashboard({
  displayPatientName = 'Bhaben Baruah',
  driftMetrics = {},
  patternAnalytics = {},
  biographicalAnalytics = {},
  shapeAnalytics = {},
  unifiedTimeline = [],
  isLoading = false,
  onRefresh,
  onOpenReportModal
}) {
  // Active game view: 'all' | 'biographical' | 'pattern' | 'shape'
  const [selectedGameView, setSelectedGameView] = useState('all');

  // Chart Metric Toggle for Combined Chart: 'accuracy' (percentage) | 'speed' (seconds)
  const [chartMetric, setChartMetric] = useState('accuracy');

  const isAlert = driftMetrics?.alert || false;
  const driftPercent = driftMetrics?.drift_percent ?? 0;

  // Biographical summary shortcuts (Game 1)
  const bioSummary = biographicalAnalytics?.summary || {};
  const hasBioData = (bioSummary.totalTrials || 0) > 0;
  const bioOverallAcc = hasBioData ? (bioSummary.overallAccuracy ?? 0) : null;
  const bioTier1Stability = hasBioData ? (bioSummary.tier1Stability ?? 0) : null;
  const bioLatencySec = hasBioData && bioSummary.averageLatencyMs
    ? Number((bioSummary.averageLatencyMs / 1000).toFixed(1))
    : null;

  // PatternTrace summary shortcuts (Game 2)
  const hasPtData = (patternAnalytics?.totalTrials || 0) > 0;
  const ptCurrentLevel = hasPtData ? (patternAnalytics?.currentLevel ?? 1) : 1;
  const ptMaxLevel = hasPtData ? (patternAnalytics?.maxLevelAchieved ?? 1) : 1;
  const ptAcc = hasPtData ? (patternAnalytics?.meanAccuracyPct ?? 0) : null;
  const ptLatencySec = hasPtData && patternAnalytics?.meanLatency
    ? Number((patternAnalytics.meanLatency / 1000).toFixed(1))
    : null;
  const ptPerseveration = hasPtData ? (patternAnalytics?.perseverationCount || 0) : 0;

  // Match the Shapes summary shortcuts (Game 3)
  const shapeMetrics = shapeAnalytics?.metrics || {};
  const hasShapeData = (shapeMetrics.totalSessionsInRange || 0) > 0 || (shapeMetrics.totalTrials || 0) > 0;
  const shapeIndependence = hasShapeData ? (shapeMetrics.averageIndependenceScore ?? 0) : null;
  const shapeAcc = hasShapeData ? (shapeMetrics.overallAccuracyPct ?? 0) : null;
  const shapeSolveTimeSec = hasShapeData && shapeMetrics.medianSolveTimeMs
    ? Number((shapeMetrics.medianSolveTimeMs / 1000).toFixed(1))
    : null;
  const shapeLatencySec = hasShapeData && shapeMetrics.medianLatencyMs
    ? Number((shapeMetrics.medianLatencyMs / 1000).toFixed(1))
    : null;
  const shapeJitter = hasShapeData ? (shapeMetrics.medianJitterPx ?? 0) : null;
  const shapeRankings = shapeAnalytics?.shapeRankings || [];
  const shapeConfusionPairs = shapeAnalytics?.confusionPairs || [];
  const shapeTimeOfDay = shapeAnalytics?.timeOfDayDistribution || [];

  const hasAnyData = hasBioData || hasPtData || hasShapeData;

  // Composite Master Score across only the games that have actually been played
  const activeScores = [];
  if (hasBioData && bioOverallAcc !== null) activeScores.push(bioOverallAcc);
  if (hasPtData && ptAcc !== null) activeScores.push(ptAcc);
  if (hasShapeData && shapeAcc !== null) activeScores.push(shapeAcc);

  const masterScore = activeScores.length > 0
    ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
    : null;

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-8">
      {/* ── 1. TOP EXECUTIVE DRIFT & MASTER HEALTH BANNER ── */}
      <div className={`p-5 sm:p-7 rounded-3xl border-3 shadow-sm transition-all ${
        !hasAnyData
          ? 'bg-gradient-to-br from-slate-50 via-slate-100/50 to-white border-slate-300'
          : isAlert
          ? 'bg-rose-50/90 border-rose-600'
          : 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-emerald-600'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl border-2 shrink-0 ${
              !hasAnyData
                ? 'bg-slate-100 border-slate-300 text-slate-600'
                : isAlert
                ? 'bg-rose-200 border-rose-700 text-rose-900'
                : 'bg-emerald-200 border-emerald-700 text-emerald-900'
            }`}>
              {!hasAnyData ? <Brain className="w-8 h-8" /> : isAlert ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-lg sm:text-2xl font-black text-slate-900">
                  {displayPatientName}&apos;s 30-Day Cognitive Health Index:
                </span>
                <span className={`text-xl sm:text-2xl font-black px-3 py-0.5 rounded-full border ${
                  !hasAnyData
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : isAlert
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}>
                  {!hasAnyData ? 'Awaiting First Game' : `${masterScore}% Overall Stability`}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed max-w-3xl">
                {!hasAnyData ? (
                  <>
                    <strong className="text-slate-900 font-bold">No game telemetry recorded yet. </strong>
                    Play Family Recognition, PatternTrace, or Match the Shapes in the Patient Portal to start recording cognitive retention, response speed, and motor coordination.
                  </>
                ) : isAlert ? (
                  <strong className="text-rose-900 font-bold">
                    Action Recommended: Reaction latency drift (+{driftPercent}%) exceeded the 35% clinical threshold. We recommend sharing this report with your visiting healthcare provider.
                  </strong>
                ) : (
                  <>
                    <strong className="text-emerald-950 font-bold">Healthy Geriatric Stability: </strong>
                    Cognitive latency drift (+{driftPercent}%) is comfortably within safe geriatric baseline parameters (&lt;35%). Active memory anchors recorded across sessions.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                title="Refresh Live Telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}

            <button
              onClick={onOpenReportModal}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer transition"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Export Clinical Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. THREE GAMES PROGRESS SNAPSHOT CARDS ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Progress Breakdown Across All 3 Cognitive Games</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Click any card to inspect detailed analytics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Family & Biographical Memory */}
          <div
            onClick={() => setSelectedGameView('biographical')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
              selectedGameView === 'biographical'
                ? 'bg-emerald-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <Heart className="w-5 h-5 fill-emerald-600 text-emerald-700" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Game 1</span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    Family &amp; Biographical
                  </h4>
                </div>
              </div>

              {hasBioData ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                  {bioTier1Stability}% Core Stable
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-300">
                  Awaiting Play
                </span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Recognition Recall</span>
                <span className="text-2xl font-black text-emerald-800">
                  {hasBioData ? `${bioOverallAcc}%` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Response Speed</span>
                <span className="text-2xl font-black text-slate-800">
                  {hasBioData && bioLatencySec !== null ? `${bioLatencySec}s` : '--'}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
              <span>{hasBioData ? 'Spouse & Identity Anchors Intact' : 'No trials recorded yet · Play to record'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: PatternTrace™ Visuospatial Working Memory */}
          <div
            onClick={() => setSelectedGameView('pattern')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
              selectedGameView === 'pattern'
                ? 'bg-indigo-50/80 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shrink-0">
                  <Layers className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-800 block">Game 2</span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    PatternTrace™ Memory
                  </h4>
                </div>
              </div>

              {hasPtData ? (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-300">
                  Level {ptCurrentLevel} of 5
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-300">
                  Awaiting Play
                </span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Sequence Accuracy</span>
                <span className="text-2xl font-black text-indigo-800">
                  {hasPtData ? `${ptAcc}%` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Reaction Time</span>
                <span className="text-2xl font-black text-slate-800">
                  {hasPtData && ptLatencySec !== null ? `${ptLatencySec}s` : '--'}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
              <span>{hasPtData ? (ptPerseveration === 0 ? 'No Repetitive Tapping Confusion' : `${ptPerseveration} Slips Logged`) : 'No sequences recorded yet · Play to record'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Match the Shapes (Shape Match Progress) */}
          <div
            onClick={() => setSelectedGameView('shape')}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
              selectedGameView === 'shape'
                ? 'bg-orange-50/80 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                : 'bg-white border-slate-200 hover:border-orange-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold shrink-0">
                  <Shapes className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-700 block">Game 3</span>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    Match the Shapes
                  </h4>
                </div>
              </div>

              {hasShapeData ? (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-bold border border-orange-300">
                  {shapeIndependence}% Independent
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-300">
                  Awaiting Play
                </span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Shape Accuracy</span>
                <span className="text-2xl font-black text-orange-600">
                  {hasShapeData ? `${shapeAcc}%` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Solve Time</span>
                <span className="text-2xl font-black text-slate-800">
                  {hasShapeData && shapeSolveTimeSec !== null ? `${shapeSolveTimeSec}s` : '--'}
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] font-semibold text-orange-700 flex items-center justify-between">
              <span>{hasShapeData ? 'Visual & Geometric Discrimination Intact' : 'No shape sessions recorded yet · Play to record'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. GAME VIEW FILTER TABS ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 rounded-2xl border border-slate-300">
          <button
            onClick={() => setSelectedGameView('all')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedGameView === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>All 3 Games (Combined Progress)</span>
          </button>

          <button
            onClick={() => setSelectedGameView('biographical')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedGameView === 'biographical'
                ? 'bg-emerald-800 text-white shadow'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-emerald-300" />
            <span>1. Family Memory</span>
          </button>

          <button
            onClick={() => setSelectedGameView('pattern')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedGameView === 'pattern'
                ? 'bg-indigo-900 text-white shadow'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-300" />
            <span>2. PatternTrace™</span>
          </button>

          <button
            onClick={() => setSelectedGameView('shape')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              selectedGameView === 'shape'
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Shapes className="w-3.5 h-3.5 text-orange-200" />
            <span>3. Match the Shapes</span>
          </button>
        </div>

        {/* Legend / Info hint */}
        <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Scores &gt;70% reflect healthy cognitive retention</span>
        </span>
      </div>

      {/* ── 4. VIEW CONTENT: ALL 3 GAMES COMBINED OVERVIEW ── */}
      {selectedGameView === 'all' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Main Simplified Progress Chart */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    30-Day Cognitive Progress Timeline (All 3 Games)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cross-game longitudinal tracking: higher scores indicate strong cognitive retention, geometric recognition, and independent task completion.
                </p>
              </div>

              {/* Metric Toggle: Accuracy % vs Speed in seconds */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setChartMetric('accuracy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    chartMetric === 'accuracy'
                      ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Recall &amp; Accuracy (%)
                </button>
                <button
                  onClick={() => setChartMetric('speed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    chartMetric === 'speed'
                      ? 'bg-white text-indigo-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Response Speed (Seconds)
                </button>
              </div>
            </div>

            {/* Visual Guide / Friendly Key */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  Family Memory
                </span>
                <span className="flex items-center gap-1.5 text-indigo-800">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                  PatternTrace Memory
                </span>
                <span className="flex items-center gap-1.5 text-orange-800">
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                  Match the Shapes
                </span>
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-3.5 h-1 border-t-2 border-dashed border-slate-800 inline-block" />
                  Overall Health Index
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>Target: 70%–100% Stable Zone</span>
              </div>
            </div>

            {/* Chart Area */}
            {unifiedTimeline && unifiedTimeline.length > 0 ? (
              <div className="h-72 sm:h-80 w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={unifiedTimeline} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />

                    {chartMetric === 'accuracy' ? (
                      <>
                        <YAxis
                          domain={[50, 100]}
                          ticks={[50, 60, 70, 80, 90, 100]}
                          unit="%"
                          tick={{ fontSize: 11, fill: '#475569' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderRadius: '16px',
                            color: '#FFF',
                            border: 'none',
                            fontSize: '11px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                          formatter={(val, name) => [val != null ? `${val}%` : 'Not played', name]}
                        />
                        {/* Healthy target zone reference area */}
                        <ReferenceArea y1={70} y2={100} fill="#10B981" fillOpacity={0.06} />
                        <ReferenceLine
                          y={70}
                          stroke="#EF4444"
                          strokeDasharray="4 4"
                          label={{
                            value: 'Clinical Review Line (70%)',
                            position: 'insideBottomRight',
                            fill: '#DC2626',
                            fontSize: 10
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="familyAccuracy"
                          name="Family Memory Recall"
                          stroke="#059669"
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{ r: 2.5, fill: '#059669' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="patternAccuracy"
                          name="PatternTrace Working Memory"
                          stroke="#4F46E5"
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{ r: 2.5, fill: '#4F46E5' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="shapeAccuracy"
                          name="Match the Shapes Accuracy"
                          stroke="#EA580C"
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{ r: 2.5, fill: '#EA580C' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="compositeScore"
                          name="Combined Stability Index"
                          stroke="#0F172A"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          connectNulls={true}
                          dot={false}
                        />
                      </>
                    ) : (
                      <>
                        <YAxis
                          domain={[0.4, 3.2]}
                          ticks={[0.5, 1.0, 1.5, 2.0, 2.5, 3.0]}
                          unit="s"
                          tick={{ fontSize: 11, fill: '#475569' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderRadius: '16px',
                            color: '#FFF',
                            border: 'none',
                            fontSize: '11px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                          }}
                          labelFormatter={(label) => `Date: ${label}`}
                          formatter={(val, name) => [val != null ? `${val}s` : 'Not played', name]}
                        />
                        <ReferenceLine
                          y={2.0}
                          stroke="#D97706"
                          strokeDasharray="4 4"
                          label={{
                            value: 'Target Response Speed (<2.0s)',
                            position: 'insideBottomRight',
                            fill: '#B45309',
                            fontSize: 10
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="familySpeedSec"
                          name="Family Recognition Speed"
                          stroke="#059669"
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{ r: 2.5, fill: '#059669' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="patternSpeedSec"
                          name="PatternTrace Initiation Speed"
                          stroke="#4F46E5"
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{ r: 2.5, fill: '#4F46E5' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="shapeSpeedSec"
                          name="Shape Match Solve Time"
                          stroke="#EA580C"
                          strokeWidth={3}
                          connectNulls={true}
                          dot={{ r: 2.5, fill: '#EA580C' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="compositeSpeedSec"
                          name="Average Response Time"
                          stroke="#0F172A"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          connectNulls={true}
                          dot={false}
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 sm:h-80 w-full flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-800">
                  No Cognitive Timeline History Recorded Yet
                </h4>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  As soon as {displayPatientName} plays Family Recognition, PatternTrace, or Match the Shapes in the Patient Portal, their session progress and response speed will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Caregiver Plain-Language Insights & Guide */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-orange-50/40 border-2 border-indigo-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                💡
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900">
                  Caregiver Guide: What {displayPatientName}&apos;s Progress Means in Daily Life
                </h4>
                <p className="text-xs text-slate-600">
                  Clinical observations translated into gentle, practical daily caregiving takeaways.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Family Anchors Active</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {hasBioData ? (
                    <>Spouse, primary home town, and immediate family members are recognized with <strong>{bioTier1Stability}% confidence</strong>. Recalling extended cousins takes a few extra seconds, which is normal.</>
                  ) : (
                    <>Awaiting first family recognition session to assess core and secondary identity recall.</>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Working Memory Steady</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {hasPtData ? (
                    <>Patient comfortably memorizes <strong>Level {ptCurrentLevel} to {ptMaxLevel}</strong> visual sequence nodes. Hand coordination has low tremor (steady touch control).</>
                  ) : (
                    <>Awaiting first PatternTrace sequence to map working memory span and motor coordination.</>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-orange-100 shadow-sm space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                  <Shapes className="w-4 h-4 text-orange-600" />
                  <span>Shape Recognition &amp; Motor Autonomy</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {hasShapeData ? (
                    <>Patient independently matches shapes with <strong>{shapeIndependence}% autonomy</strong> without needing hints. Dragging trajectory is steady with minimal tremor ({shapeJitter}px).</>
                  ) : (
                    <>Awaiting first shape matching session to evaluate geometric discrimination and drag autonomy.</>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-100/80 border border-indigo-200 text-xs font-medium text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>
                <strong>Caregiver Tip:</strong> Keep afternoon play sessions to <strong>5–6 questions or 3–4 shape rounds at a time</strong>. Short, celebratory sessions prevent mental fatigue and keep spirits high!
              </span>
              <button
                onClick={onOpenReportModal}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0 cursor-pointer"
              >
                Print Full Caregiver Summary →
              </button>
            </div>
          </div>

          {/* Tri-Game Comparative Matrix */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
            <h4 className="text-base sm:text-lg font-black text-slate-900">
              Comparative Analysis Across the 3 Cognitive Game Pillars
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                    <th className="py-3 px-3">Cognitive Game</th>
                    <th className="py-3 px-3">Clinical Focus</th>
                    <th className="py-3 px-3 text-center">Score / Accuracy</th>
                    <th className="py-3 px-3 text-center">Response Speed</th>
                    <th className="py-3 px-3">Progress Status</th>
                    <th className="py-3 px-3">Caregiver Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                      1. Family Recognition
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      Relational memory, facial recognition &amp; spouse identity
                    </td>
                    <td className="py-3.5 px-3 text-center font-black text-emerald-800 text-sm">
                      {hasBioData ? `${bioOverallAcc}%` : '--'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {hasBioData && bioLatencySec !== null ? `${bioLatencySec}s` : '--'}
                    </td>
                    <td className="py-3.5 px-3">
                      {hasBioData ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                          Stable Anchors
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-300">
                          Awaiting Play
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {hasBioData ? 'Reinforce extended relatives in photo album' : 'Start with immediate family questions'}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                      2. PatternTrace™
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      Visuospatial working memory &amp; fine motor coordination
                    </td>
                    <td className="py-3.5 px-3 text-center font-black text-indigo-800 text-sm">
                      {hasPtData ? `${ptAcc}% (L${ptCurrentLevel})` : '--'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {hasPtData && ptLatencySec !== null ? `${ptLatencySec}s` : '--'}
                    </td>
                    <td className="py-3.5 px-3">
                      {hasPtData ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-300">
                          Adaptive Climbing
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-300">
                          Awaiting Play
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {hasPtData ? 'Keep 2-session daily cadence active' : 'Begin with 3-node sequence practice'}
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                      3. Match the Shapes
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      Geometric discrimination, spatial holder alignment &amp; drag precision
                    </td>
                    <td className="py-3.5 px-3 text-center font-black text-orange-600 text-sm">
                      {hasShapeData ? `${shapeIndependence}% Indep (${shapeAcc}%)` : '--'}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                      {hasShapeData && shapeSolveTimeSec !== null ? `${shapeSolveTimeSec}s` : '--'}
                    </td>
                    <td className="py-3.5 px-3">
                      {hasShapeData ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-900 text-[10px] font-bold border border-orange-300">
                          High Autonomy
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-300">
                          Awaiting Play
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">
                      {hasShapeData ? 'Practice Tier 3 polygons gently without pressure' : 'Play first 3-shape matching round'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. VIEW CONTENT: GAME 1 DEEP DIVE (FAMILY RECOGNITION) ── */}
      {selectedGameView === 'biographical' && (
        <div className="space-y-6 sm:space-y-8">
          {!hasBioData ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-200/90 shadow-md text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <Heart className="w-7 h-7 fill-emerald-600" />
              </div>
              <h4 className="text-lg font-black text-slate-900">No Family Memory Trials Recorded Yet</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Play the Biographical &amp; Family Recognition game in the Patient Portal to begin tracking concentric relational memory and cognitive fatigue across sessions.
              </p>
            </div>
          ) : (
            <>
              {/* Relational Concentric Circles Breakdown */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">
                      Relational Concentric Memory Rings (Family &amp; Identity Recall)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Visualizes which family rings remain anchored vs which rings experience normal age-related hesitation.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Horizontal Bar Chart */}
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={biographicalAnalytics?.breakdown || []}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis dataKey="shortName" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={115} />
                        <Tooltip
                          formatter={(val, name, item) => [`${val}% (Speed: ${item.payload.avgLatency}ms)`, 'Recall Accuracy']}
                          contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                        />
                        <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                          {(biographicalAnalytics?.breakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Rings Caregiver Cards */}
                  <div className="space-y-2.5">
                    {(biographicalAnalytics?.breakdown || []).map((item) => (
                      <div key={item.tierKey} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{item.tierLabel}</span>
                            <span className="text-[10px] text-slate-500">Average response: {item.avgLatency}ms</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">{item.accuracy}%</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.accuracy >= 85 ? 'bg-emerald-100 text-emerald-800' :
                            item.accuracy >= 70 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {item.riskAssessment}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cognitive Fatigue & Session Length Recommendation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <h4 className="text-base font-black text-slate-900">
                      Cognitive Fatigue Monitor (Session Duration)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Compares patient focus in Questions 1–3 (start) vs Questions 7+ (end).
                  </p>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={biographicalAnalytics?.fatigue?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="phase" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <Tooltip formatter={(val) => [`${val}%`, 'Accuracy']} contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                        <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                          {(biographicalAnalytics?.fatigue?.chartData || []).map((_, idx) => (
                            <Cell key={idx} fill={idx === 0 ? '#059669' : idx === 1 ? '#3B82F6' : '#D97706'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                    <strong>Recommendation:</strong> Patient focus drops by {biographicalAnalytics?.fatigue?.accuracyDropPercent || 14}% after question 6. Limiting each session to 5–6 questions keeps confidence at peak.
                  </div>
                </div>

                {/* Recurring Confusions Table */}
                <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-5 h-5 text-rose-600" />
                    <h4 className="text-base font-black text-slate-900">
                      Recurring Confusions / Slips Log
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Helps the family gently practice specific names without pressure.
                  </p>

                  {(!biographicalAnalytics?.confusion || biographicalAnalytics.confusion.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-600">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xs font-bold">No recurring confusions recorded!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 overflow-y-auto max-h-64 pr-1">
                      {biographicalAnalytics.confusion.slice(0, 4).map((item, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                          <div className="font-bold text-slate-900 truncate">{item.questionText}</div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Correct: <strong className="text-emerald-700">{item.correctText}</strong></span>
                            <span>Mistaken for: <strong className="text-rose-700">{item.selectedText}</strong></span>
                            <span className="text-slate-500 font-bold">{item.frequency}x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 6. VIEW CONTENT: GAME 2 DEEP DIVE (PATTERNTRACE™ WORKING MEMORY) ── */}
      {selectedGameView === 'pattern' && (
        <div className="space-y-6 sm:space-y-8">
          {!hasPtData ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-200/90 shadow-md text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-200">
                <Layers className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-900">No PatternTrace™ Trials Recorded Yet</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Play PatternTrace™ Memory in the Patient Portal to begin tracking working memory staircase progression, node accuracy, and motor latency.
              </p>
            </div>
          ) : (
            <>
              {/* Adaptive Staircase Progression */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-700" />
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        PatternTrace™ Adaptive Working Memory Staircase
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The game dynamically adjusts difficulty: 2 flawless rounds step up (+1 Level); 2 errors step down.
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-bold border border-indigo-300">
                    Current Level {ptCurrentLevel} (Max {ptMaxLevel})
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={patternAnalytics?.trajectory || []}
                      margin={{ top: 10, right: 15, left: -25, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="ptGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="trial" tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Trial #', position: 'insideBottomRight', offset: -5, fontSize: 10 }} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} unit=" Lvl" tick={{ fontSize: 11, fill: '#4F46E5' }} />
                      <Tooltip formatter={(val) => [`Level ${val}`, 'Difficulty']} contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                      <Area
                        type="stepAfter"
                        dataKey="level"
                        stroke="#4338CA"
                        strokeWidth={3}
                        fill="url(#ptGrad)"
                        name="Working Memory Level"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Sequence Recall</span>
                    <span className="text-xl font-black text-indigo-800">{patternAnalytics?.sequenceMatchPct || 0}%</span>
                    <span className="text-[10px] text-slate-400 block">Exact node order</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Spatial Recall</span>
                    <span className="text-xl font-black text-emerald-800">{patternAnalytics?.spatialMatchPct || 0}%</span>
                    <span className="text-[10px] text-slate-400 block">Correct grid zones</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Reaction Latency</span>
                    <span className="text-xl font-black text-slate-800">{patternAnalytics?.meanLatency || 0}ms</span>
                    <span className="text-[10px] text-slate-400 block">Demonstration to tap</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Perseveration Rate</span>
                    <span className={`text-xl font-black ${ptPerseveration > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {patternAnalytics?.perseverationRatePct || 0}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">{ptPerseveration} repetitions</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 7. VIEW CONTENT: GAME 3 DEEP DIVE (MATCH THE SHAPES) ── */}
      {selectedGameView === 'shape' && (
        <div className="space-y-6 sm:space-y-8">
          {/* Top 4 Shape KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block">
                Independence Score
              </span>
              <div className="text-2xl sm:text-3xl font-black text-orange-600 mt-1">
                {hasShapeData ? `${shapeIndependence}%` : '--'}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Placed with zero hint assistance
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block">
                Placement Accuracy
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
                {hasShapeData ? `${shapeAcc}%` : '--'}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Correct slot on first drag
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block">
                Mean Solve Time
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {hasShapeData && shapeSolveTimeSec !== null ? `${shapeSolveTimeSec}s` : '--'}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Shelf pick-up to snap in slot
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block">
                Motor Path Steadiness
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-900 mt-1">
                {hasShapeData && shapeJitter !== null ? `${shapeJitter}px` : '--'}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
                Smooth drag (minimal tremor)
              </span>
            </div>
          </div>

          {/* Per-Shape Difficulty Ranking & Confusion Pairs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Shape Performance Table (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Shapes className="w-5 h-5 text-orange-600" />
                  <h4 className="text-base font-black text-slate-900">
                    Shape Performance &amp; Difficulty Ranking
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {shapeRankings.length} Shapes Evaluated
                </span>
              </div>

              {shapeRankings.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-600">
                  <Shapes className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-xs font-bold">No shape sessions recorded yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Play Match the Shapes in the Patient Portal to view shape-by-shape solve times and tier mastery.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                        <th className="py-2.5 px-2">Rank</th>
                        <th className="py-2.5 px-2">Shape</th>
                        <th className="py-2.5 px-2">Tier</th>
                        <th className="py-2.5 px-2 text-center">Avg Solve Time</th>
                        <th className="py-2.5 px-2 text-center">Avg Errors</th>
                        <th className="py-2.5 px-2 text-right">Independence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {shapeRankings.slice(0, 8).map((shape, sIdx) => (
                        <tr key={shape.shapeId || sIdx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-2 font-bold text-slate-500">#{shape.rank || sIdx + 1}</td>
                          <td className="py-3 px-2 flex items-center gap-2.5">
                            {shape.shapeId && <ShapeSvg shapeId={shape.shapeId} mode="colored" size={26} />}
                            <span className="font-bold text-slate-900 capitalize">
                              {shape.displayName || (typeof shape.shapeId === 'string' ? shape.shapeId.replace(/_/g, ' ') : 'Shape')}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              shape.tier === 1
                                ? 'bg-emerald-100 text-emerald-800'
                                : shape.tier === 2
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              Tier {shape.tier || 1}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-semibold text-slate-700">
                            {shape.avgSolveTimeMs != null ? (shape.avgSolveTimeMs / 1000).toFixed(1) : '0.0'}s
                          </td>
                          <td className="py-3 px-2 text-center text-slate-600">
                            {shape.avgErrors ?? 0}
                          </td>
                          <td className="py-3 px-2 text-right font-black text-orange-600">
                            {shape.independencePct ?? 100}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Lookalike Confusion Pairs (1 col) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/90 shadow-md space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Repeat className="w-5 h-5 text-rose-600" />
                <h4 className="text-base font-black text-slate-900">
                  Lookalike Confusion Pairs
                </h4>
              </div>
              <p className="text-xs text-slate-500">
                Instances where a shape was dropped onto a visually similar holder.
              </p>

              {shapeConfusionPairs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-slate-600">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold">No recurring shape confusion pairs detected.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shapeConfusionPairs.map((pair, idx) => {
                    const intendedShapeId = pair?.intendedShape || '';
                    const mistakenShapeId = pair?.mistakenShape || pair?.droppedSlot || '';
                    const intendedLabel =
                      pair?.intendedName ||
                      (typeof intendedShapeId === 'string' && intendedShapeId
                        ? intendedShapeId.replace(/_/g, ' ')
                        : 'Shape');
                    const mistakenLabel =
                      pair?.mistakenName ||
                      (typeof mistakenShapeId === 'string' && mistakenShapeId
                        ? mistakenShapeId.replace(/_/g, ' ')
                        : 'Target Slot');

                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {intendedShapeId && <ShapeSvg shapeId={intendedShapeId} mode="colored" size={24} />}
                            <span className="font-bold text-slate-900 capitalize">{intendedLabel}</span>
                          </div>
                          <span className="text-slate-400">➔</span>
                          <div className="flex items-center gap-2">
                            {mistakenShapeId && <ShapeSvg shapeId={mistakenShapeId} mode="outline" size={24} />}
                            <span className="font-semibold text-rose-800 capitalize">{mistakenLabel}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">{pair?.severity || 'Lookalike Pair'}</span>
                          <span className="font-black text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                            {pair?.count ?? 1}x transpositions
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200 text-xs text-orange-950">
                <strong>Clinician Note:</strong> Lookalike transpositions (e.g. Rectangle into Square) reflect subtle spatial edge orientation variations. Practice with high-contrast shapes.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
