import { DailyCheckin, MonthlyMetrics } from '@/types';

/**
 * Calculates 10 monthly discipline metrics purely in application code
 * from stored check-ins for a specified month (YYYY-MM).
 */
export function calculateMonthlyMetrics(month: string, checkins: DailyCheckin[]): MonthlyMetrics {
  const recorded_days = checkins.length;

  if (recorded_days === 0) {
    return {
      review_month: month,
      recorded_days: 0,
      total_trades: 0,
      avg_trades_per_day: 0,
      over_two_trades_days: 0,
      over_two_trades_pct: 0,
      impulsive_risk_days: 0,
      planned_setup_rate: 0,
      stopped_planned_rate: 0,
      work_distraction_count: 0,
      tempted_after_wins_count: 0,
      avg_discipline_score: null,
      best_day: null,
      worst_day: null,
    };
  }

  let total_trades = 0;
  let over_two_trades_days = 0;
  let impulsive_risk_days = 0;
  let followed_setups_days = 0;
  let stopped_planned_days = 0;
  let work_distraction_count = 0;
  let tempted_after_wins_count = 0;

  const validScores: { date: string; score: number; trade_count: number }[] = [];

  for (const c of checkins) {
    total_trades += c.trade_count;

    if (c.trade_count > 2) {
      over_two_trades_days += 1;
    }

    if (c.impulsive_risk_increase === true) {
      impulsive_risk_days += 1;
    }

    if (c.followed_setups === true) {
      followed_setups_days += 1;
    }

    if (c.stopped_as_planned === true) {
      stopped_planned_days += 1;
    }

    if (c.work_distraction === 'Yes') {
      work_distraction_count += 1;
    }

    if (c.tempted_after_wins === true) {
      tempted_after_wins_count += 1;
    }

    if (typeof c.discipline_score === 'number' && !isNaN(c.discipline_score)) {
      validScores.push({
        date: c.checkin_date,
        score: c.discipline_score,
        trade_count: c.trade_count,
      });
    }
  }

  const avg_trades_per_day = Number((total_trades / recorded_days).toFixed(2));
  const over_two_trades_pct = Number(((over_two_trades_days / recorded_days) * 100).toFixed(1));
  const planned_setup_rate = Number(((followed_setups_days / recorded_days) * 100).toFixed(1));
  const stopped_planned_rate = Number(((stopped_planned_days / recorded_days) * 100).toFixed(1));

  let avg_discipline_score: number | null = null;
  let best_day: { date: string; score: number; trade_count: number } | null = null;
  let worst_day: { date: string; score: number; trade_count: number } | null = null;

  if (validScores.length > 0) {
    const totalScore = validScores.reduce((sum, item) => sum + item.score, 0);
    avg_discipline_score = Number((totalScore / validScores.length).toFixed(1));

    // Sort to find best and worst
    const sorted = [...validScores].sort((a, b) => b.score - a.score);
    best_day = sorted[0];
    worst_day = sorted[sorted.length - 1];
  }

  return {
    review_month: month,
    recorded_days,
    total_trades,
    avg_trades_per_day,
    over_two_trades_days,
    over_two_trades_pct,
    impulsive_risk_days,
    planned_setup_rate,
    stopped_planned_rate,
    work_distraction_count,
    tempted_after_wins_count,
    avg_discipline_score,
    best_day,
    worst_day,
  };
}
