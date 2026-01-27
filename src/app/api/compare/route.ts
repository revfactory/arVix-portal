import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

interface PaperInput {
  title: string;
  abstract: string;
  categories: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { papers } = body as { papers: PaperInput[] };

    if (!papers || papers.length < 2) {
      return NextResponse.json(
        { error: '최소 2개의 논문이 필요합니다' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const papersText = papers.map((p, i) => `
논문 ${i + 1}: ${p.title}
카테고리: ${p.categories.join(', ')}
초록: ${p.abstract}
`).join('\n---\n');

    const prompt = `당신은 학술 논문 비교 분석 전문가입니다. 다음 ${papers.length}개의 논문을 비교 분석해주세요.

${papersText}

다음 JSON 형식으로만 응답해주세요 (마크다운 없이):
{
  "commonThemes": ["공통 주제 1", "공통 주제 2", "공통 주제 3"],
  "differences": ["차이점 1", "차이점 2", "차이점 3"],
  "connections": ["연결 가능성 1", "연결 가능성 2"],
  "researchGaps": ["향후 연구 방향 1", "향후 연구 방향 2"],
  "recommendation": "이 논문들을 함께 연구할 때의 종합적인 의견 (2-3문장)"
}

분석 기준:
1. commonThemes: 논문들이 공유하는 핵심 주제, 방법론, 또는 연구 목표 (3개)
2. differences: 접근 방식, 범위, 또는 결론에서의 주요 차이점 (3개)
3. connections: 이 연구들을 연결하거나 통합할 수 있는 잠재적 방법 (2개)
4. researchGaps: 이 논문들이 다루지 않은 연구 갭 또는 향후 연구 방향 (2개)
5. recommendation: 연구자에게 이 논문들을 어떻게 활용하면 좋을지 조언

모든 응답은 한국어로 작성해주세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSON 파싱
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanedText);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('논문 비교 분석 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `분석 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
