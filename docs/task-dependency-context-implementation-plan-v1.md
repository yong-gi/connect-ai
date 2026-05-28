# Task Dependency Context Implementation Plan v1

이 문서는 `dependency context improvement design v1`을 실제로 구현할 때의 최소 수정 계획을 정리한다.

## 1. 구현 목표

목표는 Writer 및 기타 downstream task가 upstream 결과를 더 안정적으로 반영하도록 하는 것이다.

핵심은 세 가지다.
- prompt 안에서 upstream 결과를 더 명시적으로 보이게 한다.
- result file header와 tracker evidence에 dependency metadata를 남긴다.
- `/results`, `/result`에서 사람이 dependency 반영 여부를 확인할 수 있게 한다.

## 2. 최소 수정 범위

최소 수정 원칙:
- 기존 delegate / run-safe 흐름은 유지한다.
- 새 데이터 구조는 additive하게 붙인다.
- tracker schema를 대규모로 바꾸지 않는다.
- brain 구조는 건드리지 않는다.
- 리팩토링은 하지 않는다.

권장 변경 범위:
- `_runSafeDepsSummary()`
- `_runSafeBuildSystemPrompt()`
- `_runSafeExecuteTask()`
- `formatTrackerTaskResult()`
- `formatTrackerTaskProgress()`
- `_resultsBuildReport()`
- tracker evidence writer
- result file header writer

## 3. 구현 단계

### Phase 1. dependency metadata 생성

목표:
- upstream task를 구조화해서 downstream에 전달할 수 있는 최소 객체를 만든다.

추가할 필드:
- `usedDependencies`
- `upstreamSummary`
- `dependencyEvidence`

권장 방식:
- `_runSafeDepsSummary()`는 기존 텍스트 요약을 유지하되, 별도 구조체 생성 로직을 추가하는 방향이 안전하다.
- 결과적으로 prompt에는 텍스트 블록, result/tracker에는 구조화 데이터가 같이 들어간다.

### Phase 2. prompt 보강

목표:
- Writer가 upstream 결과를 무시하지 않도록 강제한다.

추가 문구:
- 선행 작업 결과가 제공되면 반드시 반영
- 대상/가격/인원/채널/핵심 가치 충돌 금지
- 충돌 시 선행 결과 우선 또는 확인 필요
- 결과 끝에 `반영한 선행 결과` 섹션 필수

권장 삽입 위치:
- `_runSafeBuildSystemPrompt()`

### Phase 3. result file header 확장

목표:
- 실행 결과 파일에서 dependency 추적이 가능하도록 한다.

헤더에 추가할 내용:
- `usedDependencies`
- `upstreamSummary`
- `dependencyEvidence`

권장 위치:
- `_runSafeExecuteTask()` 내부의 `fileBody` 생성부

### Phase 4. tracker evidence 확장

목표:
- tracker task 상태만으로도 선행 결과 반영 여부를 빠르게 추적한다.

기존:
- 결과 파일 경로
- 결과 요약

추가:
- usedDependencies 목록
- upstreamSummary
- dependencyEvidence 요약

권장 위치:
- `updateTrackerTask(task.id, { evidence: ... })`

### Phase 5. `/results`, `/result` 출력 확장

목표:
- 운영자/사용자가 결과 확인 시 dependency 반영 여부를 읽을 수 있게 한다.

권장 변경:
- `/result`에 `usedDependencies`와 `upstreamSummary` 노출
- `/results`에 dependency count 또는 반영 표시 추가
- 너무 긴 `dependencyEvidence`는 접기/축약

## 4. 변경 대상 함수 목록

아래 함수들이 직접적인 수정 대상이다.

- `_runSafeDepsSummary()`
- `_runSafeBuildSystemPrompt()`
- `_runSafeExecuteTask()`
- `formatTrackerTaskResult()`
- `formatTrackerTaskProgress()`
- `_resultsBuildReport()`

간접 영향 함수:
- `updateTrackerTask()`
- `_statusCollectPlanTasks()`
- `_resultsTaskSummaryText()`
- `_resultsPickPlanId()`

## 5. 권장 데이터 흐름

### 5.1 upstream -> downstream

1. task 실행 전 upstream 목록을 찾는다.
2. 각 upstream에서 `resultSummary`, `resultPath`, `evidence`를 읽는다.
3. 필요한 경우 result file의 header 또는 본문에서 더 긴 요약을 추출한다.
4. downstream prompt에 `usedDependencies`/`upstreamSummary`/`dependencyEvidence`를 넣는다.

### 5.2 downstream -> tracker/result file

1. 결과 생성 후 `usedDependencies`를 저장한다.
2. `upstreamSummary`를 result header에 남긴다.
3. tracker evidence에 dependency 반영 흔적을 남긴다.
4. `/result`가 이를 출력한다.

## 6. 문구 표준안

### 6.1 prompt 표준 문구

```text
선행 작업 결과가 제공되면 반드시 반영하세요.
선행 결과의 대상, 가격, 인원, 채널, 핵심 가치와 충돌하면 임의로 덮어쓰지 말고 확인 필요로 표시하세요.
충돌이 없으면 선행 결과를 우선 반영하세요.
결과 끝에는 반드시 "반영한 선행 결과" 섹션을 작성하세요.
```

### 6.2 결과 파일 헤더 표준

```md
- usedDependencies: business, researcher
- upstreamSummary:
  - business: 가격 구조와 핵심 가치 확정
  - researcher: 시장 반응과 경쟁사 확인
- dependencyEvidence:
  - task-abc123: applied=true
  - task-def456: applied=true
```

### 6.3 tracker evidence 표준

```md
결과 파일: sessions/.../task-123456789.md
요약: 대상=40/50 자영업자 / 가격=월 29,000원 / 채널=Telegram
usedDependencies: business, researcher
upstreamSummary: business(가격/핵심 가치), researcher(시장/경쟁사)
dependencyEvidence:
- task-abc123: applied=true
- task-def456: applied=true
```

## 7. result file header 예시

```md
# Run Safe Result

- taskId: task-123456789
- title: Writer 초안 작성
- agentId: writer
- createdAt: 2026-05-28T10:00:00.000Z
- completedAt: 2026-05-28T10:12:00.000Z
- llmModel: qwen2.5:7b
- llmSource: local
- resultSummary: 대상=40/50 자영업자 / 가격=월 29,000원 / 채널=Telegram
- usedDependencies: business, researcher
- upstreamSummary:
  - business: 가격 구조와 핵심 가치 확정
  - researcher: 시장 반응과 경쟁사 확인
- dependencyEvidence:
  - task-abc123: applied=true
  - task-def456: applied=true

## Result

...본 결과...

## 반영한 선행 결과
- business: 대상/가격/핵심 가치 반영
- researcher: 경쟁사 관찰 결과 반영
```

## 8. `/results`, `/result` 개선안

### `/result`

추가 노출 항목:
- usedDependencies
- upstreamSummary
- dependencyEvidence

권장 표현:
- `usedDependencies`는 짧게 한 줄
- `upstreamSummary`는 bullet 목록
- `dependencyEvidence`는 최대 3~5개만 먼저 보여주고 나머지는 축약

### `/results`

추가 가능한 항목:
- dependency 반영 표시
- dependency 개수
- usedDependencies의 간단한 요약 태그

예시:

```md
1. ✍️ Writer `123456789`
   상태: 완료
   요약: 대상=40/50 자영업자 / 가격=월 29,000원
   의존: business, researcher
```

## 9. 테스트 계획

테스트는 특정 주제에 고정하지 않고 범용 dependency inheritance를 확인한다.

### Case A. `5060 AI 수익화 강의`
- Researcher 결과의 시장/경쟁사/고객 관찰이 Writer 초안에 남는지 확인
- Business 결과의 가격/인원/채널/핵심 가치가 Writer가 덮어쓰지 않는지 확인

### Case B. `40/50 자영업자 마케팅 자동화`
- Business가 정한 가격/채널/전환 목표가 Writer 문서에 반영되는지 확인
- downstream이 "확인 필요"를 남기는지 확인

### Case C. `GitHub 연동 작업`
- Developer/Secretary/CEO 선행 결과가 이후 문서에 upstreamSummary로 남는지 확인
- dependencyEvidence가 실제 결과 파일 경로를 포함하는지 확인

검증 포인트:
- result file header에 `usedDependencies`가 있는가
- `/result`에서 `usedDependencies`와 `upstreamSummary`를 볼 수 있는가
- tracker evidence에 dependencyEvidence가 남는가
- 충돌 시 확인 필요가 출력되는가

## 10. 롤백 기준

다음 조건 중 하나라도 만족하면 롤백 대상으로 본다.

- prompt 길이가 과도하게 늘어나 LLM 실패율이 올라간다.
- `/result`가 지나치게 길어져 실사용성이 떨어진다.
- usedDependencies 저장이 tracker 업데이트와 충돌한다.
- upstreamSummary가 실제보다 과장되어 신뢰도를 해친다.
- dependencyEvidence가 false positive를 만들어 추적을 오히려 혼란스럽게 한다.

롤백 우선순위:
1. `dependencyEvidence` 노출 제거
2. `upstreamSummary` 축소
3. result file header의 dependency block 제거
4. prompt 보강 문구 축소
5. `usedDependencies` 자체 제거

## 11. 구현 순서 추천

1. result file header 확장
2. tracker evidence 확장
3. `_runSafeBuildSystemPrompt()` prompt 보강
4. `/result` 출력 확장
5. `/results`의 간단 표시 확장

이 순서가 좋은 이유:
- 저장부터 확장하면 추적성이 먼저 확보된다.
- prompt 강화는 저장 구조 뒤에 붙여야 검증이 쉽다.
- `/result`/`/results`는 마지막에 붙여도 현재 동작을 깨지 않는다.

