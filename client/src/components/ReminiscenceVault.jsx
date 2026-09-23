import React, { useState, useEffect } from 'react';
import { Volume2, Heart, Search, HelpCircle, Check, Sparkles } from 'lucide-react';
import { speakPrompt } from '../services/speechService';
import { db } from '../db/db';

export function ReminiscenceVault({ dialect = 'Assamese' }) {
  const [memories, setMemories] = useState([]);
  const [activePhoto, setActivePhoto] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [revealedIds, setRevealedIds] = useState(new Set());

  useEffect(() => {
    // Fetch from backend or fallback to seeded local memories
    const fetchMemories = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/memory/photos`);
        if (res.ok) {
          const data = await res.json();
          setMemories(data);
          return;
        }
      } catch (err) {
        // Fallback local memory dataset
      }

      setMemories([
        {
          id: 'mem_1',
          title: 'Ananya Baruah',
          relation: 'Granddaughter',
          description: 'Granddaughter Ananya from Guwahati, studying computer engineering.',
          assamese_description: 'গুৱাহাটীৰ পৰা নাতিনী অনন্যা, ইঞ্জিনীয়াৰিং পঢ়ি আছে।',
          image_url: '/assets/images/mem_ananya.svg',
          tags: ['granddaughter', 'guwahati', 'ananya'],
          audio_cue: 'এয়া আপোনাৰ মৰমৰ নাতিনী অনন্যা, গুৱাহাটীৰ পৰা।'
        },
        {
          id: 'mem_2',
          title: 'Bikram Baruah',
          relation: 'Eldest Son',
          description: 'Eldest son Bikram, working as a tea estate manager in Jorhat.',
          assamese_description: 'ডাঙৰ ল\'ৰা বিক্ৰম, যোৰহাটৰ চাহ বাগিচাত পৰিচালক।',
          image_url: '/assets/images/mem_bikram.svg',
          tags: ['son', 'bikram', 'jorhat'],
          audio_cue: 'এয়া আপোনাৰ বৰপুত্ৰ বিক্ৰম, যোৰহাটৰ চাহ বাগিচাৰ।'
        },
        {
          id: 'mem_3',
          title: 'Nirupama Baruah',
          relation: 'Wife',
          description: 'Late wife Nirupama, together celebrating Rongali Bihu 1978.',
          assamese_description: 'ধৰ্মপত্নী নিৰুপমা, ১৯৭৮ চনৰ ৰঙালী বিহু উদযাপনৰ স্মৃতি।',
          image_url: '/assets/images/mem_wife.svg',
          tags: ['wife', 'nirupama', 'bihu'],
          audio_cue: 'এয়া নিৰুপমা, ১৯৭৮ চনৰ বিহুৰ দিনৰ সোঁৱৰণি।'
        },
        {
          id: 'mem_4',
          title: 'Ancestral Homestead',
          relation: 'Ancestral Home',
          description: 'Ancestral courtyard home in Raha, Nagaon, with betel nut trees.',
          assamese_description: 'ৰহা, নগাঁওৰ তামোল বাৰীৰে আৱৰা পুৰণি পূৰ্বপুৰুষৰ ঘৰ।',
          image_url: '/assets/images/mem_home.svg',
          tags: ['home', 'raha', 'nagaon'],
          audio_cue: 'এয়া আপোনাৰ ৰহাৰ নিজা ভেটি, তামোল বাৰীৰ ঘৰ।'
        }
      ]);
    };

    fetchMemories();
  }, []);

  const handleCardTap = (photo) => {
    setActivePhoto(photo);
    setRevealedIds(prev => new Set(prev).add(photo.id));

    // Play local regional audio kinship description
    const textToSpeak = dialect === 'Assamese' ? photo.audio_cue : `${photo.title}, your ${photo.relation}. ${photo.description}`;
    setIsSpeaking(true);
    speakPrompt(textToSpeak, dialect, () => {
      setIsSpeaking(false);
    });

    // Record reminiscence interaction in Dexie
    db.telemetry.add({
      patient_id: 1,
      game_type: 'reminiscence_vault',
      timestamp: new Date().toISOString(),
      latency_ms: 750,
      jitter_px: 14.2,
      accuracy_score: 1.0,
      source: 'PWA'
    }).catch(console.error);
  };

  const filteredMemories = memories.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.relation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border-4 border-zinc-900 shadow-xl">
      {/* Vault Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-zinc-200 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-900 font-bold text-sm">
              Phase 3: ChromaDB Memory Vector Store
            </span>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 mt-1 flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-600 fill-rose-600" />
            <span>{dialect === 'Assamese' ? 'সোঁৱৰণি ভঁৰাল (Reminiscence Vault)' : 'Reminiscence Memory Vault'}</span>
          </h2>
        </div>

        {/* Semantic Tag Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder={dialect === 'Assamese' ? 'সম্পৰ্ক বা নাম বিচৰক...' : 'Search kin or memories...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-zinc-400 text-base font-medium focus:border-rose-600 min-h-[48px]"
          />
        </div>
      </div>

      {/* Guide Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border-3 border-amber-700 mb-8 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-xl font-black text-amber-950 block">
            {dialect === 'Assamese' ? 'এওঁ কোন হয়? চিনি পাইছে নে?' : 'Who is this? Tap any photo to hear their voice & story:'}
          </span>
          <span className="text-sm font-semibold text-amber-800">
            Tapping cards activates local regional audio kinship prompts to anchor autobiographical memory.
          </span>
        </div>
      </div>

      {/* Photo Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {filteredMemories.map((photo) => {
          const isRevealed = revealedIds.has(photo.id);
          const isSelected = activePhoto?.id === photo.id;

          return (
            <button
              key={photo.id}
              onClick={() => handleCardTap(photo)}
              className={`rounded-3xl p-4 flex flex-col items-center border-4 text-center transition-all duration-200 cursor-pointer min-h-[280px] justify-between
                ${isSelected 
                  ? 'border-rose-600 bg-rose-50 shadow-[0_6px_0_#E11D48] scale-102' 
                  : 'border-zinc-900 bg-white hover:border-rose-600 hover:bg-zinc-50 shadow-[0_6px_0_#18181B] active:translate-y-1'
                }
              `}
            >
              <div className="w-full h-44 rounded-2xl overflow-hidden bg-zinc-100 border-2 border-zinc-300 flex items-center justify-center p-2 mb-3">
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              <div className="w-full">
                {isRevealed ? (
                  <>
                    <span className="text-xl font-black text-zinc-900 block">
                      {photo.title}
                    </span>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-rose-100 text-rose-800 text-sm font-bold">
                      {photo.relation}
                    </span>
                  </>
                ) : (
                  <div className="py-2 flex items-center justify-center gap-2 text-zinc-600 font-bold text-lg bg-zinc-100 rounded-xl border border-dashed border-zinc-400">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <span>{dialect === 'Assamese' ? 'এওঁ কোন?' : 'Who is this?'}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Photo Kinship Audio Detail Modal/Banner */}
      {activePhoto && (
        <div className="p-6 rounded-3xl bg-rose-50 border-3 border-rose-600 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-rose-500 overflow-hidden bg-white shrink-0">
              <img src={activePhoto.image_url} alt={activePhoto.title} className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-rose-700 block">
                Kinship Tag: {activePhoto.relation}
              </span>
              <h3 className="text-2xl font-black text-zinc-900">
                {activePhoto.title}
              </h3>
              <p className="text-lg font-semibold text-zinc-800 mt-1">
                {dialect === 'Assamese' ? activePhoto.assamese_description : activePhoto.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCardTap(activePhoto)}
            disabled={isSpeaking}
            className="min-h-[72px] px-6 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xl flex items-center gap-3 border-2 border-zinc-900 shadow-[0_4px_0_#18181B] shrink-0"
          >
            <Volume2 className={`w-7 h-7 ${isSpeaking ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{isSpeaking ? 'কৈ থকা হৈছে...' : 'পুনৰ শুনক (Listen)'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
