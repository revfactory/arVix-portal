'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark } from '@/types/paper';
import { getBookmarks, removeBookmark } from '@/lib/bookmarks';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setIsLoading(true);
    const data = await getBookmarks();
    setBookmarks(data);
    setIsLoading(false);
  };

  const handleRemoveBookmark = async (arxivId: string) => {
    const success = await removeBookmark(arxivId);
    if (success) {
      setBookmarks(bookmarks.filter((b) => b.arxiv_id !== arxivId));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">내 북마크</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-blue-100 rounded w-16" />
                <div className="h-5 bg-blue-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">내 북마크</h1>
        <span className="text-sm text-gray-600">
          총 <span className="font-semibold">{bookmarks.length}</span>개
        </span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
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
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">북마크가 없습니다</h3>
          <p className="mt-2 text-sm text-gray-500">관심 있는 논문을 북마크해보세요.</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            논문 검색하기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/paper/${encodeURIComponent(bookmark.arxiv_id)}`}
                  className="flex-1 group"
                >
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {bookmark.title}
                  </h3>
                </Link>
                <button
                  onClick={() => handleRemoveBookmark(bookmark.arxiv_id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="북마크 삭제"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{bookmark.authors.slice(0, 3).join(', ')}</span>
                {bookmark.authors.length > 3 && (
                  <span className="text-gray-400">외 {bookmark.authors.length - 3}명</span>
                )}
                <span className="text-gray-300">|</span>
                <span>{formatDate(bookmark.published_at)}</span>
              </div>

              {bookmark.categories && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bookmark.categories.slice(0, 4).map((category) => (
                    <span
                      key={category}
                      className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {bookmark.ai_summary && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-purple-700">AI 요약: </span>
                    {bookmark.ai_summary}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  href={`/paper/${encodeURIComponent(bookmark.arxiv_id)}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  상세 보기
                </Link>
                {bookmark.pdf_url && (
                  <a
                    href={bookmark.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-gray-600 hover:text-gray-900"
                  >
                    PDF
                  </a>
                )}
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">
                  북마크 추가일: {formatDate(bookmark.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
