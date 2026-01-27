'use client';

import { useState, useEffect } from 'react';
import { Paper } from '@/types/paper';
import { addToBucket, removeFromBucket, isInBucket, getMaxBucketSize, getBucket } from '@/lib/bucket';

interface BucketButtonProps {
  paper: Paper;
  size?: 'sm' | 'md';
}

export default function BucketButton({ paper, size = 'sm' }: BucketButtonProps) {
  const [inBucket, setInBucket] = useState(false);
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    setInBucket(isInBucket(paper.arxivId));
    setIsFull(getBucket().length >= getMaxBucketSize());

    const handleBucketUpdate = () => {
      setInBucket(isInBucket(paper.arxivId));
      setIsFull(getBucket().length >= getMaxBucketSize());
    };

    window.addEventListener('bucket-updated', handleBucketUpdate);
    return () => {
      window.removeEventListener('bucket-updated', handleBucketUpdate);
    };
  }, [paper.arxivId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inBucket) {
      removeFromBucket(paper.arxivId);
      setInBucket(false);
    } else {
      if (addToBucket(paper)) {
        setInBucket(true);
      }
    }
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <button
      onClick={handleClick}
      disabled={!inBucket && isFull}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
        inBucket
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : isFull
          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
          : 'bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'
      }`}
      title={inBucket ? '버킷에서 제거' : isFull ? '버킷이 가득 찼습니다' : '비교 버킷에 추가'}
    >
      {inBucket ? (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )}
    </button>
  );
}
