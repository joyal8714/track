'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTodayIST } from '@/lib/date-utils';
import { DailyCheckin, DailyCheckinInput, UrgeLevel, WorkDistraction } from '@/types';
import {
  Sparkles,
  AlertCircle,
  RotateCcw,
  Loader2,
  FileEdit,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface CheckinFormProps {
  initialDate?: string;
  onSuccess: (checkin: DailyCheckin) => void;
  selectedCheckinToEdit?: DailyCheckin | null;
  onCancelEdit?: () => void;
}

export default function CheckinForm({
  initialDate,
  onSuccess,
  selectedCheckinToEdit,
  onCancelEdit,
}: CheckinFormProps) {
  const [prevEditId, setPrevEditId] = useState<string | null>(selectedCheckinToEdit?.id || null);
  const [date, setDate] = useState<string>(selectedCheckinToEdit?.checkin_date || initialDate || '');
  const [tradeCount, setTradeCount] = useState<number>(selectedCheckinToEdit?.trade_count ?? 1);
  const [urgeLevel, setUrgeLevel] = useState<UrgeLevel>(selectedCheckinToEdit?.urge_level || 'Low');
  const [stoppedAsPlanned, setStoppedAsPlanned] = useState<boolean>(selectedCheckinToEdit?.stopped_as_planned ?? true);
  const [impulsiveRiskIncrease, setImpulsiveRiskIncrease] = useState<boolean>(selectedCheckinToEdit?.impulsive_risk_increase ?? false);
  const [workDistraction, setWorkDistraction] = useState<WorkDistraction>(selectedCheckinToEdit?.work_distraction || 'No');
  const [followedSetups, setFollowedSetups] = useState<boolean>(selectedCheckinToEdit?.followed_setups ?? true);
  const [temptedAfterWins, setTemptedAfterWins] = useState<boolean>(selectedCheckinToEdit?.tempted_after_wins ?? false);
  const [triggerNotes, setTriggerNotes] = useState<string>(selectedCheckinToEdit?.trigger_notes || '');
  const [dailyNotes, setDailyNotes] = useState<string>(selectedCheckinToEdit?.daily_notes || '');
  const [tomorrowImprovement, setTomorrowImprovement] = useState<string>(selectedCheckinToEdit?.tomorrow_improvement || '');

  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [existingRecord, setExistingRecord] = useState<DailyCheckin | null>(selectedCheckinToEdit || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state during render when selectedCheckinToEdit prop changes (React recommended pattern)
  if (selectedCheckinToEdit && selectedCheckinToEdit.id !== prevEditId) {
    setPrevEditId(selectedCheckinToEdit.id);
    setDate(selectedCheckinToEdit.checkin_date);
    setTradeCount(selectedCheckinToEdit.trade_count);
    setUrgeLevel(selectedCheckinToEdit.urge_level);
    setStoppedAsPlanned(selectedCheckinToEdit.stopped_as_planned);
    setImpulsiveRiskIncrease(selectedCheckinToEdit.impulsive_risk_increase);
    setWorkDistraction(selectedCheckinToEdit.work_distraction);
    setFollowedSetups(selectedCheckinToEdit.followed_setups);
    setTemptedAfterWins(selectedCheckinToEdit.tempted_after_wins);
    setTriggerNotes(selectedCheckinToEdit.trigger_notes || '');
    setDailyNotes(selectedCheckinToEdit.daily_notes || '');
    setTomorrowImprovement(selectedCheckinToEdit.tomorrow_improvement || '');
    setExistingRecord(selectedCheckinToEdit);
  } else if (!selectedCheckinToEdit && prevEditId !== null) {
    setPrevEditId(null);
  }

  const populateFromCheckin = useCallback((c: DailyCheckin) => {
    setDate(c.checkin_date);
    setTradeCount(c.trade_count);
    setUrgeLevel(c.urge_level);
    setStoppedAsPlanned(c.stopped_as_planned);
    setImpulsiveRiskIncrease(c.impulsive_risk_increase);
    setWorkDistraction(c.work_distraction);
    setFollowedSetups(c.followed_setups);
    setTemptedAfterWins(c.tempted_after_wins);
    setTriggerNotes(c.trigger_notes || '');
    setDailyNotes(c.daily_notes || '');
    setTomorrowImprovement(c.tomorrow_improvement || '');
  }, []);

  // Initialize date on client mount if empty
  useEffect(() => {
    if (!date) {
      const timer = setTimeout(() => {
        setDate(getTodayIST());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [date]);

  // When date changes, check if a checkin exists for this date
  useEffect(() => {
    if (!date) return;
    let isCancelled = false;

    async function checkExistingDate() {
      setIsLoadingExisting(true);
      setError(null);
      try {
        const res = await fetch(`/api/checkins?date=${date}`);
        if (!res.ok) throw new Error('Failed to verify date');
        const data = await res.json();
        if (!isCancelled) {
          if (data.checkin) {
            setExistingRecord(data.checkin);
            populateFromCheckin(data.checkin);
          } else {
            setExistingRecord(null);
          }
        }
      } catch (err) {
        console.error('Error checking existing date:', err);
      } finally {
        if (!isCancelled) setIsLoadingExisting(false);
      }
    }

    checkExistingDate();

    return () => {
      isCancelled = true;
    };
  }, [date, populateFromCheckin]);

  function handleReset() {
    setDate(getTodayIST());
    setTradeCount(1);
    setUrgeLevel('Low');
    setStoppedAsPlanned(true);
    setImpulsiveRiskIncrease(false);
    setWorkDistraction('No');
    setFollowedSetups(true);
    setTemptedAfterWins(false);
    setTriggerNotes('');
    setDailyNotes('');
    setTomorrowImprovement('');
    setExistingRecord(null);
    setPrevEditId(null);
    setError(null);
    if (onCancelEdit) onCancelEdit();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    const payload: DailyCheckinInput = {
      checkin_date: date,
      trade_count: Number(tradeCount),
      urge_level: urgeLevel,
      stopped_as_planned: stoppedAsPlanned,
      impulsive_risk_increase: impulsiveRiskIncrease,
      work_distraction: workDistraction,
      followed_setups: followedSetups,
      tempted_after_wins: temptedAfterWins,
      trigger_notes: triggerNotes || undefined,
      daily_notes: dailyNotes || undefined,
      tomorrow_improvement: tomorrowImprovement || undefined,
    };

    try {
      const endpoint = existingRecord
        ? `/api/checkins/${existingRecord.id}`
        : '/api/checkins';
      const method = existingRecord ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit check-in');
      }

      setExistingRecord(data.checkin);
      onSuccess(data.checkin);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculated max-two-trades rule
  const followsTwoTradeRule = tradeCount <= 2;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6"
    >
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-100">End-of-Day Check-in</h2>
            {existingRecord ? (
              <span className="flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full">
                <FileEdit className="w-3 h-3" />
                Editing Entry
              </span>
            ) : (
              <span className="text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
                New Entry
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Evaluate your NIFTY trading behavior. One check-in per date is saved.
          </p>
        </div>

        {existingRecord && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Switch to New Date
          </button>
        )}
      </div>

      {/* Date & Trade Count Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Field */}
        <div>
          <label htmlFor="checkin_date" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Date (Asia/Kolkata) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="checkin_date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
            />
            {isLoadingExisting && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>
          {existingRecord && (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              Entry found for this date. Modifying will update this record.
            </p>
          )}
        </div>

        {/* Number of Trades */}
        <div>
          <label htmlFor="trade_count" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Number of Trades <span className="text-rose-400">*</span>
          </label>
          <input
            id="trade_count"
            type="number"
            min={0}
            max={50}
            value={tradeCount}
            onChange={(e) => setTradeCount(Math.max(0, parseInt(e.target.value) || 0))}
            required
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition font-mono"
          />

          {/* Automatic Calculation Indicator for Max-Two-Trades Rule */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            {followsTwoTradeRule ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Maximum-two-trades rule: Satisfied ({tradeCount}/2)
              </span>
            ) : (
              <span className="text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                Maximum-two-trades rule: Violated ({tradeCount} trades taken, limit is 2)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overall Trading Urge */}
      <div>
        <label className="block text-xs font-medium text-zinc-300 mb-2">
          Overall Trading Urge <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['Low', 'Moderate', 'Strong'] as UrgeLevel[]).map((level) => {
            const isSelected = urgeLevel === level;
            return (
              <button
                type="button"
                key={level}
                onClick={() => setUrgeLevel(level)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition text-center ${
                  isSelected
                    ? level === 'Low'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : level === 'Moderate'
                      ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                      : 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Binary Discipline Rule Toggles */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Core Discipline Checkpoints
        </div>

        {/* Stopped when planned */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Did I stop trading when planned? <span className="text-rose-400">*</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Closed terminal as scheduled without revenge trading or chasing
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setStoppedAsPlanned(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                stoppedAsPlanned
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setStoppedAsPlanned(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                !stoppedAsPlanned
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Increased risk impulsively */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Did I increase risk impulsively? <span className="text-rose-400">*</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Oversized positions, averaging down, or ignoring stop-loss
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setImpulsiveRiskIncrease(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                impulsiveRiskIncrease
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setImpulsiveRiskIncrease(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                !impulsiveRiskIncrease
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Followed planned setups */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Did I follow my planned trading setups? <span className="text-rose-400">*</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Only took entries fulfilling pre-defined checklist criteria
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setFollowedSetups(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                followedSetups
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setFollowedSetups(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                !followedSetups
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Tempted to take extra trades after winning */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Was I tempted to take extra trades after winning? <span className="text-rose-400">*</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Euphoria or &quot;house money&quot; mindset tempting over-trading
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTemptedAfterWins(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                temptedAfterWins
                  ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setTemptedAfterWins(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition ${
                !temptedAfterWins
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Engineering Job Distraction */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
          <div>
            <div className="text-xs font-medium text-zinc-200">
              Did trading distract me from my engineering job? <span className="text-rose-400">*</span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Screen watching during work meetings, sprint delays, or mental fatigue
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {(['Yes', 'No', 'Not applicable'] as WorkDistraction[]).map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setWorkDistraction(val)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition ${
                  workDistraction === val
                    ? val === 'No'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : val === 'Yes'
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                      : 'bg-zinc-800 border-zinc-600 text-zinc-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Optional Qualitative Text Fields */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Reflective Notes (Optional)
        </div>

        <div>
          <label htmlFor="trigger_notes" className="block text-xs font-medium text-zinc-300 mb-1">
            What triggered me today?
          </label>
          <input
            id="trigger_notes"
            type="text"
            placeholder="e.g. Sudden spike in NIFTY 1-min chart, Telegram chatter, early stopout"
            value={triggerNotes}
            onChange={(e) => setTriggerNotes(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div>
          <label htmlFor="daily_notes" className="block text-xs font-medium text-zinc-300 mb-1">
            Notes about today&apos;s behavior
          </label>
          <textarea
            id="daily_notes"
            rows={2}
            placeholder="e.g. Followed setup cleanly on the first trade. Felt itch to re-enter at 2 PM but walked away."
            value={dailyNotes}
            onChange={(e) => setDailyNotes(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition resize-none"
          />
        </div>

        <div>
          <label htmlFor="tomorrow_improvement" className="block text-xs font-medium text-zinc-300 mb-1">
            What will I improve tomorrow?
          </label>
          <input
            id="tomorrow_improvement"
            type="text"
            placeholder="e.g. Hard terminal shutdown at 11:30 AM regardless of market action"
            value={tomorrowImprovement}
            onChange={(e) => setTomorrowImprovement(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-zinc-500">
          Deterministic scoring is applied first; answers &amp; AI report are saved atomically.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-semibold text-sm transition shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Generating AI Report...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-zinc-950" />
              <span>{existingRecord ? 'Update & Regenerate AI Report' : 'Generate AI Report'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
