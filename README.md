# easyfair.co.kr — AI 전시 부스 견적 플랫폼

> 렌더링 업로드 한 번으로 전문가 견적서 3분 완성  
> Next.js 14 + FastAPI + Claude Vision API + Supabase

---

## 📁 프로젝트 구조

```
easyfair/
├── frontend/                  # Next.js 14 (App Router)
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/       # Claude Vision 프록시
│   │   │   ├── quotes/        # 견적 CRUD
│   │   │   └── exchange-rate/ # 환율 API
│   │   ├── dashboard/         # 메인 대시보드
│   │   ├── quote/
│   │   │   ├── new/           # 견적 생성 Wizard
│   │   │   └── [id]/          # 견적 편집·미리보기
│   │   ├── venues/            # 전시장 검색
│   │   └── plans/             # 플랜 & 결제
│   ├── components/
│   │   ├── ui/                # Button, Input, Card 등 공통 컴포넌트
│   │   ├── quote/             # QuoteEditor, QuoteTable, SummaryPanel
│   │   ├── venue/             # VenueCard, VenueSearch
│   │   └── layout/            # Sidebar, Topbar, Shell
│   ├── hooks/
│   │   └── useQuoteStore.ts   # Zustand 전역 상태
│   ├── lib/
│   │   ├── supabase/          # client.ts / server.ts
│   │   ├── constants.ts       # 단가 DB, 환율, 플랜 설정
│   │   ├── utils.ts           # 공통 유틸
│   │   └── exportExcel.ts     # xlsx 클라이언트 출력
│   └── types/index.ts         # 전체 TypeScript 타입
│
├── backend/                   # FastAPI (Python 3.12)
│   ├── app/
│   │   ├── main.py            # FastAPI 앱 진입점
│   │   ├── api/v1/
│   │   │   └── endpoints/
│   │   │       ├── analyze.py # AI Vision 분석
│   │   │       ├── quotes.py  # 견적 CRUD
│   │   │       ├── export.py  # Excel/PDF 다운로드
│   │   │       └── venues.py  # 전시장 목록
│   │   ├── core/
│   │   │   ├── config.py      # 환경변수 설정
│   │   │   ├── security.py    # JWT 인증
│   │   │   └── database.py    # Supabase 클라이언트
│   │   ├── schemas/           # Pydantic 모델
│   │   └── services/
│   │       ├── ai_service.py  # Claude Vision 연동
│   │       ├── price_service.py # 단가 DB & venue factor
│   │       └── excel_service.py # openpyxl 견적서 생성
│   ├── supabase_schema.sql    # DB 마이그레이션
│   ├── requirements.txt
│   └── Dockerfile
│
├── .github/workflows/
│   └── ci-cd.yml              # GitHub Actions CI/CD
├── docker-compose.yml
└── README.md
```

---

## 🚀 로컬 개발 시작

### 1. 저장소 클론

```bash
git clone https://github.com/YOUR_ID/easyfair-app.git
cd easyfair-app
```

### 2. 환경변수 설정

```bash
# 프론트엔드
cp frontend/.env.local.example frontend/.env.local
# → 각 값을 실제 API 키로 채우기

# 백엔드
cp backend/.env.example backend/.env
# → 각 값을 실제 API 키로 채우기
```

### 3. Supabase DB 세팅

1. [supabase.com](https://supabase.com) → New Project
2. SQL Editor → `backend/supabase_schema.sql` 전체 복사·실행
3. Authentication → Providers → Google 활성화

### 4. 로컬 실행

**Docker Compose (권장)**
```bash
docker-compose up --build
```

**수동 실행**
```bash
# 백엔드 (터미널 1)
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 프론트엔드 (터미널 2)
cd frontend
npm install
npm run dev
```

- 프론트엔드: http://localhost:3000
- 백엔드 API 문서: http://localhost:8000/docs

---

## ☁️ 배포

### GitHub Secrets 등록

GitHub 리포 → Settings → Secrets and variables → Actions:

| Secret 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret |
| `EXCHANGE_RATE_API_KEY` | exchangerate-api.com 키 |
| `RAILWAY_TOKEN` | Railway 배포 토큰 |
| `VERCEL_TOKEN` | Vercel 배포 토큰 |
| `VERCEL_ORG_ID` | Vercel 조직 ID |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID |

### 배포 흐름

```
git push origin main
    │
    ├── GitHub Actions 자동 실행
    │       ├── 백엔드 pytest 통과 → Railway 자동 배포
    │       └── 프론트엔드 타입체크 통과 → Vercel 자동 배포
    │
    └── 완료: https://easyfair.co.kr 반영
```

---

## 🔑 핵심 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/v1/analyze` | 이미지 AI 분석 → 견적 항목 추출 |
| `GET`  | `/api/v1/quotes` | 내 견적 목록 |
| `POST` | `/api/v1/quotes` | 새 견적 생성 |
| `GET`  | `/api/v1/quotes/{id}` | 견적 상세 |
| `POST` | `/api/v1/quotes/{id}/items` | 견적 아이템 저장 |
| `GET`  | `/api/v1/export/{id}/xlsx` | Excel 다운로드 |
| `GET`  | `/api/v1/venues` | 전시장 목록 |
| `GET`  | `/api/exchange-rate` | 실시간 환율 |

---

## 💰 인프라 비용 (MVP 기준)

| 서비스 | 플랜 | 월 비용 |
|--------|------|---------|
| Vercel | Hobby (무료) | $0 |
| Supabase | Free (500MB) | $0 |
| Railway | Starter | $5~20 |
| Claude API | 사용량 과금 (500건/월) | $15~25 |
| ExchangeRate API | Free | $0 |
| **합계** | | **$20~45/월** |
