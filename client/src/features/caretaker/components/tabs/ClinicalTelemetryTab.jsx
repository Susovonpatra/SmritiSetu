import React from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  FileText,
  Brain,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

export function ClinicalTelemetryTab({
  driftMetrics,
  analyticsData,
  patternAnalytics,
  displayPatientName,
  onOpenReportModal
}) {
  return (
    <div className="space-y-6">
      {/* 7-Day Cognitive Drift Overview */}
      <div className={`p-5 sm:p-6 rounded-3xl border-3 transition-all ${
        driftMetrics.alert 
          ? 'bg-rose-50 border-rose-700 shadow-md' 
          : 'bg-emerald-50 border-emerald-700 shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-2xl border-2 shrink-0 ${
              driftMetrics.alert ? 'bg-rose-200 border-rose-800 text-rose-900' : 'bg-emerald-200 border-emerald-800 text-emerald-900'
            }`}>
              {driftMetrics.alert ? <AlertOctagon className="w-7 h-7 sm:w-8 sm:h-8" /> : <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-base sm:text-xl font-bold text-zinc-800">
                  Rolling 7-Day Cognitive Drift Index ({displayPatientName}):
                </span>
                <span className={`text-2xl sm:text-3xl font-black ${driftMetrics.alert ? 'text-rose-900' : 'text-emerald-950'}`}>
                  {driftMetrics.drift_percent >= 0 ? `+${driftMetrics.drift_percent}%` : `${driftMetrics.drift_percent}%`}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-700 mt-1">
                {driftMetrics.alert 
                  ? 'CRITICAL ALERT: Reaction latency drift exceeded the 35% clinical threshold. Recommended teleconsultation with neurology team.'
                  : 'STABLE RANGE: Reaction latency and accuracy variance are within acceptable geriatric baseline parameters (<35% drift).'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onOpenReportModal}
              className="w-full md:w-auto px-4 sm:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-300" />
              <span>Export Clinical Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* PatternTrace Working Memory & Adaptive Staircase */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] sm:text-xs font-bold">
                  PatternTrace™ Neurocognitive Engine
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                  patternAnalytics?.perseverationCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {patternAnalytics?.clinicalStatus || 'Stable Baseline'}
                </span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5">
                Visuospatial Working Memory &amp; Adaptive Staircase
              </h3>
            </div>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow shrink-0"
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>View Full Report</span>
          </button>
        </div>

        {/* 4 Biomarker Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Working Memory</span>
            <span className="text-xl sm:text-3xl font-black text-indigo-900 block mt-1">
              Level {patternAnalytics?.currentLevel || 2} <span className="text-xs font-normal text-slate-400">/ 5</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Max: Level {patternAnalytics?.maxLevelAchieved || 3}</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Sequence Recall</span>
            <span className="text-xl sm:text-3xl font-black text-emerald-800 block mt-1">
              {patternAnalytics?.sequenceMatchPct || 85}%
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Exact node trajectory</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Perceptual Latency</span>
            <span className="text-xl sm:text-3xl font-black text-slate-900 block mt-1">
              {patternAnalytics?.meanLatency || 880} ms
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">Demo to first touch</span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 min-w-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase block truncate">Perseveration Rate</span>
            <span className={`text-xl sm:text-3xl font-black block mt-1 ${
              (patternAnalytics?.perseverationCount || 0) > 0 ? 'text-amber-800' : 'text-emerald-700'
            }`}>
              {patternAnalytics?.perseverationRatePct || 0}%
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">
              {patternAnalytics?.perseverationCount || 0} repetitions
            </span>
          </div>
        </div>

        {/* Adaptive Staircase Chart */}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center justify-between text-xs gap-1">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-700" />
              <span>Adaptive Staircase Level Progression ({displayPatientName})</span>
            </h4>
            <span className="text-slate-500 text-[11px]">
              Rule: 2 Flawless (+1) | 2 Failed (-1)
            </span>
          </div>

          <div className="h-48 sm:h-56 w-full min-w-0 bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={patternAnalytics?.trajectory || []}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="levelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="trial" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Trial #', position: 'insideBottomRight', offset: -5, fontSize: 9 }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#4338CA' }} label={{ value: 'Level', angle: -90, position: 'insideLeft', fill: '#4338CA', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', border: 'none', fontSize: '11px' }}
                  labelFormatter={(label) => `Trial #${label}`}
                />
                <Area
                  type="stepAfter"
                  dataKey="level"
                  stroke="#4338CA"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#levelGrad)"
                  name="Difficulty Level"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 30-Day Timeline */}
      <div className="p-5 sm:p-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              30-Day Timeline: Reaction Latency Drift vs Task Accuracy
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Track longitudinal cognitive deceleration against target baseline (800ms).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-700 inline-block"></span>
              Latency (ms)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
              Accuracy (%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 border border-dashed border-slate-800 inline-block"></span>
              Baseline (800ms)
            </span>
          </div>
        </div>

        <div className="h-60 sm:h-72 w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[500, 1500]}
                tick={{ fontSize: 10, fill: '#4338CA' }}
                label={{ value: 'Latency', angle: -90, position: 'insideLeft', fill: '#4338CA', fontSize: 10 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[40, 100]}
                tick={{ fontSize: 10, fill: '#059669' }}
                label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight', fill: '#059669', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181B', borderRadius: '12px', color: '#FFF', border: 'none', fontSize: '11px' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <ReferenceLine yAxisId="left" y={800} stroke="#EF4444" strokeDasharray="5 5" label={{ value: '800ms', fill: '#EF4444', fontSize: 9 }} />
              <ReferenceLine yAxisId="left" y={1080} stroke="#DC2626" strokeDasharray="3 3" label={{ value: '+35%', fill: '#DC2626', fontSize: 9 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="latency_ms"
                stroke="#4338CA"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#4338CA' }}
                name="Reaction Latency (ms)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracy_pct"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#059669' }}
                name="Accuracy (%)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
