'use client';

import { useState } from 'react';
import { DailyCheckin } from '@/types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Target,
  Brain,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Trophy,
  Flame,
  CheckSquare,
  Square,
  Award,
} from 'lucide-react';

interface ReportCardProps {
  checkin: DailyCheckin;
  onEdit?: () => void;
  onNextChapter?: () => void;
}

export default function ReportCard({ checkin, onEdit, onNextChapter }: ReportCardProps) {
  const { ai_report, discipline_score, known_rules_count, trade_count } = checkin;
  const [completedPenances, setCompletedPenances] = useState<Record<number, boolean>>({});

  const togglePenance = (idx: number) => {
    setCompletedPenances((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-zinc-400 border-zinc-700 bg-zinc-900/60';
    if (score >= 75) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/20';
  };

  const score = discipline_score ?? 0;
  const isGoodDay = score >= 75;
  const isBadDay = score < 50;
  const isWarningDay = score >= 50 && score < 75;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative Book Edge Glow */}
      <div
        className={`absolute top-0 left-0 w-1.5 h-full ${
          isGoodDay ? 'bg-emerald-500' : isBadDay ? 'bg-rose-500' : 'bg-amber-500'
        }`}
      />

      {/* Chapter Ribbon & Book Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
              <BookOpen className="w-3.5 h-3.5" />
              Book of Discipline
            </span>
            <span className="text-xs text-zinc-400 font-mono">{checkin.checkin_date}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-zinc-100 mt-1 tracking-tight">
            {ai_report?.chapter_title || `Chapter: Session of ${checkin.checkin_date}`}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {known_rules_count > 0
              ? `${known_rules_count} of 4 core discipline rules evaluated • Sealed in Journal`
              : 'Insufficient data to evaluate core rules'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition"
            >
              Edit Entry
            </button>
          )}

          {/* Discipline Score Gauge */}
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${getScoreColor(
              discipline_score
            )}`}
          >
            <div>
              <div className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
                Discipline Score
              </div>
              <div className="text-2xl font-bold">
                {discipline_score !== null ? `${discipline_score}%` : 'Not enough data'}
              </div>
            </div>
            {discipline_score !== null && discipline_score >= 75 ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
            ) : discipline_score !== null ? (
              <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
            ) : (
              <HelpCircle className="w-7 h-7 text-zinc-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Motivation & Consequence / Punishment Section */}
      {isGoodDay && (
        <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-wide uppercase">
              <Trophy className="w-5 h-5 text-emerald-400" />
              Discipline Victory — Chapter Conquered
            </div>
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/50 border border-emerald-700/50 px-2 py-0.5 rounded-full">
              Honor The Process
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
            {ai_report?.motivation ||
              'Outstanding execution! You conquered your urges, executed with surgical patience, and protected your capital. Every great trading career is built chapter by disciplined chapter.'}
          </p>

          {ai_report?.reward && (
            <div className="bg-zinc-950/80 border border-emerald-500/30 rounded-lg p-3 text-xs text-emerald-200 flex items-start gap-2.5">
              <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300">Earned Reward:</strong> {ai_report.reward}
              </div>
            </div>
          )}
        </div>
      )}

      {isBadDay && (
        <div className="bg-gradient-to-r from-rose-950/50 via-zinc-900 to-zinc-950 border border-rose-500/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm tracking-wide uppercase">
              <Flame className="w-5 h-5 text-rose-500" />
              Discipline Breach — Penance Enforced
            </div>
            <span className="text-[11px] font-semibold text-rose-300 bg-rose-900/50 border border-rose-700/50 px-2 py-0.5 rounded-full">
              Accountability Required
            </span>
          </div>

          <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">
            {ai_report?.motivation ||
              'The market did not defeat you today—you defeated yourself by breaking your trading rules. Do not hide from this chapter. Acknowledge the breach, execute the penance protocol below, and turn to a clean page tomorrow.'}
          </p>

          {/* Interactive Penance Protocol Checklist */}
          {ai_report?.penance_protocol && ai_report.penance_protocol.length > 0 && (
            <div className="bg-zinc-950/90 border border-rose-900/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  The Trader&apos;s Penance Protocol
                </span>
                <span className="text-[10px] text-zinc-500">Check off each item once completed</span>
              </div>

              <div className="space-y-2">
                {ai_report.penance_protocol.map((item, idx) => {
                  const isChecked = completedPenances[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePenance(idx)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start gap-2.5 text-xs ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-800/40 text-zinc-400 line-through'
                          : 'bg-rose-950/20 border-rose-800/40 text-rose-200 hover:border-rose-600'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {isWarningDay && (
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide uppercase">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Yellow Card — Tighten Boundaries
            </div>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-900/50 border border-amber-700/50 px-2 py-0.5 rounded-full">
              Friction Warning
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {ai_report?.motivation ||
              'You survived today, but you let discipline slip. Small leaks sink great accounts. Treat tomorrow as a fresh, sacred chapter—adhere 100% to your setups.'}
          </p>

          {ai_report?.penance_protocol && ai_report.penance_protocol.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {ai_report.penance_protocol.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/60 border border-amber-800/30 rounded-lg p-2.5 text-xs text-amber-200 flex items-start gap-2"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="text-[11px] text-zinc-400">Total Trades</div>
          <div className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mt-0.5">
            {trade_count}
            <span
              className={`text-[11px] font-normal px-1.5 py-0.2 rounded border ${
                trade_count <= 2
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                  : 'border-rose-500/30 text-rose-400 bg-rose-950/20'
              }`}
            >
              {trade_count <= 2 ? 'Within rule' : 'Exceeded max 2'}
            </span>
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="text-[11px] text-zinc-400">Trading Urge</div>
          <div className="text-lg font-semibold text-zinc-100 capitalize mt-0.5">
            {checkin.urge_level}
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="text-[11px] text-zinc-400">Stopped As Planned</div>
          <div className="text-lg font-semibold mt-0.5 flex items-center gap-1.5">
            {checkin.stopped_as_planned ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Yes
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> No
              </span>
            )}
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="text-[11px] text-zinc-400">Engineering Work</div>
          <div className="text-lg font-semibold mt-0.5">
            {checkin.work_distraction === 'Yes' ? (
              <span className="text-rose-400">Distracted</span>
            ) : checkin.work_distraction === 'No' ? (
              <span className="text-emerald-400">Undistracted</span>
            ) : (
              <span className="text-zinc-400">N/A</span>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {ai_report?.discipline_summary && (
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1">
            <Brain className="w-4 h-4 text-emerald-400" />
            Executive Discipline Summary
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{ai_report.discipline_summary}</p>
        </div>
      )}

      {/* Rules Followed vs Rules Broken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rules Followed */}
        <div className="bg-zinc-950/50 border border-emerald-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            Rules Followed ({ai_report?.rules_followed?.length || 0})
          </div>
          {ai_report?.rules_followed && ai_report.rules_followed.length > 0 ? (
            <ul className="space-y-2">
              {ai_report.rules_followed.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic">No positive rule adherence recorded today.</p>
          )}
        </div>

        {/* Rules Broken */}
        <div className="bg-zinc-950/50 border border-rose-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-rose-400 mb-3">
            <XCircle className="w-4 h-4" />
            Rules Broken ({ai_report?.rules_broken?.length || 0})
          </div>
          {ai_report?.rules_broken && ai_report.rules_broken.length > 0 ? (
            <ul className="space-y-2">
              {ai_report.rules_broken.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-400/80 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero rule violations recorded today!
            </p>
          )}
        </div>
      </div>

      {/* Risk Flags & Emotional Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Flags */}
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Risk Flags ({ai_report?.risk_flags?.length || 0})
          </div>
          {ai_report?.risk_flags && ai_report.risk_flags.length > 0 ? (
            <ul className="space-y-2">
              {ai_report.risk_flags.map((flag, idx) => (
                <li
                  key={idx}
                  className="bg-amber-950/20 border border-amber-800/30 text-amber-200/90 text-xs px-2.5 py-1.5 rounded-lg flex items-start gap-2"
                >
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500 italic">No concerning risk flags detected.</p>
          )}
        </div>

        {/* Emotional Triggers */}
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-400 mb-3">
            <Sparkles className="w-4 h-4" />
            Identified Triggers ({ai_report?.emotional_triggers?.length || 0})
          </div>
          {ai_report?.emotional_triggers && ai_report.emotional_triggers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {ai_report.emotional_triggers.map((trigger, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-purple-950/30 text-purple-300 border border-purple-800/40 px-2.5 py-1 rounded-full"
                >
                  {trigger}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No emotional triggers surfaced today.</p>
          )}
        </div>
      </div>

      {/* Actionable Improvement for Tomorrow */}
      {ai_report?.improvement_for_tomorrow && (
        <div className="bg-gradient-to-r from-emerald-950/30 to-zinc-950 border border-emerald-500/30 rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <Target className="w-4 h-4" />
            One Practical Action For Tomorrow&apos;s Chapter
          </div>
          <p className="text-sm font-medium text-zinc-100">{ai_report.improvement_for_tomorrow}</p>
        </div>
      )}

      {/* Coach Feedback Message */}
      {ai_report?.coach_message && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 sm:p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-400 mb-0.5">Trading Discipline Coach</div>
            <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">
              &quot;{ai_report.coach_message}&quot;
            </p>
          </div>
        </div>
      )}

      {/* Turn to Next Page / Chapter Action */}
      {onNextChapter && (
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/40 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              This chapter is sealed. <strong className="text-zinc-200">Tomorrow is a brand-new page</strong> with 0 trades and a fresh psychological slate.
            </span>
          </div>

          <button
            type="button"
            onClick={onNextChapter}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 hover:border-emerald-500 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            <span>Turn to Next Page (New Chapter)</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      )}
    </div>
  );
}
