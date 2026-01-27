import { Pool } from 'pg';
import { Bookmark, Paper } from '@/types/paper';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// 논문 캐시 타입 정의
export interface PaperCache {
  id: string;
  arxiv_id: string;
  translation: string | null;
  translated_at: string | null;
  analysis: {
    summary: string;
    keyPoints: string[];
    methodology: string;
    contributions: string[];
    limitations: string[];
  } | null;
  analyzed_at: string | null;
  infographic_url: string | null;
  infographic_created_at: string | null;
  created_at: string;
  updated_at: string;
}

// 테이블 초기화 (앱 시작 시 한 번 실행)
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        arxiv_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        authors TEXT[] NOT NULL,
        abstract TEXT,
        categories TEXT[],
        published_at TIMESTAMP,
        pdf_url TEXT,
        ai_summary TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 인덱스 생성 (이미 존재하면 무시)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_arxiv_id ON bookmarks(arxiv_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC)
    `);
  } finally {
    client.release();
  }
}

// 북마크 추가
export async function addBookmark(paper: Paper, aiSummary?: string): Promise<Bookmark | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO bookmarks (arxiv_id, title, authors, abstract, categories, published_at, pdf_url, ai_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (arxiv_id) DO NOTHING
       RETURNING *`,
      [
        paper.arxivId,
        paper.title,
        paper.authors,
        paper.abstract,
        paper.categories,
        paper.publishedAt,
        paper.pdfUrl,
        aiSummary || null,
      ]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    return null;
  } finally {
    client.release();
  }
}

// 북마크 삭제
export async function removeBookmark(arxivId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM bookmarks WHERE arxiv_id = $1',
      [arxivId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('북마크 삭제 오류:', error);
    return false;
  } finally {
    client.release();
  }
}

// 북마크 목록 조회
export async function getBookmarks(): Promise<Bookmark[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM bookmarks ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('북마크 조회 오류:', error);
    return [];
  } finally {
    client.release();
  }
}

// 특정 논문의 북마크 여부 확인
export async function isBookmarked(arxivId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id FROM bookmarks WHERE arxiv_id = $1',
      [arxivId]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  } finally {
    client.release();
  }
}

// 특정 논문의 북마크 정보 조회
export async function getBookmarkByArxivId(arxivId: string): Promise<Bookmark | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM bookmarks WHERE arxiv_id = $1',
      [arxivId]
    );
    return result.rows[0] || null;
  } catch (error) {
    return null;
  } finally {
    client.release();
  }
}

// AI 요약 업데이트
export async function updateAISummary(arxivId: string, aiSummary: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'UPDATE bookmarks SET ai_summary = $1 WHERE arxiv_id = $2',
      [aiSummary, arxivId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('AI 요약 업데이트 오류:', error);
    return false;
  } finally {
    client.release();
  }
}

// =============================================
// 논문 캐시 관련 함수들
// =============================================

// 논문 캐시 테이블 초기화
export async function initPaperCacheTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS paper_cache (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        arxiv_id TEXT NOT NULL UNIQUE,
        translation TEXT,
        translated_at TIMESTAMP,
        analysis JSONB,
        analyzed_at TIMESTAMP,
        infographic_url TEXT,
        infographic_created_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_paper_cache_arxiv_id ON paper_cache(arxiv_id)
    `);
  } finally {
    client.release();
  }
}

// 논문 캐시 조회
export async function getPaperCache(arxivId: string): Promise<PaperCache | null> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM paper_cache WHERE arxiv_id = $1',
      [arxivId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('논문 캐시 조회 오류:', error);
    return null;
  } finally {
    client.release();
  }
}

// 번역 저장
export async function saveTranslation(arxivId: string, translation: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO paper_cache (arxiv_id, translation, translated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (arxiv_id)
       DO UPDATE SET translation = $2, translated_at = NOW()`,
      [arxivId, translation]
    );
    return true;
  } catch (error) {
    console.error('번역 저장 오류:', error);
    return false;
  } finally {
    client.release();
  }
}

// AI 분석 결과 저장
export async function saveAnalysis(
  arxivId: string,
  analysis: { summary: string; keyPoints: string[]; methodology: string; contributions: string[]; limitations: string[] }
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO paper_cache (arxiv_id, analysis, analyzed_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (arxiv_id)
       DO UPDATE SET analysis = $2, analyzed_at = NOW()`,
      [arxivId, JSON.stringify(analysis)]
    );
    return true;
  } catch (error) {
    console.error('분석 결과 저장 오류:', error);
    return false;
  } finally {
    client.release();
  }
}

// 인포그래픽 URL 저장
export async function saveInfographicUrl(arxivId: string, url: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO paper_cache (arxiv_id, infographic_url, infographic_created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (arxiv_id)
       DO UPDATE SET infographic_url = $2, infographic_created_at = NOW()`,
      [arxivId, url]
    );
    return true;
  } catch (error) {
    console.error('인포그래픽 URL 저장 오류:', error);
    return false;
  } finally {
    client.release();
  }
}
