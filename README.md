# arXiv 논문 포털

arXiv 논문을 검색하고, AI로 분석하며, 북마크를 관리할 수 있는 개인용 웹 애플리케이션입니다.

## 주요 기능

- **논문 검색**: arXiv API를 통한 논문 검색 및 카테고리 필터링
- **논문 상세 보기**: 제목, 저자, 초록, 카테고리, PDF 링크 제공
- **초록 번역**: Gemini AI를 활용한 영문 초록 한국어 번역
- **AI 분석**: 논문 요약, 핵심 포인트 추출, 연구 의의 분석
- **인포그래픽 생성**: AI 기반 논문 시각화 이미지 생성
- **북마크 관리**: 브라우저 localStorage 기반 개인화 북마크

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **AI**: Google Gemini API
  - `gemini-3-flash-preview`: 텍스트 분석 및 번역
  - `gemini-3-pro-image-preview`: 인포그래픽 생성
- **저장소**: 브라우저 localStorage

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- Python 3.8 이상 (인포그래픽 생성용)
- Google Gemini API 키

### 설치

```bash
# 저장소 클론
git clone git@github.com:revfactory/arVix-portal.git
cd arVix-portal

# 의존성 설치
npm install

# Python 패키지 설치 (인포그래픽 생성용)
pip install google-genai pillow
```

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### 실행

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 프로젝트 구조

```
arVix-portal/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   ├── page.tsx                # 메인 페이지 (검색)
│   │   ├── paper/[id]/page.tsx     # 논문 상세 페이지
│   │   ├── bookmarks/page.tsx      # 북마크 목록 페이지
│   │   └── api/
│   │       ├── arxiv/route.ts      # arXiv API 프록시
│   │       ├── analyze/route.ts    # AI 분석 API
│   │       ├── translate/route.ts  # 번역 API
│   │       └── infographic/route.ts # 인포그래픽 생성 API
│   ├── components/
│   │   ├── Navigation.tsx          # 네비게이션 바
│   │   ├── SearchBar.tsx           # 검색 입력
│   │   ├── PaperCard.tsx           # 논문 카드
│   │   ├── PaperList.tsx           # 논문 목록 (그리드)
│   │   ├── CategoryFilter.tsx      # 카테고리 필터
│   │   ├── BookmarkButton.tsx      # 북마크 버튼
│   │   ├── AIAnalysis.tsx          # AI 분석 결과
│   │   ├── InfographicGenerator.tsx # 인포그래픽 생성기
│   │   └── MarkdownView.tsx        # 마크다운 렌더러
│   ├── lib/
│   │   ├── arxiv.ts                # arXiv API 유틸리티
│   │   ├── ai.ts                   # AI 분석 유틸리티
│   │   └── bookmarks.ts            # 북마크 관리 (localStorage)
│   └── types/
│       └── paper.ts                # 타입 정의
├── scripts/
│   └── generate_infographic.py     # 인포그래픽 생성 스크립트
└── public/
    └── infographics/               # 생성된 인포그래픽 저장
```

## 주요 카테고리

| 카테고리 | 설명 |
|---------|------|
| cs.AI | 인공지능 |
| cs.LG | 머신러닝 |
| cs.CL | 자연어처리 |
| cs.CV | 컴퓨터비전 |
| cs.NE | 신경망 및 진화연산 |
| stat.ML | 통계적 머신러닝 |

## 라이선스

MIT License
