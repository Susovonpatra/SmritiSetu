import React, { useState, useEffect } from 'react';
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
  Shapes,
  Brain,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Shield,
  Download,
  Printer,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  RefreshCw,
  Sun,
  Activity,
  Award
} from 'lucide-react';
import { shapeGameApi } from '@/services/api/shapeGameApi';
import { ShapeSvg } from '@/features/games/shapes/ShapeSvg';
import { SHAPES_BY_ID } from '@/features/games/shapes/shapeConfig';

export function ShapeGameAnalyticsTab({ patientId = 1, displayPatientName = 'Patient' }) {
  const [range, setRange] = useState('30d'); // '7d' | '30d' | '90d'
  const [activeChartMetric, setActiveChartMetric] = useState('solveTime'); // 'solveTime' | 'latency' | 'independence' | 'accuracy'
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [ackStatus, setAckStatus] = useState({});

  useEffect(() => {
    loadSummary();
  }, [patientId, range]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await shapeGameApi.getCaregiverSummary(patientId, range);
      setSummaryData(data);
    } catch (err) {
      console.warn('Error loading shape analytics summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (sessionId) => {
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
      setSessionDetail(null);
      return;
    }
    setSelectedSessionId(sessionId);
    setLoadingDetail(true);
    try {
      const detail = await shapeGameApi.getCaregiverSessionDetail(patientId, sessionId);
      setSessionDetail(detail);
    } catch (err) {
      console.warn('Error loading session detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await shapeGameApi.acknowledgeAlert(patientId, alertId);
      setAckStatus(prev => ({ ...prev, [alertId]: true }));
      // Reload summary
      loadSummary();
    } catch (err) {
      console.warn('Error acknowledging alert:', err);
    }
  };

  const handleExportCsv = () => {
    const url = shapeGameApi.getExportUrl(patientId, 'csv');
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-slate-600 text-sm">Computing Shape Match Cognitive Telemetry...</p>
      </div>
    );
  }

  const metrics = summaryData?.metrics || {};
  const timeline = summaryData?.timeline || [];
  const shapeRankings = summaryData?.shapeRankings || [];
  const confusionPairs = summaryData?.confusionPairs || [];
  const activeAlerts = summaryData?.activeAlerts || [];
  const timeOfDayDist = summaryData?.timeOfDayDistribution || [];

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* ── MANDATORY CLINICAL DISCLAIMER BANNER ── */}
      <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm text-amber-900">
        <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <strong className="font-bold block text-amber-950">Clinical Observation Notice:</strong>
          These insights are for caregiver and clinician observation only and should be discussed with the patient&apos;s healthcare provider.
          SmritiSetu is a cognitive companion and monitoring aid, not a diagnostic medical device.
        </div>
      </div>

      {/* ── TOP CONTROLS & RANGE SELECTOR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
            <Shapes className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Shape Match Cognitive Analytics
            </h3>
            <p className="text-xs text-slate-500">
              Longitudinal progress, motor precision, and shape recognition for {displayPatientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* 7d / 30d / 90d pills */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === r
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={loadSummary}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── TOP METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Last Session */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Last Session</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.lastSessionDate || 'None'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.sessionsThisWeek || 0} sessions logged this week
          </span>
        </div>

        {/* 2. Independence Score */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Independence</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700">
            {metrics.averageIndependenceScore || 0}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Shapes placed with zero hint assistance
          </span>
        </div>

        {/* 3. Average Solve Time */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Solve Time</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.averageSolveTimeMs ? `${(metrics.averageSolveTimeMs / 1000).toFixed(1)}s` : '0s'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Personal Baseline: {(metrics.baselineSolveTimeMs / 1000).toFixed(1)}s
          </span>
        </div>

        {/* 4. Total Sessions in Range */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sessions</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.totalSessionsInRange || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {range === '7d' ? '7' : range === '30d' ? '30' : '90'} days
          </span>
        </div>

        {/* 5. Active Alerts Count */}
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-sm col-span-2 lg:col-span-1 ${
          metrics.activeAlertsCount > 0
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${metrics.activeAlertsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${metrics.activeAlertsCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {metrics.activeAlertsCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.activeAlertsCount > 0 ? 'Review observation flags below' : 'Performance is consistent'}
          </span>
        </div>
      </div>

      {/* ── WEEKLY PLAIN-LANGUAGE SUMMARY & EXPORT CARD ── */}
      {summaryData?.weeklySummary && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 p-5 sm:p-6 rounded-3xl border border-emerald-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-full">
                Caregiver Insight
              </span>
              <span className="text-xs font-semibold text-slate-500">Weekly Narrative</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
              {summaryData.weeklySummary}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow border border-emerald-900 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      )}

      {/* ── ALERTS PANEL ── */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200 p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="font-bold text-slate-900 text-base">
              Observation Alerts ({activeAlerts.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 border-amber-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      alert.severity === 'attention' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                    <strong className="text-sm font-bold text-slate-900">{alert.title}</strong>
                    <span className="text-xs text-slate-400">· {alert.createdAt}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700">{alert.message}</p>
                </div>

                <button
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                  className="self-end sm:self-auto px-3.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 shadow-sm transition-colors cursor-pointer"
                >
                  {ackStatus[alert.id] ? 'Acknowledged' : 'Dismiss Alert'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LONGITUDINAL CHARTS SECTION ── */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900">
              Longitudinal Cognitive Trends
            </h4>
            <p className="text-xs text-slate-500">
              Track solve time, initial reaction latency, independence, and spatial accuracy over time
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveChartMetric('solveTime')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChartMetric === 'solveTime' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solve Time (ms)
            </button>
            <button
              onClick={() => setActiveChartMetric('latency')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChartMetric === 'latency' ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reaction Latency (ms)
            </button>
            <button
              onClick={() => setActiveChartMetric('independence')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChartMetric === 'independence' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Independence (%)
            </button>
            <button
              onClick={() => setActiveChartMetric('accuracy')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeChartMetric === 'accuracy' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Accuracy (%)
            </button>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No session timeline data available in this range.
          </div>
        ) : (
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  domain={
                    activeChartMetric === 'independence' || activeChartMetric === 'accuracy'
                      ? [50, 100]
                      : ['dataMin - 300', 'dataMax + 500']
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {activeChartMetric === 'solveTime' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="solveTimeMs"
                      name="Median Solve Time (ms)"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#059669' }}
                    />
                    <ReferenceLine
                      y={metrics.baselineSolveTimeMs}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Personal Baseline', fill: '#d97706', fontSize: 10 }}
                    />
                  </>
                )}

                {activeChartMetric === 'latency' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="latencyMs"
                      name="Reaction Latency (ms)"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#4f46e5' }}
                    />
                    <ReferenceLine
                      y={metrics.baselineLatencyMs}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{ value: 'Personal Baseline', fill: '#d97706', fontSize: 10 }}
                    />
                  </>
                )}

                {activeChartMetric === 'independence' && (
                  <Line
                    type="monotone"
                    dataKey="independenceScore"
                    name="Independence Score (%)"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb' }}
                  />
                )}

                {activeChartMetric === 'accuracy' && (
                  <Line
                    type="monotone"
                    dataKey="accuracyPct"
                    name="First-Attempt Accuracy (%)"
                    stroke="#047857"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#047857' }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── TWO-COLUMN SECTION: SHAPE DIFFICULTY TABLE & CONFUSION PAIRS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Per-Shape Difficulty Table (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Shape Performance &amp; Difficulty Ranking
              </h4>
              <p className="text-xs text-slate-500">
                Sorted by cognitive difficulty index (solve time + errors + hints needed)
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {shapeRankings.length} Shapes Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-2">Rank</th>
                  <th className="py-2.5 px-2">Shape</th>
                  <th className="py-2.5 px-2">Tier</th>
                  <th className="py-2.5 px-2">Avg Time</th>
                  <th className="py-2.5 px-2">Avg Errors</th>
                  <th className="py-2.5 px-2">Independence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shapeRankings.slice(0, 10).map((shape) => (
                  <tr key={shape.shapeId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-500">#{shape.rank}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <ShapeSvg shapeId={shape.shapeId} mode="colored" size={28} />
                        <span className="font-bold text-slate-900">{shape.displayName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        shape.tier === 1
                          ? 'bg-emerald-100 text-emerald-800'
                          : shape.tier === 2
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        Tier {shape.tier}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-medium text-slate-800">
                      {(shape.avgSolveTimeMs / 1000).toFixed(1)}s
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      {shape.avgErrors}
                    </td>
                    <td className="py-3 px-2 font-semibold text-emerald-700">
                      {shape.independencePct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confusion Pairs & Time-of-Day (1 col) */}
        <div className="space-y-6">
          {/* Confusion Pairs Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-base font-bold text-slate-900">
              Visual Confusion Pairs
            </h4>
            <p className="text-xs text-slate-500">
              Instances where a shape was dropped onto a visually similar holder
            </p>

            {confusionPairs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recurring shape confusion pairs detected.
              </div>
            ) : (
              <div className="space-y-2.5">
                {confusionPairs.map((pair, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ShapeSvg shapeId={pair.intendedShape} mode="colored" size={24} />
                      <span className="font-bold text-slate-800">{pair.intendedName}</span>
                      <span className="text-slate-400">mistaken for</span>
                      <span className="font-semibold text-slate-700">{pair.mistakenName}</span>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px]">
                      {pair.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time of Day Distribution */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-base font-bold text-slate-900">
              Time-of-Day Engagement
            </h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── SESSION LIST & TIMELINE DRILL-DOWN ── */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900">
            Session History &amp; Attempt Replay Drill-Down
          </h4>
          <p className="text-xs text-slate-500">
            Click any session to view per-round timelines and hint escalations
          </p>
        </div>

        <div className="space-y-3">
          {timeline.slice().reverse().map((sess) => {
            const isExpanded = selectedSessionId === sess.sessionId;
            return (
              <div
                key={sess.sessionId}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
              >
                <div
                  onClick={() => loadSessionDetail(sess.sessionId)}
                  className="p-4 bg-slate-50 hover:bg-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {sess.roundsCompleted}/5
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        Session on {sess.fullDate}
                      </div>
                      <span className="text-xs text-slate-500">ID: {sess.sessionId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="text-emerald-700">
                      Independence: {sess.independenceScore}%
                    </span>
                    <span className="text-slate-600">
                      Solve Time: {(sess.solveTimeMs / 1000).toFixed(1)}s
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Drill-down Detail View */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-white border-t border-slate-200 space-y-4">
                    {loadingDetail ? (
                      <div className="py-6 text-center text-xs text-slate-400">Loading session replay timeline...</div>
                    ) : sessionDetail ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-slate-500 block">Fatigue Index</span>
                            <strong className="text-slate-800">{sessionDetail.fatigueIndex}x</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Rounds Completed</span>
                            <strong className="text-slate-800">{sessionDetail.roundsCompleted} of 5</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Median Latency</span>
                            <strong className="text-slate-800">{(sessionDetail.medianLatencyMs / 1000).toFixed(2)}s</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Accuracy</span>
                            <strong className="text-emerald-700">{sessionDetail.accuracyPct}%</strong>
                          </div>
                        </div>

                        {/* Per-Shape Attempt Details */}
                        <div>
                          <span className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                            Shape Attempts in Session
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                            {sessionDetail.attempts?.map((att, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                              >
                                <div className="flex items-center gap-2 justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <ShapeSvg shapeId={att.shapeId} mode="colored" size={20} />
                                    <span className="font-bold text-slate-900 truncate max-w-[90px]">{att.displayName}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400">R{att.round}</span>
                                </div>
                                <div className="text-[11px] text-slate-600 flex justify-between">
                                  <span>Time: {(att.solveTimeMs / 1000).toFixed(1)}s</span>
                                  <span>Hints: {att.hintsNeeded}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 flex justify-between">
                                  <span>Errors: {att.errors}</span>
                                  <span>Path Eff: {Math.round((att.pathEfficiency || 1) * 100)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-xs text-slate-400">No details available.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
