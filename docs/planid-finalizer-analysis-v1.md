# Connect AI `planId` 기반 기존 결과 참조와 최종 통합 task 생성 구조 분석

## 1. 목적
이 문서는 `/go` objective에 `planId`가 포함되었을 때, 기존 plan의 결과를 다시 참조해 최종 통합본 1개를 만들 수 있는지 분석한 기록이다.

확인한 핵심 질문:
- `/go` objective에서 `planId`를 감지하는가
- 해당 `planId`의 세션 task 결과를 읽는가
- 기존 결과가 새 plan task dependency로 연결되는가
- “최종/통합/패키지/문서 1개” 요청 시 finalizer task가 생성되는가
- `providedDependencies`가 왜 비어 있는가
- 최종 통합본 생성에 CEO/Gemini를 사용할 수 있는가

## 2. 현재 구조 요약
현재 `/go`는 objective 문자열을 그대로 `_delegateCreatePlan(goal)`로 넘긴다.

- `/go` 처리: [src/extension.ts](../src/extension.ts#L3663)
- plan 생성: [src/extension.ts](../src/extension.ts#L6227)
- task 정규화: [src/extension.ts](../src/extension.ts#L11105)
- template task 생성: [src/extension.ts](../src/extension.ts#L10979)

즉, `/go` 자체에는 `planId` 전용 파서가 없고, objective 안의 `planId` 문자열을 별도로 해석하지 않는다.

## 3. 확인 결과

### 3.1 `/go` objective에 포함된 `planId` 감지 로직
현재 확인된 로직은 없다.

근거:
- `/go`는 `rest.trim()`을 `goal`로만 사용한다.
- 그 뒤 `_delegateCreatePlan(goal)`로 전달할 뿐, `planId`를 추출하거나 기존 플랜을 조회하지 않는다.
- `planId`를 찾는 함수들은 `/plan`, `/results`, `/run-plan`, `/auto-safe-*` 같은 명령용 보조 함수에 한정되어 있다.

관련 함수:
- `_delegateCreatePlan()` [src/extension.ts](../src/extension.ts#L6227)
- `_delegateFindPlanIdArg()` [src/extension.ts](../src/extension.ts#L2034)
- `_resultsPickPlanId()` [src/extension.ts](../src/extension.ts#L2192)
- `_runPlanResolvePlanId()` [src/extension.ts](../src/extension.ts#L7090)
- `_autoSafeResolvePlanId()` [src/extension.ts](../src/extension.ts#L7125)

### 3.2 `sessions/<planId>/task-*.md`를 읽는 로직
현재 구조에서는 그런 로직을 찾지 못했다.

추가로, 실제 result 저장 경로도 `sessions/<planId>/...`가 아니다.

- 결과 파일 저장 위치: `sessions/<date-bucket>/task-<shortId>.md`
- 저장 코드: [src/extension.ts](../src/extension.ts#L6997)

즉,
- 세션 폴더는 날짜 bucket 기반이다
- task 결과 파일도 planId 하위 디렉터리에 저장되지 않는다
- 따라서 `sessions/<planId>/task-*.md`를 직접 읽는 경로는 현재 존재하지 않는다

현재 있는 읽기 경로는 다음과 같다:
- `readRecentSessionReports()`는 최신 세션 폴더의 `_report.md`만 요약한다
- 이 함수는 task 결과 md 파일을 planId 기준으로 읽지 않는다

관련 함수:
- `readRecentSessionReports()` [src/extension.ts](../src/extension.ts#L10201)
- `_runSafeExecuteTask()` [src/extension.ts](../src/extension.ts#L6997)

### 3.3 기존 결과가 새 plan task dependency로 연결되는가
현재는 연결되지 않는다.

이유:
- `_delegateCreatePlan()`은 planner 결과를 받아 task 목록을 만들고, 각 task를 tracker에 등록한다
- 기존 plan의 결과 파일을 읽어 새 task의 `dependsOn`으로 변환하는 경로가 없다
- `providedDependencies`는 run-safe 실행 단계에서만 계산된다
- plan 생성 단계에서는 `providedDependencies`를 채우지 않는다

관련 함수:
- `_delegateCreatePlan()` [src/extension.ts](../src/extension.ts#L6227)
- `_delegateNormalizeTasks()` [src/extension.ts](../src/extension.ts#L11105)
- `_runSafeBuildDependencyContext()` [src/extension.ts](../src/extension.ts#L6832)
- `_runSafeExecuteTask()` [src/extension.ts](../src/extension.ts#L6997)

### 3.4 “최종/통합/패키지/문서 1개” 요청 시 finalizer task 생성 여부
현재는 별도 finalizer task를 자동 생성하는 전용 분기가 없다.

확인된 사항:
- `finalizer`, `finalize`, `통합본`, `패키지 문서`, `문서 1개` 같은 요청어를 보고 finalizer task로 전환하는 함수가 없다
- planner는 일반 task 분해를 수행하고, 필요 시 template/fallback task를 붙인다
- 통합 문서 1개를 만드는 목적의 단일 finalizer task 생성 로직은 찾지 못했다

관련 함수:
- `_delegateCreatePlan()` [src/extension.ts](../src/extension.ts#L6227)
- `_delegateNormalizeTasks()` [src/extension.ts](../src/extension.ts#L11105)
- `_delegateTemplateTasks()` [src/extension.ts](../src/extension.ts#L10979)

### 3.5 `providedDependencies`가 비어 있는 이유
`providedDependencies`는 실행 결과를 저장할 때만 채워진다.

현재 구조에서:
- `providedDependencies`는 `_runSafeBuildDependencyContext()`가 `task.dependsOn` 중 완료된 선행 task만 모아 계산한다
- 그런데 새 plan 생성 단계에서는 `planId` 기반의 기존 결과를 읽어 `dependsOn`으로 연결하지 않는다
- 따라서 새 plan의 task에 `dependsOn`이 비어 있으면 `providedDependencies`도 비게 된다

정리하면:
1. objective에 planId가 있어도 읽지 않음
2. 기존 결과 md를 새 task dependency로 붙이지 않음
3. 그러니 run-safe 결과에서도 `providedDependencies`가 비는 구조가 된다

관련 함수:
- `_runSafeBuildDependencyContext()` [src/extension.ts](../src/extension.ts#L6832)
- `_runSafeExecuteTask()` [src/extension.ts](../src/extension.ts#L6997)
- `TrackerTask` 필드 정의 [src/extension.ts](../src/extension.ts#L5642)

### 3.6 최종 통합본 생성에 CEO/Gemini를 사용할 수 있는가
구조적으로는 가능하다.

현재 CEO 쪽은 이미 별도 코디네이션 경로가 있다.
- `buildCeoTelegramSystemPrompt()`
- `buildExternalRoutingContext({ roleLabel: 'ceo' })`
- `_callRoleLLMWithFallback()` 기반 외부/로컬 라우팅

따라서 finalizer task를 도입한다면:
- 역할은 `ceo`로 두는 것이 자연스럽다
- 결과 합성/통합/우선순위 정리 용도에 CEO 모델을 쓰는 편이 현재 구조와 맞는다
- Gemini 사용 여부는 모델 라우팅 정책에 따라 이미 존재하는 CEO 라우팅을 타게 하면 된다

관련 함수:
- `buildCeoTelegramSystemPrompt()` [src/extension.ts](../src/extension.ts#L10665)
- `_buildExternalRoutingContext()` [src/extension.ts](../src/extension.ts#L10558)
- `_callRoleLLMWithFallback()` 호출부는 다수 존재

## 4. 원인 정리
이번 케이스의 직접 원인은 세 가지다.

1. `/go` objective에서 `planId`를 추출하지 않는다
2. 기존 `sessions` task 결과를 새 plan dependency로 읽어오지 않는다
3. “최종 통합본 1개” 요청을 finalizer task로 변환하는 분기가 없다

결과적으로:
- 기존 5개 작업 결과를 새 plan에 붙일 수 없었고
- `dependsOn`이 비어 있었으며
- `providedDependencies`도 비었다

## 5. 최소 수정안 제안
코드 수정은 하지 않았지만, 최소 수정 범위는 다음 순서가 적절하다.

### 1차
- `/go` objective에서 `planId`를 추출하는 보조 함수를 추가한다
- 기존 `planId`가 있으면 해당 plan의 기존 결과를 탐색한다

### 2차
- `sessions/<planId>/task-*.md`는 현재 저장 구조와 다르므로, 실제로는 tracker의 `planId` 또는 `resultPath`를 따라 관련 task 결과를 읽도록 만든다
- 읽은 결과를 새 plan의 `dependsOn` 또는 `providedDependencies` 후보로 변환한다

### 3차
- objective에 `최종`, `통합`, `패키지`, `문서 1개`가 있으면 finalizer task를 생성한다
- finalizer는 `ceo` 역할로 두고, 기존 결과 요약을 입력으로 삼게 한다

### 4차
- plan 등록 직전 finalizer task에 대해 summary/task 충돌 검사를 추가한다
- evidence/debug에 `planSource`, `taskSource`, `dependencySource` 같은 provenance를 남긴다

## 6. 테스트 케이스 제안
1. `planId delegate-20260528063706-cc8t`를 명시한 `/go` 요청
   - 기대: 기존 5개 결과가 dependency로 연결됨
   - 기대: finalizer task가 생성되면 `ceo`가 통합본 문서를 작성

2. `최종 강의 패키지 문서 1개` 요청
   - 기대: 단일 finalizer task가 생성되거나, 최소한 finalizer 성격의 task가 추가됨
   - 기대: summary와 tasks가 같은 목적을 공유함

3. `planId` 없이 일반 `/go`
   - 기대: 기존 동작 유지
   - 기대: 기존 결과 참조가 없으므로 dependency는 비어도 정상

4. 기존 plan 결과가 존재하지만 `planId`가 잘못되었을 때
   - 기대: 확인 필요 메시지 또는 dependency 미연결 상태로 명확히 표시

## 7. 결론
현재 구조는 `planId` 기반 결과 재참조와 finalizer task 생성을 지원하지 않는다.

따라서 이번 문제는 “planId를 읽는 기능이 없음” + “세션 task 결과를 plan dependency로 변환하는 기능이 없음” + “통합본 finalizer 생성 기능이 없음”의 조합으로 발생했다.

최소 수정 방향은:
- `planId` 추출
- 기존 결과 탐색
- finalizer task 생성
- `dependsOn`/`providedDependencies` 연결
- provenance 기록

이 순서로 가면 기존 `/go` 흐름을 크게 흔들지 않고도 최종 통합본 생성 구조를 추가할 수 있다.
