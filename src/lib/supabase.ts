import { Bookmark, Paper } from '@/types/paper';

// 클라이언트에서 API를 통해 북마크 관리

// 북마크 추가
export async function addBookmark(paper: Paper, aiSummary?: string): Promise<Bookmark | null> {
  try {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paper, aiSummary }),
    });

    if (!response.ok) {
      console.error('북마크 추가 실패');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    return null;
  }
}

// 북마크 삭제
export async function removeBookmark(arxivId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/bookmarks?arxivId=${encodeURIComponent(arxivId)}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('북마크 삭제 오류:', error);
    return false;
  }
}

// 북마크 목록 조회
export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const response = await fetch('/api/bookmarks');

    if (!response.ok) {
      console.error('북마크 조회 실패');
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('북마크 조회 오류:', error);
    return [];
  }
}

// 특정 논문의 북마크 여부 확인
export async function isBookmarked(arxivId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/bookmarks?arxivId=${encodeURIComponent(arxivId)}`);

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.bookmarked;
  } catch (error) {
    return false;
  }
}
