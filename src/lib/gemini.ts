import { GoogleGenAI } from '@google/genai';
import { aiReportSchema, monthlyAiReviewSchema, ValidatedAiReport, ValidatedMonthlyAiReview } from './validation';
import { DailyCheckinInput, MonthlyMetrics, DailyCheckin } from '@/types';
import { DisciplineCalculation } from './scoring';

/**
 * Retrieves the configured Gemini model name, defaulting to gemini-2.5-flash
 */
export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.8-flash';
}

/**
 * Initializes Google Gen AI SDK client securely on the server
 */
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generates a structured daily trading discipline report using Gemini AI.
 * Deterministic scoring is computed by the app engine and provided to Gemini as ground truth.
 */
export async function generateDailyAiReport(
  checkin: DailyCheckinInput,
  scoring: DisciplineCalculation
): Promise<ValidatedAiReport> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Graceful fallback if API key is not configured yet
  if (!apiKey) {
    return createFallbackDailyReport(checkin, scoring, 'Gemini API key is not configured in .env.local.');
  }

  const modelName = getGeminiModelName();
  const ai = getGenAIClient();

  const systemInstructions = `
You are an expert trading psychology and discipline coach evaluating a daily NIFTY intraday options trading check-in.
The trader uses this app as a sacred personal trading journal where every trading day is an unalterable "Chapter" in their Book of Discipline.
Your role is to evaluate their discipline, grant motivating praise for good chapters, enforce constructive behavioral punishment/penance for rule-breaking chapters, and remind them that tomorrow is a completely blank new chapter.

CRITICAL RULES:
1. The discipline score is DETERMINISTICALLY PRE-CALCULATED by the system as ${scoring.disciplineScore !== null ? scoring.disciplineScore : 'null (Not enough data)'}. You MUST preserve this exact score in the "discipline_score" field.
2. Determine "verdict_type":
   - "victory" if discipline_score >= 75
   - "warning" if discipline_score between 50 and 74
   - "penance" if discipline_score < 50
3. If verdict_type is "penance" (BAD DAY):
   - Provide "penance_protocol": Exactly 2 to 3 constructive behavioral punishments/penances the trader MUST execute to reset their psychology (e.g., mandatory 30-minute terminal lockout from 9:15-9:45 AM tomorrow to only observe; 30 pushups before touching the mouse; handwritten penance note in physical journal).
   - Tone: Stern, firm, uncompromising, but ultimately geared toward protecting their capital and mind.
4. If verdict_type is "victory" (GOOD DAY):
   - Provide "reward": An earned psychological privilege (e.g., guilt-free shutdown of all market screens, permission to rest with pride in execution).
   - "penance_protocol": An empty array or celebratory commitments.
5. "chapter_title": A dramatic, memorable title for this journal entry (e.g., "Chapter: The Cost of Chasing Green Candles", "Chapter: The Sniper's Restraint", "Chapter: Overtrading at the Open").
6. "motivation": A powerful, stoic paragraph emphasizing that today's chapter is now sealed. Tomorrow is a brand-new page with a 0-trade count and clean slate.
7. Maximum 2 trades per day is a fixed, non-negotiable rule. Impulsive risk is an immediate failure.
8. NEVER invent missing details, never assume profit/loss, and NEVER give financial/buy/sell advice.

Respond ONLY with a JSON object matching this exact schema:
{
  "chapter_title": "Chapter title here",
  "verdict_type": "victory" | "warning" | "penance",
  "discipline_summary": "Short 1-2 sentence executive summary of today's discipline.",
  "discipline_score": ${scoring.disciplineScore !== null ? scoring.disciplineScore : 'null'},
  "rules_followed": ["rule 1", "rule 2"],
  "rules_broken": ["rule broken 1"],
  "positive_behaviors": ["specific disciplined behavior 1"],
  "risk_flags": ["critical warning or violation 1"],
  "emotional_triggers": ["detected trigger 1"],
  "improvement_for_tomorrow": "One single, concrete, actionable micro-habit for tomorrow's session.",
  "motivation": "2-3 sentences of Stoic trading motivation emphasizing the clean slate of tomorrow's new page.",
  "penance_protocol": ["Specific penance 1", "Specific penance 2"],
  "reward": "Earned privilege if good, or what will be earned after redeeming tomorrow.",
  "coach_message": "2-3 sentences of direct coach feedback focusing on the psychological edge."
}
`;

  const userPrompt = `
Date: ${checkin.checkin_date}
Number of trades: ${checkin.trade_count} (Allowed max: 2)
Overall trading urge: ${checkin.urge_level}
Stopped trading when planned? ${checkin.stopped_as_planned ? 'Yes' : 'No'}
Increased risk impulsively? ${checkin.impulsive_risk_increase ? 'Yes' : 'No'}
Distracted from engineering job? ${checkin.work_distraction}
Followed planned setups? ${checkin.followed_setups ? 'Yes' : 'No'}
Tempted to take extra trades after winning? ${checkin.tempted_after_wins ? 'Yes' : 'No'}
Trigger notes: ${checkin.trigger_notes || 'None noted'}
Daily behavior notes: ${checkin.daily_notes || 'None noted'}
Commitment for tomorrow: ${checkin.tomorrow_improvement || 'None noted'}

System Calculated Rules Status:
- Rules Followed: ${JSON.stringify(scoring.rulesFollowed)}
- Rules Broken: ${JSON.stringify(scoring.rulesBroken)}
- Known rules count: ${scoring.knownRulesCount}/4
- Computed discipline score: ${scoring.disciplineScore !== null ? scoring.disciplineScore : 'Not enough data'}
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts: [{ text: `${systemInstructions}\n\nCheck-in Data:\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    // Clean potential markdown fences just in case
    const jsonString = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(jsonString);

    // Enforce deterministic discipline score in output
    parsed.discipline_score = scoring.disciplineScore;

    return aiReportSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to generate AI report from Gemini:', error);
    return createFallbackDailyReport(
      checkin,
      scoring,
      error instanceof Error ? error.message : 'AI generation error'
    );
  }
}

/**
 * Fallback report when Gemini is unavailable or errors out, preserving deterministic data
 */
export function createFallbackDailyReport(
  checkin: DailyCheckinInput,
  scoring: DisciplineCalculation,
  reason: string
): ValidatedAiReport {
  const riskFlags: string[] = [];
  const positiveBehaviors: string[] = [];
  const triggers: string[] = [];

  if (checkin.trade_count > 2) {
    riskFlags.push(`Exceeded 2-trade limit (${checkin.trade_count} trades executed)`);
  } else {
    positiveBehaviors.push(`Stayed strictly within the 2-trade daily limit (${checkin.trade_count} trades)`);
  }

  if (checkin.impulsive_risk_increase) {
    riskFlags.push('Impulsive risk increase detected during the session');
  } else {
    positiveBehaviors.push('Position sizing was kept under control without impulsive spikes');
  }

  if (checkin.stopped_as_planned) {
    positiveBehaviors.push('Closed terminal and stopped trading as scheduled');
  } else {
    riskFlags.push('Failed to stop trading when planned; chased additional market movement');
  }

  if (checkin.followed_setups) {
    positiveBehaviors.push('Waited for and followed pre-planned trading setups');
  } else {
    riskFlags.push('Took off-plan entries or deviated from established setups');
  }

  if (checkin.tempted_after_wins) {
    riskFlags.push('Euphoria / temptation noticed after profitable trades');
    triggers.push('Post-win euphoria');
  }

  if (checkin.work_distraction === 'Yes') {
    riskFlags.push('Trading distracted from primary engineering work duties');
    triggers.push('Workday overlap / dual attention');
  }

  if (checkin.trigger_notes) {
    triggers.push(checkin.trigger_notes);
  }

  const score = scoring.disciplineScore ?? 0;
  let verdict_type: 'victory' | 'warning' | 'penance' = 'warning';
  let chapter_title = `Chapter: The Discipline Audit (${checkin.checkin_date})`;
  let motivation = 'Today is etched into your journal, but remember: the market is a clean sheet every morning. Tomorrow begins a brand-new chapter.';
  const penance_protocol: string[] = [];
  let reward = '';

  if (score >= 75) {
    verdict_type = 'victory';
    chapter_title = `Chapter: The Sniper's Restraint (${checkin.checkin_date})`;
    motivation = `Outstanding discipline today! You respected your boundaries and proved that you command your actions, not the NIFTY tape. Close your trading station with pride. Tomorrow, write the next chapter with the same calm precision.`;
    reward = 'Guilt-Free Shutdown: Turn off all financial screens for the evening. Focus on your engineering career or personal life with absolute peace of mind.';
  } else if (score < 50) {
    verdict_type = 'penance';
    chapter_title = `Chapter: The Cost of Impatience (${checkin.checkin_date})`;
    motivation = `Do not despair, but do not make excuses. Every elite trader has chapters of defeat. What separates professionals from gamblers is the willingness to accept consequences and turn to a fresh page tomorrow with renewed humility.`;
    penance_protocol.push('Terminal Lockout: No trading fills for the first 30 minutes tomorrow (9:15 AM - 9:45 AM). Observe price action only without an open order ticket.');
    penance_protocol.push('Physical Penance: Complete 30 push-ups or a 15-minute screen-free walk right now to flush trading adrenaline out of your nervous system.');
    penance_protocol.push('Written Penance: Handwrite on physical paper: "I am a disciplined risk manager. Breaking my setups destroys my edge. Tomorrow is trade 0."');
  } else {
    verdict_type = 'warning';
    chapter_title = `Chapter: The Friction Point (${checkin.checkin_date})`;
    motivation = `You survived today, but you leaked discipline. Small leaks sink great ships over time. Clear your mind tonight—tomorrow morning is a completely clean chapter waiting for flawless execution.`;
    penance_protocol.push('Checklist Friction: Force yourself to tick off all checklist rules on paper before clicking buy/sell tomorrow.');
    penance_protocol.push('Hard 1-Trade Cap: Restrict yourself strictly to a single A+ setup tomorrow to re-center focus.');
  }

  return {
    chapter_title,
    verdict_type,
    discipline_summary: `Recorded ${checkin.trade_count} trades with ${checkin.urge_level.toLowerCase()} urge level. Calculated discipline score: ${scoring.scoreDisplay}.`,
    discipline_score: scoring.disciplineScore,
    rules_followed: scoring.rulesFollowed,
    rules_broken: scoring.rulesBroken,
    positive_behaviors: positiveBehaviors.length > 0 ? positiveBehaviors : ['Completed daily check-in transparently'],
    risk_flags: riskFlags.length > 0 ? riskFlags : ['No critical discipline flags noted today'],
    emotional_triggers: triggers.length > 0 ? triggers : ['None identified'],
    improvement_for_tomorrow: checkin.tomorrow_improvement || (riskFlags.length > 0 ? 'Focus strictly on eliminating the flagged rule violation tomorrow.' : 'Maintain your pre-market setup routine and strict stopping rule.'),
    motivation,
    penance_protocol,
    reward,
    coach_message: `Review saved successfully (${reason ? `Note: ${reason}` : ''}). Consistency comes from executing rules regardless of how the market tempts you.`,
  };
}

/**
 * Generates monthly retrospective analysis using Gemini AI.
 */
export async function generateMonthlyAiReview(
  month: string,
  metrics: MonthlyMetrics,
  checkins: DailyCheckin[]
): Promise<ValidatedMonthlyAiReview> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return createFallbackMonthlyReview(metrics, 'Gemini API key is not configured in .env.local.');
  }

  const modelName = getGeminiModelName();
  const ai = getGenAIClient();

  const systemInstructions = `
You are a senior trading psychologist analyzing a month (${month}) of NIFTY options intraday trading behavior.
You are given strict mathematical metrics calculated by the application from real recorded check-ins.

CRITICAL INSTRUCTIONS:
1. Clearly distinguish OBSERVED DATA from your psychological interpretation.
2. Do not invent missing check-ins or assume high win/loss amounts.
3. If recorded days are very low (e.g. < 3 days), state that data is insufficient for statistical confidence.
4. Evaluate whether discipline appears to be improving or deteriorating over the course of the month.
5. Provide exactly THREE practical, bulletproof safeguards for the upcoming month.

Respond ONLY with a JSON object matching this schema:
{
  "overall_trend": "Detailed paragraph evaluating the discipline trend across the month.",
  "common_triggers": ["Trigger 1", "Trigger 2"],
  "improving_or_deteriorating": "Improving" | "Deteriorating" | "Mixed / Insufficient data",
  "repeated_violations": ["Rule violation 1", "Rule violation 2"],
  "safeguards": [
    "Safeguard 1: Specific behavioral friction or rule",
    "Safeguard 2: Specific risk management boundary",
    "Safeguard 3: Specific routine to protect engineering work hours"
  ]
}
`;

  const simplifiedDays = checkins.map(c => ({
    date: c.checkin_date,
    trades: c.trade_count,
    urge: c.urge_level,
    stopped: c.stopped_as_planned,
    impulsive_risk: c.impulsive_risk_increase,
    followed_setups: c.followed_setups,
    tempted_after_wins: c.tempted_after_wins,
    work_distracted: c.work_distraction,
    score: c.discipline_score,
    triggers: c.trigger_notes,
  }));

  const userPrompt = `
Month: ${month}
Application-Calculated Metrics:
- Recorded trading days: ${metrics.recorded_days}
- Total trades executed: ${metrics.total_trades}
- Average trades per day: ${metrics.avg_trades_per_day}
- Days exceeding 2 trades: ${metrics.over_two_trades_days} (${metrics.over_two_trades_pct}%)
- Impulsive risk surge days: ${metrics.impulsive_risk_days}
- Planned setup adherence rate: ${metrics.planned_setup_rate}%
- Stopping-as-planned rate: ${metrics.stopped_planned_rate}%
- Work distraction days: ${metrics.work_distraction_count}
- Temptation after winning days: ${metrics.tempted_after_wins_count}
- Average discipline score: ${metrics.avg_discipline_score !== null ? metrics.avg_discipline_score : 'Not enough data'}
- Best day: ${metrics.best_day ? `${metrics.best_day.date} (Score: ${metrics.best_day.score})` : 'None'}
- Worst day: ${metrics.worst_day ? `${metrics.worst_day.date} (Score: ${metrics.worst_day.score})` : 'None'}

Daily Log Summary:
${JSON.stringify(simplifiedDays, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { role: 'user', parts: [{ text: `${systemInstructions}\n\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    const jsonString = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(jsonString);

    return monthlyAiReviewSchema.parse(parsed);
  } catch (error) {
    console.error('Failed to generate monthly AI review:', error);
    return createFallbackMonthlyReview(
      metrics,
      error instanceof Error ? error.message : 'AI monthly review generation error'
    );
  }
}

/**
 * Deterministic fallback for monthly review
 */
export function createFallbackMonthlyReview(
  metrics: MonthlyMetrics,
  reason: string
): ValidatedMonthlyAiReview {
  const violations: string[] = [];
  const triggers: string[] = [];

  if (metrics.over_two_trades_days > 0) {
    violations.push(`Over-trading: Exceeded 2 trades on ${metrics.over_two_trades_days} days (${metrics.over_two_trades_pct}% of sessions).`);
  }
  if (metrics.impulsive_risk_days > 0) {
    violations.push(`Impulsive sizing: Increased risk impulsively on ${metrics.impulsive_risk_days} days.`);
  }
  if (metrics.planned_setup_rate < 80) {
    violations.push(`Setup deviation: Planned setup adherence was ${metrics.planned_setup_rate}%, below 80% target.`);
  }
  if (metrics.stopped_planned_rate < 80) {
    violations.push(`Stopping failure: Failed to stop when planned on ${100 - metrics.stopped_planned_rate}% of recorded sessions.`);
  }

  if (metrics.tempted_after_wins_count > 0) {
    triggers.push(`Greed / Overconfidence after winning sessions (${metrics.tempted_after_wins_count} recorded days)`);
  }
  if (metrics.work_distraction_count > 0) {
    triggers.push(`Market volatility coinciding with engineering job hours (${metrics.work_distraction_count} days)`);
  }

  const score = metrics.avg_discipline_score ?? 0;
  let status = 'Mixed / Insufficient data';
  if (metrics.recorded_days >= 3) {
    status = score >= 75 ? 'Improving' : 'Deteriorating';
  }

  return {
    overall_trend: `Across ${metrics.recorded_days} recorded days in ${metrics.review_month}, average discipline score was ${metrics.avg_discipline_score !== null ? `${metrics.avg_discipline_score}%` : 'unavailable'}. Total trades: ${metrics.total_trades}. ${reason ? `(Note: ${reason})` : ''}`,
    common_triggers: triggers.length > 0 ? triggers : ['Market volatility', 'FOMO on big intraday candles'],
    improving_or_deteriorating: status,
    repeated_violations: violations.length > 0 ? violations : ['No repeated major rule violations recorded'],
    safeguards: [
      'Hard 2-Trade Cap: Set order limit or lock your trading terminal immediately after the 2nd trade fill.',
      'Risk Freeze Rule: Never double contract quantity following a loss or a win on the same day.',
      'Work Buffer: Designate explicit market windows (e.g. 9:15-10:15 AM only) to avoid overlap with engineering job responsibilities.'
    ],
  };
}
