export interface Paper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  categories: string[];
  publishedAt: string;
  updatedAt: string;
  pdfUrl: string;
  arxivUrl: string;
}

export interface Bookmark {
  id: string;
  arxiv_id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  categories: string[] | null;
  published_at: string | null;
  pdf_url: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  methodology: string;
  contributions: string[];
  limitations: string[];
}

export interface SearchParams {
  query: string;
  category?: string;
  maxResults?: number;
  start?: number;
  dateRange?: {
    startDate: string; // YYYYMMDD
    endDate: string;   // YYYYMMDD
  };
}

export const ARXIV_CATEGORIES = [
  { id: 'cs.AI', name: '인공지능' },
  { id: 'cs.LG', name: '기계학습' },
  { id: 'cs.CL', name: '자연어처리' },
  { id: 'cs.CV', name: '컴퓨터비전' },
  { id: 'cs.NE', name: '신경망' },
  { id: 'cs.RO', name: '로보틱스' },
  { id: 'stat.ML', name: '통계적 기계학습' },
  { id: 'math.OC', name: '최적화' },
] as const;

// 전체 arXiv 카테고리 한글 매핑
export const CATEGORY_NAMES: Record<string, string> = {
  // Computer Science
  'cs.AI': '인공지능',
  'cs.AR': '하드웨어 아키텍처',
  'cs.CC': '계산 복잡도',
  'cs.CE': '계산공학',
  'cs.CG': '계산기하학',
  'cs.CL': '자연어처리',
  'cs.CR': '암호학/보안',
  'cs.CV': '컴퓨터비전',
  'cs.CY': '사회와 컴퓨터',
  'cs.DB': '데이터베이스',
  'cs.DC': '분산컴퓨팅',
  'cs.DL': '디지털 라이브러리',
  'cs.DM': '이산수학',
  'cs.DS': '자료구조/알고리즘',
  'cs.ET': '신기술',
  'cs.FL': '형식언어',
  'cs.GL': '일반 문헌',
  'cs.GR': '그래픽스',
  'cs.GT': '게임이론',
  'cs.HC': 'HCI',
  'cs.IR': '정보검색',
  'cs.IT': '정보이론',
  'cs.LG': '기계학습',
  'cs.LO': '논리학',
  'cs.MA': '멀티에이전트',
  'cs.MM': '멀티미디어',
  'cs.MS': '수학 소프트웨어',
  'cs.NA': '수치해석',
  'cs.NE': '신경망/진화연산',
  'cs.NI': '네트워킹',
  'cs.OH': '기타',
  'cs.OS': '운영체제',
  'cs.PF': '성능',
  'cs.PL': '프로그래밍언어',
  'cs.RO': '로보틱스',
  'cs.SC': '기호연산',
  'cs.SD': '사운드',
  'cs.SE': '소프트웨어공학',
  'cs.SI': '소셜네트워크',
  'cs.SY': '시스템제어',
  // Statistics
  'stat.AP': '통계응용',
  'stat.CO': '통계계산',
  'stat.ME': '통계방법론',
  'stat.ML': '통계적 기계학습',
  'stat.OT': '통계기타',
  'stat.TH': '통계이론',
  // Mathematics
  'math.AC': '가환대수',
  'math.AG': '대수기하',
  'math.AP': '해석학',
  'math.AT': '대수적 위상',
  'math.CA': '고전해석',
  'math.CO': '조합론',
  'math.CT': '범주론',
  'math.CV': '복소해석',
  'math.DG': '미분기하',
  'math.DS': '동역학계',
  'math.FA': '함수해석',
  'math.GM': '일반수학',
  'math.GN': '일반위상',
  'math.GR': '군론',
  'math.GT': '기하적 위상',
  'math.HO': '수학사',
  'math.IT': '정보이론',
  'math.KT': 'K-이론',
  'math.LO': '논리',
  'math.MG': '미터기하',
  'math.MP': '수리물리',
  'math.NA': '수치해석',
  'math.NT': '정수론',
  'math.OA': '작용소대수',
  'math.OC': '최적화/제어',
  'math.PR': '확률론',
  'math.QA': '양자대수',
  'math.RA': '환론',
  'math.RT': '표현론',
  'math.SG': '심플렉틱기하',
  'math.SP': '스펙트럼이론',
  'math.ST': '통계이론',
  // Electrical Engineering
  'eess.AS': '오디오/음성처리',
  'eess.IV': '이미지/영상처리',
  'eess.SP': '신호처리',
  'eess.SY': '시스템/제어',
  // Physics
  'physics.comp-ph': '계산물리',
  'physics.data-an': '데이터분석',
  'quant-ph': '양자물리',
  'cond-mat': '응집물질',
  'hep-th': '고에너지이론',
  // Quantitative Biology
  'q-bio.BM': '생체분자',
  'q-bio.CB': '세포생물',
  'q-bio.GN': '유전체학',
  'q-bio.MN': '분자네트워크',
  'q-bio.NC': '뉴런/인지',
  'q-bio.OT': '기타생물',
  'q-bio.PE': '개체군/진화',
  'q-bio.QM': '정량적방법',
  'q-bio.SC': '세포하부',
  'q-bio.TO': '조직/기관',
  // Quantitative Finance
  'q-fin.CP': '계산금융',
  'q-fin.EC': '경제학',
  'q-fin.GN': '일반금융',
  'q-fin.MF': '수리금융',
  'q-fin.PM': '포트폴리오',
  'q-fin.PR': '가격결정',
  'q-fin.RM': '리스크관리',
  'q-fin.ST': '통계금융',
  'q-fin.TR': '트레이딩',
};

// 카테고리 한글명 가져오기
export function getCategoryName(categoryId: string): string {
  return CATEGORY_NAMES[categoryId] || categoryId;
}
