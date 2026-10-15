import React from 'react';
import { User, Brain, HelpCircle, Activity, Key, Shapes } from 'lucide-react';

export function CaretakerTabsNav({ activeTab, onSelectTab }) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
      <button
        onClick={() => onSelectTab('profile')}
        className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          activeTab === 'profile'
            ? 'bg-emerald-700 text-white shadow-md border border-emerald-800'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <User className={`w-4 h-4 shrink-0 ${activeTab === 'profile' ? 'text-emerald-200' : 'text-emerald-700'}`} />
        <span>Patient Profile &amp; Care Details</span>
      </button>

      <button
        onClick={() => onSelectTab('telemetry')}
        className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          activeTab === 'telemetry'
            ? 'bg-indigo-900 text-white shadow-md border border-indigo-950'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <Brain className={`w-4 h-4 shrink-0 ${activeTab === 'telemetry' ? 'text-indigo-300' : 'text-indigo-700'}`} />
        <span>Clinical Biomarkers &amp; Telemetry</span>
      </button>

      <button
        onClick={() => onSelectTab('shape_analytics')}
        className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          activeTab === 'shape_analytics'
            ? 'bg-teal-800 text-white shadow-md border border-teal-900'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <Shapes className={`w-4 h-4 shrink-0 ${activeTab === 'shape_analytics' ? 'text-teal-200' : 'text-teal-700'}`} />
        <span>Shape Match Progress</span>
      </button>

      <button
        onClick={() => onSelectTab('biographical_cms')}
        className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          activeTab === 'biographical_cms'
            ? 'bg-emerald-800 text-white shadow-md border border-emerald-900'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <HelpCircle className={`w-4 h-4 shrink-0 ${activeTab === 'biographical_cms' ? 'text-emerald-200' : 'text-emerald-700'}`} />
        <span>Biographical CMS (Questions)</span>
      </button>

      <button
        onClick={() => onSelectTab('biographical_analytics')}
        className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          activeTab === 'biographical_analytics'
            ? 'bg-blue-900 text-white shadow-md border border-blue-950'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <Activity className={`w-4 h-4 shrink-0 ${activeTab === 'biographical_analytics' ? 'text-blue-300' : 'text-blue-700'}`} />
        <span>Biographical Telemetry &amp; Decay</span>
      </button>

      <button
        onClick={() => onSelectTab('security')}
        className={`flex-1 sm:flex-none py-2.5 sm:py-3 px-3 sm:px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
          activeTab === 'security'
            ? 'bg-slate-900 text-white shadow-md border border-slate-950'
            : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
        }`}
      >
        <Key className={`w-4 h-4 shrink-0 ${activeTab === 'security' ? 'text-slate-300' : 'text-slate-700'}`} />
        <span>Access Password &amp; ABHA</span>
      </button>
    </div>
  );
}
