# Brain Inventory Report v1

## 1. 문서 목적

이 문서는 `brain` 정리 전 현재 파일과 지식 상태를 파악하기 위한 인벤토리 보고서다.

이 보고서는 다음 용도로 사용한다.

- brain 정리 전 기준점 확보
- 운영 지식과 테스트성 기록 분리의 기초 자료
- 이후 archive / summary / current-state 정리 판단의 기준

## 2. 전체 요약

인벤토리 기준 현재 `D:\dev\brain`의 전체 요약은 아래와 같다.

- 전체 파일 수: 230
- 전체 폴더 수: 60
- 최상위 폴더 수: 2
- 최상위 파일 수: 1

관련 구조 존재 여부:

- `sessions` 관련 파일: 있음 (`_company/sessions`)
- `company` 관련 파일: 있음 (`_company`)
- `shared` 관련 파일: 있음 (`_company/_shared`)
- `tracker` 관련 파일: 있음 (`_company/_shared/tracker.json`)

추가로, 최상위에 `company_state.json`이 존재한다.

## 3. 폴더별 구조 요약

### 3.1 최상위 구조

| 폴더 | 파일 수 | 하위 폴더 수 | 역할 추정 |
| --- | ---: | ---: | --- |
| `_company` | 226 | 57 | company brain / operational knowledge |
| `00_Raw` | 3 | 1 | raw source material / dated conversations |
| `company_state.json` | 1 | - | root metadata / current company state snapshot |

### 3.2 `_company` 하위 구조

| 폴더 | 파일 수 | 하위 폴더 수 | 역할 추정 |
| --- | ---: | ---: | --- |
| `_company/_agents` | 126 | 25 | agent prompts / memories / tools |
| `_company/_shared` | 7 | 0 | shared operational knowledge |
| `_company/00_Raw` | 7 | 1 | raw daily conversations |
| `_company/approvals` | 0 | 2 | approval / escalation artifacts |
| `_company/sessions` | 85 | 24 | delegate / run task sessions |

### 3.3 `00_Raw` 하위 구조

| 폴더 | 파일 수 | 하위 폴더 수 | 역할 추정 |
| --- | ---: | ---: | --- |
| `00_Raw/2026-05-21` | 3 | 0 | raw source material / dated conversations |

### 3.4 구조 해석

- 실제 운영 지식은 주로 `_company/_shared`, `_company/_agents`, `company_state.json` 쪽에 분포한다.
- 테스트 및 실행 결과는 `_company/sessions`에 대량으로 누적되어 있다.
- 원천 대화 로그는 `00_Raw`와 `_company/00_Raw`에 분리되어 있다.
- 현재 구조만 봐도 운영 지식과 테스트 찌꺼기가 섞일 가능성이 높다.

## 4. 최근 생성/수정된 파일

최근 수정 상위 20개를 경로, 시각, 크기, 용도 추정 기준으로 정리했다.

| 경로 | 수정 시각 | 크기(KB) | 용도 추정 |
| --- | --- | ---: | --- |
| `_company\_shared\tracker.json` | 2026-05-27 10:06:13 | 229.3 | shared knowledge / tracker |
| `_company\sessions\delegate-20260527010330-r1fk\task-0334-ffn2.md` | 2026-05-27 10:06:13 | 5.4 | session/result artifact |
| `_company\sessions\delegate-20260527010330-r1fk\task-0334-ksyo.md` | 2026-05-27 10:05:26 | 1.6 | session/result artifact |
| `_company\sessions\delegate-20260527010330-r1fk\task-0334-n6f7.md` | 2026-05-27 10:04:48 | 6.3 | session/result artifact |
| `_company\sessions\delegate-20260527010330-r1fk\task-0333-zwl6.md` | 2026-05-27 10:04:38 | 2.9 | session/result artifact |
| `_company\sessions\delegate-20260527005452-va4l\task-5547-pg3c.md` | 2026-05-27 09:58:45 | 1.8 | session/result artifact |
| `_company\sessions\delegate-20260527005452-va4l\task-5547-dzl0.md` | 2026-05-27 09:57:49 | 1.8 | session/result artifact |
| `_company\sessions\delegate-20260527005452-va4l\task-5547-rwsp.md` | 2026-05-27 09:57:24 | 2.3 | session/result artifact |
| `_company\sessions\delegate-20260527005452-va4l\task-5547-7uv6.md` | 2026-05-27 09:56:58 | 2.8 | session/result artifact |
| `_company\sessions\delegate-20260527001529-lgcu\task-1533-746o.md` | 2026-05-27 09:18:21 | 6.1 | session/result artifact |
| `_company\sessions\delegate-20260527001529-lgcu\task-1533-vu8o.md` | 2026-05-27 09:17:21 | 5.1 | session/result artifact |
| `_company\sessions\delegate-20260527001529-lgcu\task-1533-rwcy.md` | 2026-05-27 09:16:29 | 6.3 | session/result artifact |
| `_company\sessions\delegate-20260527001529-lgcu\task-1533-e17g.md` | 2026-05-27 09:16:20 | 5.8 | session/result artifact |
| `_company\00_Raw\conversations\2026-05-27.md` | 2026-05-27 09:00:58 | 0.7 | raw conversation log |
| `_company\sessions\delegate-20260526101352-bi7s\task-1430-0nvn.md` | 2026-05-26 19:17:13 | 1.5 | session/result artifact |
| `_company\sessions\delegate-20260526101352-bi7s\task-1430-1lcv.md` | 2026-05-26 19:16:30 | 2.4 | session/result artifact |
| `_company\sessions\delegate-20260526101352-bi7s\task-1430-koes.md` | 2026-05-26 19:15:54 | 2.3 | session/result artifact |
| `_company\sessions\delegate-20260526101352-bi7s\task-1430-qeug.md` | 2026-05-26 19:15:28 | 2.6 | session/result artifact |
| `_company\sessions\delegate-20260526090213-3kwv\task-0305-u8i0.md` | 2026-05-26 18:07:02 | 1.5 | session/result artifact |
| `_company\sessions\delegate-20260526090213-3kwv\task-0305-jf2u.md` | 2026-05-26 18:06:09 | 1.8 | session/result artifact |

## 5. 테스트성 기록 후보

경로 패턴 기준으로 테스트성 기록 후보는 아래와 같다.

- `delegate-*` 세션 결과 파일들: 반복 테스트와 작업 분배 실험 기록 가능성이 높음
- `_company/sessions/delegate-20260526050608-ffvv/*`: `5060` 대상 AI 수익화 강의 반복 테스트 후보
- `_company/sessions/delegate-2026052701*/*`: 최근 Telegram / role routing / Gemini native 테스트 후보
- `_company/_shared/tracker.json`: 현재 작업 상태가 많이 누적된 tracker 후보
- `_company/00_Raw/conversations/2026-05-27.md`: 최근 대화 원문 로그 후보

경로만으로는 직접 표식이 약하지만, 내부 내용상 다음 주제일 가능성이 있는 후보도 있다.

- Gemini OpenAI-compatible 실패 테스트
- API key invalid 테스트
- auto-safe 반복 테스트
- run-plan 반복 테스트
- cancel-plan 테스트
- delegate 테스트 세션
- 동일 목적의 중복 session 결과

## 6. 보존 우선 후보

경로 기준으로 보존 우선 후보는 아래와 같다.

- `_company/_shared/identity.md`
- `_company/_shared/goals.md`
- `_company/_shared/decisions.md`
- `_company/_shared/tracker.json`
- `_company/_agents/ceo/*`
- `_company/_agents/secretary/*`
- `company_state.json`

보존 우선 기준은 다음과 같다.

- 운영 지식에 직접 연결된다.
- 역할/라우팅 정책과 연결된다.
- current-state와 비교 기준이 된다.
- 테스트 결과보다 오래 남아야 한다.

## 7. 정리 위험 후보

정리 위험 후보는 아래와 같다.

- 오래된 우선순위를 담고 있을 가능성이 있는 파일
- 이미 완료된 기능을 다음 과제로 말하게 만들 가능성이 있는 파일
- 현재 상태와 충돌할 수 있는 과거 판단 파일
- 중복된 delegate 세션 결과 파일
- 같은 목적의 run-plan / auto-safe / cancel-plan 반복 기록

특히 `_company/sessions/delegate-*`는 대량의 판단 로그가 누적되어 있으므로, 내용 확인 없이 삭제 대상으로 삼으면 위험하다.

## 8. 다음 정리 액션 제안

이 보고서는 삭제 명령이 아니다.  
삭제하지 않고 다음 후보를 제안하는 수준으로만 사용해야 한다.

추천 액션:

- archive 후보만 먼저 분류한다.
- summary로 압축 가능한 후보를 찾는다.
- current-state 문서로 대체 가능한 후보를 찾는다.
- 사람이 직접 확인해야 할 후보를 별도 목록으로 둔다.

정리 방식 후보:

- archive 폴더로 이동
- summary 문서로 압축
- current-state 문서로 대체
- `old/test` prefix 부여

## 9. 주의사항

- 이 보고서는 삭제 명령이 아니다.
- 실제 정리 작업은 별도 브랜치 또는 별도 작업으로 분리한다.
- 운영 지식은 반드시 current-state 문서와 model-routing-policy 문서와 대조한 뒤 판단한다.
- brain 파일 내용 전체를 대량 복사하거나 재작성하지 않는다.
- 삭제 / 이동 / 정리는 이 문서가 아니라 별도 작업에서 수행한다.

