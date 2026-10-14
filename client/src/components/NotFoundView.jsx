import React from 'react';
import { Home, Heart, Shield, Phone, Mail, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useLocale } from '@/features/localization/context/LocaleContext';

export function NotFoundView({ onNavigateHome, onSelectView }) {
  const { regionInfo } = useLocale();

  return (
    <section className="min-h-[70vh] flex items-center justify-center py-8 px-4" aria-labelledby="not-found-heading">
      <div className="max-w-xl w-full text-center bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 shadow-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-700 mb-6 shadow-sm">
          <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
        </div>

        <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-mono font-bold text-slate-700 mb-3">
          Error 404 • Page Not Found
        </div>

        <h1 id="not-found-heading" className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          {regionInfo.nativeName ? `${regionInfo.nativeName} | ` : ''}Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
          The view or page you requested could not be located or has moved. You can return safely to the home portal or select one of the core access points below.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={onNavigateHome}
            className="elder-btn bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>Return to Home</span>
          </button>

          {onSelectView && (
            <button
              type="button"
              onClick={() => onSelectView('patient_portal')}
              className="elder-btn bg-white hover:bg-emerald-50 text-emerald-900 border-2 border-emerald-600 transition cursor-pointer"
            >
              <Heart className="w-5 h-5 text-emerald-700 fill-emerald-100 shrink-0" />
              <span>Patient Companion</span>
            </button>
          )}
        </div>

        {/* Assistance / Support Contacts */}
        <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">Need immediate assistance or emergency support?</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
            <a
              href="tel:14416"
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 hover:underline py-1 px-2 rounded-lg bg-emerald-50 border border-emerald-200"
              title="Tele-MANAS Toll Free Helpline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Tele-MANAS: 14416</span>
            </a>
            <a
              href="tel:+919435012345"
              className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 hover:underline py-1 px-2 rounded-lg bg-slate-100 border border-slate-200"
              title="SmritiSetu Direct Support Helpline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 94350 12345</span>
            </a>
            <a
              href="mailto:support@smritisetu.in"
              className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 hover:underline py-1 px-2 rounded-lg bg-indigo-50 border border-indigo-200"
              title="SmritiSetu Technical Support Email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@smritisetu.in</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
