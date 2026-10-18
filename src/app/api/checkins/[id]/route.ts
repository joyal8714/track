import { NextRequest, NextResponse } from 'next/server';
import { dailyCheckinInputSchema } from '@/lib/validation';
import { calculateDisciplineScore } from '@/lib/scoring';
import { generateDailyAiReport } from '@/lib/gemini';
import { getCheckinById, upsertDailyCheckin, deleteDailyCheckin } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const checkin = await getCheckinById(id);
    if (!checkin) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }
    return NextResponse.json({ checkin });
  } catch (error) {
    console.error('GET /api/checkins/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve check-in' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getCheckinById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }

    const body = await request.json();
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

    // Recalculate deterministic discipline score
    const scoring = calculateDisciplineScore({
      trade_count: inputData.trade_count,
      followed_setups: inputData.followed_setups,
      impulsive_risk_increase: inputData.impulsive_risk_increase,
      stopped_as_planned: inputData.stopped_as_planned,
    });

    // Re-generate AI report with updated data
    let aiReport;
    try {
      aiReport = await generateDailyAiReport(inputData, scoring);
    } catch (aiErr) {
      console.error('AI Report regeneration error:', aiErr);
    }

    const updatedCheckin = await upsertDailyCheckin({
      id: existing.id,
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
      checkin: updatedCheckin,
      scoring,
    });
  } catch (error) {
    console.error('PUT /api/checkins/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update check-in' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = await deleteDailyCheckin(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/checkins/[id] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete check-in' },
      { status: 500 }
    );
  }
}
