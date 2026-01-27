import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: '번역할 텍스트가 필요합니다' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const prompt = `다음 영어 논문 초록을 한국어로 번역해주세요.

번역 규칙:
- 원문의 문장 구조와 단락 형식을 그대로 유지
- 추가적인 꾸밈이나 마크다운 서식 없이 순수 텍스트로 번역
- 학술 용어는 적절히 번역하되, 필요한 경우 영어 원문을 괄호 안에 병기
- 자연스러운 한국어로 번역

원문:
${text}

한국어 번역:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    return NextResponse.json({ translation: translatedText });
  } catch (error) {
    console.error('번역 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `번역 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
