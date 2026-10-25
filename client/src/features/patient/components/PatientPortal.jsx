import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDualAuth } from '@/features/auth/context/DualAuthContext';
import { useLocale } from '@/features/localization/context/LocaleContext';
import { DementiaLanguageToggle } from '@/features/localization/components/DementiaLanguageToggle';
import { PatternTraceGame } from '@/features/games/components/PatternTraceGame';
import { VisualSemanticGame } from '@/features/games/components/VisualSemanticGame';
import { ShapeMatchGame } from '@/features/games/components/ShapeMatchGame';
import { DailyRoutineGame } from '@/features/games/components/DailyRoutineGame';
import { BiographicalRecognitionGame } from '@/features/games/components/BiographicalRecognitionGame';
import { FEATURE_FLAGS } from '@/config/features';

function getTimeBasedGreeting(patientName = '', lang = 'en') {
  const hour = new Date().getHours();
  let period = 'morning';
  let periodLabel = 'Shokal • Morning';

  if (hour >= 4 && hour < 12) {
    period = 'morning';
    periodLabel = 'Shokal • Morning';
  } else if (hour >= 12 && hour < 17) {
    period = 'afternoon';
    periodLabel = 'Bikel • Afternoon';
  } else {
    period = 'evening';
    periodLabel = 'Shondhya • Evening';
  }

  const hasName = Boolean(patientName && patientName.trim());
  const trimmedName = hasName ? patientName.trim() : 'Dadu';

  const greetings = {
    or: {
      morning: `ଶୁଭ ସକାଳ, ${trimmedName}`,
      afternoon: `ଶୁଭ ଅପରାହ୍ନ, ${trimmedName}`,
      evening: `ଶୁଭ ସନ୍ଧ୍ୟା, ${trimmedName}`
    },
    gu: {
      morning: `શુભ સવાર, ${trimmedName}`,
      afternoon: `શુભ બપોર, ${trimmedName}`,
      evening: `શુભ સાંજ, ${trimmedName}`
    },
    as: {
      morning: `শুভ প্ৰভাত, ${trimmedName}`,
      afternoon: `শুভ অপৰাহ্ণ, ${trimmedName}`,
      evening: `শুভ সন্ধিয়া, ${trimmedName}`
    },
    en: {
      morning: `Shubho Shokal, ${trimmedName}`,
      afternoon: `Good Afternoon, ${trimmedName}`,
      evening: `Good Evening, ${trimmedName}`
    }
  };

  const selectedMap = greetings[lang] || greetings.en;
  const text = selectedMap[period] || `Shubho Shokal, ${trimmedName}`;

  return { text, period, periodLabel };
}

export function PatientPortal({ onExitToHome, initialGame = null }) {
  const { patientSession, patientProfile, patientLogin, signOutPatient } = useDualAuth();
  const { activeLang, regionInfo, t } = useLocale();

  // Active Game State: null = Companion Home View; or 'biographical' | 'pattern' | 'visual' | 'routine'
  const [activeGame, setActiveGame] = useState(initialGame);

  useEffect(() => {
    if (initialGame) {
      setActiveGame(initialGame);
    }
  }, [initialGame]);

  // Feeling State: 'Peaceful' | 'Energetic' | 'Need Rest'
  const [selectedFeeling, setSelectedFeeling] = useState('Peaceful');

  // Routine Checklist State
  const [checklist, setChecklist] = useState({
    tulsiTea: true,
    memoryExercise: false,
    afternoonWalk: false
  });

  // Audio Voice Guide playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const speechRef = useRef(null);

  // Unregistered Login State
  const [caretakerEmail, setCaretakerEmail] = useState('');
  const [patientPassword, setPatientPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dynamic Patient Profile
  const patientName = patientSession?.patient_name || patientProfile?.name || 'Rabindra N. Ghosh';
  const patientAge = patientSession?.patient_age || patientProfile?.age || '74';
  const locality = patientSession?.locality || patientProfile?.locality || 'Bhubaneswar';
  const caretakerName = patientSession?.caretaker_name || patientProfile?.caregiver_name || 'Meera';
  const caretakerPhone = patientProfile?.caregiver_phone || '+919876543210';

  const [showSignInForm, setShowSignInForm] = useState(false);

  const greetingData = getTimeBasedGreeting(patientName, activeLang);

  // Today formatted string
  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  // 0.88x Gentle Voice Speech Player
  const handlePlayVoiceGuide = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const message = `${greetingData.text}. Today is ${todayDateString}. You are safe at home in ${locality} with ${caretakerName}. Take your time today, there is no rush.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.88; // Gentle geriatric pacing
    utterance.pitch = 1.0;

    if (activeLang === 'or') utterance.lang = 'or-IN';
    else if (activeLang === 'gu') utterance.lang = 'gu-IN';
    else if (activeLang === 'as') utterance.lang = 'as-IN';
    else utterance.lang = 'en-IN';

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [greetingData.text, todayDateString, locality, caretakerName, activeLang, isPlayingAudio]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await patientLogin({ caretakerEmail, patientPassword });
    } catch (err) {
      setErrorMsg(err?.message || 'Invalid credentials. Please verify caretaker email and patient password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutPatient();
    if (onExitToHome) onExitToHome();
  };

  // If a game is active, render the full-screen exercise view with back navigation
  if (activeGame) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 pb-12 font-sans">
        {/* Navigation Bar to return to companion home & switch games directly */}
        <div className="flex flex-wrap items-center justify-between bg-surface-container-low p-3.5 sm:p-4 rounded-2xl shadow-sm border border-outline-variant/30 gap-3">
          <button
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-surface-container-lowest text-primary hover:bg-surface-container font-headline font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Companion Home</span>
          </button>

          {/* Quick Switcher Between All 4 Cognitive Exercises */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveGame('biographical')}
              className={`px-3 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeGame === 'biographical'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              1. Family Memory
            </button>
            <button
              onClick={() => setActiveGame('pattern')}
              className={`px-3 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeGame === 'pattern'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              2. PatternTrace
            </button>
            <button
              onClick={() => setActiveGame('visual')}
              className={`px-3 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeGame === 'visual'
                  ? 'bg-secondary text-on-secondary shadow-sm ring-2 ring-secondary/40'
                  : 'bg-secondary-fixed text-secondary hover:bg-secondary-fixed-dim'
              }`}
            >
              3. Shape Match
            </button>
            <button
              onClick={() => setActiveGame('routine')}
              className={`px-3 py-1.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeGame === 'routine'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              4. Daily Routine
            </button>
          </div>
        </div>

        {activeGame === 'pattern' && (
          <PatternTraceGame
            patientId={patientSession?.patient_id || patientSession?.id || patientProfile?.id || 1}
            onComplete={() => setActiveGame(null)}
            onExitToRest={() => setActiveGame(null)}
          />
        )}

        {activeGame === 'biographical' && (
          <BiographicalRecognitionGame
            patientId={patientSession?.patient_id || patientSession?.id || patientProfile?.id || 1}
            dialect={regionInfo.englishName || 'Odia'}
            onExitToRest={() => setActiveGame(null)}
          />
        )}

        {activeGame === 'visual' && (
          FEATURE_FLAGS.SHAPE_GAME_ENABLED ? (
            <ShapeMatchGame
              patientId={patientSession?.patient_id || patientSession?.id || patientProfile?.id || 1}
              dialect={regionInfo.englishName || 'Assamese'}
              onExitToRest={() => setActiveGame(null)}
            />
          ) : (
            <VisualSemanticGame
              patientId={patientSession?.patient_id || patientSession?.id || patientProfile?.id || 1}
              dialect={regionInfo.englishName || 'Odia'}
              onGameComplete={() => setActiveGame(null)}
              onComplete={() => setActiveGame(null)}
            />
          )
        )}

        {activeGame === 'routine' && (
          <DailyRoutineGame
            patientId={patientSession?.patient_id || patientSession?.id || patientProfile?.id || 1}
            dialect={regionInfo.englishName || 'Odia'}
            onGameComplete={() => setActiveGame(null)}
            onComplete={() => setActiveGame(null)}
          />
        )}
      </div>
    );
  }

  // ── PATIENT COMPANION PORTAL (STITCH NEW UI) ──
  if (!showSignInForm) {
    const completedStepsCount = Object.values(checklist).filter(Boolean).length;

    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6 pb-20 font-body text-on-surface">
        {/* 1. Welcome Banner with Warm Sun Illustration & Gentle Audio Dialect Guide */}
        <section className="w-full bg-surface-container-low rounded-2xl p-5 shadow-sm relative overflow-hidden border border-outline-variant/30">
          <div className="flex flex-col gap-3 relative z-10">
            {/* Top Row: Dialect audio guide pill & Morning Indicator */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-primary">
                <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                  wb_sunny
                </span>
                <span className="font-headline text-xs font-semibold tracking-wide text-on-surface">
                  {greetingData.periodLabel}
                </span>
              </div>

              {/* Voice Guide Trigger Button */}
              <button
                onClick={handlePlayVoiceGuide}
                aria-label="Listen to morning audio guide in gentle 0.88x voice"
                className={`min-h-[46px] px-3.5 py-1.5 rounded-xl text-primary flex items-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer ${
                  isPlayingAudio ? 'bg-primary-fixed border border-primary/40' : 'bg-surface-container-highest hover:bg-surface-container-high'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[24px] text-primary">
                  {isPlayingAudio ? 'pause_circle' : 'volume_up'}
                </span>
                <div className="flex flex-col text-left">
                  <span className="font-headline text-[12px] font-bold text-primary">0.88x Gentle Voice</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {isPlayingAudio ? 'Playing instructions...' : 'Tap to listen'}
                  </span>
                </div>
              </button>
            </div>

            {/* Personalized Dignified Greeting */}
            <div className="flex items-center gap-4 mt-1">
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-md ring-2 ring-primary-fixed">
                <img
                  className="w-full h-full object-cover"
                  alt={`Warm portrait photograph of ${patientName}`}
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfc4lbp1ww-QFAmEDXw75iZP1oBLACHHfz9lvHVodEQ_fveBXHsB5JdEPDcytRiBtBC3pYq4_tQMHI9IgkbbtlZ7C8rwQGJlS3S2rKe_b9PZBFMjpeYYrJEnwgRS3IkfSwfAJ_Vi4SgtSCSr6zvDA9bmangA8xLBtADE6GKKvco4vIdEUoW9zcjT0Mq16sr801bACuPtrtNAL8ZfNI5vU-cCXHnS2wRq4QjcRv01U"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="font-headline text-2xl sm:text-3xl text-primary tracking-tight font-bold truncate">
                  {greetingData.text}
                </h1>
                <p className="text-sm sm:text-base text-on-surface-variant mt-0.5">
                  Today is {todayDateString}
                </p>
              </div>
            </div>

            {/* Gentle reassurance callout */}
            <div className="mt-1 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-sm flex items-center gap-2.5 border border-outline-variant/20">
              <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">spa</span>
              <span className="text-sm sm:text-base text-on-surface font-medium leading-relaxed">
                You are safe at home in <strong className="text-primary font-bold">{locality}</strong> with {caretakerName}. Take your time today.
              </span>
            </div>
          </div>

          {/* Decorative Soft Morning Sun Glow SVG (Lightweight background art) */}
          <div className="absolute -right-10 -bottom-10 pointer-events-none opacity-20">
            <svg fill="none" height="220" viewBox="0 0 200 200" width="220" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" fill="#FDBA45" r="70"></circle>
              <circle cx="100" cy="100" r="92" stroke="#FDBA45" strokeDasharray="8 8" strokeWidth="4"></circle>
            </svg>
          </div>
        </section>

        {/* 2. Quick Daily Feeling & Mood Check-in */}
        <section className="w-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg sm:text-xl text-primary font-bold">
              How are you feeling now?
            </h2>
            <span className="text-xs text-on-surface-variant font-medium">Tap one</span>
          </div>

          <div aria-label="Daily emotional feeling check-in" className="grid grid-cols-3 gap-3" role="radiogroup">
            {/* Peaceful Option */}
            <button
              aria-checked={selectedFeeling === 'Peaceful'}
              className={`min-h-[96px] p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer border ${
                selectedFeeling === 'Peaceful'
                  ? 'bg-primary-fixed border-primary/40 ring-2 ring-primary/30'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container'
              }`}
              onClick={() => setSelectedFeeling('Peaceful')}
              role="radio"
              type="button"
            >
              <span className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  sentiment_satisfied
                </span>
              </span>
              <span className="font-headline text-xs sm:text-sm text-primary font-bold">Peaceful</span>
            </button>

            {/* Energetic Option */}
            <button
              aria-checked={selectedFeeling === 'Energetic'}
              className={`min-h-[96px] p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer border ${
                selectedFeeling === 'Energetic'
                  ? 'bg-tertiary-fixed border-tertiary/40 ring-2 ring-tertiary/30'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container'
              }`}
              onClick={() => setSelectedFeeling('Energetic')}
              role="radio"
              type="button"
            >
              <span className="w-12 h-12 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[30px]">local_florist</span>
              </span>
              <span className="font-headline text-xs sm:text-sm text-on-surface font-semibold">Energetic</span>
            </button>

            {/* Need Rest Option */}
            <button
              aria-checked={selectedFeeling === 'Need Rest'}
              className={`min-h-[96px] p-3 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer border ${
                selectedFeeling === 'Need Rest'
                  ? 'bg-secondary-fixed border-secondary/40 ring-2 ring-secondary/30'
                  : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container'
              }`}
              onClick={() => setSelectedFeeling('Need Rest')}
              role="radio"
              type="button"
            >
              <span className="w-12 h-12 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[30px]">bedtime</span>
              </span>
              <span className="font-headline text-xs sm:text-sm text-on-surface font-semibold">Need Rest</span>
            </button>
          </div>
        </section>

        {/* 3. Today's Routine & Hydration Track (Large Accessible Checklist Cards) */}
        <section className="w-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[26px]">checklist</span>
              <h2 className="font-headline text-lg sm:text-xl text-primary font-bold">
                Today's Gentle Steps
              </h2>
            </div>
            <span className="font-headline text-xs font-semibold px-3 py-1 rounded-full bg-primary-fixed text-primary">
              {completedStepsCount} of 3 Done
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Step 1: Morning Tulsi Water */}
            <div
              onClick={() => setChecklist(prev => ({ ...prev, tulsiTea: !prev.tulsiTea }))}
              className="w-full p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-3 border border-outline-variant/30 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  checklist.tulsiTea ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: checklist.tulsiTea ? "'FILL' 1" : "'FILL' 0" }}>
                    {checklist.tulsiTea ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline text-xs text-secondary font-bold uppercase tracking-wider">
                    8:00 AM • {checklist.tulsiTea ? 'Completed' : 'Upcoming'}
                  </span>
                  <span className={`font-headline text-base sm:text-lg font-semibold truncate ${
                    checklist.tulsiTea ? 'line-through text-outline' : 'text-on-surface'
                  }`}>
                    Morning Tulsi Tea &amp; Water
                  </span>
                  <span className="text-xs text-on-surface-variant">250ml glass taken with {caretakerName}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {checklist.tulsiTea ? 'done_all' : 'schedule'}
                </span>
              </div>
            </div>

            {/* Step 2: Midday Memory Exercise (Active Card with Direct Play Action) */}
            <div className="w-full p-4 sm:p-5 rounded-2xl bg-surface-container-low shadow-md flex flex-col gap-3 border-2 border-primary/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[32px]">psychology</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-[11px] font-bold uppercase tracking-wider text-tertiary-container bg-tertiary-fixed px-2 py-0.5 rounded-md">
                        Happening Now
                      </span>
                    </div>
                    <h3 className="font-headline text-base sm:text-lg text-primary font-bold mt-0.5">
                      Midday Memory Exercise
                    </h3>
                    <p className="text-xs sm:text-sm text-on-surface-variant">Family Moments &amp; PatternTrace</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-primary text-[28px] animate-pulse shrink-0">
                  radio_button_checked
                </span>
              </div>

              <div className="w-full bg-surface-container-high rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">timer_off</span>
                  <span className="text-xs sm:text-sm text-on-surface font-medium">No clock • Free play anytime</span>
                </div>
                <button
                  onClick={() => setActiveGame('biographical')}
                  className="font-headline text-xs sm:text-sm text-primary font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Start Now <span className="material-symbols-outlined text-[16px]">play_circle</span>
                </button>
              </div>
            </div>

            {/* Step 3: Courtyard Garden Walk */}
            <div
              onClick={() => setChecklist(prev => ({ ...prev, afternoonWalk: !prev.afternoonWalk }))}
              className="w-full p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-3 border border-outline-variant/30 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  checklist.afternoonWalk ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[32px]">nature_people</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                    3:30 PM • {checklist.afternoonWalk ? 'Completed' : 'Upcoming'}
                  </span>
                  <h3 className={`font-headline text-base sm:text-lg font-semibold truncate ${
                    checklist.afternoonWalk ? 'line-through text-outline' : 'text-on-surface'
                  }`}>
                    Courtyard Garden Walk
                  </h3>
                  <span className="text-xs text-on-surface-variant">Gentle 15 minutes fresh air with walking stick</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  {checklist.afternoonWalk ? 'done_all' : 'schedule'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Exercise Quick Tabs & Catalog */}
        <section className="w-full flex flex-col gap-3" id="exercises-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[26px]">psychology</span>
              <h2 className="font-headline text-lg sm:text-xl text-primary font-bold">
                Prescribed Cognitive Exercises
              </h2>
            </div>
            <span className="font-headline text-xs text-on-surface-variant font-medium">4 Active Games</span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveGame('biographical')}
              className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-primary-fixed hover:border-primary/40 flex items-center gap-2 text-left shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">family_restroom</span>
              </div>
              <div className="min-w-0">
                <span className="font-headline text-xs font-bold text-primary block truncate">1. Family</span>
                <span className="text-[10px] text-on-surface-variant block truncate">Face Recall</span>
              </div>
            </button>

            <button
              onClick={() => setActiveGame('pattern')}
              className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-primary-fixed hover:border-primary/40 flex items-center gap-2 text-left shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">gesture</span>
              </div>
              <div className="min-w-0">
                <span className="font-headline text-xs font-bold text-primary block truncate">2. PatternTrace</span>
                <span className="text-[10px] text-on-surface-variant block truncate">Working Memory</span>
              </div>
            </button>

            <button
              onClick={() => setActiveGame('visual')}
              className="p-3 rounded-2xl bg-secondary-fixed/50 border border-secondary/40 hover:bg-secondary-fixed flex items-center gap-2 text-left shadow-sm transition-all cursor-pointer active:scale-95 ring-1 ring-secondary/20"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[20px]">shapes</span>
              </div>
              <div className="min-w-0">
                <span className="font-headline text-xs font-bold text-secondary block truncate">3. Shape Match</span>
                <span className="text-[10px] text-on-surface-variant block truncate">Fine Motor</span>
              </div>
            </button>

            <button
              onClick={() => setActiveGame('routine')}
              className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 hover:bg-primary-fixed hover:border-primary/40 flex items-center gap-2 text-left shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div className="min-w-0">
                <span className="font-headline text-xs font-bold text-primary block truncate">4. Routine</span>
                <span className="text-[10px] text-on-surface-variant block truncate">Daily Steps</span>
              </div>
            </button>
          </div>
        </section>

        {/* 4a. Featured Cognitive Practice: Family Moments & Faces (Zero Timer Stress) */}
        <section className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-md flex flex-col gap-4 border border-outline-variant/30" id="cognitive-card">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-headline text-xs font-bold">Tier 1 Core Recognition</span>
            </div>
            <span className="font-headline text-xs text-secondary font-bold">Active Today</span>
          </div>

          {/* Practice Image Preview with Cultural Context */}
          <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-inner">
            <img
              className="w-full h-full object-cover"
              alt="Heartwarming vintage photograph of an Indian family gathering during a festival celebration in courtyard"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAo0iPKXER5k0GS2F1nzz6iE8jx0jpKfR3u9CAM1hBuGLlSEbwIyCUTQu6cXxLcB2nanymg2vxWk8_QhOjLaW8uGE54HV8exbuSqobssv1lMom7l5-NQekvw8JnGH3oTpqZ08_aDlTzHCmfsqX_UAkSktVslc318Tz3U01KrhJv1kCI4TIuUC-WSsmwL-nZ8F7ib84_t8Fno2CreMan4cEYknAHpPWjUFAVeBXbUxo"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent flex items-end p-4">
              <div className="text-on-primary">
                <p className="font-headline text-lg sm:text-xl font-bold">Family Moments &amp; Faces</p>
                <p className="text-xs sm:text-sm opacity-90">Recognize grandchildren, relatives &amp; fond memories</p>
              </div>
            </div>
          </div>

          {/* Reassurance Banner */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low text-primary">
            <div className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center shrink-0 text-primary">
              <span className="material-symbols-outlined text-[22px]">hourglass_disabled</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-on-surface">
              No rush or timers here. Take all the time you need. Each memory is a celebration.
            </p>
          </div>

          {/* Accessible 64px Giant Primary Start Button */}
          <button
            onClick={() => setActiveGame('biographical')}
            aria-label="Start practicing Family Moments and Faces exercise now"
            className="w-full min-h-[64px] px-6 py-4 rounded-2xl bg-primary text-on-primary flex items-center justify-center gap-3 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[28px]">play_circle</span>
            <span className="font-headline text-base sm:text-lg font-bold">
              Start Family Practice • ଆରମ୍ଭ କରନ୍ତୁ
            </span>
          </button>
        </section>

        {/* 4b. Match the Shapes & Motor Game Card (Tier 2 Kinematics & Motor) */}
        <section className="w-full bg-surface-container-lowest rounded-2xl p-5 shadow-md flex flex-col gap-3.5 border-2 border-secondary/30">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-secondary">
              <span className="material-symbols-outlined text-[18px]">shapes</span>
              <span className="font-headline text-xs font-bold">Tier 2 • Fine Motor &amp; Tremor</span>
            </div>
            <span className="font-headline text-xs text-primary font-bold">Kinematic Scoring Active</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[36px]">category</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="font-headline text-lg sm:text-xl text-primary font-bold">
                Match the Shapes &amp; Motor
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                Drag geometric and traditional cultural shapes into matching slots. Measures fine motor stability, hand jitter kinematics, and cognitive association.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveGame('visual')}
            aria-label="Start practicing Match the Shapes game"
            className="w-full min-h-[56px] px-6 py-3.5 rounded-xl bg-secondary text-on-secondary flex items-center justify-center gap-2.5 shadow-md hover:bg-secondary-container hover:text-on-secondary-container active:scale-[0.98] transition-all cursor-pointer font-headline text-sm sm:text-base font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">play_circle</span>
            <span>Play Shape Match • ଆକୃତି ମେଳାନ୍ତୁ</span>
          </button>
        </section>

        {/* 5. PatternTrace Tactile Paths Tile */}
        <section className="w-full bg-surface-container-low rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3 border border-outline-variant/30">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[30px]">gesture</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-base sm:text-lg text-primary font-bold truncate">
                PatternTrace™ Tactile Paths
              </span>
              <span className="text-xs sm:text-sm text-on-surface-variant">Trace gentle Kolam designs &amp; working memory dots</span>
            </div>
          </div>
          <button
            onClick={() => setActiveGame('pattern')}
            className="min-h-[52px] min-w-[72px] px-4 rounded-xl bg-surface-container-lowest text-primary font-headline text-sm font-bold shadow-sm hover:bg-primary-fixed active:scale-95 flex items-center justify-center shrink-0 cursor-pointer border border-outline-variant/20"
            type="button"
          >
            Play
          </button>
        </section>

        {/* 5b. Daily Living & Routine Sequencing Tile */}
        <section className="w-full bg-surface-container-low rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3 border border-outline-variant/30">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[30px]">calendar_month</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-base sm:text-lg text-primary font-bold truncate">
                Daily Living &amp; Routine Sequence
              </span>
              <span className="text-xs sm:text-sm text-on-surface-variant">Sequence everyday steps (tea, walk, medicine) calmly</span>
            </div>
          </div>
          <button
            onClick={() => setActiveGame('routine')}
            className="min-h-[52px] min-w-[72px] px-4 rounded-xl bg-surface-container-lowest text-primary font-headline text-sm font-bold shadow-sm hover:bg-primary-fixed active:scale-95 flex items-center justify-center shrink-0 cursor-pointer border border-outline-variant/20"
            type="button"
          >
            Play
          </button>
        </section>

        {/* 6. Caregiver Direct Link & Emergency SOS Banner */}
        <section className="w-full bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3 border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-fixed-dim inline-block animate-ping"></span>
              <span className="font-headline text-sm sm:text-base text-primary font-bold">
                {caretakerName} is in the next room
              </span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">{locality} home</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              aria-label={`Call primary family caretaker ${caretakerName}`}
              className="min-h-[64px] px-4 rounded-xl bg-surface-container-low text-primary flex items-center justify-center gap-2.5 active:scale-95 transition-transform shadow-sm border border-outline-variant/20"
              href={`tel:${caretakerPhone}`}
            >
              <span className="material-symbols-outlined text-[26px] text-primary">call</span>
              <div className="flex flex-col text-left min-w-0">
                <span className="font-headline text-xs sm:text-sm font-bold text-primary truncate">Call {caretakerName}</span>
                <span className="text-[11px] text-on-surface-variant">Quick Dial</span>
              </div>
            </a>

            <a
              aria-label="Emergency senior medical helpline 108"
              className="min-h-[64px] px-4 rounded-xl bg-error-container text-on-error-container flex items-center justify-center gap-2.5 active:scale-95 transition-transform shadow-sm"
              href="tel:108"
            >
              <span className="material-symbols-outlined text-[26px] text-error">emergency</span>
              <div className="flex flex-col text-left">
                <span className="font-headline text-xs sm:text-sm font-bold text-on-error-container">Help 108</span>
                <span className="text-[11px] text-on-error-container">Medical Assist</span>
              </div>
            </a>
          </div>
        </section>

        {/* 7. Grounding Thought / Calming Quote */}
        <div className="w-full text-center py-2 px-4">
          <p className="text-base sm:text-lg text-on-surface-variant italic font-serif">
            "ସବୁଠାରୁ ବଡ଼ ଶକ୍ତି ହେଉଛି ଆମର ଶାନ୍ତି।"
          </p>
          <p className="font-headline text-xs text-outline mt-1 font-medium">
            "The greatest strength is our quiet inner peace."
          </p>
        </div>
      </div>
    );
  }

  // ── UNREGISTERED / SIGN IN VIEW FOR PATIENT (STITCH WARM DESIGN) ──
  return (
    <div className="w-full max-w-md mx-auto bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-xl p-6 sm:p-8 space-y-6 my-6 font-body">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-fixed text-primary rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-sm">
          <span className="material-symbols-outlined text-[32px]">spa</span>
        </div>
        <h2 className="font-headline text-2xl font-bold text-primary">
          Patient Companion Sign In
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          {patientName ? (
            <>Sign in to enter the personalized companion portal for <strong className="text-primary font-bold">{patientName} (Age {patientAge})</strong>.</>
          ) : (
            <>Sign in with your caretaker credentials to enter your daily companion portal.</>
          )}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-error-container text-on-error-container rounded-xl text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-error shrink-0">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePatientSubmit} className="space-y-4">
        <div>
          <label className="block font-headline text-[11px] font-bold text-on-surface-variant uppercase mb-1">
            Caretaker's Email Address
          </label>
          <div className="relative">
            <span className="material-symbols-outlined text-outline absolute left-3.5 top-3 text-[20px]">mail</span>
            <input
              type="email"
              required
              value={caretakerEmail}
              onChange={(e) => setCaretakerEmail(e.target.value)}
              placeholder="caretaker@example.com"
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block font-headline text-[11px] font-bold text-on-surface-variant uppercase mb-1">
            Patient Access Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined text-outline absolute left-3.5 top-3 text-[20px]">lock</span>
            <input
              type="password"
              required
              value={patientPassword}
              onChange={(e) => setPatientPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-3 pl-11 pr-4 text-xs sm:text-sm text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] bg-primary hover:bg-primary-container text-on-primary font-headline font-bold text-sm rounded-xl shadow flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Verifying...' : (patientName ? `Sign In as ${patientName}` : 'Sign In to Companion')}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSignInForm(false)}
            className="w-full py-2.5 text-xs font-headline font-semibold text-on-surface-variant hover:text-on-surface hover:underline cursor-pointer"
          >
            Return to Companion Portal
          </button>
        </div>
      </form>
    </div>
  );
}

export default PatientPortal;
