'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BucketPaper, getBucket, removeFromBucket, clearBucket } from '@/lib/bucket';

interface ComparisonAnalysis {
  commonThemes: string[];
  differences: string[];
  connections: string[];
  researchGaps: string[];
  recommendation: string;
}

export default function PaperBucket() {
  const [bucket, setBucket] = useState<BucketPaper[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    // 초기 로드
    setBucket(getBucket());

    // 버킷 업데이트 이벤트 리스너
    const handleBucketUpdate = (e: CustomEvent<BucketPaper[]>) => {
      setBucket(e.detail);
    };

    window.addEventListener('bucket-updated', handleBucketUpdate as EventListener);
    return () => {
      window.removeEventListener('bucket-updated', handleBucketUpdate as EventListener);
    };
  }, []);

  const handleRemove = (arxivId: string) => {
    removeFromBucket(arxivId);
    setBucket(getBucket());
    setAnalysis(null);
  };

  const handleClear = () => {
    clearBucket();
    setBucket([]);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (bucket.length < 2) return;

    setIsAnalyzing(true);
    setShowAnalysis(true);

    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          papers: bucket.map(p => ({
            title: p.title,
            abstract: p.abstract,
            categories: p.categories,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('비교 분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (bucket.length === 0 && !showAnalysis) {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed right-4 bottom-4 z-40 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {bucket.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {bucket.length}
          </span>
        )}
      </button>

      {/* 사이드 패널 */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isExpanded ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b bg-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                비교 버킷
              </h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-indigo-700 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-indigo-200 mt-1">
              {bucket.length}개 논문 선택됨 (최대 5개)
            </p>
          </div>

          {/* 논문 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {bucket.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">논문 카드에서 + 버튼을 눌러<br />비교할 논문을 추가하세요</p>
              </div>
            ) : (
              bucket.map((paper) => (
                <div
                  key={paper.arxivId}
                  className="bg-gray-50 rounded-lg p-3 relative group"
                >
                  <button
                    onClick={() => handleRemove(paper.arxivId)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <Link
                    href={`/paper/${encodeURIComponent(paper.arxivId)}`}
                    className="block"
                    onClick={() => setIsExpanded(false)}
                  >
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 pr-6 hover:text-indigo-600">
                      {paper.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {paper.authors.slice(0, 2).join(', ')}
                      {paper.authors.length > 2 && ` 외 ${paper.authors.length - 2}명`}
                    </p>
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {paper.categories.slice(0, 2).map((cat) => (
                      <span key={cat} className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 액션 버튼 */}
          {bucket.length > 0 && (
            <div className="p-4 border-t space-y-2">
              <button
                onClick={handleAnalyze}
                disabled={bucket.length < 2 || isAnalyzing}
                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    분석 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 비교 분석
                  </>
                )}
              </button>
              {bucket.length < 2 && (
                <p className="text-xs text-center text-gray-500">
                  2개 이상의 논문을 선택하세요
                </p>
              )}
              <button
                onClick={handleClear}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                전체 비우기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 분석 결과 모달 */}
      {showAnalysis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI 논문 비교 분석</h3>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-indigo-200 mt-1">
                {bucket.length}개 논문 비교
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <svg className="animate-spin w-10 h-10 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-gray-600">AI가 논문들을 분석하고 있습니다...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  {/* 공통 주제 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                      공통 주제 및 연결점
                    </h4>
                    <ul className="space-y-1 ml-8">
                      {analysis.commonThemes.map((theme, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          {theme}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 차이점 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">2</span>
                      주요 차이점
                    </h4>
                    <ul className="space-y-1 ml-8">
                      {analysis.differences.map((diff, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 연구 연결 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">3</span>
                      연구 간 연결 가능성
                    </h4>
                    <ul className="space-y-1 ml-8">
                      {analysis.connections.map((conn, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {conn}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 연구 갭 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">4</span>
                      향후 연구 방향
                    </h4>
                    <ul className="space-y-1 ml-8">
                      {analysis.researchGaps.map((gap, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 추천 */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">종합 의견</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {analysis.recommendation}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 오버레이 */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
