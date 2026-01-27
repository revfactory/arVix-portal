#!/usr/bin/env python3
"""
논문 인포그래픽 생성 스크립트
Gemini 3 Pro Image Preview 모델 사용
"""

import sys
import os
import json
import argparse
from google import genai
from google.genai import types

# API 키 설정
api_key = os.environ.get('GEMINI_API_KEY')
if not api_key:
    print(json.dumps({"error": "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다."}))
    sys.exit(1)

client = genai.Client(api_key=api_key)

# 인포그래픽 스타일 프롬프트
INFOGRAPHIC_STYLE = """
디자인 스타일:
- 배경: 도화지 텍스처 (크림색/오프화이트)
- 텍스트: 검정 볼펜 잉크 스타일 (#000000, 90% 불투명도)
- 강조: 노란색 형광펜 (#FEE500)
- 이미지 스타일: 캐주얼 손그림, 막대 인간, 별, 화살표, 간단한 아이콘
- 구성: 여백 주석 스타일, 자유 형식, 브레인스토밍 노트 느낌
- 타이포그래피: 손글씨 폰트, 깔끔하면서도 끄적인 듯한 스타일
- 톤: 창의적, 러프, 개인적, 브레인스토밍, 진정성 있는 느낌
"""

def generate_infographic(title: str, summary: str, key_points: list, methodology: str, output_path: str):
    """논문 내용을 인포그래픽으로 생성"""

    # 핵심 포인트를 문자열로 변환
    key_points_text = "\n".join([f"• {point}" for point in key_points])

    prompt = f"""
다음 논문 내용을 손그림 스타일의 인포그래픽으로 만들어주세요.

{INFOGRAPHIC_STYLE}

논문 정보:
제목: {title}

요약: {summary}

핵심 포인트:
{key_points_text}

방법론: {methodology}

인포그래픽 구성:
1. 상단에 제목을 손글씨 스타일로 크게 배치
2. 중앙에 핵심 내용을 막대 인간, 화살표, 말풍선으로 시각화
3. 핵심 포인트들을 노란 형광펜으로 강조된 박스나 별표로 표시
4. 방법론은 간단한 플로우차트나 다이어그램으로 표현
5. 여백에 작은 주석이나 메모 스타일의 추가 설명

전체적으로 노트에 끄적인 듯한 브레인스토밍 스타일로,
학술적이면서도 친근하고 이해하기 쉬운 인포그래픽을 만들어주세요.
한국어로 작성해주세요.
"""

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio="3:4",  # 세로형 인포그래픽
                    image_size="2K"
                ),
            )
        )

        result = {"success": False, "image_path": None, "text": None}

        for part in response.parts:
            if part.text:
                result["text"] = part.text
            elif image := part.as_image():
                image.save(output_path)
                result["success"] = True
                result["image_path"] = output_path

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='논문 인포그래픽 생성')
    parser.add_argument('--title', required=True, help='논문 제목')
    parser.add_argument('--summary', required=True, help='논문 요약')
    parser.add_argument('--key-points', required=True, help='핵심 포인트 (JSON 배열)')
    parser.add_argument('--methodology', required=True, help='방법론')
    parser.add_argument('--output', required=True, help='출력 파일 경로')

    args = parser.parse_args()

    # JSON 배열 파싱
    try:
        key_points = json.loads(args.key_points)
    except json.JSONDecodeError:
        key_points = [args.key_points]

    generate_infographic(
        title=args.title,
        summary=args.summary,
        key_points=key_points,
        methodology=args.methodology,
        output_path=args.output
    )


if __name__ == "__main__":
    main()
