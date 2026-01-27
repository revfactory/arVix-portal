-- arXiv Portal 테이블 스키마
-- Supabase SQL Editor에서 실행하세요

-- =============================================
-- 1. 북마크 테이블
-- =============================================
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

CREATE INDEX idx_bookmarks_arxiv_id ON bookmarks(arxiv_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- =============================================
-- 2. 논문 캐시 테이블 (번역, 분석, 인포그래픽)
-- =============================================
CREATE TABLE paper_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  arxiv_id TEXT NOT NULL UNIQUE,

  -- 한글 번역
  translation TEXT,
  translated_at TIMESTAMP,

  -- AI 분석 결과 (JSON)
  analysis JSONB,
  analyzed_at TIMESTAMP,

  -- 인포그래픽 이미지 URL (Supabase Storage)
  infographic_url TEXT,
  infographic_created_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paper_cache_arxiv_id ON paper_cache(arxiv_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_paper_cache_updated_at
  BEFORE UPDATE ON paper_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. Supabase Storage 버킷 생성 (SQL로 실행 불가, Dashboard에서 생성)
-- =============================================
-- Storage > New bucket > "infographics" (Public 체크)

-- Row Level Security (선택사항 - 인증 사용 시)
-- ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE paper_cache ENABLE ROW LEVEL SECURITY;
