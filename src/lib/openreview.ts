import { Paper, SearchParams } from '@/types/paper';

const OPENREVIEW_API_BASE = 'https://api2.openreview.net';
const REQUEST_TIMEOUT = 5000;

interface OpenReviewNote {
  id: string;
  content: {
    title?: { value: string };
    abstract?: { value: string };
    authors?: { value: string[] };
    venue?: { value: string };
    venueid?: { value: string };
    _bibtex?: { value: string };
  };
  cdate?: number;
  mdate?: number;
  invitation?: string;
  forum?: string;
}

interface OpenReviewResponse {
  notes: OpenReviewNote[];
  count?: number;
}

function extractPdfUrl(note: OpenReviewNote): string {
  const forumId = note.forum || note.id;
  return `https://openreview.net/pdf?id=${forumId}`;
}

function extractCategories(note: OpenReviewNote): string[] {
  const categories: string[] = [];

  if (note.content?.venue?.value) {
    categories.push(note.content.venue.value);
  }

  if (note.content?.venueid?.value) {
    categories.push(note.content.venueid.value);
  }

  if (note.invitation) {
    const match = note.invitation.match(/([^/]+)$/);
    if (match) {
      categories.push(match[1]);
    }
  }

  return categories.length > 0 ? categories : ['OpenReview'];
}

function parseNote(note: OpenReviewNote): Paper | null {
  try {
    const title = note.content?.title?.value;
    const abstract = note.content?.abstract?.value;

    if (!title) {
      return null;
    }

    const sourceId = note.forum || note.id;
    const authors = note.content?.authors?.value || [];
    const categories = extractCategories(note);
    const publishedAt = note.cdate ? new Date(note.cdate).toISOString() : new Date().toISOString();
    const updatedAt = note.mdate ? new Date(note.mdate).toISOString() : publishedAt;
    const pdfUrl = extractPdfUrl(note);
    const sourceUrl = `https://openreview.net/forum?id=${sourceId}`;

    return {
      source: 'openreview',
      sourceId,
      sourceUrl,
      title: title.replace(/\s+/g, ' ').trim(),
      authors: Array.isArray(authors) ? authors : [],
      abstract: (abstract || '').replace(/\s+/g, ' ').trim(),
      categories,
      publishedAt,
      updatedAt,
      pdfUrl,
    };
  } catch (error) {
    return null;
  }
}

async function fetchWithTimeout(url: string, timeout: number = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function searchOpenReview(params: SearchParams): Promise<{ papers: Paper[]; total: number }> {
  const { query, maxResults = 20, start = 0 } = params;

  try {
    const venues = [
      'ICLR.cc/2024/Conference',
      'NeurIPS.cc/2023/Conference',
      'ICML.cc/2023/Conference',
    ];

    const searchLower = query.toLowerCase();

    const venuePromises = venues.map(async (venue) => {
      try {
        const url = new URL(`${OPENREVIEW_API_BASE}/notes`);
        url.searchParams.set('content.venueid', venue);
        url.searchParams.set('limit', '50');
        url.searchParams.set('sort', 'cdate:desc');

        const response = await fetchWithTimeout(url.toString(), 3000);

        if (!response.ok) return [];

        const data: OpenReviewResponse = await response.json();
        const notes = data.notes || [];

        return notes
          .map(parseNote)
          .filter((paper): paper is Paper => {
            if (!paper) return false;
            const titleMatch = paper.title.toLowerCase().includes(searchLower);
            const abstractMatch = paper.abstract.toLowerCase().includes(searchLower);
            return titleMatch || abstractMatch;
          });
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(venuePromises);
    const allPapers: Paper[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allPapers.push(...result.value);
      }
    });

    allPapers.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const paginatedPapers = allPapers.slice(start, start + maxResults);

    return {
      papers: paginatedPapers,
      total: allPapers.length,
    };
  } catch (error) {
    return { papers: [], total: 0 };
  }
}

export async function getPaperById(forumId: string): Promise<Paper | null> {
  try {
    const url = new URL(`${OPENREVIEW_API_BASE}/notes`);
    url.searchParams.set('id', forumId);

    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      throw new Error(`OpenReview API 오류: ${response.status}`);
    }

    const data: OpenReviewResponse = await response.json();
    const notes = data.notes || [];

    if (notes.length === 0) {
      return null;
    }

    return parseNote(notes[0]);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenReview API 타임아웃');
    }
    throw error;
  }
}

export async function getLatestPapers(venue: string = 'ICLR.cc', maxResults: number = 10): Promise<Paper[]> {
  try {
    const url = new URL(`${OPENREVIEW_API_BASE}/notes`);

    url.searchParams.set('content.venueid', venue);
    url.searchParams.set('limit', maxResults.toString());
    url.searchParams.set('sort', 'cdate:desc');

    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      throw new Error(`OpenReview API 오류: ${response.status}`);
    }

    const data: OpenReviewResponse = await response.json();
    const notes = data.notes || [];

    return notes
      .map(parseNote)
      .filter((paper): paper is Paper => paper !== null);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    throw error;
  }
}
