export type UrgeLevel = 'Low' | 'Moderate' | 'Strong';
export type WorkDistraction = 'Yes' | 'No' | 'Not applicable';

export interface AiReport {
  discipline_summary: string;
  discipline_score: number | null;
  rules_followed: string[];
  rules_broken: string[];
  positive_behaviors: string[];
  risk_flags: string[];
  emotional_triggers: string[];
  improvement_for_tomorrow: string;
  coach_message: string;
  chapter_title?: string;
  verdict_type?: 'victory' | 'warning' | 'penance';
  motivation?: string;
  penance_protocol?: string[];
  reward?: string;
}

export interface DailyCheckinInput {
  checkin_date: string; // YYYY-MM-DD (Asia/Kolkata timezone)
  trade_count: number;
  urge_level: UrgeLevel;
  stopped_as_planned: boolean;
  impulsive_risk_increase: boolean;
  work_distraction: WorkDistraction;
  followed_setups: boolean;
  tempted_after_wins: boolean;
  trigger_notes?: string | null;
  daily_notes?: string | null;
  tomorrow_improvement?: string | null;
}

export interface DailyCheckin {
  id: string;
  user_id?: string | null;
  checkin_date: string;
  trade_count: number;
  urge_level: UrgeLevel;
  stopped_as_planned: boolean;
  impulsive_risk_increase: boolean;
  work_distraction: WorkDistraction;
  followed_setups: boolean;
  tempted_after_wins: boolean;
  trigger_notes: string | null;
  daily_notes: string | null;
  tomorrow_improvement: string | null;
  discipline_score: number | null;
  known_rules_count: number;
  ai_report: AiReport | null;
  created_at: string;
  updated_at: string;
}

export interface DayPerformance {
  date: string;
  score: number;
  trade_count: number;
}

export interface MonthlyMetrics {
  review_month: string; // YYYY-MM
  recorded_days: number;
  total_trades: number;
  avg_trades_per_day: number;
  over_two_trades_days: number;
  over_two_trades_pct: number;
  impulsive_risk_days: number;
  planned_setup_rate: number;
  stopped_planned_rate: number;
  work_distraction_count: number;
  tempted_after_wins_count: number;
  avg_discipline_score: number | null;
  best_day: DayPerformance | null;
  worst_day: DayPerformance | null;
}

export interface MonthlyAiReview {
  overall_trend: string;
  common_triggers: string[];
  improving_or_deteriorating: string;
  repeated_violations: string[];
  safeguards: string[];
}

export interface MonthlyReviewRecord extends MonthlyMetrics {
  id: string;
  user_id?: string | null;
  ai_review: MonthlyAiReview | null;
  created_at: string;
  updated_at: string;
}
