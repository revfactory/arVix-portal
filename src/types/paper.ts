export interface Paper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publishedAt: string;
  updatedAt: string;
  pdfUrl: string;
  arxivUrl: string;
}

export interface Bookmark {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  categories: string[] | null;
  published_at: string | null;
  pdf_url: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  methodology: string;
  contributions: string[];
  limitations: string[];
}

export interface SearchParams {
  query: string;
  category?: string;
  maxResults?: number;
  start?: number;
}

export const ARXIV_CATEGORIES = [
  { id: 'cs.AI', name: '인공지능' },
  { id: 'cs.LG', name: '기계학습' },
  { id: 'cs.CL', name: '자연어처리' },
  { id: 'cs.CV', name: '컴퓨터비전' },
  { id: 'cs.NE', name: '신경망' },
  { id: 'cs.RO', name: '로보틱스' },
  { id: 'stat.ML', name: '통계적 기계학습' },
  { id: 'math.OC', name: '최적화' },
] as const;
