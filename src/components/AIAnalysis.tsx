'use client';

import { useState, useEffect } from 'react';
import { AIAnalysis as AIAnalysisType } from '@/types/paper';

interface AIAnalysisProps {
  title: string;
  abstract: string;
  arxivId: string;
}

export default function AIAnalysis({ title, abstract, arxivId }: AIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // 캐시된 데이터 로드
  useEffect(() => {
    loadCachedData();
  }, [arxivId]);

  const loadCachedData = async () => {
    try {
      const response = await fetch(`/api/paper-cache?arxivId=${encodeURIComponent(arxivId)}`);
      if (response.ok) {
        const cache = await response.json();
        if (cache.analysis) {
          setAnalysis(cache.analysis);
          setIsCached(true);
        }
      }
    } catch (err) {
      console.error('캐시 로드 오류:', err);
    }
  };

  const analyzeWithAI = async () => {
    setIsLoading(true);
    setError(null);
    setIsCached(false);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, abstract, arxivId, mode: 'full' }),
      });

      if (!response.ok) {
        throw new Error('분석 요청 실패');
      }

      const data = await response.json();
      setAnalysis(data);
      if (data.cached) {
        setIsCached(true);
      }
    } catch (err) {
      setError('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('AI 분석 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!analysis && !isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI 논문 분석</h3>
              <p className="text-sm text-gray-600">Gemini AI가 논문의 핵심 내용을 분석합니다</p>
            </div>
          </div>
          <button
            onClick={analyzeWithAI}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            분석 시작
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center gap-3">
          <svg
            className="animate-spin w-6 h-6 text-purple-600"
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
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI가 분석 중입니다...</h3>
            <p className="text-sm text-gray-600">잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">AI 분석 결과</h3>
        </div>
        {isCached && (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
            저장됨
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* 요약 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">요약</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{analysis?.summary}</p>
        </div>

        {/* 핵심 포인트 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">핵심 포인트</h4>
          <ul className="space-y-1">
            {analysis?.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-purple-600 mt-1">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* 방법론 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">방법론</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{analysis?.methodology}</p>
        </div>

        {/* 주요 기여 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">주요 기여</h4>
          <ul className="space-y-1">
            {analysis?.contributions.map((contribution, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-600 mt-1">✓</span>
                {contribution}
              </li>
            ))}
          </ul>
        </div>

        {/* 한계점 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">한계점 및 향후 연구</h4>
          <ul className="space-y-1">
            {analysis?.limitations.map((limitation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-600 mt-1">→</span>
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={analyzeWithAI}
        className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
      >
        다시 분석
      </button>
    </div>
  );
}
