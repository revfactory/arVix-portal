'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import PaperList from '@/components/PaperList';
import { Paper } from '@/types/paper';

interface EnhancedSearch {
  originalQuery: string;
  optimizedQuery: string;
  keywords: string[];
  suggestedCategory?: string;
}

export default function Home() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [enhancedSearch, setEnhancedSearch] = useState<EnhancedSearch | null>(null);

  // 최신 논문 로드 (초기 로드)
  useEffect(() => {
    loadLatestPapers();
  }, []);

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

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    setHasSearched(true);
    setEnhancedSearch(null);

    try {
      const params = new URLSearchParams({
        query,
        maxResults: '20',
      });

      if (selectedCategory) {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/arxiv?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPapers(data.papers);
        setTotalResults(data.total);
        if (data.enhanced) {
          setEnhancedSearch(data.enhanced);
        }
      }
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);

    // 이미 검색어가 있으면 카테고리 변경 시 재검색
    if (searchQuery) {
      handleSearchWithCategory(searchQuery, category);
    }
  };

  const handleSearchWithCategory = async (query: string, category: string | null) => {
    setIsLoading(true);
    setEnhancedSearch(null);

    try {
      const params = new URLSearchParams({
        query,
        maxResults: '20',
      });

      if (category) {
        params.set('category', category);
      }

      const response = await fetch(`/api/arxiv?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPapers(data.papers);
        setTotalResults(data.total);
        if (data.enhanced) {
          setEnhancedSearch(data.enhanced);
        }
      }
    } catch (error) {
      console.error('검색 오류:', error);
    } finally {
      setIsLoading(false);
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
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
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
            {enhancedSearch && enhancedSearch.originalQuery !== enhancedSearch.optimizedQuery && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 최적화
                </span>
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
      </div>
    </div>
  );
}
