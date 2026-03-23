# resume

PDF 원본을 기준으로 `resume.yaml`과 `content/`를 유지하는 이력서 정규화 프로젝트입니다.

## 구조

```text
resume/
  agent.md
  resume.yaml
  assets/
    profile.jpg
  content/
    summary.ko.md
    summary.en.md
    experience/
      hankook-ilbo.md
      semits.md
      uprise.md
      wisebirds.md
      interpark.md
      ameba.md
  sources/
    originals/
      README.md
  scripts/
    validate_resume.rb
```

## 운영 방식

1. 원본 이력서 PDF를 `sources/originals/`에 넣습니다.
2. 이후 `업데이트` 또는 `실행`이라고 입력합니다.
3. 에이전트는 최신 원본 PDF를 참조해 `resume.yaml`과 `content/`를 템플릿 구조로 갱신합니다.
4. `실행`일 때는 구조 검증까지 함께 수행합니다.

## 유지보수 원칙

- 구조적 데이터는 `resume.yaml`에 둡니다.
- 긴 설명문은 `content/**/*.md`에 둡니다.
- 경력 상세는 회사 단위 파일로 관리하고, 파일 내부에서 프로젝트를 나눕니다.
- 아바타 이미지는 `assets/profile.jpg`를 기준 경로로 유지합니다.
- 날짜는 `YYYY-MM-DD` 형식을 유지합니다.
- `projects[]`는 전체 프로젝트 풀입니다. 내부 프로젝트와 공개 프로젝트를 함께 둘 수 있습니다.
- 하단에 강조할 프로젝트는 `featuredProjects[]`로 고릅니다.
- `education`은 `school`, `degree`, `status`, `start`, `end` 형식을 사용합니다.
- `customSections[]`는 가능하면 `id`를 포함하고, item은 `title/date/organization/note` 형식을 우선합니다.
- PDF 원본은 수정하지 않고 참조 전용으로만 사용합니다.

## 검증

```bash
ruby scripts/validate_resume.rb
```
