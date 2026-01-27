import { NextRequest, NextResponse } from 'next/server';
import { getPaperCache, saveTranslation, saveAnalysis, saveInfographicUrl, initPaperCacheTable } from '@/lib/db';

// 테이블 초기화 (서버 시작 시)
initPaperCacheTable().catch(console.error);

// GET: 논문 캐시 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const arxivId = searchParams.get('arxivId');

  if (!arxivId) {
    return NextResponse.json({ error: 'arxivId가 필요합니다' }, { status: 400 });
  }

  try {
    const cache = await getPaperCache(arxivId);
    return NextResponse.json(cache || {});
  } catch (error) {
    console.error('캐시 조회 오류:', error);
    return NextResponse.json({ error: '캐시 조회 실패' }, { status: 500 });
  }
}

// POST: 캐시 데이터 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { arxivId, type, data } = body;

    if (!arxivId || !type || !data) {
      return NextResponse.json(
        { error: 'arxivId, type, data가 필요합니다' },
        { status: 400 }
      );
    }

    let success = false;

    switch (type) {
      case 'translation':
        success = await saveTranslation(arxivId, data);
        break;
      case 'analysis':
        success = await saveAnalysis(arxivId, data);
        break;
      case 'infographic':
        success = await saveInfographicUrl(arxivId, data);
        break;
      default:
        return NextResponse.json({ error: '알 수 없는 type입니다' }, { status: 400 });
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: '저장 실패' }, { status: 500 });
    }
  } catch (error) {
    console.error('캐시 저장 오류:', error);
    return NextResponse.json({ error: '캐시 저장 실패' }, { status: 500 });
  }
}
