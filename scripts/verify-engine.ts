import { calculateDisciplineScore } from '../src/lib/scoring';
import { calculateMonthlyMetrics } from '../src/lib/metrics';
import { getTodayIST, getCurrentMonthIST, formatISTDate } from '../src/lib/date-utils';
import { DailyCheckin } from '../src/types';

console.log('--- 1. Testing Deterministic Scoring Engine ---');

// Test 1: Perfect discipline
const perfect = calculateDisciplineScore({
  trade_count: 2,
  followed_setups: true,
  impulsive_risk_increase: false,
  stopped_as_planned: true,
});
console.log('Test 1 (Perfect 4/4):', perfect.disciplineScore === 100 && perfect.knownRulesCount === 4 ? 'PASSED' : 'FAILED', perfect);

// Test 2: 3 rules followed, 1 rule broken (overtrading: 3 trades)
const overtraded = calculateDisciplineScore({
  trade_count: 3,
  followed_setups: true,
  impulsive_risk_increase: false,
  stopped_as_planned: true,
});
console.log('Test 2 (Overtraded 3 trades -> 75%):', overtraded.disciplineScore === 75 && overtraded.rulesBroken.some(r => r.includes('Over-traded')) ? 'PASSED' : 'FAILED', overtraded);

// Test 3: Partial data (1 unknown rule)
const partial = calculateDisciplineScore({
  trade_count: 1, // satisfied
  followed_setups: true, // satisfied
  impulsive_risk_increase: true, // broken
  stopped_as_planned: null, // unknown
});
// 2 satisfied out of 3 known -> 67%
console.log('Test 3 (Partial 2/3 -> 67%):', partial.disciplineScore === 67 && partial.knownRulesCount === 3 ? 'PASSED' : 'FAILED', partial);

// Test 4: Zero rules known
const unknownAll = calculateDisciplineScore({
  trade_count: null,
  followed_setups: null,
  impulsive_risk_increase: null,
  stopped_as_planned: null,
});
console.log('Test 4 (Zero known -> Not enough data):', unknownAll.disciplineScore === null && unknownAll.scoreDisplay === 'Not enough data' ? 'PASSED' : 'FAILED', unknownAll);

console.log('\n--- 2. Testing Monthly Metrics Calculation ---');

const dummyCheckins: DailyCheckin[] = [
  {
    id: '1',
    checkin_date: '2026-10-01',
    trade_count: 2,
    urge_level: 'Low',
    stopped_as_planned: true,
    impulsive_risk_increase: false,
    work_distraction: 'No',
    followed_setups: true,
    tempted_after_wins: false,
    trigger_notes: null,
    daily_notes: null,
    tomorrow_improvement: null,
    discipline_score: 100,
    known_rules_count: 4,
    ai_report: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    checkin_date: '2026-10-02',
    trade_count: 3, // overtraded
    urge_level: 'Strong',
    stopped_as_planned: false, // did not stop
    impulsive_risk_increase: true, // impulsive
    work_distraction: 'Yes', // distracted
    followed_setups: false, // broke setups
    tempted_after_wins: true, // tempted
    trigger_notes: 'Gap down panic',
    daily_notes: null,
    tomorrow_improvement: null,
    discipline_score: 0,
    known_rules_count: 4,
    ai_report: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const metrics = calculateMonthlyMetrics('2026-10', dummyCheckins);
console.log('Monthly metrics verification:', {
  recorded_days: metrics.recorded_days === 2 ? 'PASSED (2)' : 'FAILED',
  total_trades: metrics.total_trades === 5 ? 'PASSED (5)' : 'FAILED',
  avg_trades_per_day: metrics.avg_trades_per_day === 2.5 ? 'PASSED (2.5)' : 'FAILED',
  over_two_trades_days: metrics.over_two_trades_days === 1 ? 'PASSED (1)' : 'FAILED',
  over_two_trades_pct: metrics.over_two_trades_pct === 50 ? 'PASSED (50%)' : 'FAILED',
  impulsive_risk_days: metrics.impulsive_risk_days === 1 ? 'PASSED (1)' : 'FAILED',
  planned_setup_rate: metrics.planned_setup_rate === 50 ? 'PASSED (50%)' : 'FAILED',
  stopped_planned_rate: metrics.stopped_planned_rate === 50 ? 'PASSED (50%)' : 'FAILED',
  work_distraction_count: metrics.work_distraction_count === 1 ? 'PASSED (1)' : 'FAILED',
  tempted_after_wins_count: metrics.tempted_after_wins_count === 1 ? 'PASSED (1)' : 'FAILED',
  avg_discipline_score: metrics.avg_discipline_score === 50 ? 'PASSED (50)' : 'FAILED',
  best_day: metrics.best_day?.score === 100 ? 'PASSED (100 on 2026-10-01)' : 'FAILED',
  worst_day: metrics.worst_day?.score === 0 ? 'PASSED (0 on 2026-10-02)' : 'FAILED',
});

console.log('\n--- 3. Testing Date Utilities ---');
const today = getTodayIST();
const month = getCurrentMonthIST();
console.log('Today IST:', today, /^\d{4}-\d{2}-\d{2}$/.test(today) ? 'PASSED' : 'FAILED');
console.log('Month IST:', month, /^\d{4}-\d{2}$/.test(month) ? 'PASSED' : 'FAILED');
console.log('Formatted IST Date:', formatISTDate('2026-10-18'));
