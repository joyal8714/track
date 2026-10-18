'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import ReportCard from '@/components/ReportCard';
import CheckinForm from '@/components/CheckinForm';
import { DailyCheckin } from '@/types';
import { formatISTDate } from '@/lib/date-utils';
import {
  History,
  FileEdit,
  Trash2,
  Loader2,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function HistoryPage() {
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState<DailyCheckin | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadAllCheckins = useCallback(async (filter: string) => {
    try {
      setIsLoading(true);
      const url = filter ? `/api/checkins?month=${filter}` : '/api/checkins?limit=100';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCheckins(data.checkins || []);
        if (data.checkins && data.checkins.length > 0) {
          setSelectedCheckin((prev) => prev || data.checkins[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load checkins:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!ignore) {
        await loadAllCheckins(monthFilter);
      }
    }
    run();
    return () => {
      ignore = true;
    };
  }, [monthFilter, loadAllCheckins]);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this trading check-in?')) return;

    try {
      setIsDeleting(id);
      const res = await fetch(`/api/checkins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCheckins(prev => prev.filter(c => c.id !== id));
        if (selectedCheckin?.id === id) {
          setSelectedCheckin(null);
          setIsEditing(false);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(null);
    }
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    if (score >= 75) return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400';
    if (score >= 50) return 'bg-amber-950/40 border-amber-500/40 text-amber-400';
    return 'bg-rose-950/40 border-rose-500/40 text-rose-400';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-900">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-400" />
              Check-in History
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Review and audit all past daily trading behavioral logs and generated AI reports.
            </p>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
            />
            {monthFilter && (
              <button
                onClick={() => setMonthFilter('')}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* List Column */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recorded Sessions ({checkins.length})</span>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
            </div>

            {checkins.length === 0 && !isLoading ? (
              <div className="p-8 text-center bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-400 text-xs">
                No check-ins found {monthFilter ? `for ${monthFilter}` : ''}.
              </div>
            ) : (
              <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
                {checkins.map((item) => {
                  const isSelected = selectedCheckin?.id === item.id;
                  const isOvertrade = item.trade_count > 2;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedCheckin(item);
                        setIsEditing(false);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500/60 shadow-lg'
                          : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-100">
                            {formatISTDate(item.checkin_date)}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isOvertrade
                                ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                                : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            }`}
                          >
                            {item.trade_count} trade{item.trade_count === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                          <span>Urge: {item.urge_level}</span>
                          <span>&bull;</span>
                          <span>Setups: {item.followed_setups ? 'Yes' : 'No'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded border ${getScoreBadge(
                            item.discipline_score
                          )}`}
                        >
                          {item.discipline_score !== null ? `${item.discipline_score}%` : 'N/A'}
                        </span>

                        <button
                          type="button"
                          disabled={isDeleting === item.id}
                          onClick={(e) => handleDelete(item.id, e)}
                          title="Delete check-in"
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <ChevronRight className={`w-4 h-4 text-zinc-500 ${isSelected ? 'text-emerald-400' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="lg:col-span-7">
            {selectedCheckin ? (
              isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-200">
                      Editing Check-in: {formatISTDate(selectedCheckin.checkin_date)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                    >
                      Cancel Edit
                    </button>
                  </div>
                  <CheckinForm
                    selectedCheckinToEdit={selectedCheckin}
                    onSuccess={(updated) => {
                      setSelectedCheckin(updated);
                      setIsEditing(false);
                      loadAllCheckins(monthFilter);
                    }}
                    onCancelEdit={() => setIsEditing(false)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-400">
                      Selected Session Details &bull; {selectedCheckin.checkin_date}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 transition"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-emerald-400" />
                      Edit &amp; Regenerate Report
                    </button>
                  </div>

                  <ReportCard
                    checkin={selectedCheckin}
                    onEdit={() => setIsEditing(true)}
                  />
                </div>
              )
            ) : (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-sm">
                Select a session from the left to inspect its details and AI report.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
