'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Paper, getCategoryName } from '@/types/paper';
import BookmarkButton from './BookmarkButton';
import BucketButton from './BucketButton';

interface PaperCardProps {
  paper: Paper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const router = useRouter();
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);

  const findSimilarPapers = async () => {
    if (isFindingSimilar) return;

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
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateAbstract = (text: string, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col h-full group">
      {/* 카테고리 태그 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {paper.categories.slice(0, 2).map((category) => (
          <span
            key={category}
            className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full"
            title={category}
          >
            {getCategoryName(category)}
          </span>
        ))}
        {paper.categories.length > 2 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
            +{paper.categories.length - 2}
          </span>
        )}
      </div>

      {/* 제목 */}
      <Link
        href={`/paper/${encodeURIComponent(paper.arxivId)}`}
        className="flex-grow"
      >
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
          {paper.title}
        </h3>
      </Link>

      {/* 논문 ID, 저자 및 날짜 */}
      <div className="text-xs text-gray-500 mb-3">
        <p className="font-mono text-gray-400 mb-1">arXiv:{paper.arxivId}</p>
        <p className="truncate">{paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 && ` 외 ${paper.authors.length - 2}명`}</p>
        <p className="mt-1">{formatDate(paper.publishedAt)}</p>
      </div>

      {/* 초록 미리보기 */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4 flex-grow">
        {truncateAbstract(paper.abstract)}
      </p>

      {/* 하단 액션 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Link
            href={`/paper/${encodeURIComponent(paper.arxivId)}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
          >
            상세보기
          </Link>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            PDF
          </a>
          <button
            onClick={findSimilarPapers}
            disabled={isFindingSimilar}
            className="text-xs font-medium text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
            title="유사한 논문 찾기"
          >
            {isFindingSimilar ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                검색중
              </span>
            ) : (
              '유사논문'
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <BucketButton paper={paper} size="sm" />
          <BookmarkButton paper={paper} size="sm" />
        </div>
      </div>
    </div>
  );
}
