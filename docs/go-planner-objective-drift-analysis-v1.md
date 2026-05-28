# Connect AI /go Planner Objective Drift Analysis

## 1. 요약

이번 사례의 핵심은 `/go`의 현재 objective가 planner에 전달되지 않은 것이 아니라, 전달은 되었지만 planner가 `최근 세션/대화/brain context`와 `템플릿형 course-pilot 관성`에 끌려가면서 이전 5060 테스트 흐름을 재사용한 것으로 보인다는 점이다.

즉, 문제는 단일 실패가 아니라 다음이 겹친 결과다.

- `/go` objective는 planner prompt에 들어간다.
- 그런데 planner prompt가 `recent session reports`, `recent conversations`, `tracker open tasks`, `brain context`를 함께 읽는다.
- 현재 코드에는 objective mismatch를 사전에 차단하거나, 생성된 plan을 objective와 대조해 reject하는 검증이 없다.
- 그래서 LLM이 이전 5060 course/pilot 패턴을 그대로 따라가도 통과한다.

이번 케이스에서 가장 유력한 원인은 `prompt contamination + validation 부재`다.

## 2. 확인된 사실

### 2.1 `/go` objective는 planner prompt에 들어간다

- `/go` 처리에서 `_delegateCreatePlan(goal)`가 호출된다.
- 여기서 `goal`은 그대로 `buildExternalPlannerTelegramSystemPrompt(goal)`의 `focus`로 들어간다.
- 동시에 `_callRoleLLMWithFallback()`의 `externalUserPrompt`와 `localUserPrompt`에도 그대로 전달된다.

즉, objective 누락이 아니라 objective가 다른 문맥과 섞이는 문제가 더 가깝다.

### 2.2 planner prompt는 최근 세션과 대화 로그를 강하게 참고한다

`buildExternalPlannerTelegramSystemPrompt(goal)`는 `_buildExternalRoutingContext({ focus: goal, roleLabel: 'planner' })`를 사용한다.

`_buildExternalRoutingContext()`는 아래를 함께 넣는다.

- `_shared/identity.md`
- `_shared/goals.md`
- `_shared/decisions.md`
- tracker open tasks
- `readRecentSessionReports(1, 200)`
- `readRecentConversations(500)`

즉, planner는 현재 objective 외에도 최근 결과물과 회사 대화의 tail을 본다. 최근 5060 테스트가 세션/대화에 남아 있으면, planner가 그 흐름을 따라갈 수 있다.

### 2.3 local fallback planner도 최근 컨텍스트를 강하게 읽는다

`_callRoleLLMWithFallback()`에서 외부 planner가 실패하면 `buildDelegateTelegramSystemPrompt()`를 쓰는 local fallback으로 간다.

이 fallback은 `buildCeoTelegramBrainContext()`를 읽는데, 여기에도 다음이 들어간다.

- identity / goals / decisions
- tracker open tasks
- `readRecentSessionReports(2, 250)`
- `readRecentConversations(500)`

즉, 외부 planner가 실패해도 local fallback은 최근 5060 세션과 대화 영향을 그대로 받을 수 있다.

### 2.4 objective mismatch 검증이 없다

현재 `_delegateCreatePlan()`에는 다음만 있다.

- JSON 파싱 실패 시, template 여부와 무관하게 실패 반환 또는 template fallback
- task를 생성할 때 title 중복 정도만 부분 검사
- `goal`과 `title/description`의 의미적 일치 여부를 reject하는 로직 없음

즉, plan이 objective와 어긋나도 “왜 5060인가?”를 막는 방어선이 없다.

### 2.5 template/fallback 관성도 있다

직접적인 이번 원인은 아닐 가능성이 높지만, 다음 관성은 위험하다.

- `_delegateIsCoursePilotTemplateGoal(goal)`는 `5060 + AI + (강의|수익화|파일럿|모집글)` 조합을 course-pilot template로 본다.
- `_delegateNormalizeTasks()`는 template mode에서 기본 코스 플로우를 우선 깔고, 그 위에 parsed task를 추가한다.
- `_delegateTemplateTasks()`는 researcher/business/writer/ceo 기본 골격을 제공한다.

이번 입력은 `5060`이 없어서 이 template switch 자체는 직접 발동하지 않았을 가능성이 높다. 그래도 이 계열의 고정 패턴은 목적 drift를 유도하는 배경 요인이다.

## 3. 이번 케이스의 원인 후보

### 1순위: 최근 5060 세션/대화 컨텍스트 오염

근거:

- planner prompt가 `readRecentSessionReports()`와 `readRecentConversations()`를 포함한다.
- local fallback도 같은 계열의 최근 세션/대화 정보를 읽는다.
- 리포트 저장/운영 로그 문서에 5060 course 테스트 흔적이 반복적으로 남아 있다.

해석:

- objective가 “이번 주 AI 교육 모임 90분 실습형 강의안”이더라도,
- 최근 세션이 “5060 수익화 강의 / 파일럿 모집”이면,
- planner가 그 패턴을 안전한 기본값처럼 재사용했을 가능성이 있다.

### 2순위: objective mismatch 검증 부재

근거:

- plan 생성 후 objective와 task를 대조해 reject하는 코드가 없다.
- task title/description이 objective에서 멀어져도 통과한다.
- 특히 `5060`, `수익화`, `파일럿`, `모집글` 같은 과거 테스트 키워드가 들어와도 차단하지 않는다.

해석:

- planner가 잘못된 방향으로 만들어도 시스템이 그걸 “틀림”으로 인식하지 못한다.

### 3순위: fallback/template 관성

근거:

- course-pilot 계열 템플릿은 강의/파일럿/모집글과 쉽게 연결된다.
- `2주 파일럿 실행계획과 우선순위 최종 정리` 같은 CEO 기본 타이틀이 코스/파일럿 흐름에 가깝다.
- task normalization이 큰 틀의 역할 골격을 고정한다.

해석:

- 이번 케이스의 직접 원인은 아니더라도, planner가 방향을 잃었을 때 다시 5060형 코스로 돌아가기 쉬운 구조다.

### 4순위: tracker / brain context의 과도한 일반 참조

근거:

- `readRecentSessionReports()`는 최신 세션 `_report.md`를 그대로 넣는다.
- `readRecentConversations()`는 최근 회사 대화 tail을 넣는다.
- `buildCeoTelegramBrainContext()`는 최근 세션 보고서와 최근 대화까지 포함한다.

해석:

- context는 풍부하지만, planner 입장에서는 “현재 objective”보다 “최근 반복 작업”이 더 강한 힌트가 될 수 있다.

## 4. 관련 함수와 파일

### `src/extension.ts`

핵심 분석 대상 함수:

- `/go` 처리부: `if (cmd === '/go') { ... }`
- `_delegateCreatePlan(goal)`
- `buildExternalPlannerTelegramSystemPrompt(goal)`
- `buildDelegateTelegramSystemPrompt()`
- `_buildExternalRoutingContext(opts)`
- `readRecentSessionReports()`
- `readRecentConversations()`
- `buildCeoTelegramBrainContext()`
- `_delegateIsCoursePilotTemplateGoal(goal)`
- `_delegateNormalizeTasks(goal, parsed)`
- `_delegateTemplateTasks(goal, dueAt?)`
- `_delegateRewriteSafeTask(task, goal, inferredDueAt?)`
- `_delegateParsePlan(raw)`
- `_delegateHasSemanticOverlap(a, b)`
- `_delegateHasDuplicateTitle(title)`

### 문서/기록 파일

- `docs/connect-ai-operation-test-log-v1.md`
- `docs/connect-ai-current-state-v1.md`
- `docs/model-routing-policy-v1.md`

이 문서들은 runtime prompt에 직접 들어가진 않더라도, 운영상 동일한 5060 테스트 패턴이 반복되었음을 보여주는 기록이다.

## 5. objective mismatch 방지 설계안

### 설계 원칙

1. 현재 `/go` objective를 절대 우선한다.
2. 최근 세션과 대화는 참고만 하고, objective를 덮지 못하게 한다.
3. planner가 objective와 다른 테마를 내면 계획을 수락하지 않는다.
4. 5060 course-pilot 패턴은 명시적으로 그럴 때만 쓰게 한다.

### 최소 수정안

#### A. planner prompt에 objective lock 문구 추가

예시:

- “이번 objective 외의 과거 테스트 주제를 재사용하지 말 것”
- “최근 세션은 참고만 하고, 현재 objective를 최우선으로 유지할 것”
- “모든 task title/description은 현재 objective의 핵심 대상·형식·목표를 직접 반영할 것”

#### B. recent session / conversation 주입을 planner에서 약화

가장 안전한 방향은 planner용 context에서 최근 세션 요약을 줄이거나, objective 관련성이 있을 때만 넣는 것이다.

예:

- 최근 세션 보고서 기본 제외
- 또는 150~200자 미만으로 축소
- 또는 goal 키워드와 session summary가 의미적으로 겹칠 때만 include

#### C. plan 생성 후 objective mismatch 검증 추가

후처리 검증 규칙 예시:

- goal에 `AI 교육`, `실습형`, `90분`, `초보자`, `결과물`이 있는데 task가 `5060`, `수익화`, `파일럿 모집` 위주면 reject
- planner summary나 task title/description에 `5060`이 들어가는데 goal에 그런 맥락이 없으면 reject
- `title/description`이 objective 핵심 명사와 전혀 겹치지 않으면 retry

#### D. template fallback의 발동 조건을 더 엄격하게

현재처럼 broad regex로 course/pilot 템플릿을 타는 구조는 위험하다.

권장:

- `강의` 단독으로 template을 열지 않기
- `5060 + AI + 수익화/파일럿/모집글`처럼 명시적인 조합일 때만 template 사용
- 아니면 일반 planner로 처리

#### E. reject 후 재시도 프롬프트를 별도로 둔다

첫 plan이 mismatch면 즉시 버리지 말고,

- “현재 objective만 사용”
- “과거 5060 템플릿 금지”
- “AI 초보자 / 90분 / 실습형 / 결과물 1개” 같은 핵심 제약을 재강조

후 재시도하는 방식이 좋다.

## 6. 테스트 케이스 제안

### 케이스 1. 이번 재현 케이스

- 입력: `이번 주 AI 교육 모임에서 사용할 90분짜리 실습형 강의안을 준비해줘. 대상은 AI 초보자이고, 목표는 참가자가 수업 안에서 직접 결과물 하나를 만들어보는 것이다.`
- 기대:
  - `5060`
  - `수익화`
  - `파일럿 모집`
  - `사업 구조`
  가 plan에 들어가지 않아야 한다.
  - 연구/비즈니스/Writer/CEO task가 있어도 모두 현재 교육 모임 목적에 맞아야 한다.

### 케이스 2. 명시적 5060 course goal

- 입력: `/go 5060 대상 AI 수익화 강의 사업을 준비해줘. 2주 안에 첫 파일럿 모집글까지 올리고 싶어.`
- 기대:
  - course-pilot template 또는 이에 준하는 구조가 허용될 수 있다.
  - 단, 여전히 task가 objective와 맞아야 한다.

### 케이스 3. 일반 업무형 목표

- 입력: `/go 다음 주 고객사 미팅 자료를 1시간 안에 정리해줘.`
- 기대:
  - course-pilot 템플릿이 나오면 안 된다.
  - meeting brief / summary / action items 쪽으로 가야 한다.

### 케이스 4. 최근 세션 오염 회귀 테스트

- 직전 세션에 5060 course/pilot 관련 리포트가 존재하는 상태에서
- 전혀 다른 목표를 넣고
- planner가 과거 주제를 재사용하지 않는지 확인한다.

### 케이스 5. planner fallback 테스트

- 외부 planner를 실패시킨 뒤 local fallback이 실행돼도
- 동일 objective가 유지되는지 확인한다.

## 7. 결론

이번 사례는 단순히 “프롬프트가 약했다” 수준이 아니다.

- `/go` objective 전달은 정상
- 최근 세션/대화/brain 컨텍스트 주입은 강함
- objective mismatch 검증은 없음
- template/fallback 관성은 존재

그래서 planner가 현재 목표보다 과거 5060 테스트 맥락을 더 강하게 따라간 것으로 보는 것이 타당하다.

### 최소 수정 방향

1. planner context에서 최근 세션/대화 영향 줄이기
2. planner prompt에 objective lock 넣기
3. 생성 후 objective mismatch reject/retry 추가
4. 5060 course-pilot template 조건을 더 엄격하게 좁히기

이 네 가지가 가장 비용 대비 효과가 크다.
