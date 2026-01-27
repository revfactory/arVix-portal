import { parseStringPromise } from 'xml2js';
import { Paper, SearchParams } from '@/types/paper';

const ARXIV_API_BASE = 'https://export.arxiv.org/api/query';

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: { name: string[] }[];
  published: string[];
  updated: string[];
  link: { $: { href: string; title?: string; type?: string } }[];
  category: { $: { term: string } }[];
}

interface ArxivResponse {
  feed: {
    entry?: ArxivEntry[];
    'opensearch:totalResults'?: { _: string }[];
  };
}

// arXiv ID 추출 (URL에서)
function extractArxivId(idUrl: string): string {
  const match = idUrl.match(/abs\/(.+?)(?:v\d+)?$/);
  return match ? match[1] : idUrl;
}

// XML을 Paper 객체로 변환
function parseEntry(entry: ArxivEntry): Paper {
  const arxivUrl = entry.id[0];
  const arxivId = extractArxivId(arxivUrl);

  const pdfLink = entry.link.find(l => l.$.title === 'pdf');
  const pdfUrl = pdfLink ? pdfLink.$.href : `https://arxiv.org/pdf/${arxivId}.pdf`;

  return {
    arxivId,
    title: entry.title[0].replace(/\s+/g, ' ').trim(),
    authors: entry.author.map(a => a.name[0]),
    abstract: entry.summary[0].replace(/\s+/g, ' ').trim(),
    categories: entry.category.map(c => c.$.term),
    publishedAt: entry.published[0],
    updatedAt: entry.updated[0],
    pdfUrl,
    arxivUrl: `https://arxiv.org/abs/${arxivId}`,
  };
}

// arXiv API 검색
export async function searchArxiv(params: SearchParams): Promise<{ papers: Paper[]; total: number }> {
  const { query, category, maxResults = 20, start = 0, dateRange } = params;

  let searchQuery = query;

  // 카테고리 필터 추가
  if (category) {
    searchQuery = `cat:${category} AND (${query})`;
  }

  // 날짜 필터 추가
  if (dateRange) {
    const dateQuery = `submittedDate:[${dateRange.startDate} TO ${dateRange.endDate}]`;
    searchQuery = `${dateQuery} AND (${searchQuery})`;
  }

  const url = new URL(ARXIV_API_BASE);
  url.searchParams.set('search_query', `all:${searchQuery}`);
  url.searchParams.set('start', start.toString());
  url.searchParams.set('max_results', maxResults.toString());
  url.searchParams.set('sortBy', 'submittedDate');
  url.searchParams.set('sortOrder', 'descending');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`arXiv API 오류: ${response.status}`);
  }

  const xml = await response.text();
  const result: ArxivResponse = await parseStringPromise(xml);

  const entries = result.feed.entry || [];
  const papers = entries.map(parseEntry);

  const totalStr = result.feed['opensearch:totalResults']?.[0];
  const total = totalStr ? parseInt(typeof totalStr === 'object' ? totalStr._ : totalStr, 10) : papers.length;

  return { papers, total };
}

// 특정 논문 조회 (arXiv ID로)
export async function getPaperById(arxivId: string): Promise<Paper | null> {
  const url = new URL(ARXIV_API_BASE);
  url.searchParams.set('id_list', arxivId);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`arXiv API 오류: ${response.status}`);
  }

  const xml = await response.text();
  const result: ArxivResponse = await parseStringPromise(xml);

  const entries = result.feed.entry || [];

  if (entries.length === 0) {
    return null;
  }

  return parseEntry(entries[0]);
}

// 최신 논문 조회 (카테고리별)
export async function getLatestPapers(category: string, maxResults = 10): Promise<Paper[]> {
  const url = new URL(ARXIV_API_BASE);
  url.searchParams.set('search_query', `cat:${category}`);
  url.searchParams.set('start', '0');
  url.searchParams.set('max_results', maxResults.toString());
  url.searchParams.set('sortBy', 'submittedDate');
  url.searchParams.set('sortOrder', 'descending');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`arXiv API 오류: ${response.status}`);
  }

  const xml = await response.text();
  const result: ArxivResponse = await parseStringPromise(xml);

  const entries = result.feed.entry || [];
  return entries.map(parseEntry);
}
