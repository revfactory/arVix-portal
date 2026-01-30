import { NextRequest, NextResponse } from 'next/server';
import { analyzePaper, generateQuickSummary } from '@/lib/ai';
import { getPaperCache, saveAnalysis } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, abstract, arxivId, source, mode = 'full' } = body;

    if (!abstract) {
      return NextResponse.json({ error: '초록이 필요합니다' }, { status: 400 });
    }

    if (mode === 'quick') {
      // 빠른 요약만
      const summary = await generateQuickSummary(abstract);
      return NextResponse.json({ summary });
    }

    // 전체 분석 - 캐시 확인
    if (arxivId) {
      const cache = await getPaperCache(arxivId);
      if (cache?.analysis) {
        return NextResponse.json({ ...cache.analysis, cached: true });
      }
    }

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다' }, { status: 400 });
    }

    const analysis = await analyzePaper(title, abstract);

    // 분석 결과 캐시에 저장
    if (arxivId && analysis) {
      if (source && source !== 'arxiv') {
        await saveAnalysis(source, arxivId, analysis);
      } else {
        await saveAnalysis(arxivId, analysis);
      }
    }

    return NextResponse.json({ ...analysis, cached: false });
  } catch (error) {
    console.error('AI 분석 API 오류:', error);

    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';

    return NextResponse.json(
      { error: `AI 분석 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
