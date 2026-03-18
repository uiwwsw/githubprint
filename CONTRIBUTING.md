# Contributing to GitFolio

[English](#english) | [한국어](#한국어)

## English

### Scope

GitFolio is intentionally small. Contributions should respect the product contract:

- keep two primary user-facing pages
- preserve one shared analysis model across all templates
- keep result pages print-friendly
- keep secrets server-only
- keep fallback rendering reliable when AI fails

### Before You Change Anything

Read these files first:

- [`/Users/uiwwsw/gitfolio/README.md`](/Users/uiwwsw/gitfolio/README.md)
- [`/Users/uiwwsw/gitfolio/lib/schemas.ts`](/Users/uiwwsw/gitfolio/lib/schemas.ts)
- [`/Users/uiwwsw/gitfolio/lib/github.ts`](/Users/uiwwsw/gitfolio/lib/github.ts)
- [`/Users/uiwwsw/gitfolio/lib/analyze.ts`](/Users/uiwwsw/gitfolio/lib/analyze.ts)

### Working Rules

- Do not add extra public pages casually
- Do not add fake data to production paths
- Do not weaken Zod validation to make broken AI output pass silently
- Do not move GitHub or OpenAI secrets into client code
- Keep Korean and English flows aligned when changing UI copy or navigation
- Prefer server-side fetching and analysis
- Prefer adjusting `data/*.json` rules before hardcoding new interpretation logic in TypeScript

### Verification

Run this before opening a PR:

```bash
npm run check
```

### Documentation

If you change product behavior, update at least one of these:

- [`/Users/uiwwsw/gitfolio/README.md`](/Users/uiwwsw/gitfolio/README.md)
- [`/Users/uiwwsw/gitfolio/.env.example`](/Users/uiwwsw/gitfolio/.env.example)
- [`/Users/uiwwsw/gitfolio/CONTRIBUTING.md`](/Users/uiwwsw/gitfolio/CONTRIBUTING.md)
- [`/Users/uiwwsw/gitfolio/data/`](/Users/uiwwsw/gitfolio/data)

## 한국어

### 범위

GitFolio는 의도적으로 작은 제품입니다. 기여 시 아래 계약을 지켜야 합니다.

- 사용자에게 보이는 주요 흐름은 두 페이지 유지
- 템플릿은 달라도 분석 데이터 모델은 하나 유지
- 결과 페이지는 인쇄 친화적인 문서 형태 유지
- 비밀키는 서버 전용 유지
- AI 실패 시 fallback 렌더링 보장

### 작업 전 확인 파일

- [`/Users/uiwwsw/gitfolio/README.md`](/Users/uiwwsw/gitfolio/README.md)
- [`/Users/uiwwsw/gitfolio/lib/schemas.ts`](/Users/uiwwsw/gitfolio/lib/schemas.ts)
- [`/Users/uiwwsw/gitfolio/lib/github.ts`](/Users/uiwwsw/gitfolio/lib/github.ts)
- [`/Users/uiwwsw/gitfolio/lib/analyze.ts`](/Users/uiwwsw/gitfolio/lib/analyze.ts)

### 작업 원칙

- 퍼블릭 페이지를 함부로 늘리지 않기
- 프로덕션 경로에 fake data 넣지 않기
- 깨진 AI 응답을 억지로 통과시키기 위해 스키마 검증을 약화하지 않기
- GitHub/OpenAI 비밀키를 클라이언트 코드로 옮기지 않기
- UI 문구나 라우팅을 바꾸면 한국어/영어 흐름을 같이 맞추기
- 가능하면 서버에서 fetch와 analyze를 유지하기
- 새로운 판단 기준이 필요하면 TypeScript 하드코딩보다 `data/*.json` 수정부터 우선하기

### 검증

PR 전 아래 명령 실행:

```bash
npm run check
```

### 문서 업데이트

제품 동작이 바뀌면 최소 하나 이상 같이 갱신합니다.

- [`/Users/uiwwsw/gitfolio/README.md`](/Users/uiwwsw/gitfolio/README.md)
- [`/Users/uiwwsw/gitfolio/.env.example`](/Users/uiwwsw/gitfolio/.env.example)
- [`/Users/uiwwsw/gitfolio/CONTRIBUTING.md`](/Users/uiwwsw/gitfolio/CONTRIBUTING.md)
- [`/Users/uiwwsw/gitfolio/data/`](/Users/uiwwsw/gitfolio/data)
