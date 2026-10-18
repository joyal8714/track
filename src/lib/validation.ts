import { z } from 'zod';

export const urgeLevelSchema = z.enum(['Low', 'Moderate', 'Strong']);
export const workDistractionSchema = z.enum(['Yes', 'No', 'Not applicable']);

export const dailyCheckinInputSchema = z.object({
  checkin_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  trade_count: z.coerce.number().int().min(0, 'Trade count must be a non-negative integer'),
  urge_level: urgeLevelSchema,
  stopped_as_planned: z.boolean(),
  impulsive_risk_increase: z.boolean(),
  work_distraction: workDistractionSchema,
  followed_setups: z.boolean(),
  tempted_after_wins: z.boolean(),
  trigger_notes: z.string().optional().nullable().transform(val => val?.trim() || null),
  daily_notes: z.string().optional().nullable().transform(val => val?.trim() || null),
  tomorrow_improvement: z.string().optional().nullable().transform(val => val?.trim() || null),
});

export const aiReportSchema = z.object({
  discipline_summary: z.string(),
  discipline_score: z.number().int().min(0).max(100).nullable(),
  rules_followed: z.array(z.string()).default([]),
  rules_broken: z.array(z.string()).default([]),
  positive_behaviors: z.array(z.string()).default([]),
  risk_flags: z.array(z.string()).default([]),
  emotional_triggers: z.array(z.string()).default([]),
  improvement_for_tomorrow: z.string(),
  coach_message: z.string(),
  chapter_title: z.string().optional(),
  verdict_type: z.enum(['victory', 'warning', 'penance']).optional(),
  motivation: z.string().optional(),
  penance_protocol: z.array(z.string()).optional(),
  reward: z.string().optional(),
});

export const monthlyAiReviewSchema = z.object({
  overall_trend: z.string(),
  common_triggers: z.array(z.string()).default([]),
  improving_or_deteriorating: z.string(),
  repeated_violations: z.array(z.string()).default([]),
  safeguards: z.array(z.string()).min(1),
});

export type ValidatedDailyCheckinInput = z.infer<typeof dailyCheckinInputSchema>;
export type ValidatedAiReport = z.infer<typeof aiReportSchema>;
export type ValidatedMonthlyAiReview = z.infer<typeof monthlyAiReviewSchema>;
