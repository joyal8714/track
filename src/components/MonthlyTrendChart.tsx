'use client';

import { DailyCheckin } from '@/types';
import { formatISTDate } from '@/lib/date-utils';

interface MonthlyTrendChartProps {
  checkins: DailyCheckin[];
}

export default function MonthlyTrendChart({ checkins }: MonthlyTrendChartProps) {
  if (!checkins || checkins.length === 0) {
    return (
      <div className="p-8 text-center bg-zinc-950/60 border border-zinc-800 rounded-xl text-zinc-500 text-xs">
        No recorded trading sessions available for trend visualization.
      </div>
    );
  }

  // Sort checkins chronologically
  const sorted = [...checkins].sort((a, b) => a.checkin_date.localeCompare(b.checkin_date));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-100">Daily Discipline &amp; Trade Frequency</h3>
          <p className="text-[11px] text-zinc-400">
            Day-by-day discipline score (%) and trade volume. Red line indicates 2-trade cap.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">Score &ge; 75%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-zinc-300">Score 50-74%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-zinc-300">Score &lt; 50%</span>
          </div>
        </div>
      </div>

      {/* Responsive Bar / Scatter visualization */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((day) => {
            const score = day.discipline_score;
            const isOvertrade = day.trade_count > 2;

            let scoreColor = 'bg-zinc-700 text-zinc-300';
            let barColor = 'bg-zinc-600';
            if (score !== null) {
              if (score >= 75) {
                scoreColor = 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300';
                barColor = 'bg-emerald-500';
              } else if (score >= 50) {
                scoreColor = 'bg-amber-950/50 border-amber-500/40 text-amber-300';
                barColor = 'bg-amber-500';
              } else {
                scoreColor = 'bg-rose-950/50 border-rose-500/40 text-rose-300';
                barColor = 'bg-rose-500';
              }
            }

            return (
              <div
                key={day.id}
                className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between gap-2 hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">
                    {formatISTDate(day.checkin_date)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.2 rounded border ${
                        isOvertrade
                          ? 'border-rose-500/40 text-rose-400 bg-rose-950/30'
                          : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                      }`}
                    >
                      {day.trade_count} trade{day.trade_count === 1 ? '' : 's'}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${scoreColor}`}
                    >
                      {score !== null ? `${score}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${score !== null ? score : 0}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                  <span>Urge: {day.urge_level}</span>
                  <span>Stopped: {day.stopped_as_planned ? '✓ Yes' : '✕ No'}</span>
                  <span>Risk: {day.impulsive_risk_increase ? '✕ Spiked' : '✓ Controlled'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
