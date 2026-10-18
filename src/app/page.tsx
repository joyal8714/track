'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CheckinForm from '@/components/CheckinForm';
import ReportCard from '@/components/ReportCard';
import RecentHistory from '@/components/RecentHistory';
import { DailyCheckin } from '@/types';
import {
  Target,
  ShieldCheck,
  BookOpen,
  Sparkles,
  PlusCircle,
  PenLine,
  ArrowRight,
} from 'lucide-react';
import { getTodayIST } from '@/lib/date-utils';

export default function DashboardPage() {
  const [activeCheckin, setActiveCheckin] = useState<DailyCheckin | null>(null);
  const [checkinToEdit, setCheckinToEdit] = useState<DailyCheckin | null>(null);
  const [recentCheckins, setRecentCheckins] = useState<DailyCheckin[]>([]);
  const [cleanSlateMessage, setCleanSlateMessage] = useState<string | null>(null);
  const [formDateOverride, setFormDateOverride] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'checkin' | 'verdict'>('checkin');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/checkins?limit=10');
      if (res.ok) {
        const data = await res.json();
        const list: DailyCheckin[] = data.checkins || [];
        setRecentCheckins(list);

        // If no active checkin is selected, show today's or most recent
        const today = getTodayIST();
        const todayEntry = list.find((c) => c.checkin_date === today);
        if (todayEntry) {
          setActiveCheckin((prev) => prev || todayEntry);
        } else if (list.length > 0) {
          setActiveCheckin((prev) => prev || list[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load recent checkins:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchHistory();
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [fetchHistory]);

  // Sync activeTab with URL hash (#verdict vs #checkin)
  useEffect(() => {
    const handleHash = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#verdict') {
          setActiveTab('verdict');
        } else if (window.location.hash === '#checkin' || window.location.hash === '') {
          setActiveTab('checkin');
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchTab = (tab: 'checkin' | 'verdict') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab === 'verdict' ? '#verdict' : '#checkin';
    }
  };

  function handleCheckinSuccess(saved: DailyCheckin) {
    setActiveCheckin(saved);
    setCheckinToEdit(null);
    setCleanSlateMessage(null);
    fetchHistory();
    // Seamlessly navigate to the verdict tab to view the generated AI feedback
    switchTab('verdict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelectFromHistory(item: DailyCheckin) {
    setActiveCheckin(item);
    setCheckinToEdit(item);
    setCleanSlateMessage(null);
    switchTab('checkin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleViewVerdict(item: DailyCheckin) {
    setActiveCheckin(item);
    switchTab('verdict');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleTurnToNextChapter() {
    let nextDate = getTodayIST();
    if (activeCheckin) {
      try {
        const [y, m, d] = activeCheckin.checkin_date.split('-').map(Number);
        const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        curr.setUTCDate(curr.getUTCDate() + 1);
        nextDate = curr.toISOString().split('T')[0];
      } catch {
        nextDate = getTodayIST();
      }
    }

    setCheckinToEdit(null);
    setFormDateOverride(nextDate);
    setCleanSlateMessage(
      `Turned to a new page: Chapter for ${nextDate}. Yesterday's chapter is written in stone. Today is trade 0 with a 100% clean sheet.`
    );
    switchTab('checkin');

    setTimeout(() => {
      const formEl = document.getElementById('journal-form-section');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  function handleNewBlankPage() {
    setCheckinToEdit(null);
    setFormDateOverride(getTodayIST());
    setCleanSlateMessage('Opened a fresh blank page for today. Focus on process over outcome.');
    switchTab('checkin');
    setTimeout(() => {
      const formEl = document.getElementById('journal-form-section');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    if (score >= 75) return 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400';
    if (score >= 50) return 'bg-amber-950/60 border-amber-500/50 text-amber-400';
    return 'bg-rose-950/60 border-rose-500/50 text-rose-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Journal Header Bar */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-100">
                  The Trader&apos;s Chronicle: Book of Discipline
                </h1>
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-300">
                  Daily Journal
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every trading day is a new chapter. Fill your check-in, accept your penance, or turn to a clean slate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewBlankPage}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Write Blank Page</span>
            </button>
          </div>
        </div>

        {/* Clean Slate Fresh Page Notice */}
        {cleanSlateMessage && (
          <div className="bg-gradient-to-r from-emerald-950/40 to-zinc-950 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cleanSlateMessage}</span>
            </div>
            <button
              onClick={() => setCleanSlateMessage(null)}
              className="text-emerald-400 hover:text-emerald-300 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Switcher: Daily Inscription vs Chapter Verdict */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => switchTab('checkin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'checkin'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PenLine className="w-4 h-4 text-emerald-400" />
              <span>Daily Journal Check-in</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('verdict')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'verdict'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Chapter Feedback &amp; Verdict</span>
              {activeCheckin && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getScoreBadge(
                    activeCheckin.discipline_score
                  )}`}
                >
                  {activeCheckin.discipline_score !== null ? `${activeCheckin.discipline_score}%` : 'Ready'}
                </span>
              )}
            </button>
          </div>

          {/* Quick context info */}
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            {activeTab === 'checkin' && activeCheckin && (
              <button
                type="button"
                onClick={() => switchTab('verdict')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>View Verdict for {activeCheckin.checkin_date} ({activeCheckin.discipline_score}%)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {activeTab === 'verdict' && activeCheckin && (
              <span className="text-zinc-500 text-[11px] font-mono">
                Chapter: {activeCheckin.checkin_date}
              </span>
            )}
          </div>
        </div>

        {/* TAB 1: DAILY JOURNAL CHECK-IN FORM & HISTORY */}
        {activeTab === 'checkin' && (
          <div className="space-y-6">
            {/* Slim Status Bar if active report exists */}
            {activeCheckin && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Latest Chapter for <strong className="text-zinc-100">{activeCheckin.checkin_date}</strong> is inscribed with a Discipline Score of{' '}
                    <strong className="text-emerald-400">{activeCheckin.discipline_score}%</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => switchTab('verdict')}
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
                >
                  <span>Open Verdict Tab &amp; Penance Drills</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Check-in Form & History Layout */}
            <div id="journal-form-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Check-in Form */}
              <div className="lg:col-span-7">
                <CheckinForm
                  initialDate={formDateOverride}
                  onSuccess={handleCheckinSuccess}
                  selectedCheckinToEdit={checkinToEdit}
                  onCancelEdit={() => {
                    setCheckinToEdit(null);
                    setFormDateOverride(undefined);
                  }}
                />
              </div>

              {/* Right Column: History & Discipline Guidelines */}
              <div className="lg:col-span-5 space-y-6">
                <RecentHistory
                  checkins={recentCheckins}
                  onSelectCheckin={handleSelectFromHistory}
                  onViewVerdict={handleViewVerdict}
                  selectedId={activeCheckin?.id}
                />

                {/* Trading Discipline Guardrails Card */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    The 4 Immutable Laws of the Journal
                  </h4>
                  <ul className="space-y-2 text-xs text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                        25
                      </span>
                      <div>
                        <strong className="text-zinc-200">Followed Planned Setups:</strong> No impulse trades, no FOMO chasing, strict checklist execution.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                        25
                      </span>
                      <div>
                        <strong className="text-zinc-200">Max Two Trades Rule:</strong> Strictly &le; 2 filled orders per day. Over-trading is forbidden.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                        25
                      </span>
                      <div>
                        <strong className="text-zinc-200">No Impulsive Risk:</strong> Position size never increases after a loss or out of impatience.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                        25
                      </span>
                      <div>
                        <strong className="text-zinc-200">Stopped When Planned:</strong> Terminal shut down at predetermined profit, loss, or time limit.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE CHAPTER FEEDBACK & VERDICT */}
        {activeTab === 'verdict' && (
          <div className="space-y-6">
            {activeCheckin ? (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      <Target className="w-5 h-5 text-emerald-400" />
                      Active Chapter Feedback &amp; Verdict
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Disciplinarian report, penance drills, positive reinforcement, and next-chapter preparation.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckinToEdit(activeCheckin);
                        switchTab('checkin');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
                    >
                      Edit This Session
                    </button>
                    <button
                      type="button"
                      onClick={handleTurnToNextChapter}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1"
                    >
                      <span>Turn to Next Page 📖</span>
                    </button>
                  </div>
                </div>

                <ReportCard
                  checkin={activeCheckin}
                  onEdit={() => {
                    setCheckinToEdit(activeCheckin);
                    switchTab('checkin');
                  }}
                  onNextChapter={handleTurnToNextChapter}
                />
              </section>
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-8">
                <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-zinc-200">No Chapter Inscribed Yet</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Complete your daily check-in form to summon Gemini&apos;s discipline analysis, personalized motivation, and penance or rewards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchTab('checkin')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs shadow-lg transition"
                >
                  <PenLine className="w-4 h-4" />
                  <span>Inscribe Today&apos;s Chapter</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        The Book of Discipline &bull; Single-user private behavior analytics &bull; Asia/Kolkata
      </footer>
    </div>
  );
}
