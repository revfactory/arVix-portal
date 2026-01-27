import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface EnhancedSearchQuery {
  originalQuery: string;
  englishKeywords: string[];
  searchQuery: string;
  suggestedCategory?: string;
}

/**
 * 자연어 검색어를 arXiv 검색에 최적화된 쿼리로 변환
 * - 한글을 영어로 번역
 * - 핵심 키워드 추출
 * - 관련 카테고리 추천
 */
export async function enhanceSearchQuery(query: string): Promise<EnhancedSearchQuery> {
  // 영어만 포함된 경우 간단히 처리
  const isEnglishOnly = /^[a-zA-Z0-9\s\-_.,:;'"!?()]+$/.test(query);

  if (isEnglishOnly && query.split(' ').length <= 5) {
    return {
      originalQuery: query,
      englishKeywords: query.toLowerCase().split(' ').filter(w => w.length > 2),
      searchQuery: query,
    };
  }

  if (!apiKey) {
    console.warn('GEMINI_API_KEY가 없어 기본 검색을 수행합니다.');
    return {
      originalQuery: query,
      englishKeywords: [query],
      searchQuery: query,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `당신은 arXiv 학술 논문 검색 전문가입니다. 사용자의 검색어를 분석하여 arXiv API 검색에 최적화된 영어 키워드를 추출해주세요.

사용자 검색어: "${query}"

다음 JSON 형식으로만 응답해주세요 (마크다운 없이):
{
  "englishKeywords": ["keyword1", "keyword2", "keyword3"],
  "searchQuery": "optimized search query for arXiv",
  "suggestedCategory": "cs.AI"
}

규칙:
1. englishKeywords: 핵심 영어 키워드 3-5개 (학술 용어 사용)
2. searchQuery: arXiv 검색에 적합한 영어 쿼리 (OR로 연결된 키워드)
3. suggestedCategory: 가장 관련성 높은 arXiv 카테고리 (cs.AI, cs.LG, cs.CL, cs.CV, cs.NE, stat.ML 중 하나, 없으면 null)

예시:
- "딥러닝 이미지 분류" → {"englishKeywords": ["deep learning", "image classification", "CNN"], "searchQuery": "deep learning OR image classification OR convolutional neural network", "suggestedCategory": "cs.CV"}
- "자연어처리 트랜스포머" → {"englishKeywords": ["natural language processing", "transformer", "NLP", "attention"], "searchQuery": "transformer OR NLP OR natural language processing OR attention mechanism", "suggestedCategory": "cs.CL"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    return {
      originalQuery: query,
      englishKeywords: parsed.englishKeywords || [query],
      searchQuery: parsed.searchQuery || query,
      suggestedCategory: parsed.suggestedCategory || undefined,
    };
  } catch (error) {
    console.error('검색어 변환 오류:', error);
    return {
      originalQuery: query,
      englishKeywords: [query],
      searchQuery: query,
    };
  }
}
