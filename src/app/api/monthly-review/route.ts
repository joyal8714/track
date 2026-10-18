import { NextRequest, NextResponse } from 'next/server';
import { getCheckinsForMonth, getMonthlyReview, upsertMonthlyReview } from '@/lib/db';
import { calculateMonthlyMetrics } from '@/lib/metrics';
import { generateMonthlyAiReview } from '@/lib/gemini';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Valid month parameter (YYYY-MM) is required' }, { status: 400 });
    }

    const checkins = await getCheckinsForMonth(month);
    const metrics = calculateMonthlyMetrics(month, checkins);
    const reviewRecord = await getMonthlyReview(month);

    return NextResponse.json({
      month,
      checkins,
      metrics,
      review: reviewRecord,
    });
  } catch (error) {
    console.error('GET /api/monthly-review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve monthly review' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, regenerate } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Valid month (YYYY-MM) is required' }, { status: 400 });
    }

    const checkins = await getCheckinsForMonth(month);
    const metrics = calculateMonthlyMetrics(month, checkins);

    // If review exists and regenerate not requested, return existing
    const existing = await getMonthlyReview(month);
    if (existing && !regenerate && existing.ai_review) {
      return NextResponse.json({
        success: true,
        review: existing,
        metrics,
        checkins,
      });
    }

    // Generate monthly AI review with Gemini
    let aiReview = null;
    try {
      aiReview = await generateMonthlyAiReview(month, metrics, checkins);
    } catch (err) {
      console.error('Gemini monthly review generation failed:', err);
    }

    // Save/update monthly review record in database
    const savedRecord = await upsertMonthlyReview({
      id: existing?.id,
      review_month: month,
      recorded_days: metrics.recorded_days,
      total_trades: metrics.total_trades,
      avg_trades_per_day: metrics.avg_trades_per_day,
      over_two_trades_days: metrics.over_two_trades_days,
      over_two_trades_pct: metrics.over_two_trades_pct,
      impulsive_risk_days: metrics.impulsive_risk_days,
      planned_setup_rate: metrics.planned_setup_rate,
      stopped_planned_rate: metrics.stopped_planned_rate,
      work_distraction_count: metrics.work_distraction_count,
      tempted_after_wins_count: metrics.tempted_after_wins_count,
      avg_discipline_score: metrics.avg_discipline_score,
      best_day: metrics.best_day,
      worst_day: metrics.worst_day,
      ai_review: aiReview,
    });

    return NextResponse.json({
      success: true,
      review: savedRecord,
      metrics,
      checkins,
    });
  } catch (error) {
    console.error('POST /api/monthly-review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate monthly review' },
      { status: 500 }
    );
  }
}
