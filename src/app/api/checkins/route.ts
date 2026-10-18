import { NextRequest, NextResponse } from 'next/server';
import { dailyCheckinInputSchema } from '@/lib/validation';
import { calculateDisciplineScore } from '@/lib/scoring';
import { generateDailyAiReport } from '@/lib/gemini';
import { getCheckinByDate, getRecentCheckins, getCheckinsForMonth, upsertDailyCheckin } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const limitParam = searchParams.get('limit');

    if (date) {
      const checkin = await getCheckinByDate(date);
      return NextResponse.json({ checkin });
    }

    if (month) {
      const checkins = await getCheckinsForMonth(month);
      return NextResponse.json({ checkins });
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const checkins = await getRecentCheckins(limit);
    return NextResponse.json({ checkins });
  } catch (error) {
    console.error('GET /api/checkins error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve check-ins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate form input with Zod
    const validationResult = dailyCheckinInputSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          issues: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const inputData = validationResult.data;

    // 2. Deterministically calculate discipline score in pure application logic
    const scoring = calculateDisciplineScore({
      trade_count: inputData.trade_count,
      followed_setups: inputData.followed_setups,
      impulsive_risk_increase: inputData.impulsive_risk_increase,
      stopped_as_planned: inputData.stopped_as_planned,
    });

    // 3. Request structured AI report from Gemini
    let aiReport;
    try {
      aiReport = await generateDailyAiReport(inputData, scoring);
    } catch (aiErr) {
      console.error('AI Report error in POST /api/checkins:', aiErr);
    }

    // 4. Save original answers and generated report together to database
    const savedCheckin = await upsertDailyCheckin({
      checkin_date: inputData.checkin_date,
      trade_count: inputData.trade_count,
      urge_level: inputData.urge_level,
      stopped_as_planned: inputData.stopped_as_planned,
      impulsive_risk_increase: inputData.impulsive_risk_increase,
      work_distraction: inputData.work_distraction,
      followed_setups: inputData.followed_setups,
      tempted_after_wins: inputData.tempted_after_wins,
      trigger_notes: inputData.trigger_notes || null,
      daily_notes: inputData.daily_notes || null,
      tomorrow_improvement: inputData.tomorrow_improvement || null,
      discipline_score: scoring.disciplineScore,
      known_rules_count: scoring.knownRulesCount,
      ai_report: aiReport || null,
    });

    return NextResponse.json({
      success: true,
      checkin: savedCheckin,
      scoring,
    });
  } catch (error) {
    console.error('POST /api/checkins error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save check-in' },
      { status: 500 }
    );
  }
}
