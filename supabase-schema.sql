-- arXiv Portal Bookmarks 테이블 스키마
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE bookmarks (
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
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX idx_bookmarks_arxiv_id ON bookmarks(arxiv_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Row Level Security (선택사항 - 인증 사용 시)
-- ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능 (인증 없이 사용 시)
-- CREATE POLICY "Enable all access for all users" ON bookmarks
--   FOR ALL USING (true) WITH CHECK (true);
