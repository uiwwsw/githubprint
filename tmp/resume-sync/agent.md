# Resume Maintenance Agent

이 저장소의 목적은 원본 이력서 PDF를 기반으로, 아래 템플릿 구조를 지속적으로 유지하는 것입니다.

## 고정 목표

항상 아래 구조를 기준으로 작업합니다.

```text
resume/
  resume.yaml
  content/
    summary.ko.md
    summary.en.md
    experience/
      *.md
  assets/
    profile.jpg
```

## 트리거 해석

- `업데이트`
  - `sources/originals/` 안의 최신 원본 PDF를 찾습니다.
  - PDF 내용을 기준으로 `resume.yaml`과 `content/`를 업데이트합니다.
- `실행`
  - `업데이트`와 동일하게 동기화합니다.
  - 이후 `ruby scripts/validate_resume.rb`를 실행해 구조를 검증합니다.

## 작업 규칙

1. 원본 진실은 항상 `sources/originals/`의 PDF입니다.
2. 사용자가 특정 파일명을 지정하지 않으면 가장 최근 수정된 PDF를 사용합니다.
3. `resume.yaml`은 현재 저장소 validator와 gitfolio 엔진이 공통으로 이해하는 스키마를 우선합니다.
4. 문장형 설명, 긴 요약, 종료일 같은 확장 정보는 `content/**/*.md`에 둡니다.
5. 한국어와 영어가 모두 필요한 필드는 가능한 한 쌍으로 유지합니다.
6. `resume.yaml`에는 빈 문자열을 두지 않습니다. 값이 필요하면 확인 가능한 공개 정보로 채우고, 그렇지 않으면 필드를 재검토합니다.
7. 날짜는 `YYYY-MM-DD` 형식을 유지합니다.
8. 경력 항목은 `start`, `end`, `current`를 함께 유지합니다.
9. 경력 상세는 회사 단위로 `content/experience/` 아래에 Markdown 파일을 유지합니다.
10. 회사 내부 프로젝트가 여러 개면 해당 회사 Markdown 안에서 소제목으로 구분하고, 강조가 필요하면 `projects[]`에도 별도 항목으로 정리할 수 있습니다.
11. 원본 PDF는 수정, 이동, 삭제하지 않습니다.
12. 정보가 PDF에 없고 기존 저장소에도 없다면 임의로 단정하지 않습니다.
13. `projects[]`에는 내부 프로젝트와 공개 프로젝트를 함께 둘 수 있습니다.
14. 하단 대표 프로젝트는 `featuredProjects[]`로 선택할 수 있습니다.
15. `customSections[]`는 가능하면 `id`를 함께 유지합니다.

## 업데이트 기준

- `basics`: 이름, 아바타 또는 아바타 URL, 헤드라인, 위치, 웹사이트, 이메일, 전화번호, 링크
- `summary`: 한국어/영어 요약 Markdown 경로 유지
- `experience`: 회사명, 직함, 시작일, 종료일, 재직 여부, 핵심 bullet, 상세 Markdown
- `projects`: `id`, 제목, 기간, 저장소, 라이브 URL, 기술 스택, bullet, 상세 Markdown까지 허용
- `featuredProjects`: `project` 또는 `repo` 참조로 하단 대표 프로젝트 선택
- `education`: `school`, `degree`, `status`, `start`, `end` 형식을 우선
- `skills`: 그룹형 `title + items` 형식을 우선
- `customSections`: `id`, `title`, `layout`, `items`를 사용하고 item은 `title/date/organization/note` 또는 일반 항목 형식을 허용

## 응답 원칙

- 수정이 끝나면 무엇을 바꿨는지 간단히 보고합니다.
- 검증을 못 했으면 그 사실을 명시합니다.
- 구조를 바꾸기보다 콘텐츠를 갱신하는 쪽을 우선합니다.
