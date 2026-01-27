'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Paper, getCategoryName } from '@/types/paper';
import BookmarkButton from '@/components/BookmarkButton';
import AIAnalysis from '@/components/AIAnalysis';
import MarkdownView from '@/components/MarkdownView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaperDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 유사 논문 검색 상태
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);

  // 번역 상태
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);

  // 인포그래픽 상태
  const [infographicUrl, setInfographicUrl] = useState<string | null>(null);
  const [isGeneratingInfographic, setIsGeneratingInfographic] = useState(false);

  useEffect(() => {
    loadPaper();
  }, [id]);

  // 캐시된 데이터 로드
  useEffect(() => {
    if (paper?.arxivId) {
      loadCachedData();
    }
  }, [paper?.arxivId]);

  const loadCachedData = async () => {
    if (!paper) return;
    try {
      const response = await fetch(`/api/paper-cache?arxivId=${encodeURIComponent(paper.arxivId)}`);
      if (response.ok) {
        const cache = await response.json();
        if (cache.translation) {
          setTranslation(cache.translation);
        }
        if (cache.infographic_url) {
          setInfographicUrl(cache.infographic_url);
        }
      }
    } catch (err) {
      console.error('캐시 로드 오류:', err);
    }
  };

  const loadPaper = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const decodedId = decodeURIComponent(id);
      const response = await fetch(`/api/arxiv?action=get&id=${encodeURIComponent(decodedId)}`);

      if (!response.ok) {
        throw new Error('논문을 찾을 수 없습니다');
      }

      const data = await response.json();
      setPaper(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '논문을 불러오는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const translateAbstract = async () => {
    if (!paper || translation) {
      setShowOriginal(false);
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: paper.abstract, arxivId: paper.arxivId }),
      });

      if (!response.ok) {
        throw new Error('번역 요청 실패');
      }

      const data = await response.json();
      setTranslation(data.translation);
      setShowOriginal(false);
    } catch (err) {
      console.error('번역 오류:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const generateInfographic = async () => {
    if (!paper || infographicUrl || isGeneratingInfographic) return;

    setIsGeneratingInfographic(true);

    try {
      const response = await fetch('/api/infographic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: paper.title,
          summary: paper.abstract.slice(0, 500),
          keyPoints: [paper.categories.join(', '), `저자: ${paper.authors.slice(0, 3).join(', ')}`],
          methodology: '',
          arxivId: paper.arxivId,
        }),
      });

      if (!response.ok) {
        throw new Error('인포그래픽 생성 실패');
      }

      const data = await response.json();
      if (data.imageUrl) {
        setInfographicUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('인포그래픽 생성 오류:', err);
    } finally {
      setIsGeneratingInfographic(false);
    }
  };

  const findSimilarPapers = async () => {
    if (!paper || isFindingSimilar) return;

    setIsFindingSimilar(true);
    try {
      const response = await fetch('/api/similar-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract,
          categories: paper.categories,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.searchQuery) {
          router.push(`/?q=${encodeURIComponent(data.searchQuery)}`);
        }
      }
    } catch (err) {
      console.error('유사 논문 검색 오류:', err);
    } finally {
      setIsFindingSimilar(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-blue-100 rounded w-16" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">{error || '논문을 찾을 수 없습니다'}</h2>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        검색으로 돌아가기
      </Link>

      {/* 논문 정보 카드 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
        {/* 제목 및 북마크 */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{paper.title}</h1>
            <p className="mt-1 text-sm font-mono text-gray-400">arXiv:{paper.arxivId}</p>
          </div>
          <BookmarkButton paper={paper} size="lg" />
        </div>

        {/* 저자 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-1">저자</h2>
          <p className="text-gray-700">{paper.authors.join(', ')}</p>
        </div>

        {/* 날짜 */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-semibold text-gray-500">게시일: </span>
            <span className="text-gray-700">{formatDate(paper.publishedAt)}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-500">수정일: </span>
            <span className="text-gray-700">{formatDate(paper.updatedAt)}</span>
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">카테고리</h2>
          <div className="flex flex-wrap gap-2">
            {paper.categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-full"
                title={category}
              >
                {getCategoryName(category)}
              </span>
            ))}
          </div>
        </div>

        {/* 링크들 */}
        <div className="flex gap-4 pt-2">
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            PDF 다운로드
          </a>
          <a
            href={paper.arxivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            arXiv에서 보기
          </a>
          <button
            onClick={findSimilarPapers}
            disabled={isFindingSimilar}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFindingSimilar ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                검색 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                유사 논문 찾기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 초록 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            초록 {showOriginal ? '(Abstract)' : '(한국어 번역)'}
          </h2>
          <div className="flex items-center gap-2">
            {translation && (
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => setShowOriginal(true)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    showOriginal
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  원문
                </button>
                <button
                  onClick={() => setShowOriginal(false)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    !showOriginal
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  한국어
                </button>
              </div>
            )}
            {!translation && (
              <button
                onClick={translateAbstract}
                disabled={isTranslating}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {isTranslating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    번역 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    한국어로 번역
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {isTranslating ? (
          <div className="py-8 text-center">
            <svg
              className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-gray-600">Gemini AI가 번역 중입니다...</p>
          </div>
        ) : showOriginal ? (
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {paper.abstract}
          </p>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <MarkdownView content={translation || ''} />
          </div>
        )}
      </div>

      {/* AI 분석 */}
      <AIAnalysis title={paper.title} abstract={paper.abstract} arxivId={paper.arxivId} />

      {/* 인포그래픽 섹션 */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">인포그래픽</h3>
              <p className="text-sm text-gray-600">논문 내용을 시각화한 이미지</p>
            </div>
          </div>
          {infographicUrl && (
            <a
              href={infographicUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              다운로드
            </a>
          )}
        </div>

        {infographicUrl ? (
          <div className="rounded-lg overflow-hidden border border-amber-200 bg-white">
            <img
              src={infographicUrl}
              alt="논문 인포그래픽"
              className="w-full h-auto"
            />
          </div>
        ) : (
          <div className="text-center py-10">
            {isGeneratingInfographic ? (
              <>
                <svg className="animate-spin w-10 h-10 text-amber-600 mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-700 font-medium mb-1">인포그래픽 생성 중...</p>
                <p className="text-sm text-gray-500">AI가 논문 내용을 시각화하고 있습니다 (30초~1분 소요)</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-amber-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 mb-4">논문 내용을 시각화한 인포그래픽을 생성할 수 있습니다</p>
                <button
                  onClick={generateInfographic}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  인포그래픽 생성
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
