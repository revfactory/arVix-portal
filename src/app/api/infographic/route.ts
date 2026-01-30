import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadInfographic } from '@/lib/storage';
import { getPaperCache, saveInfographicUrl } from '@/lib/db';

const INFOGRAPHIC_STYLE = `
디자인 스타일:
- 배경: 도화지 텍스처 (크림색/오프화이트)
- 텍스트: 검정 볼펜 잉크 스타일 (#000000, 90% 불투명도)
- 강조: 노란색 형광펜 (#FEE500)
- 이미지 스타일: 캐주얼 손그림, 막대 인간, 별, 화살표, 간단한 아이콘
- 구성: 여백 주석 스타일, 자유 형식, 브레인스토밍 노트 느낌
- 타이포그래피: 손글씨 폰트, 깔끔하면서도 끄적인 듯한 스타일
- 톤: 창의적, 러프, 개인적, 브레인스토밍, 진정성 있는 느낌
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, keyPoints, methodology, arxivId, source, forceRegenerate } = body;

    if (!title || !summary || !keyPoints) {
      return NextResponse.json(
        { error: '제목, 요약, 핵심 포인트가 필요합니다' },
        { status: 400 }
      );
    }

    // 캐시된 인포그래픽이 있는지 확인 (forceRegenerate가 true면 스킵)
    if (arxivId && !forceRegenerate) {
      const cache = await getPaperCache(arxivId);
      if (cache?.infographic_url) {
        return NextResponse.json({
          success: true,
          imageUrl: cache.infographic_url,
          cached: true,
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    // 핵심 포인트를 문자열로 변환
    const keyPointsText = keyPoints.map((point: string) => `• ${point}`).join('\n');

    const prompt = `
다음 논문 내용을 손그림 스타일의 인포그래픽으로 만들어주세요.

${INFOGRAPHIC_STYLE}

논문 정보:
제목: ${title}

요약: ${summary}

핵심 포인트:
${keyPointsText}

방법론: ${methodology || '정보 없음'}

인포그래픽 구성:
1. 상단에 제목을 손글씨 스타일로 크게 배치
2. 중앙에 핵심 내용을 막대 인간, 화살표, 말풍선으로 시각화
3. 핵심 포인트들을 노란 형광펜으로 강조된 박스나 별표로 표시
4. 방법론은 간단한 플로우차트나 다이어그램으로 표현
5. 여백에 작은 주석이나 메모 스타일의 추가 설명

전체적으로 노트에 끄적인 듯한 브레인스토밍 스타일로,
학술적이면서도 친근하고 이해하기 쉬운 인포그래픽을 만들어주세요.
한국어로 작성해주세요.
`;

    // Gemini API 직접 호출 (REST API) - gemini-3-pro-image-preview 모델 사용
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: '16:9',
              imageSize: '4K',
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API 오류:', errorText);
      return NextResponse.json(
        { error: `Gemini API 오류: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 응답에서 이미지 데이터 추출
    let imageData: string | null = null;
    let textResponse: string | null = null;

    if (data.candidates && data.candidates[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.text) {
          textResponse = part.text;
        }
        if (part.inlineData?.data) {
          imageData = part.inlineData.data;
        }
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: '이미지 생성에 실패했습니다', details: textResponse },
        { status: 500 }
      );
    }

    // Base64 이미지를 Buffer로 변환
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Supabase Storage에 업로드
    let imageUrl: string | null = null;
    const filename = `infographic-${uuidv4()}.png`;

    if (arxivId) {
      imageUrl = await uploadInfographic(arxivId, imageBuffer);

      if (imageUrl) {
        // DB에 URL 저장
        if (source && source !== 'arxiv') {
          await saveInfographicUrl(source, arxivId, imageUrl);
        } else {
          await saveInfographicUrl(arxivId, imageUrl);
        }
      }
    }

    // Storage 업로드 실패 시 Base64 데이터 URL 반환
    if (!imageUrl) {
      imageUrl = `data:image/png;base64,${imageData}`;
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      text: textResponse,
      cached: false,
    });
  } catch (error) {
    console.error('인포그래픽 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `인포그래픽 생성 중 오류: ${errorMessage}` },
      { status: 500 }
    );
  }
}
