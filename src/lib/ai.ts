import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysis } from '@/types/paper';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function analyzePaper(title: string, abstract: string): Promise<AIAnalysis> {
  if (!apiKey) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.');
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `당신은 학술 논문 분석 전문가입니다. 다음 논문의 제목과 초록을 분석하여 JSON 형식으로 응답해주세요.

제목: ${title}

초록: ${abstract}

다음 형식의 JSON으로 응답해주세요 (마크다운 코드 블록 없이 순수 JSON만):
{
  "summary": "논문의 핵심 내용을 2-3문장으로 요약 (한국어)",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "methodology": "사용된 방법론 간략히 설명 (한국어)",
  "contributions": ["주요 기여 1", "주요 기여 2"],
  "limitations": ["한계점 또는 향후 연구 방향 1", "한계점 또는 향후 연구 방향 2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱 시도
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis: AIAnalysis = JSON.parse(cleanedText);

    return analysis;
  } catch (error) {
    console.error('AI 분석 오류 상세:', error);
    throw error;
  }
}

export async function generateQuickSummary(abstract: string): Promise<string> {
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `다음 논문 초록을 한국어로 2-3문장으로 간결하게 요약해주세요:

${abstract}

요약:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('요약 생성 오류:', error);
    throw error;
  }
}
