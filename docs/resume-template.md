# Resume Template Guide

`resume` 템플릿은 GitHubPrint가 추론해서 만드는 문서가 아니라, 사용자가 직접 관리하는 `resume` 레포를 읽어 웹 미리보기와 Word 이력서를 만드는 규격입니다.

## 핵심 규칙

- 레포 이름은 정확히 `resume`
- 루트에 `resume.yaml` 필수
- 영어를 따로 관리하려면 루트에 `resume.en.yaml` 또는 `resume_en.yaml` 추가
- `resume.en.yaml`이 없으면 영어 미리보기는 `resume.yaml`로 fallback
- 긴 본문은 `content/*.md`로 분리 가능
- 사진은 `basics.avatar` 또는 `basics.avatarUrl`로 전달
- `avatar`는 `assets/` 아래 상대경로를 권장
- private 레포도 가능하지만 로그인한 본인 self mode에서만 읽고 export 가능

## 권장 다국어 방식

이제 권장 방식은 `한 파일 안에 ko/en 객체를 섞는 것`이 아니라 `locale별 manifest를 분리`하는 것입니다.

- 한국어: `resume.yaml`
- 영어: `resume.en.yaml`

이 방식이 좋은 이유:

- 언어마다 문장 길이, 섹션 순서, 표현 방식을 독립적으로 조정할 수 있음
- `featuredProjects`, `bullets`, `summary`, `customSections`를 언어별로 다르게 설계 가능
- YAML 내부에 `ko`/`en` 객체가 줄어들어 작성과 유지보수가 쉬움

기존의 `{ ko: "...", en: "..." }` 형태도 당장은 legacy로 읽지만, 새 템플릿에서는 권장하지 않습니다.

## 추천 구조

```text
resume/
  resume.yaml
  resume.en.yaml
  content/
    ko/
      summary.md
      experience/
        acme.md
        githubprint.md
    en/
      summary.md
      experience/
        acme.md
        githubprint.md
  assets/
    profile.jpg
```

## 사진 넣는 방법

권장 필드:

```yaml
basics:
  avatar: "assets/profile.jpg"
```

대체 필드:

```yaml
basics:
  avatarUrl: "https://images.example.com/profile.jpg"
```

권장 방식:

1. `resume` 레포 안에 `assets/profile.jpg` 같은 파일을 넣는다.
2. `resume.yaml`과 `resume.en.yaml`에는 `basics.avatar: "assets/profile.jpg"`만 적는다.
3. GitHubPrint가 해당 파일을 직접 읽어 웹 미리보기와 Word export에 함께 사용한다.

## `resume.yaml` 예시

```yaml
basics:
  name: "홍길동"
  avatar: "assets/profile.jpg"
  headline: "제품과 구현을 함께 다루는 프론트엔드 개발자"
  email: "hello@example.com"
  phone: "+82-10-0000-0000"
  location: "Seoul, KR"
  website: "https://example.com"
  links:
    - label: "GitHub"
      url: "https://github.com/<username>"
      kind: "repo"
    - label: "블로그"
      url: "https://blog.example.com"
      kind: "docs"

summary:
  markdown: "content/ko/summary.md"

experience:
  - title: "Acme"
    subtitle: "Frontend Engineer"
    location: "Seoul"
    start: "2024-01-01"
    current: true
    bullets:
      - "제품 화면과 운영용 어드민을 함께 개발했습니다."
      - "디자인 시스템과 프론트엔드 기준을 정리했습니다."
    detailsMarkdown:
      markdown: "content/ko/experience/acme.md"
    links:
      - label: "Company"
        url: "https://acme.com"
        kind: "live"

projects:
  - id: "githubprint-product"
    title: "GitHubPrint"
    subtitle: "공동창업 프로젝트"
    repo: "githubprint"
    start: "2025-02-01"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript", "OpenAI"]
    bullets:
      - "제품, 디자인, 구현을 처음부터 끝까지 맡았습니다."
      - "GitHub 데이터를 공유 가능한 문서로 바꾸는 흐름을 만들었습니다."
    detailsMarkdown:
      markdown: "content/ko/experience/githubprint.md"

featuredProjects:
  - project: "githubprint-product"
  - repo: "uiwwsw.github.io"

education:
  - school: "OO대학교"
    degree: "컴퓨터공학"
    start: "2018-03-01"
    end: "2022-02-28"
    status: "졸업"

skills:
  - title: "Core"
    items: ["TypeScript", "React", "Next.js", "Node.js"]
  - "Figma"
  - "Product thinking"

customSections:
  - id: "writing"
    title: "글"
    layout: "list"
    items:
      - title: "개발 블로그"
        links:
          - label: "Blog"
            url: "https://blog.example.com"
            kind: "docs"
```

## `resume.en.yaml` 예시

```yaml
basics:
  name: "Hong Gil Dong"
  avatar: "assets/profile.jpg"
  headline: "Frontend engineer who handles both product direction and implementation"
  email: "hello@example.com"
  phone: "+82-10-0000-0000"
  location: "Seoul, KR"
  website: "https://example.com"
  links:
    - label: "GitHub"
      url: "https://github.com/<username>"
      kind: "repo"
    - label: "Blog"
      url: "https://blog.example.com"
      kind: "docs"

summary:
  markdown: "content/en/summary.md"

experience:
  - title: "Acme"
    subtitle: "Frontend Engineer"
    location: "Seoul"
    start: "2024-01-01"
    current: true
    bullets:
      - "Built both product-facing surfaces and operational admin tools."
      - "Established frontend standards and design-system foundations."
    detailsMarkdown:
      markdown: "content/en/experience/acme.md"
    links:
      - label: "Company"
        url: "https://acme.com"
        kind: "live"

projects:
  - id: "githubprint-product"
    title: "GitHubPrint"
    subtitle: "Co-founded product"
    repo: "githubprint"
    start: "2025-02-01"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript", "OpenAI"]
    bullets:
      - "Built the product, design direction, and implementation end to end."
      - "Turned GitHub evidence into shareable developer documents."
    detailsMarkdown:
      markdown: "content/en/experience/githubprint.md"

featuredProjects:
  - project: "githubprint-product"
  - repo: "uiwwsw.github.io"

education:
  - school: "OO University"
    degree: "Computer Science"
    start: "2018-03-01"
    end: "2022-02-28"
    status: "Graduated"

skills:
  - title: "Core"
    items: ["TypeScript", "React", "Next.js", "Node.js"]
  - "Figma"
  - "Product thinking"

customSections:
  - id: "writing"
    title: "Writing"
    layout: "list"
    items:
      - title: "Engineering blog"
        links:
          - label: "Blog"
            url: "https://blog.example.com"
            kind: "docs"
```

## Markdown 예시

`content/ko/summary.md`

```md
제품 관점과 구현 관점을 함께 잡고, 작은 팀에서 빠르게 만들고 검증하는 흐름을 선호합니다.
GitHub 기반 제품, 문서형 인터페이스, 개발자 도구에 관심이 많습니다.
```

`content/en/summary.md`

```md
I prefer fast build-and-validate loops in small product teams.
I am especially interested in GitHub-based products, document interfaces, and developer tooling.
```

## 시간축 연결 규칙

- `projects[].start`가 있으면 그 날짜를 기준으로 프로젝트를 정렬합니다.
- `projects[].start`가 없고 `repo`가 현재 계정의 GitHub repo와 매칭되면 repo 생성일을 보조 날짜로 사용합니다.
- 이렇게 얻은 날짜를 바탕으로 어떤 `experience` 구간과 겹치는지 연결해서 보여줍니다.
- 연결되지 않으면 독립 프로젝트로 표시합니다.
- `featuredProjects`가 있으면 하단 프로젝트 섹션에는 선택한 항목만 노출합니다.
- `featuredProjects`가 없으면 `projects` 전체를 하단 프로젝트 섹션에 사용합니다.

## `featuredProjects` 작성 방식

- `project: "<id>"`: `projects[]` 안의 명시적 프로젝트를 선택합니다.
- `repo: "<repo-name-or-owner/repo>"`: 현재 GitHub 계정의 repo를 직접 선택합니다.
- `repo` 참조가 `projects[]`에도 있으면 그 명시적 프로젝트를 우선 사용합니다.
- `repo`만 적으면 제목, 링크, 기본 기술 정보는 GitHub repo 메타데이터로 채웁니다.

## 현재 지원 필드

### `basics`

- `name` required
- `avatar` optional
- `avatarUrl` optional
- `headline` optional
- `email` optional
- `phone` optional
- `location` optional
- `website` optional
- `links[]` optional

### `experience[]`, `education[]`, `customSections[].items[]`

- `title` required
- `subtitle` optional
- `location` optional
- `start` optional
- `end` optional
- `current` optional
- `bullets[]` optional
- `links[]` optional
- `detailsMarkdown` optional

### `projects[]`

- 공통 항목 전부 지원
- `repo` optional
- `liveUrl` optional
- `tech[]` optional

## migration 메모

- 새로 작성할 때는 `resume.yaml`과 `resume.en.yaml`를 분리하세요.
- 기존의 `{ ko: "...", en: "..." }` 또는 `markdown: { ko: "...", en: "..." }` 방식은 legacy입니다.
- 현재는 하위 호환으로 읽지만, 경고가 뜨면 locale별 manifest 분리로 옮기는 편이 좋습니다.
