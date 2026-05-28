# Task Dependency Context Improvement Design v1

작성 목적: `Writer`가 `Researcher / Business / 현빈` 등 선행 작업 결과를 더 안정적으로 반영하도록, dependency context inheritance를 범용 구조로 개선하는 설계안을 정리한다.

## 1. 문제 정의

현재 구현은 dependency를 "있다/없다" 수준으로만 전달한다.

현재 확인된 상태:
- `Writer`는 tracker에서 `dependsOn`을 가진다.
- 실행 프롬프트에는 `_runSafeDepsSummary()` 결과가 `completed deps`로 짧게 들어간다.
- dependency별 `resultSummary`는 약 80자 수준이다.
- 전체 `completed deps` 블록은 약 700자 수준으로 제한된다.
- 결과 파일에는 `usedDependencies / upstreamSummary / dependencyEvidence`가 남지 않는다.
- `/results`, `/result`는 `resultSummary`, `resultPath`, `evidence`는 보여주지만 dependency 구조 자체는 충분히 노출하지 않는다.

이 때문에 다음 정보가 Writer에게 충분히 전달되지 않을 수 있다.
- 대상 독자
- 가격
- 인원
- 채널
- 핵심 가치
- 이미 합의된 전략적 제약
- 선행 작업이 남긴 확인 필요 사항

## 2. 목표

Writer 및 다른 downstream 작업이 선행 작업 결과를 더 안정적으로 반영하게 만든다.

요구되는 동작:
- upstream task의 핵심 결정을 downstream prompt에 구조적으로 전달한다.
- 충돌 가능성이 있으면 downstream이 임의로 덮어쓰지 않고 확인 필요로 표시한다.
- 결과 파일과 tracker evidence에 dependency 반영 흔적이 남아 추적 가능해야 한다.
- 범용 구조로 설계해 특정 주제(예: 5060 AI 교육)에 고정하지 않는다.

## 3. 현재 전달 경로

### 3.1 run-safe 경로

- `_runSafeBuildSystemPrompt(agentId, task)`가 task metadata와 `dependsOn`, `completed deps`를 프롬프트에 넣는다.
- `_runSafeExecuteTask(task)`가 이를 `roleId/purpose='worker'`로 `_callRoleLLMWithFallback()`에 전달한다.
- 결과 파일은 `sessions/<bucket>/task-<shortId>.md`에 저장된다.
- tracker에는 `resultPath`, `resultSummary`, `evidence`만 업데이트된다.

### 3.2 results/result 경로

- `/results`는 plan 전체 task 목록, 상태, 요약을 보여준다.
- `/result`는 단일 task의 `resultSummary`, `resultPath`, `evidence`를 보여준다.
- dependency 사용 여부를 직접 보여주는 필드는 없다.

## 4. 최소 수정 범위 원칙

설계 원칙은 "작게 고치되 구조는 넓게 남긴다"이다.

최소 수정 대상:
- `_runSafeDepsSummary()`
- `_runSafeBuildSystemPrompt()`
- `_runSafeExecuteTask()`
- result file header 생성부
- tracker evidence 생성부
- `/results`, `/result` 출력 포맷

코드 구조를 크게 갈아엎지 않고 아래를 추가하는 방향이 적절하다.
- dependency metadata block
- dependency evidence block
- upstream 충돌 감지 규칙
- result header 확장

## 5. 제안 데이터 구조

### 5.1 `usedDependencies`

형태 예시:

```json
[
  {
    "taskId": "task-abc123",
    "agentId": "business",
    "title": "가격 구조 정리",
    "status": "done",
    "resultSummary": "월 29,000원/연 290,000원 제안",
    "resultPath": "sessions/.../task-abc123.md"
  }
]
```

의미:
- downstream task가 실제로 참조한 upstream task 목록
- id와 agentId를 함께 남겨 추후 추적 가능하게 함

### 5.2 `upstreamSummary`

형태 예시:

```md
- business: 대상=40/50 자영업자, 가격=월 29,000원, 채널=YouTube+Telegram
- researcher: 시장 확인 결과, 3개 경쟁사 중 2개는 무료 체험 제공
```

의미:
- downstream이 반영한 upstream 핵심 결정을 요약한 텍스트
- 사람이 읽기 좋고, `/result`와 result file header에 넣기 적합

### 5.3 `dependencyEvidence`

형태 예시:

```json
[
  {
    "taskId": "task-abc123",
    "evidence": "결과 파일: sessions/.../task-abc123.md\n요약: 월 29,000원/연 290,000원 제안",
    "applied": true
  }
]
```

의미:
- upstream 결과를 downstream이 실제로 사용했는지 추적하는 근거
- tracker evidence와 result header 양쪽에 반영 가능

## 6. prompt 보강 문구 제안

### 6.1 기본 원칙 문구

아래 문구를 `_runSafeBuildSystemPrompt()`에 추가하는 안이 적절하다.

```text
선행 작업 결과가 제공되면 반드시 반영하세요.
선행 결과의 대상, 가격, 인원, 채널, 핵심 가치와 충돌하면 임의로 덮어쓰지 말고 확인 필요로 표시하세요.
충돌이 없으면 선행 결과를 우선 반영하세요.
결과 끝에는 반드시 "반영한 선행 결과" 섹션을 작성하세요.
```

### 6.2 충돌 규칙 문구

```text
아래 항목은 upstream 결과와 충돌 금지입니다.
- 대상 독자
- 가격
- 인원
- 채널
- 핵심 가치
충돌하면 선행 결과 우선 또는 확인 필요라고 명시하세요.
```

### 6.3 결과 섹션 문구

```text
결과 끝에 "반영한 선행 결과" 섹션을 추가하세요.
각 항목에 사용한 upstream task와 반영 포인트를 짧게 적으세요.
```

## 7. result 파일 헤더 예시

현재 header는 task metadata, model 정보, summary 중심이다.

제안 예시:

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
  - researcher: 시장 반응과 경쟁사 체계 확인
- dependencyEvidence:
  - task-abc123: 결과 파일 sessions/.../task-abc123.md
  - task-def456: 결과 파일 sessions/.../task-def456.md

## Result
...

## 반영한 선행 결과
- business: 대상/가격/핵심 가치 반영
- researcher: 경쟁사 관찰 결과 반영
```

## 8. tracker evidence 예시

제안하는 tracker evidence는 사람이 읽을 수 있어야 하고, `/result`에서도 짧게 확인 가능해야 한다.

예시:

```md
결과 파일: sessions/2026-05-28/task-123456789.md
요약: 대상=40/50 자영업자 / 가격=월 29,000원 / 채널=Telegram
usedDependencies: business, researcher
upstreamSummary: business(가격/핵심 가치), researcher(시장/경쟁사)
dependencyEvidence:
- task-abc123: applied=true
- task-def456: applied=true
```

## 9. `/results`, `/result` 개선 가능성

현재 상태:
- `/results`는 plan-level summary 중심이다.
- `/result`는 resultSummary, resultPath, evidence를 보여준다.
- dependency metadata는 별도 필드가 없다.

개선 방향:
- `/result`에 `usedDependencies`와 `upstreamSummary`를 추가 표시한다.
- `/results`의 task line에는 dependency count 또는 반영 여부를 짧게 붙인다.
- dependencyEvidence는 길 수 있으므로 `/result`에서만 펼치거나 접힌 섹션으로 보여주는 것이 적절하다.

## 10. 변경 대상 함수 목록

설계상 영향을 받는 함수:
- `_runSafeDepsSummary()`
- `_runSafeBuildSystemPrompt()`
- `_runSafeExecuteTask()`
- `formatTrackerTaskResult()`
- `formatTrackerTaskProgress()`
- `_resultsBuildReport()`
- tracker update helper

## 11. 테스트 계획

아래 시나리오는 모두 범용 dependency inheritance 검증용이다.

1. `5060 AI 수익화 강의`
   - Researcher -> Business -> Writer 순서에서 대상/가격/채널/핵심 가치가 downstream으로 유지되는지 확인
2. `40/50 자영업자 마케팅 자동화`
   - Business가 정한 가격/인원/채널 제약을 Writer가 임의로 덮어쓰지 않는지 확인
3. `GitHub 연동 작업`
   - Developer/Secretary/CEO 선행 결과가 후속 문서에 남는지 확인

검증 포인트:
- result file header에 usedDependencies가 남는지
- tracker evidence에 dependencyEvidence가 남는지
- `/result`에서 dependency 반영 여부를 읽을 수 있는지
- 충돌 시 확인 필요 표시가 출력되는지

## 12. 롤백 기준

다음 중 하나라도 발생하면 롤백 대상이다.

- downstream prompt가 과도하게 길어져 context overflow가 증가하는 경우
- `/result` 출력이 너무 장황해져 가독성이 떨어지는 경우
- usedDependencies 추가로 tracker 저장 구조가 불안정해지는 경우
- dependencyEvidence가 false positive를 많이 만들거나 실제 반영 여부를 왜곡하는 경우
- 기존 완료 플로우가 느려지거나 실패율이 증가하는 경우

롤백 우선순위:
- 1차: result header 확장만 철회
- 2차: prompt 보강 문구 축소
- 3차: dependencyEvidence만 비활성화
- 4차: usedDependencies 구조 추가 자체를 철회

## 13. 결론

이 설계의 핵심은 `dependsOn`을 단순 실행 순서가 아니라 "downstream이 실제로 읽고 반영해야 하는 upstream 계약"으로 승격하는 것이다.

가장 작은 성공 기준은 다음 3가지다.
- Writer가 upstream 핵심 결정을 prompt에서 다시 받는다.
- result 파일과 tracker evidence에 그 흔적이 남는다.
- `/result`에서 사람이 반영 여부를 확인할 수 있다.

