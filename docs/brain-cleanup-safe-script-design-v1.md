# Brain Cleanup Safe Script Design v1

## 1. 문서 목적

이 문서는 실제 brain 정리 전 사용할 dry-run 스크립트의 설계 기준을 정의한다.

목적은 실행이 아니라 검토다.  
즉, 이 문서는 "무엇을 지울지"가 아니라 "무엇을 어떻게 분류할지"를 정하는 기준 문서다.

## 2. 스크립트 목표

`brain-cleanup-safe` 스크립트의 목표는 다음과 같다.

- `D:\dev\brain` 폴더를 읽는다.
- 파일을 수정, 삭제, 이동하지 않는다.
- 정리 후보를 분류한다.
- CSV 또는 Markdown으로 dry-run 결과만 출력한다.

이 스크립트는 실제 정리 작업이 아니라, 정리 전에 사람이 검토할 수 있는 계획만 만든다.

## 3. 절대 금지 동작

이 스크립트는 아래 동작을 절대 하면 안 된다.

- 파일 삭제
- 파일 이동
- 파일 내용 수정
- archive 폴더 생성
- 자동 정리 실행
- API key 또는 민감정보 출력

즉, 스크립트는 읽기 전용이어야 하며, 결과 생성 역시 계획 수준에서 끝나야 한다.

## 4. 입력값 설계

dry-run 스크립트는 아래 입력값을 받는 구조가 적절하다.

- `brainRoot`
- `outputPath`
- `mode: dry-run only`
- `includeContentPreview: false`
- `maxRecentFiles`
- `maxPreviewChars`

### 입력값 해석

- `brainRoot`: 분석 대상이 되는 brain 루트 경로
- `outputPath`: dry-run 결과를 저장할 경로
- `mode`: 반드시 dry-run only
- `includeContentPreview`: 기본값은 false, 내용 노출 방지
- `maxRecentFiles`: 최근 파일 추출 수 제한
- `maxPreviewChars`: 미리보기 문자 제한

이 입력값 설계는 민감정보 노출을 줄이고, 결과를 사람이 검토하기 쉽게 만든다.

## 5. 출력 컬럼

dry-run 결과는 아래 컬럼을 포함하는 것이 좋다.

- `action`
- `sourcePath`
- `targetPath`
- `reason`
- `category`
- `riskLevel`
- `requiresManualReview`
- `lastWriteTime`
- `sizeBytes`
- `matchedRules`

### 컬럼 의미

- `action`: 분류 결과의 동작 제안
- `sourcePath`: 원본 경로
- `targetPath`: 제안 대상 경로
- `reason`: 분류 이유
- `category`: 보존, 아카이브, 요약, 삭제, 보류 등
- `riskLevel`: 위험 수준
- `requiresManualReview`: 사람이 다시 봐야 하는지 여부
- `lastWriteTime`: 마지막 수정 시각
- `sizeBytes`: 파일 크기
- `matchedRules`: 어떤 규칙에 걸렸는지

## 6. action 종류

스크립트가 출력할 action 값은 아래로 제한한다.

- `KEEP`
- `ARCHIVE_CANDIDATE`
- `SUMMARY_CANDIDATE`
- `DELETE_CANDIDATE`
- `REVIEW_REQUIRED`

### action 해석

- `KEEP`: 그대로 유지
- `ARCHIVE_CANDIDATE`: 아카이브 후보
- `SUMMARY_CANDIDATE`: 요약 후 대체 후보
- `DELETE_CANDIDATE`: 삭제 후보지만 실제 삭제는 금지
- `REVIEW_REQUIRED`: 사람이 직접 확인해야 함

## 7. 분류 규칙

### 7.1 KEEP

아래 항목은 KEEP으로 분류한다.

- `identity`
- `goals`
- `decisions`
- role definitions
- `company_state.json`
- `_company/_shared`
- `_company/_agents`

이 범주는 현재 정책과 운영 기준을 구성하는 핵심 정보다.

### 7.2 ARCHIVE_CANDIDATE

아래 항목은 ARCHIVE_CANDIDATE로 분류한다.

- `sessions` 하위 반복 테스트
- auto-safe 테스트
- run-plan 테스트
- cancel-plan 테스트
- delegate 테스트
- gemini openai compatible 실패 테스트

이 범주는 현재 운영 기준에는 직접 필요하지 않지만, 나중에 참고할 수 있다.

### 7.3 SUMMARY_CANDIDATE

아래 항목은 SUMMARY_CANDIDATE로 분류한다.

- 반복된 5060 AI 수익화 강의 결과
- 동일 목표의 Researcher / Writer / CEO 반복 산출물
- 중복된 role routing 실험 기록

이 범주는 원문 전체보다 요약본이 더 유용하다.

### 7.4 DELETE_CANDIDATE

아래 항목은 DELETE_CANDIDATE로 분류한다.

- API key invalid 테스트 결과
- 명백한 실패 로그
- 의미 없는 중복 로그

단, 실제 삭제는 절대 하지 않는다.
이 action은 "삭제 검토 후보"일 뿐이며, 최종 실행은 별도 승인 절차가 필요하다.

### 7.5 REVIEW_REQUIRED

아래 항목은 REVIEW_REQUIRED로 분류한다.

- Researcher 외부/로컬 판단 자료
- Codari Qwen 품질 판단 자료
- 운영 지식인지 테스트인지 애매한 자료

이 범주는 자동 판정보다 사람이 직접 확인하는 것이 안전하다.

## 8. riskLevel 기준

위험 수준은 아래 값으로 제한하는 것이 좋다.

- `none`
- `low`
- `medium`
- `high`
- `critical`

### 기준 예시

- `none`: 유지 대상
- `low`: 요약 또는 비파괴 아카이브 후보
- `medium`: 반복 테스트 세션 등 검토 필요
- `high`: 삭제 후보, 충돌 가능성 있음
- `critical`: 민감정보 포함 가능성 또는 정책 충돌 가능성

## 9. 민감정보 탐지 방향

dry-run 스크립트는 민감정보를 출력하지 않도록 탐지해야 한다.

탐지 키워드 예시:

- `API key`
- `token`
- `secret`
- `Authorization`
- `Bearer`
- `password`
- `key=`

탐지 시에는 원문을 그대로 출력하지 말고, 민감정보가 있다는 사실만 표시해야 한다.

## 10. 다음 단계

이 설계 문서 이후의 다음 단계는 아래와 같다.

1. 설계 문서 커밋
2. dry-run 스크립트 구현 브랜치 생성
3. dry-run 실행
4. 결과 검토
5. 승인된 항목만 archive 이동

이 순서로 진행해야 brain 정리의 안전성을 유지할 수 있다.

