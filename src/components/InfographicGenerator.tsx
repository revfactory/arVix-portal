'use client';

import { useState } from 'react';
import Image from 'next/image';

interface InfographicGeneratorProps {
  title: string;
  summary: string;
  keyPoints: string[];
  methodology: string;
}

export default function InfographicGenerator({
  title,
  summary,
  keyPoints,
  methodology,
}: InfographicGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInfographic = async () => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch('/api/infographic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          summary,
          keyPoints,
          methodology,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인포그래픽 생성 실패');
      }

      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
      } else {
        throw new Error('이미지 생성에 실패했습니다');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `infographic-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
      <div className="flex items-center gap-3 mb-4">
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
          <h3 className="text-lg font-semibold text-gray-900">인포그래픽 생성</h3>
          <p className="text-sm text-gray-600">AI가 논문 내용을 시각화합니다</p>
        </div>
      </div>

      {!imageUrl && !isLoading && (
        <button
          onClick={generateInfographic}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          인포그래픽 만들기
        </button>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3">
            <svg
              className="animate-spin w-6 h-6 text-amber-600"
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
            <span className="text-gray-700 font-medium">
              인포그래픽 생성 중... (30초~1분 소요)
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            AI가 논문 내용을 손그림 스타일로 시각화하고 있습니다
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={generateInfographic}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {imageUrl && (
        <div className="mt-4">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
            <Image
              src={imageUrl}
              alt="논문 인포그래픽"
              width={600}
              height={800}
              className="w-full h-auto"
              unoptimized
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={downloadImage}
              className="flex-1 px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              다운로드
            </button>
            <button
              onClick={generateInfographic}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              다시 생성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
