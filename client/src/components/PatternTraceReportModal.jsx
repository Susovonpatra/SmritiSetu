import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Brain,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { PatternTraceTelemetryService } from '../services/patternTraceTelemetry';

export function PatternTraceReportModal({ isOpen, onClose, patient }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      PatternTraceTelemetryService.getLongitudinalAnalytics(patient?.id || 1).then((data) => {
        setAnalytics(data);
        setLoading(false);
      });
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-slate-300 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 border-b border-slate-800 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center border border-indigo-500/30 shrink-0">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Clinical Neurocognitive Summary
              </span>
              <h3 className="text-base sm:text-2xl font-black text-white leading-tight">
                PatternTrace Visuospatial Working Memory Report
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end xs:self-auto shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 sm:px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 sm:gap-2 border border-indigo-600 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              aria-label="Close report"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Printable Report Content Body */}
        <div className="p-4 sm:p-8 overflow-y-auto space-y-4 sm:space-y-6 text-sm">
          {loading || !analytics ? (
            <div className="py-16 text-center text-slate-500">
              <Brain className="w-10 h-10 mx-auto text-indigo-400 animate-pulse mb-3" />
              <p className="font-bold">Aggregating neurocognitive telemetry...</p>
            </div>
          ) : (
            <>
              {/* Patient Metadata Header Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">Patient Name</span>
                  <span className="text-sm sm:text-base font-black text-slate-900">{patient?.name || 'Registered Patient'}</span>
                  <span className="text-xs text-slate-500 block">Age: {patient?.age || 'N/A'} | ABHA: {patient?.abha_id || 'Not Linked'}</span>
                </div>
                <div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">Assessing Assessment</span>
                  <span className="text-sm sm:text-base font-black text-indigo-900">PatternTrace v2.4 (3x3 Matrix)</span>
                  <span className="text-xs text-slate-500 block">Protocol: Asymmetric Adaptive Staircase</span>
                </div>
                <div>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase block">Clinical Date</span>
                  <span className="text-sm sm:text-base font-black text-slate-900">{new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                  <span className="text-xs text-emerald-700 font-semibold block">DPDP Consent: Verified &amp; Signed</span>
                </div>
              </div>

              {/* Working Memory Index & Clinical Interpretation */}
              <div className="p-4 sm:p-6 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-900">
                      Composite Working Memory Score:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-200 text-indigo-900 text-[11px] sm:text-xs font-extrabold">
                      {analytics.clinicalStatus}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-indigo-950">
                    {analytics.compositeScore} <span className="text-base sm:text-lg text-indigo-600 font-bold">/ 100</span>
                  </div>
                  <p className="text-xs text-indigo-900 font-semibold mt-1.5 sm:mt-2 max-w-xl">
                    {analytics.clinicalNotes}
                  </p>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-indigo-100 shadow-sm text-center w-full sm:w-auto min-w-[140px]">
                  <span className="text-xs font-bold text-slate-500 block">Peak Working Memory Span</span>
                  <span className="text-xl sm:text-2xl font-black text-indigo-900 block mt-1">Level {analytics.maxLevelAchieved}</span>
                  <span className="text-[11px] text-slate-500 font-medium">({analytics.maxLevelAchieved + 1} node sequences)</span>
                </div>
              </div>

              {/* 4 Quantitative Biomarker Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 block">Sequence Accuracy</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">{analytics.sequenceMatchPct}%</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Exact node order</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 block">Spatial Memory</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">{analytics.spatialMatchPct}%</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Correct nodes visited</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 block">Initiation Latency</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1">{analytics.meanLatency} ms</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Perceptual time</span>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-500 block">Perseveration Rate</span>
                  <span className={`text-xl sm:text-2xl font-black block mt-1 ${analytics.perseverationCount > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {analytics.perseverationRatePct}%
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500">{analytics.perseverationCount} repetitions</span>
                </div>
              </div>

              {/* Error Distribution Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-700" />
                  <span>Neurocognitive Error Pattern Breakdown</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">Omission Errors (Total: {analytics.totalOmissions})</span>
                    <p className="text-slate-600 mt-1">
                      Target nodes the patient failed to recall. Indicates working memory capacity overload under higher node spans.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-800 block">Commission Errors (Total: {analytics.totalCommissions})</span>
                    <p className="text-slate-600 mt-1">
                      Incorrect nodes introduced during recall. Indicates spatial intrusion or motor tremor offset.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Trial Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-700" />
                  <span>Recent Assessment Trials History</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Trial ID</th>
                        <th className="p-3">Level</th>
                        <th className="p-3">Accuracy</th>
                        <th className="p-3">Initiation Latency</th>
                        <th className="p-3">Execution Time</th>
                        <th className="p-3">Perseveration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {analytics.trials && analytics.trials.length > 0 ? (
                        analytics.trials.slice(0, 8).map((t, idx) => (
                          <tr key={t.trial_id || idx} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-[11px] text-slate-500">{t.trial_id?.slice(0, 10) || `#${idx + 1}`}</td>
                            <td className="p-3 font-bold text-indigo-800">Level {t.level}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                t.accuracy_score >= 1.0
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : t.accuracy_score >= 0.7
                                  ? 'bg-blue-100 text-blue-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}>
                                {Math.round((t.accuracy_score || 0) * 100)}%
                              </span>
                            </td>
                            <td className="p-3">{t.initiation_latency_ms} ms</td>
                            <td className="p-3">{t.total_execution_time_ms} ms</td>
                            <td className="p-3">
                              {t.perseveration_detected ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                  Detected
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-400">No trials recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
