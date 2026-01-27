import { NextRequest, NextResponse } from 'next/server';
import { analyzePaper, generateQuickSummary } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, abstract, mode = 'full' } = body;

    if (!abstract) {
      return NextResponse.json({ error: '초록이 필요합니다' }, { status: 400 });
    }

    if (mode === 'quick') {
      // 빠른 요약만
      const summary = await generateQuickSummary(abstract);
      return NextResponse.json({ summary });
    }

    // 전체 분석
    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다' }, { status: 400 });
    }

    const analysis = await analyzePaper(title, abstract);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('AI 분석 API 오류:', error);

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

    return NextResponse.json(
      { error: `AI 분석 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
