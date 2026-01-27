import { NextRequest, NextResponse } from 'next/server';
import { searchArxiv, getPaperById, getLatestPapers } from '@/lib/arxiv';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'search';

  try {
    if (action === 'get') {
      // 특정 논문 조회
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 });
      }

      const paper = await getPaperById(id);
      if (!paper) {
        return NextResponse.json({ error: '논문을 찾을 수 없습니다' }, { status: 404 });
      }

      return NextResponse.json(paper);
    }

    if (action === 'latest') {
      // 최신 논문 조회
      const category = searchParams.get('category') || 'cs.AI';
      const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);

      const papers = await getLatestPapers(category, maxResults);
      return NextResponse.json({ papers, total: papers.length });
    }

    // 기본: 검색
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '20', 10);
    const start = parseInt(searchParams.get('start') || '0', 10);

    if (!query) {
      return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
    }

    const result = await searchArxiv({ query, category, maxResults, start });
    return NextResponse.json(result);
  } catch (error) {
    console.error('arXiv API 오류:', error);
    return NextResponse.json(
      { error: 'arXiv API 호출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
