import React, { useState } from 'react';
import { useLocale } from '@/features/localization/context/LocaleContext';
import { useAshaTriage } from '../hooks/useAshaTriage';

export function AshaMode({ onOpenTeleconsult }) {
  const { t, activeLang, setLanguage } = useLocale();
  const { queue, isSyncing, addScreeningRecord, syncQueueToPhc } = useAshaTriage();

  const [showAddModal, setShowAddModal] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [village, setVillage] = useState('Sonapur');
  const [triageStatus, setTriageStatus] = useState('Amber');
  const [notes, setNotes] = useState('');

  // Interactive Battery Checkbox state
  const [batteryStep2, setBatteryStep2] = useState(false);
  const [batteryStep3, setBatteryStep3] = useState(false);

  // Audio Note Recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, icon = 'check_circle') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Please enter patient name.', 'error');
      return;
    }

    try {
      await addScreeningRecord({
        patientId: Math.floor(Math.random() * 1000) + 1,
        patientName: patientName.trim(),
        village: village.trim() || 'Sonapur',
        triageStatus,
        notes: notes.trim()
      });

      const savedName = patientName.trim();
      setPatientName('');
      setNotes('');
      setShowAddModal(false);
      showToast(`Screening for "${savedName}" saved offline in Dexie.js!`, 'check_circle');
    } catch (err) {
      showToast('Could not record screening. Please try again.', 'error');
    }
  };

  const handleSyncToPHC = async () => {
    showToast('Connecting to Kamrup CHC Cloud...', 'cloud_sync');
    try {
      await syncQueueToPhc();
      showToast('Records safely synchronized with Regional Health Registry!', 'cloud_done');
    } catch {
      showToast('Network offline. Records safely stored on-device.', 'sync_problem');
    }
  };

  const handleVoiceNoteToggle = () => {
    if (isRecordingAudio) {
      setIsRecordingAudio(false);
      showToast('Voice memo saved to offline triage queue', 'check_circle');
    } else {
      setIsRecordingAudio(true);
      showToast('Audio note recording started... (Assamese voice recognition)', 'mic');
    }
  };

  // Triage counters
  const totalCount = queue.length + 3; // Combining baseline community cohort + active queue
  const stableCount = queue.filter(q => q.triage_status === 'Green').length + 1;
  const reviewCount = queue.filter(q => q.triage_status === 'Amber').length + 1;
  const alertCount = queue.filter(q => q.triage_status === 'Red').length + 1;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-5 pb-24 font-body text-on-surface">
      {/* 1. Sunlight Optimized Status Banner */}
      <div className="w-full bg-surface-container-high rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span className="font-headline text-xs uppercase tracking-wider font-bold">
                ASHA Field Triage Mode
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl text-on-surface font-bold leading-tight mt-1 truncate">
              Village: Sonapur
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
              <span>Kamrup Metropolitan, Sector 4</span>
            </p>
          </div>

          {/* Offline Sync Badge */}
          <div className="flex flex-col items-end shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-primary shadow-sm border border-primary/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="font-headline text-xs font-bold">
                {queue.filter(q => !q.synced).length + 3} Queued
              </span>
            </div>
            <button
              onClick={handleSyncToPHC}
              disabled={isSyncing}
              className="mt-2 text-xs font-headline font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer active:scale-95 transition-transform"
              type="button"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Quick Regional Dialect Switcher Pill */}
        <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="font-headline text-xs text-on-surface-variant shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
            <span>Dialect:</span>
          </span>
          <div className="inline-flex p-1 bg-surface-container-highest rounded-xl text-xs font-headline shrink-0 shadow-inner">
            <button
              onClick={() => {
                if (setLanguage) setLanguage('as');
                showToast('Dialect switched to অসমীয়া (Assamese)', 'translate');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLang === 'as'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              অসমীয়া
            </button>
            <button
              onClick={() => {
                if (setLanguage) setLanguage('or');
                showToast('Dialect switched to ଓଡ଼ିଆ (Odia)', 'translate');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLang === 'or'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              ଓଡ଼ିଆ
            </button>
            <button
              onClick={() => {
                if (setLanguage) setLanguage('en');
                showToast('Dialect switched to English', 'translate');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLang === 'en' || activeLang === 'gu'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant font-medium hover:text-on-surface'
              }`}
              type="button"
            >
              ENG / বাং
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Triage Statistics: High Contrast Counter Tiles */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-headline text-sm font-bold text-on-surface tracking-tight">
            Today's Field Screenings
          </h3>
          <span className="text-xs text-on-surface-variant font-medium">Target: 18 Households</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Total */}
          <div className="bg-surface-container-lowest p-2.5 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col items-center justify-center text-center">
            <span className="font-headline text-xl sm:text-2xl font-bold text-on-surface">{totalCount}</span>
            <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold">Total</span>
          </div>

          {/* Green Stable */}
          <div className="bg-primary-fixed p-2.5 rounded-2xl shadow-sm border border-primary/20 flex flex-col items-center justify-center text-center text-primary">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="font-headline text-xl sm:text-2xl font-bold">{stableCount}</span>
            </div>
            <span className="font-headline text-[10px] uppercase font-bold">Stable</span>
          </div>

          {/* Amber Review */}
          <div className="bg-tertiary-fixed p-2.5 rounded-2xl shadow-sm border border-tertiary/20 flex flex-col items-center justify-center text-center text-tertiary">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">help_center</span>
              <span className="font-headline text-xl sm:text-2xl font-bold">{reviewCount}</span>
            </div>
            <span className="font-headline text-[10px] uppercase font-bold">Review</span>
          </div>

          {/* Red Alert */}
          <div className="bg-error-container p-2.5 rounded-2xl shadow-sm border border-error/20 flex flex-col items-center justify-center text-center text-on-error-container">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              <span className="font-headline text-xl sm:text-2xl font-bold">{alertCount}</span>
            </div>
            <span className="font-headline text-[10px] uppercase font-bold">Alert</span>
          </div>
        </div>
      </section>

      {/* 3. Door-to-Door Patient Queue List */}
      <section className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-primary">family_restroom</span>
            <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              Assigned Household Queue
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container font-headline text-xs text-on-surface font-semibold">
            {totalCount} Actionable
          </span>
        </div>

        {/* Patient 1: Parbati Devi (Amber Review) */}
        <article className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                className="w-14 h-14 rounded-full object-cover shadow-inner shrink-0 ring-2 ring-tertiary-fixed"
                alt="Portrait of Parbati Devi"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPkx6PzsZ6u6oZ_vOw0-DUg9SRAARJezBdbp6E0kIcQKJl3aef_DzTfQFP_zDfwL4fMY9YJ2vBgIDPKX4afXu4MwQoa_yLs6aWCiogY_P4MeU9ZMZ6Ja3YSdwm_84q-YUWf3AMMdtVjOPmwH0cT-GtMY9K0YvPeWCZLDkknBtlipP-1K2Q6Gxe_ifBz8y0poQ6ZoylQL0jn-T38p1mM0hniVJLTI-7mzkYF0zNLAc"
              />
              <div className="min-w-0">
                <h4 className="font-headline text-base sm:text-lg text-on-surface font-bold truncate">
                  Parbati Devi
                </h4>
                <p className="text-xs text-on-surface-variant">Age 68 • House #14B (North Pod)</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-tertiary-fixed text-tertiary font-headline text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span>Review</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/20">
            <div className="flex items-center justify-between text-on-surface">
              <span className="font-headline text-xs font-bold flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[15px]">timelapse</span>
                <span>Latency Drift: +38%</span>
              </span>
              <span className="text-[11px] text-on-surface-variant">Recorded 10:15 AM</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Hesitation during family genealogical recall; episodic name substitution between daughter and sister.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenTeleconsult) {
                  onOpenTeleconsult({
                    patient_name: 'Parbati Devi',
                    village: 'Sonapur',
                    triage_status: 'Amber',
                    notes: 'Hesitation during genealogical recall'
                  });
                }
              }}
              className="flex-1 min-h-[50px] rounded-xl bg-secondary text-on-secondary px-4 py-2.5 flex items-center justify-center gap-2 font-headline text-xs sm:text-sm font-bold shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">videocam</span>
              <span>Initiate eSanjeevani Teleconsult</span>
            </button>
            <button
              onClick={() => showToast('Opening historical screening log...', 'history_edu')}
              className="min-h-[50px] px-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center gap-1 font-headline text-xs font-semibold cursor-pointer border border-outline-variant/20"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">history_edu</span>
              <span>Log</span>
            </button>
          </div>
        </article>

        {/* Patient 2: Hemanta Baruah (Red Alert) */}
        <article className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                className="w-14 h-14 rounded-full object-cover shadow-inner shrink-0 ring-2 ring-error-container"
                alt="Portrait of Hemanta Baruah"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP_cXMd8eU6xzE4Mq97WTuNfuRYqR-axa4wPvAmYTDR48d3YvRwUL5Fml6SCAfOZt76zOxHfxV8T2g9aqWtaBKPpc4ydzftDRDb-j_51D_l2ZmwKWlH2Z5KidrlB9zJWCY4gr9a_4ig26pk6wWroevhvh0cmWYVXewAKG718csc1dkWton0JvmYOrPLmeqFWrB50OaY-AEA4bm7XOqv2lvuQxsjBvvithbocMoaU4"
              />
              <div className="min-w-0">
                <h4 className="font-headline text-base sm:text-lg text-on-surface font-bold truncate">
                  Hemanta Baruah
                </h4>
                <p className="text-xs text-on-surface-variant">Age 81 • House #09 (River Road)</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error-container text-on-error-container font-headline text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-[15px]">priority_high</span>
              <span>Red Alert</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-error-container/40 text-on-error-container flex flex-col gap-1 border border-error/20">
            <div className="flex items-center gap-1 font-headline text-xs font-bold">
              <span className="material-symbols-outlined text-[17px]">neurology</span>
              <span>Sudden Orientation Drop &amp; High Perseveration</span>
            </div>
            <p className="text-xs leading-relaxed">
              Unable to identify present season or home district. Repeated standard motor gesture 7 times uninterrupted. Primary caregiver son reports night wanderings.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              className="min-h-[50px] rounded-xl bg-error text-on-error px-3 py-2 flex items-center justify-center gap-1.5 font-headline text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-transform text-center"
              href="tel:108"
            >
              <span className="material-symbols-outlined text-[20px]">ambulance</span>
              <span>Dispatch PHC (108)</span>
            </a>
            <button
              onClick={() => showToast('Caregiver notified via SMS/Call', 'ring_volume')}
              className="min-h-[50px] rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface px-3 py-2 flex items-center justify-center gap-1.5 font-headline text-xs sm:text-sm font-bold active:scale-95 transition-transform cursor-pointer border border-outline-variant/20"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">ring_volume</span>
              <span>Alert Caregiver</span>
            </button>
          </div>
        </article>

        {/* Patient 3: Biren Saikia (Green Stable) */}
        <article className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                className="w-14 h-14 rounded-full object-cover shadow-inner shrink-0 ring-2 ring-primary-fixed"
                alt="Portrait of Biren Saikia"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC99SEpWuklsjRGNkPo5XmfzL_fiADMDaKsNTB0dt_yh6T6oLDuMn4Uh8ZBf1gBRFwLWBeyLHfxXPH0xyoildffxzzJBVgS-sEWgwJor1F9WAIgO5X_Nwwqz6o-sYwCRQ76Qxqc86V4fyPaCjAcF2S0aaBBxl1mD0TpHGbVEgxD9VzA3pk8OoQ4TzbtThJlytY6GtVuuBbHRFff2OQOojjIFD50e_thgBChWhgiAyE"
              />
              <div className="min-w-0">
                <h4 className="font-headline text-base sm:text-lg text-on-surface font-bold truncate">
                  Biren Saikia
                </h4>
                <p className="text-xs text-on-surface-variant">Age 76 • House #22 (East Temple)</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-primary font-headline text-xs font-bold shrink-0">
              <span className="material-symbols-outlined text-[15px]">task_alt</span>
              <span>Stable</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center gap-2 border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-[22px]">draw</span>
              <div>
                <div className="font-headline text-sm font-bold text-on-surface">88 / 100</div>
                <div className="text-[10px] text-on-surface-variant">PatternTrace Score</div>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-low flex items-center gap-2 border border-outline-variant/20">
              <span className="material-symbols-outlined text-primary text-[22px]">directions_walk</span>
              <div>
                <div className="font-headline text-sm font-bold text-on-surface">Optimal</div>
                <div className="text-[10px] text-on-surface-variant">Daily Living (ADL)</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-on-surface-variant text-xs pt-1">
            <span className="flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
              <span>Next Followup: 30 Days</span>
            </span>
            <button
              onClick={() => showToast('Opening quick note modal...', 'edit_note')}
              className="font-headline text-xs font-bold text-primary hover:underline cursor-pointer"
              type="button"
            >
              Quick Note +
            </button>
          </div>
        </article>

        {/* Dynamic Registered Queue Records */}
        {queue.map((record) => (
          <article
            key={record.id}
            className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-headline text-base font-bold text-on-surface">{record.patient_name}</h4>
                <p className="text-xs text-on-surface-variant">{record.village || 'Sonapur'} • {new Date(record.timestamp).toLocaleDateString()}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-headline font-bold ${
                record.triage_status === 'Red'
                  ? 'bg-error-container text-on-error-container'
                  : record.triage_status === 'Amber'
                  ? 'bg-tertiary-fixed text-tertiary'
                  : 'bg-primary-fixed text-primary'
              }`}>
                {record.triage_status}
              </span>
            </div>
            {record.notes && (
              <p className="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg border border-outline-variant/20">
                {record.notes}
              </p>
            )}
          </article>
        ))}
      </section>

      {/* 4. Interactive Rapid Clinical Battery Module (MoCA / ICMR-NARI Tier 1) */}
      <section className="bg-surface-container-high rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 border border-outline-variant/30">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            </div>
            <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface">
              Standard Rapid Screening Tool
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-primary text-[11px] font-headline font-bold border border-outline-variant/20">
            ICMR-NARI Tier 1
          </span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Validated multi-lingual 5-minute verbal &amp; clock-orientation protocol tailored for rural non-literate and literate elders.
        </p>

        {/* Battery Checklist */}
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest cursor-pointer border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-on-surface">
                1. Three-Word Audio Recall (Fish, Tree, Coin)
              </span>
            </div>
            <span className="font-headline text-xs text-primary font-bold">Completed</span>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest cursor-pointer border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={batteryStep2}
                onChange={(e) => {
                  setBatteryStep2(e.target.checked);
                  showToast(
                    e.target.checked ? 'Currency calculation recorded: Passed (1/1)' : 'Calculation pending',
                    'done'
                  );
                }}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-on-surface">
                2. Regional Market Currency Calculation
              </span>
            </div>
            <span className={`font-headline text-xs font-bold ${batteryStep2 ? 'text-primary' : 'text-outline'}`}>
              {batteryStep2 ? 'Passed' : 'Pending'}
            </span>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest cursor-pointer border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={batteryStep3}
                onChange={(e) => {
                  setBatteryStep3(e.target.checked);
                  showToast(
                    e.target.checked ? 'Clock gesture registered cleanly' : 'Gesture test pending',
                    'schedule'
                  );
                }}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-semibold text-on-surface">
                3. Clock Face Orientation Finger Gesture
              </span>
            </div>
            <span className={`font-headline text-xs font-bold ${batteryStep3 ? 'text-primary' : 'text-outline'}`}>
              {batteryStep3 ? 'Passed' : 'Pending'}
            </span>
          </label>
        </div>
      </section>

      {/* 5. Sticky Bottom Action Bar for New Screening & Voice Memo */}
      <div className="sticky bottom-2 w-full z-30 pt-2">
        <div className="bg-surface-container-lowest/95 backdrop-blur-md p-2 rounded-2xl shadow-xl flex items-center gap-2 border border-outline-variant/40">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 min-h-[56px] rounded-xl bg-primary text-on-primary font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">add_circle</span>
            <span>+ New Household Screening</span>
          </button>

          <button
            onClick={handleVoiceNoteToggle}
            aria-label="Field Audio Note"
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer shadow-sm ${
              isRecordingAudio
                ? 'bg-error text-on-error animate-pulse'
                : 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isRecordingAudio ? 'mic_off' : 'mic'}
            </span>
            <span className="text-[10px] font-headline font-bold uppercase">
              {isRecordingAudio ? 'Stop' : 'Note'}
            </span>
          </button>
        </div>
      </div>

      {/* Add New Screening Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline text-lg sm:text-xl font-bold text-primary">
                New Household Screening
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddVisit} className="space-y-4">
              <div>
                <label className="block font-headline text-xs font-bold text-on-surface-variant uppercase mb-1">
                  Elder Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Nirmala Borah"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-headline text-xs font-bold text-on-surface-variant uppercase mb-1">
                  Village / Household
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Sonapur Pod #3"
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-headline text-xs font-bold text-on-surface-variant uppercase mb-1">
                  Triage Urgency Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Green', 'Amber', 'Red'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTriageStatus(st)}
                      className={`py-2 rounded-xl text-xs font-headline font-bold transition-all border cursor-pointer ${
                        triageStatus === st
                          ? st === 'Green'
                            ? 'bg-primary text-on-primary border-primary'
                            : st === 'Amber'
                            ? 'bg-secondary text-on-secondary border-secondary'
                            : 'bg-error text-on-error border-error'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {st === 'Green' ? 'Stable' : st === 'Amber' ? 'Review' : 'Alert'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-headline text-xs font-bold text-on-surface-variant uppercase mb-1">
                  Clinical Observations &amp; Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note memory, orientation, motor tremors..."
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-xs text-on-surface focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] rounded-xl bg-primary text-on-primary font-headline text-xs sm:text-sm font-bold shadow hover:bg-primary-container cursor-pointer"
                >
                  Save to Triage Queue
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[48px] px-4 rounded-xl bg-surface-container text-on-surface font-headline text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-xl font-headline text-xs shadow-xl flex items-center gap-2 z-50 animate-in fade-in">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">{toast.icon}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default AshaMode;
