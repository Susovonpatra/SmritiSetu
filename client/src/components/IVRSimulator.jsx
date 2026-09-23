import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, Volume2, Code, CheckCircle, Radio } from 'lucide-react';
import { speakPrompt } from '../services/speechService';
import { db } from '../db/db';

const QUESTIONS = [
  {
    step: 1,
    title_en: 'Question 1: Temporal Orientation',
    prompt_as: 'নমস্কাৰ! স্মৃতিসেতু স্বাগতম। এতিয়া ৰাতিপুৱা নে গধূলি? ৰাতিপুৱাৰ বাবে ১ টিপক, গধূলিৰ বাবে ২ টিপক।',
    prompt_en: 'Is it morning or evening? Press 1 for Morning, 2 for Evening.',
    opt1: '1: Morning (ৰাতিপুৱা)',
    opt2: '2: Evening (গধূলি)',
    correct: '1'
  },
  {
    step: 2,
    title_en: 'Question 2: Routine & Meds Adherence',
    prompt_as: 'আপুনি আজি ৰাতিপুৱাৰ চাহ আৰু ঔষধ খালে নে? খালে ১ টিপক, খোৱা নাই যদি ২ টিপক।',
    prompt_en: 'Did you take morning tea and medicine? Press 1 for Yes, 2 for No.',
    opt1: '1: Yes (খালে)',
    opt2: '2: No (খোৱা নাই)',
    correct: '1'
  },
  {
    step: 3,
    title_en: 'Question 3: Kinship Recognition',
    prompt_as: 'আপোনাৰ নাতিনী অনন্যা গুৱাহাটীত থাকে নে ডিব্ৰুগড়ত? গুৱাহাটীৰ বাবে ১ টিপক, ডিব্ৰুগড়ৰ বাবে ২ টিপক।',
    prompt_en: 'Does granddaughter Ananya live in Guwahati or Dibrugarh? Press 1 for Guwahati, 2 for Dibrugarh.',
    opt1: '1: Guwahati (গুৱাহাটী)',
    opt2: '2: Dibrugarh (ডিব্ৰুগড়)',
    correct: '1'
  }
];

export function IVRSimulator({ dialect = 'Assamese' }) {
  const [callActive, setCallActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [result, setResult] = useState(null);
  const [showTwiML, setShowTwiML] = useState(false);

  const startCall = () => {
    setCallActive(true);
    setCurrentStep(0);
    setResponses({});
    setResult(null);
    playQuestion(0);
  };

  const endCall = () => {
    setCallActive(false);
    setIsSpeaking(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playQuestion = (stepIdx) => {
    const q = QUESTIONS[stepIdx];
    if (!q) return;

    setIsSpeaking(true);
    speakPrompt(dialect === 'Assamese' ? q.prompt_as : q.prompt_en, dialect, () => {
      setIsSpeaking(false);
    });
  };

  const handleDtmfPress = async (digit) => {
    if (!callActive || currentStep >= QUESTIONS.length) return;

    // Beep sound
    playDtmfBeep();

    const newResponses = { ...responses, [`q${currentStep + 1}`]: digit };
    setResponses(newResponses);

    if (currentStep < QUESTIONS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeout(() => playQuestion(nextStep), 600);
    } else {
      // Completed all 3 questions
      setIsSpeaking(true);
      speakPrompt(dialect === 'Assamese' ? 'আপোনাৰ উত্তৰ সংৰক্ষণ কৰা হ\'ল। ধন্যবাদ।' : 'Thank you. Your responses have been recorded.', dialect, () => {
        setIsSpeaking(false);
      });

      // Submit to backend
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/ivr/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: 1,
            q1: newResponses.q1 || '1',
            q2: newResponses.q2 || '1',
            q3: newResponses.q3 || '1',
            call_sid: 'IVR-CALL-' + Date.now().toString().slice(-6)
          })
        });

        if (res.ok) {
          const data = await res.json();
          setResult(data);
        }
      } catch (err) {
        console.warn('Backend offline, logging IVR telemetry locally');
      }

      // Also record in Dexie
      await db.telemetry.add({
        patient_id: 1,
        game_type: 'ivr_checkin',
        latency_ms: 1200,
        jitter_px: 0,
        accuracy_score: 1.0,
        source: 'IVR',
        timestamp: new Date().toISOString()
      });

      setCallActive(false);
    }
  };

  const playDtmfBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 697; // DTMF tone frequency
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 150);
    } catch (e) {}
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border-4 border-zinc-900 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-zinc-200 pb-4 mb-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-1">
            Tier 3: Off-Grid 2G Feature-Phone Voice Gateway
          </span>
          <h2 className="text-3xl font-black text-zinc-900 flex items-center gap-3">
            <Radio className="w-8 h-8 text-amber-800" />
            <span>Interactive Feature-Phone IVR Simulator</span>
          </h2>
          <p className="text-base font-semibold text-zinc-600 mt-1">
            Zero-internet, automated dial-in telemetry for remote NER villages using DTMF keypress parsing.
          </p>
        </div>

        <button
          onClick={() => setShowTwiML(!showTwiML)}
          className="min-h-[56px] px-5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-base flex items-center gap-2 border-2 border-zinc-900 shadow"
        >
          <Code className="w-5 h-5" />
          <span>{showTwiML ? 'Hide TwiML' : 'View Carrier TwiML XML'}</span>
        </button>
      </div>

      {/* Main Grid: Phone simulator + Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Retro Feature Phone Mockup */}
        <div className="w-full max-w-xs mx-auto bg-zinc-800 p-5 rounded-[40px] border-4 border-zinc-950 shadow-2xl flex flex-col items-center">
          {/* Earpiece Speaker grill */}
          <div className="w-16 h-1.5 bg-zinc-600 rounded-full mb-3"></div>

          {/* Phone Monochrome / Matrix LCD Screen */}
          <div className="w-full min-h-[140px] bg-[#9CA3AF] border-3 border-zinc-700 rounded-2xl p-3 flex flex-col justify-between font-mono text-zinc-900 shadow-inner">
            <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-700 pb-1">
              <span>BSNL 2G NER</span>
              <span>{callActive ? '00:14' : 'READY'}</span>
            </div>

            <div className="my-2 text-center">
              {callActive ? (
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">
                    CALL IN PROGRESS...
                  </span>
                  <span className="text-sm font-black text-zinc-950 block mt-1">
                    Step {currentStep + 1} of 3
                  </span>
                  <span className="text-xs font-semibold text-zinc-800 block mt-1">
                    {isSpeaking ? 'Listening to voice prompt...' : 'Press 1 or 2 on keypad'}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-black text-zinc-950 block">
                    SmritiSetu IVR
                  </span>
                  <span className="text-xs font-bold text-zinc-700 block mt-1">
                    +91 8000 SMRITI
                  </span>
                  <span className="text-xs text-zinc-600 block mt-1">
                    Press Call Button Below
                  </span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-right font-bold text-zinc-700">
              DTMF HUB ACTIVE
            </div>
          </div>

          {/* Action Buttons: Green Call / Red End */}
          <div className="grid grid-cols-2 gap-4 w-full my-4">
            <button
              onClick={startCall}
              disabled={callActive}
              className={`min-h-[56px] rounded-xl flex items-center justify-center border-2 border-zinc-900 shadow font-bold text-white
                ${callActive ? 'bg-zinc-600 opacity-50' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'}
              `}
              title="Start IVR Check-in"
            >
              <PhoneCall className="w-6 h-6 mr-1" />
              <span>Call</span>
            </button>
            <button
              onClick={endCall}
              disabled={!callActive}
              className={`min-h-[56px] rounded-xl flex items-center justify-center border-2 border-zinc-900 shadow font-bold text-white
                ${!callActive ? 'bg-zinc-600 opacity-50' : 'bg-rose-600 hover:bg-rose-700 active:scale-95'}
              `}
              title="Hang Up"
            >
              <PhoneOff className="w-6 h-6 mr-1" />
              <span>End</span>
            </button>
          </div>

          {/* DTMF Keypad Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
              <button
                key={key}
                onClick={() => handleDtmfPress(key)}
                className="min-h-[50px] rounded-xl bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-900 text-white font-black text-xl border border-zinc-600 shadow flex flex-col items-center justify-center transition-all select-none"
              >
                <span>{key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Call Flow Guide & Telemetry Feedback */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-amber-50 border-3 border-amber-800">
            <h4 className="text-xl font-black text-amber-950 mb-2">
              Automated 3-Question Regional Voice Menu
            </h4>
            <div className="space-y-3">
              {QUESTIONS.map((q, idx) => (
                <div
                  key={q.step}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    callActive && currentStep === idx
                      ? 'bg-amber-100 border-amber-700 shadow-sm'
                      : 'bg-white border-zinc-300'
                  }`}
                >
                  <div className="flex justify-between items-center text-sm font-bold text-zinc-900">
                    <span>{q.title_en}</span>
                    {responses[`q${idx + 1}`] && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-black">
                        DTMF Key: {responses[`q${idx + 1}`]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-zinc-600 mt-1">
                    Assamese Prompt: "{q.prompt_as}"
                  </p>
                  <div className="flex gap-4 text-xs font-bold text-zinc-700 mt-1.5">
                    <span>{q.opt1}</span>
                    <span>{q.opt2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Result Banner */}
          {result && (
            <div className="p-5 rounded-2xl bg-emerald-50 border-3 border-emerald-800 text-emerald-950 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-700" />
                <h4 className="text-lg font-black">IVR Telemetry Synced Successfully</h4>
              </div>
              <p className="text-sm font-semibold">{result.message}</p>
              <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-300 text-xs font-mono space-y-1">
                <div>Score: <strong>{result.composite_score}%</strong></div>
                <div>Orientation: <strong>{result.responses.q1_day_orientation}</strong></div>
                <div>Adherence: <strong>{result.responses.q2_routine_adherence}</strong></div>
                <div>Recall: <strong>{result.responses.q3_memory_recall}</strong></div>
              </div>
            </div>
          )}

          {/* TwiML XML Gateway View */}
          {showTwiML && (
            <div className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto border-2 border-zinc-700">
              <span className="text-emerald-400 font-bold block mb-2">// Twilio / Carrier XML Response from /api/v1/ivr/twiml:</span>
              <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="as-IN">
      নমস্কাৰ, স্মৃতিসেতু দৈনিক স্বাস্থ্য পৰীক্ষালৈ স্বাগতম।
    </Say>
    <Gather numDigits="1" action="/api/v1/ivr/dtmf" method="POST" timeout="10">
        <Say voice="Polly.Aditi" language="as-IN">
          প্ৰথম প্ৰশ্ন: এতিয়া ৰাতিপুৱা নে গধূলি? ৰাতিপুৱাৰ বাবে এক টিপক, গধূলিৰ বাবে দুই টিপক।
        </Say>
    </Gather>
</Response>`}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
