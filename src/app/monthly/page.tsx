'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MonthlyTrendChart from '@/components/MonthlyTrendChart';
import { DailyCheckin, MonthlyMetrics, MonthlyReviewRecord } from '@/types';
import { getCurrentMonthIST, formatISTMonth, formatISTDate } from '@/lib/date-utils';
import {
  BarChart3,
  Calendar,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Target,
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function MonthlyPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [metrics, setMetrics] = useState<MonthlyMetrics | null>(null);
  const [reviewRecord, setReviewRecord] = useState<MonthlyReviewRecord | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize current month on client mount
  useEffect(() => {
    if (!selectedMonth) {
      const timer = setTimeout(() => {
        setSelectedMonth(getCurrentMonthIST());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedMonth]);

  const loadMonthData = useCallback(async (month: string) => {
    if (!month) return;
    setIsLoadingData(true);
    setError(null);
    try {
      const res = await fetch(`/api/monthly-review?month=${month}`);
      if (!res.ok) throw new Error('Failed to load month data');
      const data = await res.json();
      setCheckins(data.checkins || []);
      setMetrics(data.metrics || null);
      setReviewRecord(data.review || null);
    } catch (err) {
      console.error('Error fetching month data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch month data');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    let ignore = false;
    async function run() {
      if (!ignore) {
        await loadMonthData(selectedMonth);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [selectedMonth, loadMonthData]);

  async function handleGenerateReview(regenerate = false) {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    setError(null);
    try {
      const res = await fetch('/api/monthly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, regenerate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate monthly review');
      setReviewRecord(data.review);
      if (data.metrics) setMetrics(data.metrics);
      if (data.checkins) setCheckins(data.checkins);
    } catch (err) {
      console.error('Monthly review generation error:', err);
      setError(err instanceof Error ? err.message : 'Error generating review');
    } finally {
      setIsGeneratingAi(false);
    }
  }

  const aiReview = reviewRecord?.ai_review;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Header & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              Monthly Discipline Review
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Comprehensive statistical audit &amp; Gemini AI behavioral retrospective for {formatISTMonth(selectedMonth)}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Application-Calculated Deterministic Metrics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                1. Observed Application Metrics
              </h2>
              <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                Deterministic
              </span>
            </div>
            {isLoadingData && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
          </div>

          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Recorded Trading Days */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Recorded Sessions</div>
                <div className="text-xl font-extrabold text-zinc-100">
                  {metrics.recorded_days} <span className="text-xs text-zinc-500 font-normal">days</span>
                </div>
                <div className="text-[10px] text-zinc-500">In {formatISTMonth(selectedMonth)}</div>
              </div>

              {/* 2. Total Trades & Avg Trades/Day */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Total &amp; Avg Trades</div>
                <div className="text-xl font-extrabold text-zinc-100">
                  {metrics.total_trades} <span className="text-xs text-zinc-400 font-normal">({metrics.avg_trades_per_day}/day)</span>
                </div>
                <div className="text-[10px] text-zinc-500">Limit target is &le; 2.0</div>
              </div>

              {/* 3. Days Exceeding 2 Trades */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Exceeded 2-Trade Rule</div>
                <div className={`text-xl font-extrabold ${metrics.over_two_trades_days > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metrics.over_two_trades_days} <span className="text-xs font-normal">({metrics.over_two_trades_pct}%)</span>
                </div>
                <div className="text-[10px] text-zinc-500">Over-trading incidence</div>
              </div>

              {/* 4. Impulsive Risk Days */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Impulsive Risk Spikes</div>
                <div className={`text-xl font-extrabold ${metrics.impulsive_risk_days > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {metrics.impulsive_risk_days} <span className="text-xs text-zinc-500 font-normal">days</span>
                </div>
                <div className="text-[10px] text-zinc-500">Oversized positions</div>
              </div>

              {/* 5. Planned Setup Adherence Rate */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Setup Adherence</div>
                <div className="text-xl font-extrabold text-emerald-400">
                  {metrics.planned_setup_rate}%
                </div>
                <div className="text-[10px] text-zinc-500">Followed trading setups</div>
              </div>

              {/* 6. Stopping As Planned Rate */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Stopped As Planned</div>
                <div className="text-xl font-extrabold text-emerald-400">
                  {metrics.stopped_planned_rate}%
                </div>
                <div className="text-[10px] text-zinc-500">Terminal closure discipline</div>
              </div>

              {/* 7. Work Distraction Frequency */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Job Distraction</div>
                <div className={`text-xl font-extrabold ${metrics.work_distraction_count > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                  {metrics.work_distraction_count} <span className="text-xs text-zinc-500 font-normal">days</span>
                </div>
                <div className="text-[10px] text-zinc-500">Engineering conflict</div>
              </div>

              {/* 8. Temptation After Wins */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Tempted After Wins</div>
                <div className={`text-xl font-extrabold ${metrics.tempted_after_wins_count > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
                  {metrics.tempted_after_wins_count} <span className="text-xs text-zinc-500 font-normal">days</span>
                </div>
                <div className="text-[10px] text-zinc-500">Post-profit euphoria urge</div>
              </div>

              {/* 9. Average Discipline Score */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Avg Discipline Score</div>
                <div className="text-xl font-extrabold text-emerald-400">
                  {metrics.avg_discipline_score !== null ? `${metrics.avg_discipline_score}%` : 'N/A'}
                </div>
                <div className="text-[10px] text-zinc-500">Valid scores average</div>
              </div>

              {/* 10. Best & Worst Discipline Days */}
              <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
                <div className="text-[11px] text-zinc-400">Best &amp; Worst Days</div>
                <div className="text-xs font-semibold text-zinc-200">
                  Best: {metrics.best_day ? `${formatISTDate(metrics.best_day.date)} (${metrics.best_day.score}%)` : 'None'}
                </div>
                <div className="text-xs font-semibold text-rose-300/90">
                  Worst: {metrics.worst_day ? `${formatISTDate(metrics.worst_day.date)} (${metrics.worst_day.score}%)` : 'None'}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Trend Visualization */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
              2. Monthly Trend Visualization
            </h2>
          </div>
          <MonthlyTrendChart checkins={checkins} />
        </section>

        {/* Section 3: Gemini AI Qualitative Review */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-900">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  3. Gemini AI Monthly Retrospective
                </h2>
                <span className="text-[10px] text-purple-400 bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded">
                  AI Interpretation
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Clearly distinguished from mathematical observations. Synthesizes psychological triggers and establishes safeguards.
              </p>
            </div>

            <button
              type="button"
              disabled={isGeneratingAi || (checkins.length === 0 && !reviewRecord)}
              onClick={() => handleGenerateReview(true)}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500 text-zinc-100 text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Synthesizing Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{reviewRecord?.ai_review ? 'Regenerate Monthly Review' : 'Generate Monthly Review'}</span>
                </>
              )}
            </button>
          </div>

          {aiReview ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
              {/* Status & Overall Trend */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Discipline Direction:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      aiReview.improving_or_deteriorating === 'Improving'
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
                        : aiReview.improving_or_deteriorating === 'Deteriorating'
                        ? 'bg-rose-950/50 text-rose-300 border-rose-500/40'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {aiReview.improving_or_deteriorating}
                  </span>
                </div>

                <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                  <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Overall Discipline Trend
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {aiReview.overall_trend}
                  </p>
                </div>
              </div>

              {/* Common Triggers & Repeated Rule Violations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Common Triggers */}
                <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl space-y-2.5">
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Most Common Triggers
                  </div>
                  {aiReview.common_triggers && aiReview.common_triggers.length > 0 ? (
                    <ul className="space-y-2">
                      {aiReview.common_triggers.map((trig, idx) => (
                        <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{trig}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No recurring triggers identified.</p>
                  )}
                </div>

                {/* Repeated Violations */}
                <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl space-y-2.5">
                  <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Repeated Rule Violations
                  </div>
                  {aiReview.repeated_violations && aiReview.repeated_violations.length > 0 ? (
                    <ul className="space-y-2">
                      {aiReview.repeated_violations.map((violation, idx) => (
                        <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{violation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-400/90 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      No repeated rule violations detected this month.
                    </p>
                  )}
                </div>
              </div>

              {/* Three Practical Safeguards For Next Month */}
              <div className="p-5 bg-gradient-to-r from-emerald-950/30 to-zinc-950 border border-emerald-500/30 rounded-xl space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Three Practical Safeguards For Next Month
                </div>
                <div className="space-y-2.5">
                  {aiReview.safeguards && aiReview.safeguards.map((safeguard, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950/80 border border-emerald-800/30 rounded-lg p-3 text-xs sm:text-sm text-zinc-200 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{safeguard}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center space-y-3">
              <Brain className="w-8 h-8 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-semibold text-zinc-300">No Monthly AI Review Generated Yet</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                {checkins.length > 0
                  ? 'Click "Generate Monthly Review" above to analyze your recorded trading sessions with Gemini.'
                  : `No trading check-ins have been recorded for ${formatISTMonth(selectedMonth)}. Save daily check-ins first.`}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
