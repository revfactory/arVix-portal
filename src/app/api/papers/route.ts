import { NextRequest, NextResponse } from 'next/server';
import { searchArxiv, getPaperById as getArxivPaperById, getLatestPapers as getArxivLatestPapers } from '@/lib/arxiv';
import { searchOpenReview, getPaperById as getOpenReviewPaperById, getLatestPapers as getOpenReviewLatestPapers } from '@/lib/openreview';
import { enhanceSearchQuery } from '@/lib/search';
import { Paper } from '@/types/paper';

function mergePapers(arxivPapers: Paper[], openreviewPapers: Paper[]): Paper[] {
  const merged: Paper[] = [];
  const seenTitles = new Set<string>();

  const maxLength = Math.max(arxivPapers.length, openreviewPapers.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < arxivPapers.length) {
      const paper = arxivPapers[i];
      const normalizedTitle = paper.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        merged.push(paper);
        seenTitles.add(normalizedTitle);
      }
    }

    if (i < openreviewPapers.length) {
      const paper = openreviewPapers[i];
      const normalizedTitle = paper.title.toLowerCase().trim();
      if (!seenTitles.has(normalizedTitle)) {
        merged.push(paper);
        seenTitles.add(normalizedTitle);
      }
    }
  }

  return merged;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'search';
  const source = searchParams.get('source') || 'both';

  try {
    if (action === 'get') {
      const id = searchParams.get('id');
      if (!id) {
        return NextResponse.json({ error: 'ID가 필요합니다' }, { status: 400 });
      }

      let paper: Paper | null = null;

      if (source === 'arxiv') {
        paper = await getArxivPaperById(id);
      } else if (source === 'openreview') {
        paper = await getOpenReviewPaperById(id);
      } else {
        if (id.includes(':')) {
          const [detectedSource, actualId] = id.split(':');
          if (detectedSource === 'arxiv') {
            paper = await getArxivPaperById(actualId);
          } else if (detectedSource === 'openreview') {
            paper = await getOpenReviewPaperById(actualId);
          }
        } else {
          paper = await getArxivPaperById(id);
        }
      }

      if (!paper) {
        return NextResponse.json({ error: '논문을 찾을 수 없습니다' }, { status: 404 });
      }

      return NextResponse.json(paper);
    }

    if (action === 'latest') {
      const category = searchParams.get('category') || 'cs.AI';
      const venue = searchParams.get('venue') || 'ICLR.cc';
      const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);

      let papers: Paper[] = [];

      if (source === 'both') {
        const [arxivPapers, openreviewPapers] = await Promise.all([
          getArxivLatestPapers(category, Math.ceil(maxResults / 2)),
          getOpenReviewLatestPapers(venue, Math.ceil(maxResults / 2)),
        ]);
        papers = mergePapers(arxivPapers, openreviewPapers).slice(0, maxResults);
      } else if (source === 'arxiv') {
        papers = await getArxivLatestPapers(category, maxResults);
      } else if (source === 'openreview') {
        papers = await getOpenReviewLatestPapers(venue, maxResults);
      }

      return NextResponse.json({ papers, total: papers.length });
    }

    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || undefined;
    const maxResults = parseInt(searchParams.get('maxResults') || '20', 10);
    const start = parseInt(searchParams.get('start') || '0', 10);
    const enhance = searchParams.get('enhance') !== 'false';

    if (!query) {
      return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
    }

    let searchQuery = query;
    let enhancedData = null;

    if (enhance) {
      enhancedData = await enhanceSearchQuery(query);
      searchQuery = enhancedData.searchQuery;
    }

    if (source === 'both') {
      const arxivMaxResults = Math.ceil(maxResults / 2);
      const openreviewMaxResults = Math.ceil(maxResults / 2);

      const [arxivResult, openreviewResult] = await Promise.allSettled([
        searchArxiv({
          query: searchQuery,
          category: category || enhancedData?.suggestedCategory,
          maxResults: arxivMaxResults,
          start,
          dateRange: enhancedData?.dateFilter ? {
            startDate: enhancedData.dateFilter.startDate,
            endDate: enhancedData.dateFilter.endDate,
          } : undefined,
        }),
        searchOpenReview({
          query: searchQuery,
          maxResults: openreviewMaxResults,
          start: 0,
        }),
      ]);

      const arxivPapers = arxivResult.status === 'fulfilled' ? arxivResult.value.papers : [];
      const arxivTotal = arxivResult.status === 'fulfilled' ? arxivResult.value.total : 0;

      const openreviewPapers = openreviewResult.status === 'fulfilled' ? openreviewResult.value.papers : [];
      const openreviewTotal = openreviewResult.status === 'fulfilled' ? openreviewResult.value.total : 0;

      const papers = mergePapers(arxivPapers, openreviewPapers);

      return NextResponse.json({
        papers,
        total: arxivTotal + openreviewTotal,
        sources: {
          arxiv: { count: arxivPapers.length, total: arxivTotal },
          openreview: { count: openreviewPapers.length, total: openreviewTotal },
        },
        enhanced: enhancedData ? {
          originalQuery: enhancedData.originalQuery,
          optimizedQuery: enhancedData.searchQuery,
          keywords: enhancedData.englishKeywords,
          suggestedCategory: enhancedData.suggestedCategory,
          dateFilter: enhancedData.dateFilter,
        } : null,
      });
    } else if (source === 'arxiv') {
      const result = await searchArxiv({
        query: searchQuery,
        category: category || enhancedData?.suggestedCategory,
        maxResults,
        start,
        dateRange: enhancedData?.dateFilter ? {
          startDate: enhancedData.dateFilter.startDate,
          endDate: enhancedData.dateFilter.endDate,
        } : undefined,
      });

      return NextResponse.json({
        ...result,
        sources: {
          arxiv: { count: result.papers.length, total: result.total },
          openreview: { count: 0, total: 0 },
        },
        enhanced: enhancedData ? {
          originalQuery: enhancedData.originalQuery,
          optimizedQuery: enhancedData.searchQuery,
          keywords: enhancedData.englishKeywords,
          suggestedCategory: enhancedData.suggestedCategory,
          dateFilter: enhancedData.dateFilter,
        } : null,
      });
    } else if (source === 'openreview') {
      const result = await searchOpenReview({
        query: searchQuery,
        maxResults,
        start,
      });

      return NextResponse.json({
        ...result,
        sources: {
          arxiv: { count: 0, total: 0 },
          openreview: { count: result.papers.length, total: result.total },
        },
        enhanced: enhancedData ? {
          originalQuery: enhancedData.originalQuery,
          optimizedQuery: enhancedData.searchQuery,
          keywords: enhancedData.englishKeywords,
          suggestedCategory: enhancedData.suggestedCategory,
          dateFilter: enhancedData.dateFilter,
        } : null,
      });
    }

    return NextResponse.json({ error: '잘못된 source 파라미터' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'API 호출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
