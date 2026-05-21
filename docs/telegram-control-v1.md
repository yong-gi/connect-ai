# Telegram Control v1 안정화 문서

안정 태그: `stable-telegram-control-v1`

이 문서는 현재 Connect AI 프로젝트에서 **실제로 구현된 Telegram Control v1 기능**만 정리한 운영 문서입니다.  
아래 내용은 코드에 존재하는 동작을 기준으로 작성했으며, 아직 구현되지 않은 기능은 포함하지 않았습니다.

## 현재 구현된 Telegram 명령어

### `/research <주제>`
- 역할: Researcher agent를 직접 호출합니다.
- 동작: 입력한 주제를 `@researcher <주제>` 형태로 정규화한 뒤 라우팅합니다.
- 특징: Secretary/CEO 경로를 우회합니다.

### `/queue`
- 역할: `tracker.json` 기준으로 열려 있는 작업 목록을 보여줍니다.
- 동작: 완료/취소되지 않은 tracker 작업만 Telegram으로 출력합니다.
- 특징: 등록 작업 상태를 확인하는 명령입니다.

### `/progress <id>`
- 역할: 특정 작업의 상세 상태를 보여줍니다.
- 동작: `tracker.json`에서 작업 ID를 전체 일치 또는 `endsWith(id)` 방식으로 찾습니다.
- 출력 항목: title, id 짧은 표시값, status, owner, agentIds, priority, dueAt, createdAt, evidence

### `/live`
- 역할: 현재 실행 상태를 보여줍니다.
- 동작: dispatch queue, 실행 중 작업, 대기 작업, 최근 상태를 읽어서 Telegram으로 출력합니다.
- 특징: 실제 실행/대기 상태 확인용입니다.

## 각 명령어 설명

### `/research`
- Researcher agent를 직접 호출합니다.
- 일반 자연어 triage와 다르게 Secretary를 거치지 않습니다.
- `Leo / YouTube` 도구 실행 경로로 들어가지 않아야 합니다.

### `/queue`
- `tracker.json`에 기록된 열린 작업 목록을 확인합니다.
- 현재 작업 등록 상태를 보는 용도입니다.

### `/progress`
- 특정 작업 하나의 상태를 자세히 확인합니다.
- 작업의 현재 상태, 담당자, 우선순위, 마감일, 증거 기록을 확인할 수 있습니다.

### `/live`
- 실제 dispatch / 실행 상태를 확인합니다.
- 작업 등록 상태가 아니라, 지금 모델이 무엇을 처리 중인지 보는 용도입니다.

## 중요한 개념 정리

- `/queue`와 `/progress`는 `tracker.json` 기준의 **등록 작업 상태**를 보여줍니다.
- `/live`는 **실제 dispatch / 실행 상태** 확인용입니다.
- 일반 자연어 메시지는 Secretary가 작업 등록이나 분기로 처리할 수 있습니다.
- `/research`는 Secretary/CEO를 우회해 researcher로 직접 라우팅합니다.

## 현재 안정 버전까지의 Git 커밋 흐름

아래 커밋 흐름을 기준으로 Telegram Control v1이 안정화되었습니다.

1. `chore: checkpoint working lm studio telegram setup`
2. `feat: add telegram queue and progress commands`
3. `feat: add telegram research command with queue progress`
4. `feat: add telegram live status command`

## 운영 예시

- `/research 바이브코딩으로 5일내 매출 가능한 SaaS 아이디어 조사해줘`
- `/queue`
- `/progress 2407-oj8`
- `/live`

## 주의사항

- 로컬 LLM은 느릴 수 있으므로 `/research`는 필요한 경우만 테스트하는 것이 좋습니다.
- `/queue`에 작업이 있다고 해서 실제 LLM이 계속 실행 중이라는 뜻은 아닙니다.
- 실제 실행 여부는 `/live`로 확인해야 합니다.
- YouTube / Leo tool은 `/research` 경로에서 실행되지 않아야 합니다.

## 다음 개발 후보

아래 항목은 현재 문서 범위 밖의 다음 후보입니다.

- `/project`: CEO 즉시 보고서
- `/delegate`: 자율 작업 등록
- `/result <id>`: 작업 결과 확인

## 요약

Telegram Control v1은 다음의 세 축으로 나뉩니다.

- `Research` 계열: `/research`
- `Tracker` 계열: `/queue`, `/progress`
- `Live status` 계열: `/live`

이 세 가지를 통해 현재는

- 작업을 등록하고,
- 등록된 작업을 조회하고,
- 실제 실행 상태를 확인하는

기본 운영 루프를 사용할 수 있습니다.
