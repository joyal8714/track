'use client';

import { DailyCheckin } from '@/types';
import { formatISTDate } from '@/lib/date-utils';
import {
  Calendar,
  FileEdit,
  History,
  ShieldCheck,
  ShieldAlert,
  Target,
} from 'lucide-react';

interface RecentHistoryProps {
  checkins: DailyCheckin[];
  onSelectCheckin: (checkin: DailyCheckin) => void;
  onViewVerdict?: (checkin: DailyCheckin) => void;
  selectedId?: string | null;
}

export default function RecentHistory({
  checkins,
  onSelectCheckin,
  onViewVerdict,
  selectedId,
}: RecentHistoryProps) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-zinc-300">No Recent Check-ins</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Complete your first daily trading check-in above to begin tracking your NIFTY behavioral discipline.
        </p>
      </div>
    );
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    if (score >= 75) return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400';
    if (score >= 50) return 'bg-amber-950/40 border-amber-500/40 text-amber-400';
    return 'bg-rose-950/40 border-rose-500/40 text-rose-400';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-100">Recent Check-ins</h3>
        </div>
        <span className="text-[11px] text-zinc-400">
          Showing last {checkins.length} sessions
        </span>
      </div>

      <div className="space-y-2.5">
        {checkins.map((item) => {
          const isSelected = selectedId === item.id;
          const isOvertrade = item.trade_count > 2;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-zinc-800/80 border-emerald-500/50 shadow-md'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                {/* Date badge */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 min-w-[105px]">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{formatISTDate(item.checkin_date)}</span>
                </div>

                {/* Trade count badge */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                  <span className="font-mono font-medium">{item.trade_count} trade{item.trade_count === 1 ? '' : 's'}</span>
                  {isOvertrade ? (
                    <span className="text-[10px] text-rose-400 flex items-center gap-0.5 bg-rose-950/30 border border-rose-800/40 px-1.5 py-0.2 rounded">
                      <ShieldAlert className="w-3 h-3" /> &gt;2 Limit
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 bg-emerald-950/30 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                      <ShieldCheck className="w-3 h-3" /> Max-2 Ok
                    </span>
                  )}
                </div>

                {/* Urge level */}
                <div className="hidden md:block text-[11px] text-zinc-400">
                  Urge: <span className="text-zinc-200 capitalize">{item.urge_level}</span>
                </div>
              </div>

              {/* Right side: Score & Select Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                {/* Score badge */}
                <div
                  className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getScoreBadge(
                    item.discipline_score
                  )}`}
                >
                  {item.discipline_score !== null ? `${item.discipline_score}% Score` : 'Not enough data'}
                </div>

                {/* Action Buttons: Verdict & Edit */}
                <div className="flex items-center gap-1.5">
                  {onViewVerdict && (
                    <button
                      type="button"
                      onClick={() => onViewVerdict(item)}
                      className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-emerald-300 font-medium px-2 py-1 rounded border border-zinc-750 bg-zinc-900 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition"
                      title="View Chapter Feedback & Verdict"
                    >
                      <Target className="w-3 h-3 text-emerald-400" />
                      <span>Verdict</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectCheckin(item)}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-950/20 transition"
                    title="Edit check-in entry"
                  >
                    <FileEdit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
