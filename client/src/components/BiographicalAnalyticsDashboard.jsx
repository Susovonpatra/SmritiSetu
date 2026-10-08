import React, { useState, useEffect } from 'react';
import { BiographicalTelemetryService } from '../services/biographicalTelemetry';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Activity,
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  Sparkles,
  HelpCircle,
  Shield,
  Zap,
  Repeat,
  RefreshCw,
  Compass
} from 'lucide-react';

export function BiographicalAnalyticsDashboard({ patientId = 1 }) {
  const [loading, setLoading] = useState(true);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [longitudinalTrends, setLongitudinalTrends] = useState([]);
  const [relationalBreakdown, setRelationalBreakdown] = useState([]);
  const [confusionMatrix, setConfusionMatrix] = useState([]);
  const [fatigueMetric, setFatigueMetric] = useState(null);
  const [spatialDistribution, setSpatialDistribution] = useState([]);

  // Active view mode for Longitudinal chart (Accuracy vs Latency)
  const [longitudinalMetric, setLongitudinalMetric] = useState('accuracy'); // 'accuracy' | 'latency'

  useEffect(() => {
    loadAnalytics();
  }, [patientId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [summary, trends, breakdown, confusion, fatigue, spatial] = await Promise.all([
        BiographicalTelemetryService.getExecutiveSummary(patientId),
        BiographicalTelemetryService.getLongitudinalTrends(patientId),
        BiographicalTelemetryService.getRelationalMemoryBreakdown(patientId),
        BiographicalTelemetryService.getConfusionFrequencyMatrix(patientId),
        BiographicalTelemetryService.getCognitiveFatigueMetric(patientId),
        BiographicalTelemetryService.getSpatialDistribution(patientId)
      ]);

      setExecutiveSummary(summary);
      setLongitudinalTrends(trends);
      setRelationalBreakdown(breakdown);
      setConfusionMatrix(confusion);
      setFatigueMetric(fatigue);
      setSpatialDistribution(spatial);
    } catch (err) {
      console.error('Failed loading biographical analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
          <Brain className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Calculating Cognitive Telemetry...</h3>
        <p className="text-xs text-slate-500">Aggregating longitudinal moving averages and relational rings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── TOP HEADER & REFRESH ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
              Clinical Telemetry Engine
            </span>
            <span className="text-xs text-slate-400 font-medium">Biographical Recognition Biometrics</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            Neurocognitive Relational Memory Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Based on {executiveSummary?.totalTrials || 0} recorded recognition interaction trials across all 4 relational memory tiers.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* ── EXECUTIVE SNAPSHOT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Accuracy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">30-Day Accuracy</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {executiveSummary?.overallAccuracy || 0}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Target threshold &gt;70%</span>
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Mean Latency</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {executiveSummary?.averageLatencyMs || 0} <span className="text-sm font-semibold text-slate-500">ms</span>
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">
            Time to recognition tap
          </div>
        </div>

        {/* Tier 1 Primary Ring Stability */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Core Ring Anchor</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {executiveSummary?.tier1Stability || 100}%
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold">
            Spouse &amp; Identity Retention
          </div>
        </div>

        {/* Cognitive Fatigue Drop */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Fatigue Drop (Q7+)</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            -{fatigueMetric?.accuracyDropPercent || 0}%
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {fatigueMetric?.fatigueRiskLevel || 'Minimal Fatigue'}
          </div>
        </div>
      </div>

      {/* ── SECTION 1: LONGITUDINAL TREND CHART (7-DAY & 30-DAY MOVING AVERAGE) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                1. Longitudinal Trend Chart (7-Day &amp; 30-Day Moving Average)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tracks recognition trajectory over time, smoothing day-to-day fluctuations to reveal true cognitive decay or stability.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setLongitudinalMetric('accuracy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                longitudinalMetric === 'accuracy'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recognition Accuracy (%)
            </button>
            <button
              onClick={() => setLongitudinalMetric('latency')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                longitudinalMetric === 'latency'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Response Speed (ms)
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={longitudinalTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
              
              {longitudinalMetric === 'accuracy' ? (
                <>
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Clinical Concern Threshold (70%)', position: 'insideBottomRight', fill: '#f43f5e', fontSize: 10 }} />
                  <Line type="monotone" dataKey="accuracy" name="Daily Raw Accuracy" stroke="#cbd5e1" strokeWidth={1.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ma7Accuracy" name="7-Day Moving Avg" stroke="#059669" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="ma30Accuracy" name="30-Day Moving Avg" stroke="#4f46e5" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                </>
              ) : (
                <>
                  <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
                  <Tooltip
                    formatter={(value, name) => [`${value} ms`, name]}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <ReferenceLine y={1800} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Motor Hesitation Baseline (1800ms)', position: 'insideBottomRight', fill: '#d97706', fontSize: 10 }} />
                  <Line type="monotone" dataKey="avgLatency" name="Daily Raw Latency" stroke="#cbd5e1" strokeWidth={1.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ma7Latency" name="7-Day Moving Avg" stroke="#0284c7" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="ma30Latency" name="30-Day Moving Avg" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── SECTION 2 & 3: RELATIONAL MEMORY BREAKDOWN & COGNITIVE FATIGUE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Relational Memory Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-black text-slate-900">
                2. Relational Memory Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Visualizes which relational concentric rings are decaying first (Core vs Child vs Sibling vs Extended).
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relationalBreakdown} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} unit="%" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="shortName" type="category" stroke="#64748b" fontSize={11} width={110} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (${item.payload.avgLatency}ms)`, 'Accuracy']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="accuracy" radius={[0, 8, 8, 0]}>
                  {relationalBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Clinical Tier Ring Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {relationalBreakdown.map(item => (
              <div key={item.tierKey} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-bold text-slate-800">{item.tierLabel}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900">{item.accuracy}%</span>
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

        {/* 3. Cognitive Fatigue Metric */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-black text-slate-900">
                3. Cognitive Fatigue Metric
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Comparing recognition accuracy and latency in Questions 1–3 vs Questions 7+ within sessions.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fatigueMetric?.chartData || []} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="phase" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} unit="%" fontSize={11} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (Latency: ${item.payload.latency}ms)`, 'Accuracy']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="accuracy" fill="#4f46e5" radius={[8, 8, 0, 0]}>
                  {fatigueMetric?.chartData?.map((entry, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#059669' : idx === 1 ? '#3b82f6' : '#d97706'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Fatigue Clinical Analysis Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Sustained Attention Drop:</span>
              <span className="text-sm font-black text-amber-700">-{fatigueMetric?.accuracyDropPercent || 0}% Accuracy</span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span>Latency Slowdown in Late Phase:</span>
              <span className="font-bold">+{fatigueMetric?.latencySlowdownMs || 0} ms</span>
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed pt-1 border-t border-amber-200/60">
              <strong>Clinical Action:</strong> Patient demonstrates rapid depletion after question 6. We recommend limiting daily biographical sessions to 5–6 questions at a time to prevent cognitive frustration.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: CONFUSION FREQUENCY MATRIX ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              4. Confusion Frequency Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logs recurring mistaken selections to identify specific confabulatory associations (e.g. consistently clicking "Sister" when asked for "Daughter").
          </p>
        </div>

        {confusionMatrix.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-800">No Confabulatory Mistakes Logged</p>
            <p className="text-xs text-slate-500">Patient has answered all biographical questions correctly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase font-black text-[10px]">
                  <th className="py-3 px-3">Target Prompt</th>
                  <th className="py-3 px-3">Correct Answer</th>
                  <th className="py-3 px-3">Mistaken Choice (Selected)</th>
                  <th className="py-3 px-3 text-center">Frequency</th>
                  <th className="py-3 px-3 text-center">Avg Latency</th>
                  <th className="py-3 px-3">Pattern Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {confusionMatrix.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900 max-w-xs truncate">
                      {item.questionText}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                        {item.correctText}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 font-bold">
                        {item.selectedText}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-black">
                        {item.frequency}x
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-600">
                      {item.avgLatency} ms
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.isRecurrent
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.relativeSeverity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 5: EXECUTIVE SPATIAL PERSEVERATION ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-black text-slate-900">
            5. Spatial Perseveration &amp; Slot Selection Monitor
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Evaluates screen tap distribution across slots 1–4. Heavy concentration (&gt;45%) in a single slot indicates spatial perseveration (motor habit tapping instead of cognitive semantic recognition).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {spatialDistribution.map(slot => (
            <div
              key={slot.slot}
              className={`p-4 rounded-2xl border text-center space-y-1 ${
                slot.isBiased
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-500 uppercase">{slot.label}</div>
              <div className="text-xl font-black">{slot.percentage}%</div>
              <div className="text-[10px] text-slate-500">{slot.count} selections</div>
              {slot.isBiased && (
                <span className="inline-block text-[10px] font-black uppercase text-amber-700 bg-amber-200/90 px-2 py-0.5 rounded-full mt-1">
                  Slot Perseveration
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
