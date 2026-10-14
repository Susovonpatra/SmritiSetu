import React from 'react';
import {
  Heart,
  ArrowRight,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  User,
  Calendar,
  MapPin,
  Clock,
  Compass,
  Shield,
  Stethoscope,
  Phone,
  FileText,
  Save
} from 'lucide-react';

export function CaretakerProfileTab({
  profileForm,
  onProfileChange,
  onSaveProfile,
  isSavingProfile,
  profileSaveStatus,
  displayPatientName,
  displayPatientAge,
  displayLocality,
  displayDementiaDuration,
  onNavigateToPatientPortal
}) {
  return (
    <div className="space-y-6">
      {/* Live Profile Summary & Companion Preview Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-7 border border-emerald-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/40">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-black text-xl shrink-0">
              🧓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold border border-emerald-500/30">
                  Active Patient Record
                </span>
                <span className="text-[11px] text-emerald-400/80">Synchronized with Patient Portal</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {displayPatientName}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onNavigateToPatientPortal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>View Greeting on Patient Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Preview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Patient Name</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">{displayPatientName}</p>
            <span className="text-[10px] text-emerald-400">Used in dynamic greetings</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Age</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">{displayPatientAge} Years</p>
            <span className="text-[10px] text-emerald-400">Displayed in portal badge</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Locality</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">{displayLocality}</p>
            <span className="text-[10px] text-emerald-400">Orientation anchor</span>
          </div>

          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-bold text-emerald-300/80 uppercase block">Dementia History</span>
            <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">{displayDementiaDuration}</p>
            <span className="text-[10px] text-emerald-400">Clinical timeline</span>
          </div>
        </div>

        {/* Patient Portal Live Greeting Banner Preview */}
        <div className="p-3.5 bg-emerald-900/40 rounded-2xl border border-emerald-600/30 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-semibold text-emerald-100">
              Patient Portal Welcome Banner will say:
            </span>
            <strong className="text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              "Good Morning, {displayPatientName}"
            </strong>
          </div>
          <span className="text-[11px] text-emerald-300/80">
            (Also renders in native Odia, Assamese, and Gujarati)
          </span>
        </div>
      </div>

      {/* Profile Edit Form Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-200/90 shadow-md space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Edit Patient Profile &amp; Clinical Details
              </h3>
              <p className="text-xs text-slate-500">
                Fill up patient name, age, locality, and how long they have been suffering from dementia.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold text-xs hidden sm:inline-block">
            PostgreSQL &amp; Dexie Synced
          </span>
        </div>

        {/* Status Alert Banner */}
        {profileSaveStatus && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
              profileSaveStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-2 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-2 border-rose-300'
            }`}
          >
            {profileSaveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-700" />
            )}
            <div className="flex-1">
              <p className="font-bold text-sm">
                {profileSaveStatus.type === 'success' ? 'Profile Updated Successfully!' : 'Save Error'}
              </p>
              <p className="mt-0.5">{profileSaveStatus.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={onSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* 1. Patient Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Patient Full Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => onProfileChange('name', e.target.value)}
                placeholder="Patient Full Name"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
              <p className="text-[11px] text-slate-500">
                Renders directly in Patient Portal greeting: <em>"Good Morning{profileForm.name ? `, ${profileForm.name}` : ''}"</em>
              </p>
            </div>

            {/* 2. Patient Age */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Age (Years) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={125}
                value={profileForm.age}
                onChange={(e) => onProfileChange('age', e.target.value)}
                placeholder="Age in Years"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
              <p className="text-[11px] text-slate-500">
                Displayed on Patient Portal identity card &amp; calibrates baseline motor latency.
              </p>
            </div>

            {/* 3. Locality / Address / District */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>Locality / Village / District <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={profileForm.locality}
                onChange={(e) => onProfileChange('locality', e.target.value)}
                placeholder="Locality, District, State"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
              <p className="text-[11px] text-slate-500">
                Provides familiar place orientation to soothe morning disorientation.
              </p>
            </div>

            {/* 4. Dementia Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Suffering Dementia For How Long <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={profileForm.dementia_duration}
                onChange={(e) => onProfileChange('dementia_duration', e.target.value)}
                placeholder="Dementia Duration"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['6 Months', '1 Year', '2 Years', '3-5 Years', '5+ Years'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onProfileChange('dementia_duration', chip)}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer ${
                      profileForm.dementia_duration === chip
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Preferred Regional Dialect */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>Preferred Regional Dialect</span>
              </label>
              <select
                value={profileForm.dialect}
                onChange={(e) => onProfileChange('dialect', e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              >
                <option value="Assamese">Assamese (অসমীয়া)</option>
                <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="English">English (National)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Sets default TTS dialect in IVR calls &amp; audio games.
              </p>
            </div>

            {/* 6. ABHA Health ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>ABHA Health ID (Ayushman Bharat)</span>
              </label>
              <input
                type="text"
                value={profileForm.abha_id}
                onChange={(e) => onProfileChange('abha_id', e.target.value)}
                placeholder="ABHA Health ID"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
              <p className="text-[11px] text-slate-500">
                Used for eSanjeevani teleconsultation and ABDM records.
              </p>
            </div>

            {/* 7. Primary Clinical Stage */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                <span>Primary Diagnosis / Stage</span>
              </label>
              <select
                value={profileForm.primary_condition}
                onChange={(e) => onProfileChange('primary_condition', e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              >
                <option value="Early-stage Alzheimer’s & Vascular Dementia">Early-stage Alzheimer’s &amp; Vascular</option>
                <option value="Mild Cognitive Impairment (MCI)">Mild Cognitive Impairment (MCI)</option>
                <option value="Moderate Dementia">Moderate Dementia</option>
                <option value="Age-Associated Memory Loss">Age-Associated Memory Loss</option>
                <option value="Frontotemporal Dementia">Frontotemporal Dementia</option>
              </select>
            </div>

            {/* 8. Emergency Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Emergency Caretaker Phone</span>
                </span>
                {profileForm.emergency_contact && profileForm.emergency_contact.trim().length > 3 && (
                  <a
                    href={`tel:${profileForm.emergency_contact.trim()}`}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline normal-case flex items-center gap-1"
                    title="Direct call emergency phone"
                  >
                    Call ({profileForm.emergency_contact.trim()})
                  </a>
                )}
              </label>
              <input
                type="tel"
                value={profileForm.emergency_contact}
                onChange={(e) => onProfileChange('emergency_contact', e.target.value)}
                placeholder="Emergency Contact Number"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
            </div>

            {/* 9. Daily Guidance Notes */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Caregiver Notes &amp; Routine Tips</span>
              </label>
              <input
                type="text"
                value={profileForm.notes}
                onChange={(e) => onProfileChange('notes', e.target.value)}
                placeholder="Caregiver Notes & Routine Tips"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition shadow-sm"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant offline &amp; online auto-synchronization enabled</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving & Syncing...' : 'Save Patient Profile'}</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToPatientPortal}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-emerald-300 text-emerald-300" />
                <span>Launch Patient Portal</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
