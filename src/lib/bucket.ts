import { Paper } from '@/types/paper';

const STORAGE_KEY = 'arxiv-portal-bucket';
const MAX_BUCKET_SIZE = 5;

export interface BucketPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  addedAt: string;
}

// localStorage에서 버킷 불러오기
export function getBucket(): BucketPaper[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// localStorage에 버킷 저장
function saveBucket(bucket: BucketPaper[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bucket));
    // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지)
    window.dispatchEvent(new CustomEvent('bucket-updated', { detail: bucket }));
  } catch (error) {
    console.error('버킷 저장 오류:', error);
  }
}

// 버킷에 논문 추가
export function addToBucket(paper: Paper): boolean {
  const bucket = getBucket();

  // 이미 존재하는지 확인
  if (bucket.some(p => p.arxivId === paper.arxivId)) {
    return false;
  }

  // 최대 크기 확인
  if (bucket.length >= MAX_BUCKET_SIZE) {
    return false;
  }

  const bucketPaper: BucketPaper = {
    arxivId: paper.arxivId,
    title: paper.title,
    authors: paper.authors,
    abstract: paper.abstract,
    categories: paper.categories,
    addedAt: new Date().toISOString(),
  };

  bucket.push(bucketPaper);
  saveBucket(bucket);
  return true;
}

// 버킷에서 논문 제거
export function removeFromBucket(arxivId: string): boolean {
  const bucket = getBucket();
  const filtered = bucket.filter(p => p.arxivId !== arxivId);

  if (filtered.length === bucket.length) {
    return false;
  }

  saveBucket(filtered);
  return true;
}

// 버킷 비우기
export function clearBucket(): void {
  saveBucket([]);
}

// 버킷에 있는지 확인
export function isInBucket(arxivId: string): boolean {
  const bucket = getBucket();
  return bucket.some(p => p.arxivId === arxivId);
}

// 최대 크기 반환
export function getMaxBucketSize(): number {
  return MAX_BUCKET_SIZE;
}
