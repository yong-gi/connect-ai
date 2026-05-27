# Connect AI Current State v1

## 1. 문서 목적

이 문서는 현재까지 구현된 Connect AI 기능을 기준점으로 남기기 위한 스냅샷이다.

이후 이 문서는 다음 용도로 사용한다.

- brain 정리 기준점
- 테스트 데이터 정리 기준점
- 다음 개발 우선순위 판단 기준점
- 현재 동작이 언제부터 안정화되었는지 확인하는 기준점

## 2. 현재 완료된 주요 기능

현재 Connect AI에는 아래 기능이 구현되어 있다.

- Telegram Mobile Control v1
- `/go`
- `/status`
- `/results`
- `/stop`
- `/help`
- `/help advanced`
- `/result`
- `/cancel-plan taskId 역추적`
- Safe Auto
- run-plan lock
- role model routing v1
- Gemini native provider
- model routing policy v1

## 3. 안정 태그 목록

현재 git log와 태그 기준으로 확인 가능한 stable 태그는 아래와 같다.

- `stable-telegram-mobile-control-v1`
- `stable-mobile-commands-v1`
- `stable-mobile-go-v1`
- `stable-mobile-status-v1`
- `stable-mobile-ux-v1`
- `stable-role-model-routing-v1`
- `stable-gemini-native-provider-v1`
- `stable-auto-safe-on-off-v1`
- `stable-auto-safe-run-once-v1`
- `stable-auto-safe-timer-v1`
- `stable-brain-grounded-ceo-v1`
- `stable-cancel-plan-v1`
- `stable-dag-plan-v1`
- `stable-delegate-planning-v1`
- `stable-result-command-v1`
- `stable-retry-command-v1`
- `stable-run-plan-lock-v1`
- `stable-run-plan-v1`
- `stable-run-ready-v1`
- `stable-run-safe-v1`
- `stable-telegram-control-v1`

## 4. 모바일 기본 사용 흐름

사용자는 기본적으로 비서/영숙과 대화한다.

실제 모바일 기본 사용 흐름은 아래 4개로 충분하다.

1. `/go 목표`
2. `/status`
3. `/results`
4. `/stop`

`/ceo`는 일반 사용자용 기본 UX가 아니다.  
`/ceo`는 개발, 검증, 고급 테스트에 더 가깝다.

## 5. 역할 구조

Connect AI의 공식 역할 9개는 아래와 같다.

1. CEO
2. 레오
3. 인스타그램
4. 디자이너
5. 코다리
6. 현빈
7. 영숙/비서
8. Writer
9. Researcher

## 6. planner 개념

`planner`는 공식 역할이 아니다.

`plannerModel`은 `/go`, `/delegate`에서 CEO의 작업 분배 기능을 수행할 때 쓰는 내부 purpose다.  
즉, planner는 사용자-facing 역할이 아니라 내부 실행 목적이다.

## 7. 현재 모델 라우팅 정책

현재 라우팅 정책의 핵심은 비용과 품질의 균형이다.

- 비서/영숙/secretary/yeongsuk/assistant: 로컬 Qwen 고정
- CEO: Gemini 우선, 실패 시 Qwen fallback
- 현빈/business: Gemini 우선, 실패 시 Qwen fallback
- planner purpose: Gemini 우선, 실패 시 Qwen fallback
- Researcher: 기본 로컬 Qwen
- Writer: 기본 로컬 Qwen
- 코다리: 기본 로컬 Qwen, 품질 부족 시 외부 검토
- 레오/인스타그램/디자이너: 기본 로컬 Qwen

이 정책의 핵심은 다음과 같다.

- 사용자-facing 입구인 비서/영숙은 외부 API를 타지 않게 유지한다.
- CEO와 일부 고품질 판단 역할만 외부 Gemini를 선택적으로 사용한다.
- 모든 역할을 외부 모델로 덮어쓰지 않는다.

## 8. 현재 권장 settings.json 방향

현재 권장하는 설정 방향은 아래와 같다.

- API Key는 User Settings JSON에만 저장한다.
- 프로젝트 파일에 API Key를 저장하지 않는다.
- `workerModel`은 비워 둔다.
- `plannerModel`, `ceoModel`, `businessModel`, `hyunbinModel`만 `gemini-2.5-flash`로 둔다.
- 나머지 역할별 모델은 비워 두어 기본적으로 로컬 Qwen을 사용하게 한다.
- 실제 API Key는 문서에 절대 쓰지 않는다.

예시:

```json
{
  "connectAiLab.defaultModel": "qwen2.5-coder-7b-instruct",
  "connectAiLab.externalProvider": "gemini",
  "connectAiLab.externalApiKey": "<Gemini API Key>",
  "connectAiLab.externalApiModel": "gemini-2.5-flash",
  "connectAiLab.plannerModel": "gemini-2.5-flash",
  "connectAiLab.ceoModel": "gemini-2.5-flash",
  "connectAiLab.businessModel": "gemini-2.5-flash",
  "connectAiLab.hyunbinModel": "gemini-2.5-flash",
  "connectAiLab.workerModel": "",
  "connectAiLab.researcherModel": "",
  "connectAiLab.writerModel": "",
  "connectAiLab.codariModel": "",
  "connectAiLab.leoModel": "",
  "connectAiLab.instagramModel": "",
  "connectAiLab.designerModel": "",
  "connectAiLab.yeongsukModel": ""
}
```

## 9. 검증된 테스트 결과

현재까지 확인된 테스트 결과는 아래와 같다.

- Gemini native provider에서 `/ceo` 단독 호출 성공
- `/go` 전체 플로우 성공
- planner는 Gemini
- Researcher는 Qwen
- Business/현빈은 Gemini
- Writer는 Qwen
- CEO는 Gemini
- `/status`, `/results`, `/queue`, `/live` 정상 확인
- Safe Auto 완료 후 자동 OFF 확인

## 10. 현재 남은 이슈

현재 남아 있는 이슈는 다음과 같다.

- brain 지식 수가 테스트 반복으로 많이 증가함
- 테스트성 기록과 운영 지식이 섞였을 가능성 있음
- CEO가 오래된 우선순위를 말하는 경우가 있어 current state 정리가 필요함
- Researcher를 외부로 보낼지 로컬로 둘지는 추후 판단 필요
- 코다리는 Qwen 품질 테스트 후 외부 사용 여부 판단 필요

## 11. 다음 우선순위 제안

다음 작업 우선순위는 아래 순서가 적절하다.

1. brain/current state 최신화
2. 테스트 데이터와 운영 지식 분리
3. 결과 품질 개선
4. `/results` 모바일 요약 개선
5. 역할별 prompt 품질 개선
6. 코다리 Qwen 품질 테스트
7. Researcher 외부/로컬 판단 테스트

## 12. 주의사항

- 실제 API Key를 문서화하지 않는다.
- `workerModel`에 Gemini를 넣으면 많은 worker가 외부 API를 탈 수 있으므로 신중히 사용한다.
- 비서/영숙은 사용자-facing 입구이므로 외부 API를 타지 않게 유지한다.
- brain 정리 전에는 현재 상태 문서를 기준점으로 삼는다.
