import { Bookmark, Paper } from '@/types/paper';

const STORAGE_KEY = 'arxiv-portal-bookmarks';

// localStorage에서 북마크 불러오기
function getStoredBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// localStorage에 북마크 저장
function saveBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error('북마크 저장 오류:', error);
  }
}

// 북마크 추가
export async function addBookmark(paper: Paper, aiSummary?: string): Promise<Bookmark | null> {
  try {
    const bookmarks = getStoredBookmarks();

    // 이미 존재하는지 확인
    if (bookmarks.some(b => b.arxiv_id === paper.arxivId)) {
      return bookmarks.find(b => b.arxiv_id === paper.arxivId) || null;
    }

    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      arxiv_id: paper.arxivId,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      categories: paper.categories,
      published_at: paper.publishedAt,
      pdf_url: paper.pdfUrl,
      ai_summary: aiSummary || null,
      created_at: new Date().toISOString(),
    };

    bookmarks.unshift(newBookmark);
    saveBookmarks(bookmarks);

    return newBookmark;
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    return null;
  }
}

// 북마크 삭제
export async function removeBookmark(arxivId: string): Promise<boolean> {
  try {
    const bookmarks = getStoredBookmarks();
    const filtered = bookmarks.filter(b => b.arxiv_id !== arxivId);

    if (filtered.length === bookmarks.length) {
      return false; // 삭제할 항목 없음
    }

    saveBookmarks(filtered);
    return true;
  } catch (error) {
    console.error('북마크 삭제 오류:', error);
    return false;
  }
}

// 북마크 목록 조회
export async function getBookmarks(): Promise<Bookmark[]> {
  return getStoredBookmarks();
}

// 특정 논문의 북마크 여부 확인
export async function isBookmarked(arxivId: string): Promise<boolean> {
  const bookmarks = getStoredBookmarks();
  return bookmarks.some(b => b.arxiv_id === arxivId);
}

// 특정 논문의 북마크 정보 조회
export async function getBookmarkByArxivId(arxivId: string): Promise<Bookmark | null> {
  const bookmarks = getStoredBookmarks();
  return bookmarks.find(b => b.arxiv_id === arxivId) || null;
}

// AI 요약 업데이트
export async function updateAISummary(arxivId: string, aiSummary: string): Promise<boolean> {
  try {
    const bookmarks = getStoredBookmarks();
    const index = bookmarks.findIndex(b => b.arxiv_id === arxivId);

    if (index === -1) {
      return false;
    }

    bookmarks[index].ai_summary = aiSummary;
    saveBookmarks(bookmarks);
    return true;
  } catch (error) {
    console.error('AI 요약 업데이트 오류:', error);
    return false;
  }
}
