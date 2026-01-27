import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    const { title, abstract, categories } = await request.json();

    if (!title || !abstract) {
      return NextResponse.json(
        { error: '논문 제목과 초록이 필요합니다' },
        { status: 400 }
      );
    }

    const prompt = `You are an academic search query optimizer. Based on the following research paper information, generate an optimal search query to find similar papers on arXiv.

Title: ${title}

Abstract: ${abstract.slice(0, 1000)}

Categories: ${categories?.join(', ') || 'Not specified'}

Instructions:
1. Extract the core research topic and methodology
2. Identify key technical terms and concepts
3. Generate a concise English search query (3-7 keywords/phrases)
4. Focus on finding papers with similar research direction or methodology
5. Do NOT include author names or specific model names unless they are fundamental concepts

Respond with ONLY the search query, nothing else. Example format:
transformer attention mechanism natural language processing`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const searchQuery = response.text()?.trim() || '';

    if (!searchQuery) {
      return NextResponse.json(
        { error: '검색어 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      searchQuery,
      originalTitle: title,
    });
  } catch (error) {
    console.error('유사 논문 검색어 생성 오류:', error);
    return NextResponse.json(
      { error: '검색어 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
