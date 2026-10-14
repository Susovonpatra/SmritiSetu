import React from 'react';
import {
  ShieldCheck,
  Heart,
  Shield,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Users,
  Activity,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { useLocale } from '@/features/localization/context/LocaleContext';

export function Footer({ onSelectView, onOpenConsent, onOpenAuthModal }) {
  const { t, regionInfo } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t-4 border-slate-950 mt-auto" role="contentinfo">
      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4">
            <div
              onClick={() => onSelectView('landing')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectView('landing');
                }
              }}
              className="flex items-center gap-3 cursor-pointer group select-none"
              aria-label="SmritiSetu Home"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform border border-emerald-500/30">
                {regionInfo.nativeName ? regionInfo.nativeName.substring(0, 2) : 'ସ୍ମୃ'}
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight leading-tight block">
                  SmritiSetu
                </span>
                <span className="text-xs font-serif text-emerald-400 font-medium">
                  {regionInfo.nativeName || 'ସ୍ମୃତିସେତୁ'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              AI-driven cognitive gaming, acoustic biometric tracking, and offline-first memory companion engineered for elderly dementia patients across Odisha, Gujarat, Assam, and national dialects.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                DPDP 2023 Compliant
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                WCAG AAA
              </span>
            </div>
          </div>

          {/* Column 2: Portals & Clinical Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              System Portals
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('landing')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  <span>Public Overview</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('patient_portal')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Patient Companion Portal</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('caretaker_portal')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Caretaker Clinical Hub</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('asha')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  <span>ASHA Door-to-Door Triage</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('ivr')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>2G Feature Phone IVR Simulator</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectView('pitch')}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>3-Tier Architecture & Specs</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: National Health Standards & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              National Health Integrations
            </h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <a
                  href="https://esanjeevani.mohfw.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>eSanjeevani Teleconsultation</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://abdm.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>Ayushman Bharat (ABDM)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://telemanas.mohfw.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>Tele-MANAS Mental Health</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenConsent}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>DPDP 2023 Consent &amp; Privacy Policy</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Clickable Direct Contact & Helpline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Contact & Emergency
            </h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Toll-Free Mental Health Helpline:</span>
                <a
                  href="tel:14416"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold hover:underline text-sm mt-0.5"
                  title="Call National Tele-MANAS Helpline"
                >
                  <Phone className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>14416 (Tele-MANAS)</span>
                </a>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Direct Caretaker Support Hotline:</span>
                <a
                  href="tel:+919435012345"
                  className="inline-flex items-center gap-2 text-slate-200 hover:text-white font-bold hover:underline mt-0.5"
                  title="Call SmritiSetu Care Support"
                >
                  <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>+91 94350 12345</span>
                </a>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Technical & Clinical Inquiries:</span>
                <a
                  href="mailto:support@smritisetu.in"
                  className="inline-flex items-center gap-2 text-slate-200 hover:text-white font-bold hover:underline mt-0.5 break-all"
                  title="Email SmritiSetu Support"
                >
                  <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>support@smritisetu.in</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Legal & Technical Bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-400 font-medium">
          <div>
            <p>
              © {currentYear} <strong className="text-white">SmritiSetu (ସ୍ମୃତିସେତୁ)</strong>. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Clinical decision support platform for dementia screening &amp; memory assistance.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 text-[11px] font-mono text-slate-400">
            <span>FastAPI: 8000</span>
            <span className="text-slate-600">•</span>
            <span>Dexie.js Offline</span>
            <span className="text-slate-600">•</span>
            <span>Speech: 0.88x Rate</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">ABDM Aligned</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
