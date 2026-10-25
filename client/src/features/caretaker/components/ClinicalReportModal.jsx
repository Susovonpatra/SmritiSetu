import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Brain,
  Layers,
  Sparkles,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  EXERCISE_TYPES,
  generateClinicalReportHtml,
  printOrDownloadReportPdf,
  downloadReportHtmlBlob
} from '@/services/clinicalPdfReportGenerator';

export function ClinicalReportModal({
  isOpen,
  onClose,
  initialType = EXERCISE_TYPES.CONSOLIDATED,
  patient = {},
  analytics = {}
}) {
  const [selectedType, setSelectedType] = useState(initialType);
  const [isExporting, setIsExporting] = useState(false);

  // Sync initial type if it changes when opening
  React.useEffect(() => {
    if (isOpen && initialType) {
      setSelectedType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handlePrintPdf = async () => {
    setIsExporting(true);
    await printOrDownloadReportPdf({
      type: selectedType,
      patient,
      analytics
    });
    setIsExporting(false);
  };

  const handleDownloadFile = () => {
    downloadReportHtmlBlob({
      type: selectedType,
      patient,
      analytics
    });
  };

  const reportHtml = generateClinicalReportHtml({
    type: selectedType,
    patient,
    analytics
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 w-full max-w-5xl rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-slate-300 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                ICMR-NARI &amp; MoCA Clinical Telemetry
              </span>
              <h3 className="text-base sm:text-xl font-black text-white leading-tight">
                SmritiSetu Clinical Dossier &amp; PDF Report
              </h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={handlePrintPdf}
              disabled={isExporting}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-600 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{isExporting ? 'Generating...' : 'Print / Save as PDF'}</span>
            </button>
            <button
              onClick={handleDownloadFile}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Download Offline HTML Document"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden xs:inline">Download File</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Exercise Category Selector Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs font-bold shrink-0">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mr-1 shrink-0">
            Report Type:
          </span>
          <button
            onClick={() => setSelectedType(EXERCISE_TYPES.CONSOLIDATED)}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedType === EXERCISE_TYPES.CONSOLIDATED
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Overall Consolidated Dossier</span>
          </button>
          <button
            onClick={() => setSelectedType(EXERCISE_TYPES.BIOGRAPHICAL)}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              selectedType === EXERCISE_TYPES.BIOGRAPHICAL
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Biographical Recall
          </button>
          <button
            onClick={() => setSelectedType(EXERCISE_TYPES.PATTERN)}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              selectedType === EXERCISE_TYPES.PATTERN
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            PatternTrace™
          </button>
          <button
            onClick={() => setSelectedType(EXERCISE_TYPES.SHAPE)}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              selectedType === EXERCISE_TYPES.SHAPE
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Shape Match &amp; Motor
          </button>
          <button
            onClick={() => setSelectedType(EXERCISE_TYPES.ROUTINE)}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              selectedType === EXERCISE_TYPES.ROUTINE
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily Routine Sequencer
          </button>
        </div>

        {/* Interactive Document Preview (iframe rendering exact print output) */}
        <div className="flex-1 bg-slate-200 p-2 sm:p-6 overflow-y-auto min-h-[350px]">
          <div className="bg-white rounded-xl shadow-lg border border-slate-300 max-w-4xl mx-auto overflow-hidden">
            <iframe
              title="Clinical Dossier Preview"
              srcDoc={reportHtml}
              className="w-full h-[600px] border-0"
            />
          </div>
        </div>

        {/* Bottom Footer with Status and Close */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 sm:p-4 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-700">
              MoCA &amp; ICMR-NARI standard clinical layout ready for direct printing or PDF export
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClinicalReportModal;
