# arXiv 논문 포털

arXiv 논문을 검색하고, AI로 분석하며, 북마크를 관리할 수 있는 개인용 웹 애플리케이션입니다.

## 주요 기능

- **논문 검색**: arXiv API를 통한 논문 검색 및 카테고리 필터링
- **논문 상세 보기**: 제목, 저자, 초록, 카테고리, PDF 링크 제공
- **초록 번역**: Gemini AI를 활용한 영문 초록 한국어 번역
- **AI 분석**: 논문 요약, 핵심 포인트 추출, 연구 의의 분석 (DB 캐싱)
- **인포그래픽 생성**: AI 기반 논문 시각화 이미지 생성 (Supabase Storage)
- **북마크 관리**: 브라우저 localStorage 기반 개인화 북마크
- **결과 캐싱**: 번역, 분석, 인포그래픽 결과를 DB에 저장하여 재사용

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **AI**: Google Gemini API
  - `gemini-3-flash-preview`: 텍스트 분석 및 번역
  - `gemini-3-pro-image-preview`: 인포그래픽 생성
- **데이터베이스**: PostgreSQL (번역/분석 캐싱)
- **스토리지**: Supabase Storage (인포그래픽 이미지)
- **북마크 저장소**: 브라우저 localStorage

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
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | O | Google Gemini API 키 |
| `DATABASE_URL` | O | PostgreSQL 연결 문자열 (번역/분석 캐싱용) |
| `NEXT_PUBLIC_SUPABASE_URL` | O | Supabase 프로젝트 URL (스토리지용) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | O | Supabase Publishable 키 |

### Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase-schema.sql` 실행
3. Storage에서 `infographics` 버킷 생성 (Public 체크)

> **참고**: 북마크는 브라우저 localStorage에 저장됩니다. 번역, AI 분석, 인포그래픽은 PostgreSQL에 캐싱되어 재사용됩니다.

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
│   │       ├── analyze/route.ts    # AI 분석 API (캐싱)
│   │       ├── translate/route.ts  # 번역 API (캐싱)
│   │       ├── infographic/route.ts # 인포그래픽 생성 API
│   │       └── paper-cache/route.ts # 캐시 조회 API
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
│   │   ├── bookmarks.ts            # 북마크 관리 (localStorage)
│   │   ├── db.ts                   # PostgreSQL 연결 및 캐시 함수
│   │   └── storage.ts              # Supabase Storage 유틸리티
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
