# Brain Archive Strategy v1

## 1. 문서 목적

이 문서는 실제 brain 정리 전에 archive 구조와 dry-run 기준을 정하기 위한 전략 문서다.

핵심 원칙은 삭제보다 아카이브와 검증을 우선하는 것이다.

즉, 이 문서는 다음을 위한 기준점이다.

- 실제 brain 정리 전 archive 구조 설계
- dry-run 검토 기준 정의
- 이동/삭제 전 검증 절차 정리

## 2. 기본 원칙

brain 정리의 기본 원칙은 아래와 같다.

- 바로 삭제하지 않는다.
- 먼저 archive로 이동한다.
- 이동 전 dry-run 목록을 만든다.
- 이동 후 `/ceo`, `/go` 테스트로 검증한다.
- 문제가 있으면 archive에서 복구할 수 있어야 한다.

즉, brain 정리는 "삭제"가 아니라 "분류 → archive → 검증 → 필요 시 복구" 흐름으로 진행한다.

## 3. archive 폴더 구조 제안

권장 archive 루트는 아래와 같다.

```text
D:\dev\brain\_archive\
```

하위 구조는 목적별로 나누는 것이 좋다.

```text
D:\dev\brain\_archive\2026-05-routing-tests\
D:\dev\brain\_archive\2026-05-auto-safe-tests\
D:\dev\brain\_archive\2026-05-run-plan-tests\
D:\dev\brain\_archive\2026-05-cancel-plan-tests\
D:\dev\brain\_archive\2026-05-gemini-openai-compatible-tests\
D:\dev\brain\_archive\2026-05-duplicate-5060-ai-course-tests\
```

### 구조 해석

- `routing-tests`: role routing, planner, CEO, worker 라우팅 실험 기록
- `auto-safe-tests`: Safe Auto on/off, timer, run once 실험 기록
- `run-plan-tests`: run-plan / run-ready / run-safe 관련 기록
- `cancel-plan-tests`: cancel-plan, taskId 역추적, plan 취소 기록
- `gemini-openai-compatible-tests`: Gemini OpenAI-compatible 실패/제한 테스트 기록
- `duplicate-5060-ai-course-tests`: 5060 AI 수익화 강의 반복 산출물

이 구조는 archive가 단순 쓰레기통이 아니라, 나중에 다시 찾을 수 있는 보관소가 되도록 하는 목적이다.

## 4. archive 대상 분류 기준

다음 항목은 archive 후보가 된다.

- 반복 테스트 세션
- 실패한 API 테스트
- 중복된 5060 AI 수익화 강의 결과
- 이미 정책 문서로 대체된 오래된 판단
- 현재 상태와 충돌하는 우선순위 기록

archive 대상은 "더 이상 현재 운영 기준을 설명하지 않지만, 나중에 참고할 가능성이 있는 것"을 우선한다.

## 5. 절대 archive하지 말아야 할 것

다음 자료는 archive 대상이 아니다.

- `identity`
- `goals`
- `decisions` 중 현재 정책과 연결되는 내용
- role definitions
- `company_state.json`
- current state와 model routing policy에 필요한 자료
- 최신 stable 기준을 설명하는 파일

이들은 brain의 기준점 역할을 하므로 archive 전에 반드시 보존 판단을 해야 한다.

## 6. dry-run 출력 형식 제안

실제 이동이나 삭제를 하지 않고 계획만 출력할 때는 CSV 또는 Markdown 표 형식을 권장한다.

권장 컬럼은 아래와 같다.

- `action`
- `sourcePath`
- `targetPath`
- `reason`
- `riskLevel`
- `requiresManualReview`

### Markdown 표 예시

| action | sourcePath | targetPath | reason | riskLevel | requiresManualReview |
| --- | --- | --- | --- | --- | --- |
| MOVE_CANDIDATE | `_company/sessions/...` | `_archive/2026-05-routing-tests/...` | repeated routing test session | medium | yes |
| ARCHIVE_CANDIDATE | `_company/sessions/...` | `_archive/2026-05-auto-safe-tests/...` | auto-safe test session | medium | yes |
| SUMMARY_CANDIDATE | `_company/sessions/...` | `docs/...summary.md` | repeated output better summarized | low | yes |
| DELETE_CANDIDATE | `_company/sessions/...` | `-` | obvious duplicate / invalid test log | high | yes |
| KEEP | `_company/_shared/identity.md` | `-` | operational baseline | none | no |

## 7. dry-run 예시

dry-run은 삭제나 이동을 수행하지 않고 계획만 출력해야 한다.

예시 action 값:

- `MOVE_CANDIDATE`
- `ARCHIVE_CANDIDATE`
- `SUMMARY_CANDIDATE`
- `DELETE_CANDIDATE`
- `KEEP`

예시 해석:

- `MOVE_CANDIDATE`: 아카이브 폴더로 이동할 후보
- `ARCHIVE_CANDIDATE`: 별도 보관이 필요한 후보
- `SUMMARY_CANDIDATE`: 원문보다 요약본이 유용한 후보
- `DELETE_CANDIDATE`: 삭제 후보지만 실제 삭제는 별도 승인 필요
- `KEEP`: 유지 대상

## 8. 실제 정리 전 체크리스트

실제 정리 전에 다음을 확인한다.

- current-state 문서 최신 여부
- model-routing-policy 문서 최신 여부
- brain 백업 여부
- dry-run 결과 수동 검토 여부
- 민감정보 포함 여부
- 정리 후 테스트 명령 준비 여부

이 체크리스트를 통과한 뒤에만 archive 이동이나 삭제 후보 승인을 진행한다.

## 9. 정리 후 검증 명령

archive 이동 이후에는 아래 명령으로 상태를 확인한다.

- `/ceo 현재 Connect AI 프로젝트 다음 우선순위 3개만 알려줘.`
- `/go 5060 대상 AI 수익화 강의 사업을 준비해줘. 2주 안에 첫 파일럿 모집글까지 올리고 싶어.`
- `/status`
- `/results`
- `/queue`
- `/live`

이 검증은 archive 이동이 현재 운영 정책을 깨지 않았는지 확인하기 위한 절차다.

## 10. 다음 액션

다음 단계에서 고려할 액션은 아래와 같다.

- `brain-cleanup-safe` dry-run 스크립트 설계
- 실제 이동/삭제 없이 후보 CSV 생성
- 사람이 승인한 항목만 archive 이동
- archive 후 재검증

이 문서는 실제 brain 정리 작업의 안전한 출발점으로 사용한다.

