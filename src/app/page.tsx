'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import PaperList from '@/components/PaperList';
import { Paper } from '@/types/paper';

const SEARCH_CACHE_KEY = 'arxiv-search-cache';

interface EnhancedSearch {
  originalQuery: string;
  optimizedQuery: string;
  keywords: string[];
  suggestedCategory?: string;
  dateFilter?: {
    startDate: string;
    endDate: string;
    description: string;
  };
}

interface SearchCache {
  query: string;
  category: string | null;
  papers: Paper[];
  total: number;
  enhanced: EnhancedSearch | null;
  timestamp: number;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [enhancedSearch, setEnhancedSearch] = useState<EnhancedSearch | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentStart, setCurrentStart] = useState(0);
  const RESULTS_PER_PAGE = 20;

  // 캐시에서 검색 결과 복원
  const restoreFromCache = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(SEARCH_CACHE_KEY);
      if (cached) {
        const data: SearchCache = JSON.parse(cached);
        // 5분 이내의 캐시만 사용
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          setPapers(data.papers);
          setTotalResults(data.total);
          setSearchQuery(data.query);
          setSelectedCategory(data.category);
          setEnhancedSearch(data.enhanced);
          setHasSearched(true);
          return true;
        }
      }
    } catch (e) {
      console.error('캐시 복원 오류:', e);
    }
    return false;
  }, []);

  // 캐시에 검색 결과 저장
  const saveToCache = useCallback((data: Omit<SearchCache, 'timestamp'>) => {
    try {
      const cache: SearchCache = { ...data, timestamp: Date.now() };
      sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('캐시 저장 오류:', e);
    }
  }, []);

  // URL 파라미터 변경 감지 및 검색 수행
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlCategory = searchParams.get('category');

    if (urlQuery) {
      // URL에 검색어가 있으면 해당 검색 수행
      if (urlQuery !== searchQuery) {
        setSearchQuery(urlQuery);
        if (urlCategory) setSelectedCategory(urlCategory);
        performSearch(urlQuery, urlCategory);
      }
    } else if (!isInitialized) {
      if (restoreFromCache()) {
        // 캐시 복원 성공
      } else {
        // 최신 논문 로드
        loadLatestPapers();
      }
    }
    setIsInitialized(true);
  }, [searchParams]);

  const loadLatestPapers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/arxiv?action=latest&category=cs.AI&maxResults=10');
      if (response.ok) {
        const data = await response.json();
        setPapers(data.papers);
        setTotalResults(data.total);
      }
    } catch (error) {
      console.error('최신 논문 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 수행 함수
  const performSearch = async (query: string, category: string | null) => {
    setIsLoading(true);
    setHasSearched(true);
    setEnhancedSearch(null);
    setCurrentStart(0);

    try {
      const params = new URLSearchParams({
        query,
        maxResults: String(RESULTS_PER_PAGE),
        start: '0',
      });

      if (category) {
        params.set('category', category);
      }

      const response = await fetch(`/api/arxiv?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPapers(data.papers);
        setTotalResults(data.total);

        const enhanced = data.enhanced || null;
        setEnhancedSearch(enhanced);

        // 캐시에 저장
        saveToCache({
          query,
          category,
          papers: data.papers,
          total: data.total,
          enhanced,
        });
      }
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 더보기 함수
  const loadMore = async () => {
    if (isLoadingMore || !searchQuery) return;

    setIsLoadingMore(true);
    const nextStart = currentStart + RESULTS_PER_PAGE;

    try {
      const params = new URLSearchParams({
        query: searchQuery,
        maxResults: String(RESULTS_PER_PAGE),
        start: String(nextStart),
      });

      if (selectedCategory) {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/arxiv?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // 중복 논문 필터링
        setPapers(prev => {
          const existingIds = new Set(prev.map(p => p.arxivId));
          const newPapers = data.papers.filter((p: Paper) => !existingIds.has(p.arxivId));
          return [...prev, ...newPapers];
        });
        setCurrentStart(nextStart);
      }
    } catch (error) {
      console.error('더보기 오류:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    // URL 업데이트 (히스토리에 추가)
    const params = new URLSearchParams();
    params.set('q', query);
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    router.push(`/?${params.toString()}`, { scroll: false });

    await performSearch(query, selectedCategory);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);

    // 이미 검색어가 있으면 카테고리 변경 시 재검색
    if (searchQuery) {
      // URL 업데이트
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (category) {
        params.set('category', category);
      }
      router.push(`/?${params.toString()}`, { scroll: false });

      performSearch(searchQuery, category);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">arXiv 논문 포털</h1>
        <p className="text-gray-600">AI 연구 논문을 검색하고, 분석하고, 관리하세요</p>
      </div>

      {/* 검색 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* 결과 섹션 */}
      <div>
        {hasSearched && !isLoading && (
          <div className="mb-4 space-y-2">
            <p className="text-sm text-gray-600">
              {searchQuery && (
                <>
                  <span className="font-medium">&quot;{searchQuery}&quot;</span> 검색 결과:{' '}
                </>
              )}
              <span className="font-semibold">{totalResults.toLocaleString()}</span>개의 논문
            </p>

            {/* AI 검색 최적화 정보 */}
            {enhancedSearch && (enhancedSearch.originalQuery !== enhancedSearch.optimizedQuery || enhancedSearch.dateFilter) && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 최적화
                </span>
                {enhancedSearch.dateFilter && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {enhancedSearch.dateFilter.description}
                  </span>
                )}
                {enhancedSearch.keywords.slice(0, 4).map((keyword, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSearched && !isLoading && papers.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-medium">최신 AI 논문</span>
          </p>
        )}

        <PaperList
          papers={papers}
          isLoading={isLoading}
          emptyMessage={hasSearched ? '검색 결과가 없습니다.' : '논문을 검색해보세요.'}
        />

        {/* 더보기 버튼 */}
        {hasSearched && !isLoading && papers.length > 0 && papers.length < totalResults && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  로딩 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  더보기 ({papers.length} / {totalResults.toLocaleString()})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
