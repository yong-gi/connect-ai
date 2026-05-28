# Connect AI dependency context inheritance 분석

작성 기준: 현재 워크트리의 `src/extension.ts`, `src/agents.ts`, `package.json` 기준.

## 1. 결론 요약

Connect AI의 dependency/context inheritance는 하나의 단일 계층이 아니라, 서로 다른 4개 층이 겹친 구조다.

1. `role/model routing`
   - `현빈(business/hyunbin)`은 `businessModel` 또는 `hyunbinModel`로 라우팅된다.
   - `Writer`는 `writerModel`로 별도 라우팅된다.
   - `workerModel`은 범용 fallback이며, business/writer의 직접 상위가 아니다.

2. `shared agent context`
   - `readAgentSharedContext()`가 개인 목표, 회사 목표, 정체성, 의사결정, 캘린더, 스케줄, tracker, verified/skills/templates/memory, graph RAG, self-rag 규칙을 순서대로 합친다.

3. `corporate dispatch`
   - CEO가 먼저 플랜 JSON을 만들고, 각 task를 specialist에게 순차 분배한다.
   - 각 specialist는 `buildSpecialistPrompt()` + project memory + agent config + 실데이터(prefetch) + shared context + peer output + recent files context를 합쳐 받는다.

4. `task dependency DAG`
   - `/delegate`로 생성된 tracker task는 `dependsOn`으로 연결된다.
   - template plan에서는 `researcher -> business -> writer -> ceo` 순서가 명시되고, 실제 생성 시 `dependsOn`이 task id로 치환된다.

즉, `현빈 -> Writer`는 모델 상속이 아니라 `task dependency + peer context + shared context`의 조합으로 전달된다.

## 2. 실제 전달 경로

### 2.1 사용자 입력 -> corporate dispatch

- 사용자의 일반 입력은 `SidebarChatProvider._handleCorporatePrompt()`로 들어간다. `src/extension.ts:22796`
- 여기서 먼저 CEO planner가 동작하고, `readAgentSharedContext('ceo')`와 최근 대화가 CEO 컨텍스트에 붙는다. `src/extension.ts:22920` `src/extension.ts:22931` `src/extension.ts:22933`
- CEO가 만든 계획은 JSON으로 파싱된 뒤, 각 task가 specialist에게 순차로 전달된다. `src/extension.ts:23180` `src/extension.ts:23290` `src/extension.ts:23327`

### 2.2 specialist 컨텍스트 합성

specialist 1회 호출마다 시스템 프롬프트는 아래 순서로 합쳐진다.

1. `buildSpecialistPrompt(t.agent)`
2. `_getProjectMemory()`
3. `buildAgentConfigStatus(t.agent)`
4. `prefetchAgentRealtimeData(t.agent)`
5. `readAgentSharedContext(t.agent, { lean })`
6. `peerCtx`
7. `hallucinationGuard`
8. `recentFilesCtx`

근거:
- `src/extension.ts:23327`
- `src/extension.ts:23290`
- `src/extension.ts:23301`
- `src/extension.ts:23305`
- `src/extension.ts:23319`
- `src/extension.ts:23326`

이 구조 때문에 `현빈`이 먼저 받은 데이터나 판단은 이후 `Writer`로 다음 층에서 전달된다.

### 2.3 worker/run-safe 경로

`run-safe`는 별도의 worker-style 경로를 탄다.

- `_runSafeBuildSystemPrompt()`가 task metadata, 같은 plan summary, 완료된 선행 dependency 요약을 붙인다. `src/extension.ts:6600`
- `_runSafeExecuteTask()`는 이를 `roleId` 기반으로 `_callRoleLLMWithFallback()`에 넘긴다. `src/extension.ts:6655`

여기서는 `dependsOn`이 실제 dependency context의 핵심이며, `dependencyKey`는 현재 실행 경로에서 소비되지 않는다.

## 3. 현빈 -> Writer 전달 흐름

### 3.1 delegate planner에서의 선언

`/delegate` 플로우에서 planner가 만든 task는 tracker DAG로 저장된다. `src/extension.ts:6223`

`_delegateTemplateTasks()`에는 다음 하드코딩 dependency가 있다.

- `writer` task는 `researcher`, `business`를 `dependsOn`으로 가진다. `src/extension.ts:10381` `src/extension.ts:10386`
- `ceo` task는 `writer`를 `dependsOn`으로 가진다. `src/extension.ts:10390` `src/extension.ts:10395`

즉 `현빈`은 business role이며, template/plan 구조상 Writer의 선행 노드 역할을 한다.

### 3.2 실제 task id로의 치환

`_delegateCreatePlan()`에서 task가 tracker에 저장될 때, `dependsOn`은 `createdByRef`를 통해 실제 task id로 바뀐다. `src/extension.ts:6263` `src/extension.ts:6282`

핵심:
- `task.key` / `task.agentId` / `task.title` 기준으로 created task id를 저장한다.
- 이후 `resolvedDependsOn`은 `createdByRef.get(ref.toLowerCase()) || ref`로 변환된다.

따라서 `business -> writer` 관계는 문자열 참조가 아니라 실제 task id dependency가 된다.

### 3.3 실행 시 전달

Writer task가 실행되면 `_runSafeDepsSummary()`가 `dependsOn` task를 찾아 `완료된 선행 작업 요약`으로 프롬프트에 넣는다. `src/extension.ts:6567`

이때 실제 전달은 다음과 같다.

- planner가 만든 `business` 산출물
- `peerCtx`에 쌓인 같은 세션 동료 산출물
- `completed deps`에 들어간 선행 task 결과
- `readAgentSharedContext()`의 공통 배경

즉, Writer는 현빈의 결과를 직접 "상속"하는 것이 아니라, dependency summary와 peer context를 통해 간접 상속한다.

## 4. prompt injection 위치

### 4.1 일반 채팅

- `_handlePrompt()`에서 `reqMessages[0]`의 system message를 재작성한다. `src/extension.ts:22172`
- 주입 위치는 `this._systemPrompt + projectMemory + [BACKGROUND CONTEXT] + editor/workspace/brain/internet`다. `src/extension.ts:22212`

### 4.2 corporate dispatch

- `_handleCorporatePrompt()`에서 specialist별 시스템 프롬프트 문자열을 직접 만든다. `src/extension.ts:22796`
- 주입 위치는 `sysPrompt = buildSpecialistPrompt(...) + projectMemory + agentConfigStatus + realtimeData + sharedContext + peerCtx + hallucinationGuard + recentFilesCtx`다. `src/extension.ts:23327`

### 4.3 delegate planner

- `_delegateCreatePlan()`는 planner용 system prompt와 external planner prompt를 분리해서 쓴다. `src/extension.ts:6223`
- 외부 라우팅 경로는 `_callRoleLLMWithFallback()`가 담당한다. `src/extension.ts:2780` `src/extension.ts:2790`

## 5. dependency context merge 방식

### 5.1 shared context merge 순서

`readAgentSharedContext()`의 병합 순서는 아래와 같다.

1. 개인 목표 `goal.md`
2. 회사 목표 `goals.md`
3. 회사 정체성 `identity.md`
4. 결정 로그 `decisions.md`
5. 일정/통합 스케줄
6. 열린 tracker 작업
7. Self-RAG verified 지식
8. skills/
9. templates/
10. 개인 memory
11. Graph RAG brain context
12. Self-RAG 프로토콜
13. 사용자 정의 self-rag 기준
14. tool catalog
15. custom prompt/config

근거:
- `src/extension.ts:8127`
- `src/extension.ts:8141`
- `src/extension.ts:8185`
- `src/extension.ts:8192`
- `src/extension.ts:8200`
- `src/extension.ts:8215`
- `src/extension.ts:8305`
- `src/extension.ts:8365`
- `src/extension.ts:8830`

### 5.2 dependency merge in planner/run-safe

`dependsOn`는 두 곳에서 실제 의미를 가진다.

1. planner/DAG 생성
   - template task의 `dependsOn`가 task id로 변환된다.
2. run-safe execution
   - `completed deps`가 시스템 프롬프트에 포함된다.

이 둘이 합쳐져서 "선행 작업이 끝난 뒤 다음 task가 실행되는" 구조가 된다.

## 6. dependency 누락 가능성

1. `dependencyKey`는 현재 실사용 경로가 없다.
   - 선언/전달은 되지만, 실행/merge에서 소비되지 않는다.
   - 따라서 dependency 표현이 `dependsOn`에만 실려야 안정적이다.

2. `dependsOn` 문자열이 `createdByRef`에 없는 값이면 그대로 남는다.
   - `_delegateCreatePlan()`는 `ref`를 못 찾으면 원문 문자열을 유지한다.
   - 이 경우 later execution에서 task id lookup이 실패할 수 있다.

3. `peerCtx`는 같은 세션에서 이미 생성된 출력만 전달한다.
   - 이전 task가 실패하거나 early return하면, 뒤 task가 기대한 peer evidence가 비어 있을 수 있다.

4. `readAgentSharedContext()`의 `lean` 모드는 context를 줄인다.
   - 실데이터가 많을 때는 좋은데, 일부 깊은 의사결정 맥락은 잘릴 수 있다.

5. `realtimeData`와 `hallucinationGuard`는 prompt 조건부다.
   - prefetch가 없으면 현빈/Writer가 전 단계 데이터에 덜 의존할 수 있다.

6. `buildSpecialistPrompt()` 자체에는 goal/dependency summary가 없다.
   - 실제 의존성은 반드시 뒤에 붙는 `readAgentSharedContext()`, `peerCtx`, `recentFilesCtx` 쪽에서 보완된다.

## 7. 관련 파일 목록

- `src/extension.ts`
  - prompt injection, delegate planner, specialist dispatch, worker/run-safe, dependency merge의 핵심 구현.
- `src/agents.ts`
  - agent id, 이름, 역할, Writer/현빈 정의.
- `package.json`
  - `workerModel`, `writerModel`, `businessModel`, `hyunbinModel` 설정 스키마.
- `docs/connect-ai-original-architecture-analysis-v1.md`
  - 기존 아키텍처 분석 문서. 현재 분석과 교차 검증용.
- `docs/connect-ai-current-state-v1.md`
  - 현재 상태/모델 정책 문서. 모델 라우팅 비교용.
- `docs/model-routing-policy-v1.md`
  - 현빈/Writer/worker 라우팅 정책 문서.

## 8. 확인된 구조 한 줄 요약

`현빈 -> Writer`는 "모델 상속"이 아니라 `delegate DAG + dependsOn id 치환 + shared context + peerCtx + run-safe completed deps`로 전달된다.

