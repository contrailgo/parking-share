# 사내 주차장 공유 시스템

빈 내부 주차면을 대기자/외부 배정자에게 공유·배정하는 내부 웹 애플리케이션.

## 확정된 설계 결정

- **인증 없음**: 이름 입력 → 관리자 명단과 대조하여 내부/외부/대기자 판별
- **등록/신청 방식**: 이름 기반, 별도 로그인 없음 (허위 입력은 고려하지 않음)
- **마감 시각**: 빈 자리 등록 및 신청 모두 **전날 16:00 마감**
- **우선순위**: 1순위 대기자(그룹 내 선착순) → 2순위 외부 배정자(선착순)
- **UI**: 리스트가 아닌 주차장 평면도 클릭 방식, 상단 날짜 선택기 (기본값 오늘)
- **구현 형태**: 웹 (Next.js)
- **배포**: Vercel
- **DB**: Vercel Postgres (Neon) + Prisma ORM

## 미확정 사항

- 화면 상태별 색상/상태 체계 (빈자리/신청됨/마감 등)
- 외부 주차장 별도 맵 뷰 필요 여부
- 명단 파일 / 도면 데이터 포맷 (추후 전달 예정)

## 프로젝트 구조

```
app/
  page.tsx                     # 메인 페이지 (날짜 선택 + 평면도)
  api/
    employees/lookup/route.ts  # 이름 -> 임직원 타입 조회
    vacancies/route.ts         # 빈 자리 조회(GET) / 등록(POST)
    requests/route.ts          # 빈 자리 신청(POST)
components/
  FloorPlan.tsx                # 평면도 컴포넌트 (도면 데이터 대기 중)
lib/
  prisma.ts                    # Prisma client 싱글톤
prisma/
  schema.prisma                # DB 스키마 (Employee, ParkingSpot, Vacancy, Request)
```

## 로컬 개발 시작하기

1. 의존성 설치
   ```bash
   npm install
   ```
2. `.env` 파일에 `DATABASE_URL` 설정 (Vercel Postgres 생성 후 발급되는 값)
3. 스키마를 DB에 반영
   ```bash
   npm run db:push
   ```
4. 개발 서버 실행
   ```bash
   npm run dev
   ```

## 아직 구현 안 된 부분 (TODO)

API 라우트들은 스키마와 폴더 구조만 잡아둔 상태이고, 실제 로직(명단 조회, 마감 체크, 배정 알고리즘)은 아직 미구현. 명단 파일/도면 데이터를 받은 후 이어서 구현.
