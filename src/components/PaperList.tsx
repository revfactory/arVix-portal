'use client';

import { Paper } from '@/types/paper';
import PaperCard from './PaperCard';

interface PaperListProps {
  papers: Paper[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function PaperList({ papers, isLoading = false, emptyMessage = '논문이 없습니다.' }: PaperListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
            <div className="flex gap-2 mb-3">
              <div className="h-5 bg-blue-100 rounded-full w-14" />
              <div className="h-5 bg-blue-100 rounded-full w-14" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-full mb-2" />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="mx-auto h-16 w-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{emptyMessage}</h3>
        <p className="mt-2 text-sm text-gray-500">검색어를 입력하여 논문을 찾아보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {papers.map((paper) => (
        <PaperCard key={paper.arxivId} paper={paper} />
      ))}
    </div>
  );
}
