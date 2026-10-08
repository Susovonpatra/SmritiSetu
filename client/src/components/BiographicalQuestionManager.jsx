import React, { useState, useEffect } from 'react';
import { BiographicalTelemetryService } from '../services/biographicalTelemetry';
import { DEFAULT_BIOGRAPHICAL_QUESTIONS } from '../db/db';
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  HelpCircle,
  Layers,
  Sparkles,
  Heart,
  X
} from 'lucide-react';

const RELATION_TIERS = [
  {
    key: 'TIER_1_CORE',
    label: 'Tier 1: Core (Spouse / Primary)',
    description: 'Closest lifelong anchor (e.g. Spouse, Self identity, First ancestral home)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    key: 'TIER_2_CHILD',
    label: 'Tier 2: Child (Children & Immediate)',
    description: 'Immediate filial bonds (e.g. Daughters, Sons, Grandchildren)',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300'
  },
  {
    key: 'TIER_3_SIBLING',
    label: 'Tier 3: Sibling (Brothers / Sisters / Close Kin)',
    description: 'Early generational connections (e.g. Brothers, Sisters, Childhood schools)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  {
    key: 'TIER_4_EXTENDED',
    label: 'Tier 4: Extended (Distant Memories / Nostalgia)',
    description: 'Contextual distant memories (e.g. First vacations, Favorite pet, Old colleagues)',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300'
  }
];

export function BiographicalQuestionManager({ patientId = 1 }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [formData, setFormData] = useState({
    questionText: '',
    relationTier: 'TIER_1_CORE',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  });
  const [formError, setFormError] = useState(null);

  // Live filter state
  const [selectedFilterTier, setSelectedFilterTier] = useState('ALL');

  useEffect(() => {
    loadQuestions();
  }, [patientId]);

  const loadQuestions = async () => {
    setLoading(true);
    const list = await BiographicalTelemetryService.getQuestions(patientId);
    setQuestions(list || []);
    setLoading(false);
  };

  // Open modal for new question
  const handleOpenAddModal = () => {
    setEditingQuestionId(null);
    setFormData({
      questionText: '',
      relationTier: 'TIER_1_CORE',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing question
  const handleOpenEditModal = (q) => {
    setEditingQuestionId(q.questionId);
    setFormData({
      questionText: q.questionText,
      relationTier: q.relationTier || 'TIER_1_CORE',
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex || 0
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Modal Form (Add or Update in local state)
  const handleSaveModalForm = (e) => {
    e.preventDefault();
    if (!formData.questionText.trim()) {
      setFormError('Please enter the question prompt.');
      return;
    }

    const filledOptions = formData.options.map(opt => opt.trim());
    if (filledOptions.some(opt => opt.length === 0)) {
      setFormError('All 4 option choices are required to maintain cognitive multi-choice balance.');
      return;
    }

    if (editingQuestionId) {
      // Update
      setQuestions(prev =>
        prev.map(item =>
          item.questionId === editingQuestionId
            ? { ...item, ...formData, options: filledOptions }
            : item
        )
      );
    } else {
      // Add
      const newQuestion = {
        questionId: `bio-q-${Date.now()}`,
        patientId: patientId,
        questionText: formData.questionText.trim(),
        relationTier: formData.relationTier,
        options: filledOptions,
        correctOptionIndex: formData.correctOptionIndex,
        orderIndex: questions.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setQuestions(prev => [...prev, newQuestion]);
    }

    setIsModalOpen(false);
  };

  // Delete question
  const handleDeleteQuestion = (questionId) => {
    if (questions.length <= 1) {
      alert('You must keep at least 1 biographical question in the pool.');
      return;
    }
    setQuestions(prev => prev.filter(q => q.questionId !== questionId));
  };

  // Reorder questions
  const handleMoveQuestion = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setQuestions(copy);
  };

  // Batch Save to Storage
  const handleBatchSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await BiographicalTelemetryService.saveQuestionsBatch(questions, patientId);
      setSaveStatus({
        type: 'success',
        message: `Successfully saved ${questions.length} questions to secure storage & patient game!`
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: 'Failed to batch save questions. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default clinical questions
  const handleResetDefaults = async () => {
    if (window.confirm('Reset questions pool back to standard clinical default templates?')) {
      setQuestions(DEFAULT_BIOGRAPHICAL_QUESTIONS);
      await BiographicalTelemetryService.saveQuestionsBatch(DEFAULT_BIOGRAPHICAL_QUESTIONS, patientId);
      setSaveStatus({
        type: 'success',
        message: 'Restored clinical default questions.'
      });
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const filteredQuestions = selectedFilterTier === 'ALL'
    ? questions
    : questions.filter(q => q.relationTier === selectedFilterTier);

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
              Caregiver CMS
            </span>
            <span className="text-slate-400 text-xs">Biographical Recognition Manager</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Custom Biographical Questions &amp; Memory Anchors
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Curate personalized questions categorized across relational memory tiers. These questions power the patient's companion game and provide clinical degradation biomarkers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Question</span>
          </button>

          <button
            onClick={handleBatchSave}
            disabled={isSaving}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer hover:scale-[1.02] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Pool...' : 'Save & Sync Batch'}</span>
          </button>
        </div>
      </div>

      {/* Save Status Notification */}
      {saveStatus && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* ── FILTER & SUMMARY BAR ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Filter Tier:</span>
          <button
            onClick={() => setSelectedFilterTier('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedFilterTier === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Tiers ({questions.length})
          </button>
          {RELATION_TIERS.map(tier => {
            const count = questions.filter(q => q.relationTier === tier.key).length;
            return (
              <button
                key={tier.key}
                onClick={() => setSelectedFilterTier(tier.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedFilterTier === tier.key
                    ? `${tier.badgeColor} font-black shadow-sm`
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tier.key.replace('TIER_', 'T').replace('_', ' ')} ({count})
              </button>
            );
          })}
        </div>

        <button
          onClick={handleResetDefaults}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition underline cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* ── QUESTIONS LIST (CRUD & REORDERING) ── */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-medium">Loading biographical question pool...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
          <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No questions match this filter</h3>
          <p className="text-xs text-slate-500">Add a new question or switch filters to view questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const originalIndex = questions.findIndex(item => item.questionId === q.questionId);
            const tierInfo = RELATION_TIERS.find(t => t.key === q.relationTier) || RELATION_TIERS[0];

            return (
              <div
                key={q.questionId}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 shadow-sm p-5 sm:p-6 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left: Question details & Options */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        #{originalIndex + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierInfo.badgeColor}`}>
                        {tierInfo.label}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                      {q.questionText}
                    </h3>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = optIdx === q.correctOptionIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                                isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {optIdx + 1}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>

                            {isCorrect && (
                              <span className="text-[10px] uppercase font-black text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-md shrink-0">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Actions (Reorder, Edit, Delete) */}
                  <div className="flex items-center md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 justify-end">
                    {/* Reorder Buttons */}
                    <div className="flex md:flex-row gap-1">
                      <button
                        onClick={() => handleMoveQuestion(originalIndex, -1)}
                        disabled={originalIndex === 0}
                        title="Move Up in Session Queue"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(originalIndex, 1)}
                        disabled={originalIndex === questions.length - 1}
                        title="Move Down in Session Queue"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(q)}
                      className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteQuestion(q.questionId)}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {editingQuestionId ? 'Edit Biographical Question' : 'Add New Biographical Question'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize the question prompt, relational tier, and 4 multi-choice options.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModalForm} className="space-y-5">
              {/* Question Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Question Prompt (Dementia Friendly)
                </label>
                <input
                  type="text"
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="e.g. Who is your eldest daughter who visits on weekends?"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition"
                  required
                />
              </div>

              {/* Relation Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Relational Memory Tier
                </label>
                <select
                  value={formData.relationTier}
                  onChange={(e) => setFormData({ ...formData, relationTier: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  {RELATION_TIERS.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.label} — {t.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4 Choices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    4 Choice Options (Select Radio for Correct Option)
                  </label>
                  <span className="text-[11px] text-slate-500">Select which option is correct</span>
                </div>

                <div className="space-y-2.5">
                  {formData.options.map((opt, idx) => {
                    const isCorrect = formData.correctOptionIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border-2 transition ${
                          isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          id={`correct-opt-${idx}`}
                          name="correctOptionIndex"
                          checked={isCorrect}
                          onChange={() => setFormData({ ...formData, correctOptionIndex: idx })}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-1"
                        />
                        <span className="text-xs font-black text-slate-500 w-5">#{idx + 1}</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...formData.options];
                            newOpts[idx] = e.target.value;
                            setFormData({ ...formData, options: newOpts });
                          }}
                          placeholder={`Option ${idx + 1} text`}
                          className="flex-1 bg-transparent border-0 text-slate-900 text-sm font-semibold focus:outline-none placeholder:text-slate-400"
                          required
                        />
                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200/90 px-2 py-0.5 rounded-md mr-1">
                            Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  {editingQuestionId ? 'Save Changes' : 'Add to Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
