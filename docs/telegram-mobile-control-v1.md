# Telegram Mobile Control v1

밖에서 폰으로 큰 목표를 입력하면 Connect AI가 작업을 나누고, Safe Auto로 실행하고, 결과를 확인하는 구조입니다.

## 기본 사용 흐름

1. `/go 목표`
2. `/status`
3. `/results`
4. 필요하면 `/stop`

## 모바일 기본 명령 설명

### `/go 목표`
- 새 일을 맡깁니다.
- 내부적으로 DAG plan을 생성합니다.
- Safe Auto를 켭니다.
- 자동 실행을 시작합니다.

### `/status`
- 현재 진행 상태를 확인합니다.
- 완료/진행/대기 작업 수를 확인합니다.
- 다음 작업을 확인합니다.

### `/results`
- 현재 또는 최근 plan의 결과 요약을 확인합니다.
- 자세한 결과는 `/result <id>`로 확인합니다.

### `/stop`
- Safe Auto 자동 진행을 중단합니다.
- 현재 실행 중인 작업은 강제 중단하지 않고 끝난 뒤 멈춥니다.

### `/help`
- 기본 사용법을 확인합니다.

## 실제 사용 예시

사용자:

`/go 5060 대상 AI 수익화 강의 사업을 준비해줘. 2주 안에 첫 파일럿 모집글까지 올리고 싶어.`

이후:

`/status`

`/results`

## 고급 명령 정리

### 상태 확인
- `/plan`
- `/live`
- `/queue`
- `/progress <id>`

### 결과 확인
- `/result <id>`

### 정리/복구
- `/cancel-plan <planId 또는 taskId>`
- `/retry <id>`

### 수동 실행
- `/run-safe <id>`
- `/run-ready`
- `/run-plan <planId>`

### Safe Auto
- `/auto-safe-status`
- `/auto-safe-on <planId>`
- `/auto-safe-run-once <planId>`
- `/auto-safe-off`

## 안전 원칙

- 기존 24시간 Auto Cycle과 Safe Auto는 분리되어 있습니다.
- Safe Auto는 tracker DAG 작업만 실행합니다.
- dispatch queue를 사용하지 않습니다.
- Python/API/YouTube/Leo tool을 실행하지 않습니다.
- `dependsOn` 조건이 충족된 작업만 실행합니다.
- 실패 시 자동 진행을 중단합니다.
- `/stop`으로 언제든 자동 진행을 중단할 수 있습니다.

## 자주 쓰는 패턴

### 패턴 A: 새 일 맡기기

`/go ...`

### 패턴 B: 어디까지 됐는지 확인

`/status`

### 패턴 C: 결과 보기

`/results`

### 패턴 D: 멈추기

`/stop`

### 패턴 E: 테스트 plan 정리

`/cancel-plan <taskId 또는 planId>`

## 스모크 테스트 체크리스트

- `/help` 출력 확인
- `/go`로 plan 생성
- `/status`로 진행 확인
- Safe Auto 자동 진행 확인
- `/results`로 결과 확인
- `/stop`으로 중단 확인
- `/cancel-plan` taskId 역추적 확인
- `/live`에서 기존 Auto Cycle OFF 확인

## 현재 한계

- `/stop`은 현재 실행 중인 LLM 작업을 강제 중단하지 않습니다.
- Safe Auto 상태는 in-memory라 VS Code 재시작 시 유지 방식 확인이 필요합니다.
- 결과 품질은 각 agent prompt 품질에 의존합니다.
- `/results`는 요약 중심이며 전문은 `/result <id>`로 확인합니다.

## 다음 개선 후보

- `/go` 품질 보정
- `/results` 요약 품질 개선
- Safe Auto 상태 persistent 저장
- 모바일 알림 메시지 정리
- plan 완료 시 최종 요약 자동 발송
