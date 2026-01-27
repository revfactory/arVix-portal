import { NextRequest, NextResponse } from 'next/server';
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  isBookmarked,
  initDatabase,
} from '@/lib/db';

// 앱 시작 시 테이블 초기화
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

// 북마크 목록 조회 또는 특정 논문 북마크 여부 확인
export async function GET(request: NextRequest) {
  await ensureInitialized();

  const searchParams = request.nextUrl.searchParams;
  const arxivId = searchParams.get('arxivId');

  try {
    if (arxivId) {
      // 특정 논문의 북마크 여부 확인
      const bookmarked = await isBookmarked(arxivId);
      return NextResponse.json({ bookmarked });
    }

    // 전체 북마크 목록 조회
    const bookmarks = await getBookmarks();
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('북마크 조회 오류:', error);
    return NextResponse.json({ error: '북마크 조회 실패' }, { status: 500 });
  }
}

// 북마크 추가
export async function POST(request: NextRequest) {
  await ensureInitialized();

  try {
    const body = await request.json();
    const { paper, aiSummary } = body;

    if (!paper || !paper.arxivId) {
      return NextResponse.json({ error: '논문 정보가 필요합니다' }, { status: 400 });
    }

    const bookmark = await addBookmark(paper, aiSummary);

    if (!bookmark) {
      return NextResponse.json({ error: '북마크 추가 실패' }, { status: 500 });
    }

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    return NextResponse.json({ error: '북마크 추가 실패' }, { status: 500 });
  }
}

// 북마크 삭제
export async function DELETE(request: NextRequest) {
  await ensureInitialized();

  const searchParams = request.nextUrl.searchParams;
  const arxivId = searchParams.get('arxivId');

  if (!arxivId) {
    return NextResponse.json({ error: 'arxivId가 필요합니다' }, { status: 400 });
  }

  try {
    const success = await removeBookmark(arxivId);

    if (!success) {
      return NextResponse.json({ error: '북마크 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('북마크 삭제 오류:', error);
    return NextResponse.json({ error: '북마크 삭제 실패' }, { status: 500 });
  }
}
