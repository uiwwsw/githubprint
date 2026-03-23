# Resume Template Guide

`resume` 템플릿은 GitHubPrint가 추론해서 만드는 문서가 아니라, 사용자가 직접 관리하는 `resume` 레포를 읽어 Word 이력서와 웹 미리보기를 만드는 규격입니다.

## 핵심 규칙

- 레포 이름은 정확히 `resume`
- 루트에 `resume.yaml` 필수
- 긴 본문은 `content/*.md`로 분리 가능
- 사진은 `basics.avatar` 또는 `basics.avatarUrl`로 전달
- `avatar`는 `assets/` 아래 상대경로를 권장하고, GitHubPrint가 직접 읽어 미리보기/Word export에 사용합니다.
- private 레포도 가능하지만 로그인한 본인 self mode에서만 읽고 export 가능

## 추천 구조

```text
resume/
  resume.yaml
  content/
    summary.ko.md
    summary.en.md
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
2. `resume.yaml`에는 `basics.avatar: "assets/profile.jpg"`만 적는다.
3. GitHubPrint가 해당 파일을 직접 읽어 웹 미리보기와 Word export에 함께 사용한다.

외부 CDN URL을 써야 하면 `avatarUrl`을 사용하면 됩니다. 하지만 이력서와 함께 소스를 관리하려면 `avatar` 상대경로가 더 낫습니다.

## 전체 템플릿 예시

```yaml
basics:
  name:
    ko: "홍길동"
    en: "Hong Gil Dong"
  avatar: "assets/profile.jpg"
  headline:
    ko: "제품과 구현을 함께 다루는 개발자"
    en: "A developer who handles both product and implementation"
  email: "hello@example.com"
  phone: "+82-10-0000-0000"
  location:
    ko: "Seoul, KR"
    en: "Seoul, KR"
  website: "https://example.com"
  links:
    - label: "GitHub"
      url: "https://github.com/<username>"
      kind: "repo"
    - label:
        ko: "블로그"
        en: "Blog"
      url: "https://blog.example.com"
      kind: "docs"

summary:
  markdown:
    ko: "content/summary.ko.md"
    en: "content/summary.en.md"

experience:
  - title:
      ko: "Acme"
      en: "Acme"
    subtitle:
      ko: "Frontend Engineer"
      en: "Frontend Engineer"
    location:
      ko: "Seoul"
      en: "Seoul"
    start: "2024-01-01"
    current: true
    bullets:
      - "Owned product-facing frontend delivery."
      - "Worked closely with design and product."
    detailsMarkdown:
      markdown:
        ko: "content/experience/acme.md"
        en: "content/experience/acme.md"
    links:
      - label: "Company"
        url: "https://acme.com"
        kind: "live"

projects:
  - id: "githubprint-product"
    title: "GitHubPrint"
    subtitle:
      ko: "공동창업 프로젝트"
      en: "Co-founded product"
    repo: "githubprint"
    start: "2025-02-01"
    liveUrl: "https://githubprint.vercel.app"
    tech: ["Next.js", "TypeScript", "OpenAI"]
    bullets:
      - "Built product, design, and implementation end to end."
      - "Turns GitHub data into shareable documents."
    detailsMarkdown:
      markdown:
        ko: "content/experience/githubprint.md"
        en: "content/experience/githubprint.md"
  - id: "semits-equip-client"
    title:
      ko: "반도체 장비 웹 클라이언트"
      en: "Semiconductor Equipment Web Client"
    subtitle:
      ko: "주식회사세미티에스 내부 프로젝트"
      en: "Internal project at Semits"
    start: "2023-09-01"
    end: "2024-03-01"
    tech: ["React", "TypeScript", "SWR"]
    bullets:
      - "Built and operated a client-facing internal product."
      - "Established shared API and frontend patterns."

featuredProjects:
  - project: "githubprint-product"
  - project: "semits-equip-client"
  - repo: "uiwwsw.github.io"

education:
  - title:
      ko: "OO대학교"
      en: "OO University"
    subtitle:
      ko: "컴퓨터공학"
      en: "Computer Science"
    start: "2018-03-01"
    end: "2022-02-28"

skills:
  - title:
      ko: "Core"
      en: "Core"
    items: ["TypeScript", "React", "Next.js", "Node.js"]
  - "Figma"
  - "Product thinking"

customSections:
  - id: "writing"
    title:
      ko: "글"
      en: "Writing"
    layout: "list"
    items:
      - title:
          ko: "개발 블로그"
          en: "Engineering blog"
        links:
          - label: "Blog"
            url: "https://blog.example.com"
            kind: "docs"
```

## Markdown 예시

`content/summary.ko.md`

```md
제품 관점과 구현 관점을 함께 잡고, 작은 팀에서 빠르게 만들고 검증하는 흐름을 선호합니다.
GitHub 기반 제품, 문서형 인터페이스, 개발자 도구에 관심이 많습니다.
```

`content/summary.en.md`

```md
I prefer fast build-and-validate loops in small product teams.
I am especially interested in GitHub-based products, document interfaces, and developer tooling.
```

## 시간축 연결 규칙

- `projects[].start`가 있으면 그 날짜를 기준으로 프로젝트를 정렬합니다.
- `projects[].start`가 없고 `repo`가 현재 계정의 GitHub repo와 매칭되면, repo 생성일을 보조 날짜로 사용합니다.
- 이렇게 얻은 날짜를 바탕으로 어떤 `experience` 구간과 겹치는지 연결해서 보여줍니다.
- 연결되지 않으면 독립 프로젝트로 표시합니다.
- `featuredProjects`가 있으면 하단 프로젝트 섹션에는 선택한 항목만 노출합니다.
- `featuredProjects`가 없으면 `projects` 전체를 하단 프로젝트 섹션에 사용합니다.
- 회사 내부 프로젝트도 `projects`에 넣고 날짜를 맞추면 해당 `experience` 구간 아래에 자동으로 연결됩니다.

## `featuredProjects` 작성 방식

- `project: "<id>"`: `projects[]` 안의 명시적 프로젝트를 선택합니다.
- `repo: "<repo-name-or-owner/repo>"`: 현재 GitHub 계정의 repo를 직접 선택합니다.
- `repo` 참조가 `projects[]`에도 있으면 그 명시적 프로젝트를 우선 사용합니다.
- `repo`만 적으면 제목/링크/기본 기술 정보는 GitHub repo 메타데이터로 채웁니다.
- 내부 프로젝트를 강조하려면 `projects[]`에 `id`, `title`, `start`/`end`, `tech`, `bullets`를 먼저 적고 `featuredProjects`에서 그 `id`를 선택하는 방식이 가장 안정적입니다.

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

## 작성 팁

- 경력은 빠뜨리지 말고 `experience`에 모두 넣는 것이 좋습니다.
- 개인 프로젝트는 가능하면 `start`를 넣으세요.
- 종료된 경력은 가능하면 `end`도 넣으세요. 현재 `current: false`인데 `end`가 없으면 연동 컨텍스트는 보수적으로만 계산됩니다.
- GitHub repo가 있는 프로젝트는 `repo`를 넣으면 검증 배지가 붙습니다.
- 사진은 너무 큰 원본보다 적당한 프로필 크기의 이미지가 좋습니다.
