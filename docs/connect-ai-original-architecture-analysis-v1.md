# Connect AI Original Architecture Analysis v1

## 1. 제품 정체성

Connect AI는 단순 채팅 확장기가 아니라, VS Code 안에서 동작하는 `1인 기업 운영 체제`에 가깝다.

핵심 목적은 다음 네 축이다.
- UI에서 사용자의 의도를 받는다.
- brain 폴더의 현재 상태와 과거 작업 기록을 읽는다.
- CEO가 작업을 분배하고, specialist agent가 역할별 산출물을 만든다.
- 결과와 상태를 tracker / sessions / GitHub sync로 지속 저장한다.

즉, 이 제품은 `UI - brain - tracker - agent - automation`이 한 파이프라인으로 이어지는 구조다.

## 2. 전체 제품 구조

### 2.1 주요 표면

코드 기준 Connect AI에는 크게 아래 표면이 있다.
- VS Code sidebar webview chat
- dashboard / office 패널
- Telegram mobile command bridge
- brain 폴더
- task tracker
- session 결과 저장소

### 2.2 사용자 입력이 흘러가는 방식

사용자가 UI에서 에이전트 또는 명령을 선택하면 보통 다음 중 하나로 흐른다.

1. 단순 대화
- `sendPromptFromExtension()` 또는 sidebar chat 경로로 들어간다.
- 내부적으로 `_handlePrompt()` / `_handleCorporatePrompt()` 계열을 탄다.

2. 역할 기반 작업
- `@researcher`, `@writer` 같은 specialist 라우팅 또는 Telegram `/delegate`, `/go`로 들어간다.
- `buildDelegateTelegramSystemPrompt()` 또는 `buildExternalPlannerTelegramSystemPrompt()`가 플랜을 만든다.
- tracker에 plan/task가 생성된다.

3. 안전 실행 작업
- `/run-safe`, `/run-ready`, `/run-plan` 계열로 들어간다.
- `_runSafeBuildSystemPrompt()`와 `_runSafeExecuteTask()`를 통해 task 단위로 실행된다.

4. CEO 분석
- `/ceo`는 brain context를 읽어 CEO 보고서를 만든다.
- 외부 Gemini 경로와 로컬 fallback 경로가 분리되어 있다.

## 3. 에이전트 구조

### 3.1 공식 registry

현재 코드의 공식 에이전트 registry는 `src/agents.ts`의 `AGENTS`, `AGENT_ORDER`, `SPECIALIST_IDS`다.

코드상 registry에는 10개가 들어 있다.
- ceo
- youtube
- instagram
- designer
- developer
- business
- secretary
- editor
- writer
- researcher

후속 정책 문서에서는 이 중 일부를 사용자 정책상 9개 공식 역할로 재정의했지만, 원래 코드 구조는 위 registry가 기준이다.

### 3.2 에이전트 메타데이터의 저장 위치

에이전트 설명과 UI 표시는 `src/agents.ts`의 `AGENTS` map에서 온다.

각 agent의 다음 정보가 UI와 프롬프트에 쓰인다.
- `name`
- `role`
- `specialty`
- `tagline`
- `profileImage`
- `persona`
- `color`
- `emoji`

### 3.3 brain agent 파일 사용 여부

`goal.md`, `memory.md`, `prompt.md`, `config.md`, `tools.md`는 실제로 프롬프트와 UI에 사용된다.

읽는 경로는 다음과 같다.
- `readAgentGoal(agentId)` → `_agents/{id}/goal.md`
- `readAgentSharedContext(agentId)` → `identity.md`, `goals.md`, `decisions.md`, `memory.md`, skills, templates, verified knowledge, tools
- `readAgentCustomPrompt(agentId)` → `_agents/{id}/prompt.md`, `config.md`
- `listAgentTools(agentId)` → `_agents/{id}/tools/`

즉, brain agent 파일은 단순 기록이 아니라 실제 prompt substrate다.

## 4. brain 구조

### 4.1 localBrainPath / D:\dev\brain

`getCompanyDir()` / `_getBrainDir()`를 통해 brain 루트가 결정되고, 그 아래가 회사 운영 저장소가 된다.

### 4.2 `_company/_shared`

회사 공용 지식의 중심이다.
- `identity.md`
- `goals.md`
- `decisions.md`
- `schedule.md`
- `calendar_cache.md`
- `tracker.json`
- `company_state.json`
- `conversations` raw log

### 4.3 `_company/_agents`

에이전트별 개인 공간이다.
- `goal.md`
- `memory.md`
- `prompt.md`
- `config.md`
- `tools.md`
- `rag_mode.txt`
- `self_rag_criteria.md`
- `verified.md`
- `skills/`

### 4.4 `_company/sessions`

실행 결과 저장소다.
- plan/session 단위 `_report.md`
- task 결과 파일 `task-<id>.md`

`/result`는 `resultPath`를 따라 전문을 읽고, `/results`는 `resultSummary`와 `evidence`를 우선 읽는다.

### 4.5 tracker.json

`tracker.json`은 task DAG의 단일 진실원(single source of truth)이다.

주요 필드:
- `id`
- `title`
- `description`
- `owner`
- `agentIds`
- `status`
- `planId`
- `stage`
- `dependsOn`
- `resultPath`
- `resultSummary`
- `evidence`

### 4.6 company_state.json

`company_state.json`은 회사 메트릭/상태용이다.
- core prompt 근거가 아니다.
- CEO의 판단 근거로 직접 읽히지 않는다.
- 회사 진행률/통계용 보조 상태에 가깝다.

## 5. 명령 구조

### `/ceo`
- `handleTelegramCommand()`의 `/ceo` 분기에서 처리된다.
- `buildExternalCeoTelegramSystemPrompt()` + `_callRoleLLMWithFallback()`를 사용한다.
- 실패 시 로컬 `buildCeoTelegramSystemPrompt()` + `_quickLLMCall()`로 fallback한다.

### `/delegate`
- `handleTelegramCommand()`의 `/delegate` 분기에서 처리된다.
- `_delegateCreatePlan()`를 호출한다.
- 내부적으로 `buildDelegateTelegramSystemPrompt()` 또는 `buildExternalPlannerTelegramSystemPrompt()`를 사용한다.
- tracker에 plan/task를 등록하는 명령이다.

### `/go`
- `/delegate`를 실행한 뒤 Safe Auto를 켜는 모바일 편의 명령이다.
- task 생성 후 `_autoSafeState.enabled = true`로 바꾸고 다음 tick부터 자동 진행시킨다.

### `/run-safe`
- `findTrackerTaskByIdArg()`로 task를 찾는다.
- `_runSafeTaskSequential()` → `_runSafeExecuteTask()`로 이어진다.
- task별 결과 파일을 `sessions/`에 저장하고 tracker를 갱신한다.

### `/status`
- `_statusBuildReport()`가 현재 실행/대기/완료/failed 상태를 요약한다.

### `/results`
- `_resultsBuildReport(planId)`가 tracker의 `resultSummary`, `evidence`, `resultPath`를 요약한다.

### `/result`
- `formatTrackerTaskResult()`로 헤더를 만들고,
- `resultPath`를 따라 세션 파일 전문을 읽는다.

### `/stop`
- `_autoSafeDisable()`로 Safe Auto만 끈다.
- 현재 실행 중인 작업을 강제 종료하는 명령은 아니다.

## 6. LLM 호출 구조

### 6.1 기본 로컬 호출

`_quickLLMCall()`은 로컬 Ollama / LM Studio 계열 호출의 기본 경로다.
- `ollamaUrl`
- `defaultModel`
- `requestTimeout`

가 기본 축이다.

### 6.2 역할 라우팅 래퍼

`_callRoleLLMWithFallback()`는 역할별 라우팅을 덧씌우는 래퍼다.
- 외부 provider가 설정되면 외부 호출
- 실패하면 로컬 fallback
- provider가 없으면 처음부터 로컬

이 함수가 현재 `role routing`의 중심이다.

### 6.3 외부 모델

현재 외부 호출은 두 종류다.
- OpenAI-compatible `/v1/chat/completions`
- Gemini native `generateContent`

둘 다 `_callRoleLLMWithFallback()` 안에 붙어 있다.

### 6.4 로컬 Qwen과 외부 Gemini의 위치

- 로컬 Qwen: `_quickLLMCall()`와 fallback 경로
- 외부 Gemini: `_callGeminiNativeGenerateContent()`
- OpenAI-compatible provider: `_callOpenAICompatibleChatCompletion()`

## 7. 자가검증 구조

### 7.1 UI의 “자가검증 ON”

UI의 자가검증 토글은 별도 LLM을 띄우는 버튼이 아니다.

실제 구현은 agent별 `rag_mode.txt`의 값이다.
- `standard`
- `self-rag`

### 7.2 실제 효과

`self-rag`가 켜지면 `readAgentSharedContext()`가 다음을 추가한다.
- `verified.md` 우선 주입
- self-rag 자가검증 프로토콜
- `self_rag_criteria.md` 사용자 기준

즉, 자가검증은 별도 self-check LLM 호출이 아니라 prompt-level protocol이다.

### 7.3 에이전트별 공통 적용 여부

기본 구조는 에이전트별이다.
- `researcher`
- `writer`
- `business`
- `ceo`
- 기타 specialist 전반

각 agent의 `rag_mode.txt`에 따라 다르게 동작한다.

## 8. 자동화 구조

### 8.1 기존 24시간 Auto Cycle

원래 구조는 `autoCycleEnabled` 기반의 자율 사이클이다.
- idle / timer 기반으로 CEO가 정기적으로 분배한다.
- `dispatch queue`를 사용해 동시 실행 충돌을 막는다.

### 8.2 dispatch queue

`_dispatchQueue`, `_runDispatchWorker()`가 사용자 명령과 자동 사이클을 직렬화한다.
- user priority
- auto priority
- 중복 prompt 억제

### 8.3 tracker DAG

`planId`, `stage`, `dependsOn`로 DAG가 형성된다.
- `/delegate`가 DAG를 생성
- `/run-ready`가 ready task만 실행
- `/run-plan`이 전체 계획을 순차 실행

### 8.4 Safe Auto

우리가 추가한 Safe Auto는 기존 24시간 자율 사이클과 다르다.
- task DAG 기반
- `pending` task만 실행
- dependsOn이 충족된 것만 실행
- `/go`, `/auto-safe-*`, `/run-safe`, `/run-ready`, `/run-plan`으로 제어

즉, 원래 auto cycle은 “상시 자율 대화/분배”, Safe Auto는 “안전한 DAG 실행기”에 가깝다.

## 9. GitHub 백업 구조

UI의 GitHub 백업은 별도 클라우드 서비스가 아니라 `git` 기반 자동 동기화다.

관련 설정:
- `connectAiLab.secondBrainRepo`
- `connectAiLab.companyRepo`

실제 동작:
- brain sync: `_safeGitAutoSync()`
- company sync: `_safeGitAutoSyncCompany()`

특징:
- `git init`
- `fetch`
- `merge --ff-only`
- `push -u origin`

즉, 브레인/회사 폴더를 GitHub 저장소에 백업하는 구조다.

## 10. 현재 커스터마이징과 원래 구조의 차이

현재 우리가 덧붙인 구조는 원래의 “brain + tracker + agent + LLM” 골격 위에 얹힌 것이다.

추가된/강화된 항목:
- Telegram Mobile Control
- `/go`, `/status`, `/results`, `/stop`
- `/help advanced`
- role model routing
- Gemini native provider
- brain archive / dry-run / apply workflow
- current-state sync 문서화

원래 구조에 직접적인 영향을 주는 지점은:
- `readAgentSharedContext()`
- `buildDelegateTelegramSystemPrompt()`
- `buildCeoTelegramBrainContext()`
- `buildCeoTelegramSystemPrompt()`
- `_quickLLMCall()`
- `_callRoleLLMWithFallback()`
- `_runSafeBuildSystemPrompt()`
- `tracker.json`
- `_company/_agents/*`

## 11. Researcher 개선 전 판단

Researcher 품질이 기대에 못 미치면, 가장 먼저 손대야 할 곳은 self-check가 아니다.

우선순위는 아래 순서가 맞다.
1. `_runSafeBuildSystemPrompt()`의 roleRules를 특정 주제 전용이 아니라 범용 품질 원칙 중심으로 다듬는다.
2. Researcher는 먼저 `사용자 목표 / 대상 / 기간 / 제약 / 산출물 형식`을 분해하도록 강제한다.
3. Writer는 먼저 `대상 독자 / 채널 / 산출물 형식 / CTA / 실행 가능성`을 점검하도록 강제한다.
4. 주제별 조건은 agent goal이 아니라 task context에서만 반영한다.
5. `researcher/goal.md`, `writer/goal.md`는 특정 주제 전용이 아니라 범용 역할 원칙을 강화하는 방향이 맞다.
6. `researcher/memory.md`의 오래된 generic AI/SaaS 기록은 필요 시 정리 대상이지만, 이는 주제 고정이 아니라 잡음 제거 관점에서 다룬다.
7. 외부 사실 확인이나 최신 트렌드가 정말 필요한 경우에만 `researcherModel` 외부 사용을 검토한다. 기본은 local Qwen으로 먼저 테스트한다.

즉, Researcher/Writer 개선은 self-rag보다 `task prompt + 범용 roleRules + goal/memory hygiene`가 먼저다. 특정 5060 파일럿을 role level에 고정하기보다, task context에서만 그 조건을 주입하는 편이 구조적으로 안전하다.

## 결론

원작자가 의도한 핵심 구조는 다음으로 보인다.
- VS Code 안의 회사 운영 OS
- brain 폴더를 단일 지식 저장소로 쓰는 구조
- tracker DAG로 작업을 관리하는 구조
- CEO가 분배하고 specialist가 실행하는 구조
- LLM은 로컬 기본값(Qwen)을 쓰되, 필요하면 외부 모델로 확장하는 구조
- UI, Telegram, GitHub sync, automation이 모두 같은 brain을 본다

현재 우리가 덧붙인 구조는 그 위에 얹힌 운영 레이어다.
- 모바일 제어
- Safe Auto
- role routing
- Gemini native
- archive / current-state sync

앞으로 수정할 때 특히 건드리면 안 되는 핵심 경로는:
- `AGENTS` registry와 `readAgentSharedContext()`
- `tracker.json` / `sessions/` 연결
- `_quickLLMCall()` / `_callRoleLLMWithFallback()`
- `buildDelegateTelegramSystemPrompt()` / `buildCeoTelegramBrainContext()`
- `_safeGitAutoSync()` / `_safeGitAutoSyncCompany()`

Researcher/Writer 개선은 `run-safe`의 roleRules부터 시작하고, 그 다음에 agent goal/memory를 정리하는 순서가 가장 안전하다.
