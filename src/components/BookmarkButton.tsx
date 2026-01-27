'use client';

import { useState, useEffect } from 'react';
import { Paper } from '@/types/paper';
import { addBookmark, removeBookmark, isBookmarked } from '@/lib/bookmarks';

interface BookmarkButtonProps {
  paper: Paper;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function BookmarkButton({ paper, size = 'md', showLabel = false }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBookmarkStatus();
  }, [paper.arxivId]);

  const checkBookmarkStatus = async () => {
    setLoading(true);
    const status = await isBookmarked(paper.arxivId);
    setBookmarked(status);
    setLoading(false);
  };

  const toggleBookmark = async () => {
    setLoading(true);
    try {
      if (bookmarked) {
        const success = await removeBookmark(paper.arxivId);
        if (success) {
          setBookmarked(false);
        }
      } else {
        const result = await addBookmark(paper);
        if (result) {
          setBookmarked(true);
        }
      }
    } catch (error) {
      console.error('북마크 토글 오류:', error);
    }
    setLoading(false);
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark();
      }}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-md transition-colors ${buttonSizeClasses[size]} ${
        bookmarked
          ? 'text-yellow-500 hover:text-yellow-600'
          : 'text-gray-400 hover:text-gray-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={bookmarked ? '북마크 제거' : '북마크 추가'}
    >
      {loading ? (
        <svg className={`animate-spin ${sizeClasses[size]}`} viewBox="0 0 24 24">
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
      ) : (
        <svg
          className={sizeClasses[size]}
          fill={bookmarked ? 'currentColor' : 'none'}
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
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {bookmarked ? '북마크됨' : '북마크'}
        </span>
      )}
    </button>
  );
}
