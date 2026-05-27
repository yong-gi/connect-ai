# Brain Archive Approval List v1

## 1. 문서 목적

이 문서는 `docs/brain-cleanup-dry-run-v1.md`와 `docs/brain-archive-move-plan-v1.md`를 기준으로, 실제 이동 전에 사람이 승인할 수 있는 1차 archive 후보를 정리한 승인 검토 문서다.

이 문서는 실행 문서가 아니다.

즉, 이 문서는 아래 작업을 바로 수행하라는 뜻이 아니다.

- 실제 이동
- 실제 삭제
- archive 폴더 생성

대신, 반복 테스트성이 명확하고 현재 정책과 충돌하지 않는 항목만 1차 승인 후보로 정리한다.

## 2. 1차 archive 승인 기준

1차 archive 승인 기준은 아래와 같다.

- 반복 테스트성 명확
- 현재 정책 / 운영 지식과 직접 관련 없음
- current-state / model-routing-policy와 충돌하지 않음
- `sensitive:masked` 없음

추가로, `requiresManualReview=yes`라도 **명백히 반복 테스트인 경우**만 1차 후보로 분류한다.

## 3. 1차 archive 후보 표

아래 후보들은 `ARCHIVE_CANDIDATE` 중에서도 반복 테스트성이 분명하고, `sensitive:masked`가 없는 항목들만 1차 승인 후보로 묶은 것이다.

| approve | sourcePath | targetArchiveFolder | reason | riskLevel | notes |
| --- | --- | --- | --- | --- | --- |
| YES | `_company/sessions/2026-05-21T11-49/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | 반복된 role routing / session 결과 | medium | _brief / _report 포함 |
| YES | `_company/sessions/2026-05-21T13-58/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | 반복된 role routing / session 결과 | medium | researcher 결과 반복 |
| YES | `_company/sessions/delegate-20260522091131-9zqj/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525035026-9mx5/**` | `D:\dev\brain\_archive\2026-05-duplicate-5060-ai-course-tests\` | 5060 AI 수익화 강의 반복 산출물 | medium | 동일 주제 반복 |
| YES | `_company/sessions/delegate-20260525045548-6ltd/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525053956-4d1p/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525054546-uyrz/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525061048-rora/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525062800-y5qd/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525070547-yocu/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260525082006-ufdi/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526020336-1qbu/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526030028-rtro/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526032507-e65p/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526052231-zfyl/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526054105-o0c7/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526063754-bxr8/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |
| YES | `_company/sessions/delegate-20260526090213-3kwv/**` | `D:\dev\brain\_archive\2026-05-routing-tests\` | delegate 반복 테스트 세션 | medium | task 단위 결과 묶음 |

## 4. 제외 항목

아래 항목은 1차 archive 승인 후보에서 제외한다.

- `sensitive:masked` 항목
- `REVIEW_REQUIRED` 항목
- `identity` 관련 항목
- `goals` 관련 항목
- `decisions` 관련 항목
- `company_state.json`
- `_company/_shared`
- `_company/_agents`
- 운영 지식인지 애매한 항목

이 항목들은 현재 정책과 운영 기준에 직접 연결되거나, 수동 검토가 필요한 자료이므로 1차 승인 후보로 넣지 않는다.

## 5. 수동 확인 필요 항목

다음 항목은 1차 승인 목록에서 제외하고 수동 확인 대상으로 둔다.

- Researcher 외부 / 로컬 판단 자료
- Codari Qwen 품질 판단 자료
- 원문 conversations
- `sensitive:masked` 항목

특히 `sensitive:masked`는 보존과 아카이브 이전에 별도 검토가 필요하다.

## 6. 다음 단계

다음 단계는 아래 순서가 적절하다.

1. 승인 목록 검토
2. archive move dry-run 스크립트 설계 또는 구현
3. 실제 이동 전 백업 확인
4. 이동 후 `/ceo`, `/go`, `/status`, `/results`, `/queue`, `/live` 재검증

이 문서는 그 중 첫 단계인 승인 검토용 기준표로 사용한다.

