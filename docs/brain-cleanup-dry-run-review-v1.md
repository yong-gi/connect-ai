# Brain Cleanup Dry-Run Review v1

## 1. dry-run 요약

`docs/brain-cleanup-dry-run-v1.md` 기준 요약은 아래와 같다.

- `scannedFiles`: 230
- `KEEP`: 134
- `ARCHIVE_CANDIDATE`: 79
- `SUMMARY_CANDIDATE`: 6
- `DELETE_CANDIDATE`: 0
- `REVIEW_REQUIRED`: 11

## 2. 분류 결과 평가

### 2.1 KEEP 분류

KEEP 분류는 전반적으로 적절하다.

특히 아래 자료는 현재 정책과 직접 연결되므로 KEEP이 맞다.

- `identity`
- `goals`
- `decisions`
- role definitions 관련 파일
- `company_state.json`
- `_company/_shared`
- `_company/_agents`

다만 KEEP 항목 중 `sensitive:masked`가 붙은 파일은 내용상 민감정보가 포함될 가능성이 있으므로, 보존은 하되 접근 방식은 별도로 관리하는 것이 좋다.

### 2.2 ARCHIVE 후보

ARCHIVE 후보 79개는 과도하지 않은 수준으로 보인다.

이 범주는 주로 반복 세션, 실행 실험, 과거 테스트 기록에 해당하므로 archive 후보로 분류하는 방향이 타당하다.

특히 `_company/sessions` 하위 반복 기록은 현재 상태를 설명하는 운영 지식보다 테스트 흔적에 가까운 경우가 많다.

### 2.3 SUMMARY 후보

SUMMARY 후보 6개는 타당하다.

원문을 그대로 보관하기보다 요약본이 더 유용한 경우에만 잡혀 있는 것으로 보인다.

대표적으로 다음 성격의 자료가 포함된다.

- 5060 AI 수익화 강의 반복 산출물
- 동일 목표의 Researcher / Writer / CEO 반복 산출물
- role routing 중복 실험 기록

### 2.4 DELETE 후보

DELETE_CANDIDATE가 0인 것은 안전한 상태다.

현재 단계에서는 실제 삭제보다 archive와 요약이 우선이므로, 삭제 후보가 없다는 것은 보수적으로 잘 분류되었음을 의미한다.

### 2.5 REVIEW_REQUIRED 후보

REVIEW_REQUIRED 11개는 직접 검토가 필요하다.

이 범주는 자동 분류만으로는 운영 지식인지 테스트 기록인지 명확하지 않은 항목들이다.

따라서 이 후보들은 사람이 직접 열어 보고 보존/아카이브/요약/삭제 중 하나로 재분류해야 한다.

## 3. 우선 검토 대상

우선 검토 대상은 아래 순서가 적절하다.

### 3.1 REVIEW_REQUIRED 항목

다음 유형이 우선 검토 대상이다.

- `_company/.gitignore`
- `_company/00_Raw/conversations/*.md`
- `00_Raw/2026-05-21/*`

이 항목들은 운영 지식일 수도 있고, 단순 원문/테스트 찌꺼기일 수도 있어서 자동 판단만으로는 부족하다.

### 3.2 SUMMARY_CANDIDATE 항목

SUMMARY_CANDIDATE는 1차로 요약 문서 생성 여부를 판단해야 한다.

특히 반복된 5060 AI 수익화 강의 산출물과 역할 반복 산출물은 원문 다수를 유지하기보다 요약본 하나로 대체하는 편이 낫다.

### 3.3 민감정보 탐지 matchedRules가 있는 항목

`matchedRules`에 `sensitive:masked`가 붙은 항목은 우선적으로 검토해야 한다.

이 항목들은 KEEP이라도 민감정보가 포함되었을 가능성이 있으므로, 접근/보관 정책을 다시 확인해야 한다.

### 3.4 현재 상태와 충돌 가능성 있는 항목

현재 상태와 충돌할 가능성이 있는 항목은 다음과 같은 성격을 가진다.

- 오래된 우선순위를 말하게 할 수 있는 과거 판단 기록
- 이미 정책 문서로 대체된 운영 판단
- 현재 model routing policy와 충돌할 수 있는 오래된 실험 기록

이런 항목은 보존 여부를 current-state와 model-routing-policy 문서와 대조해서 확인해야 한다.

## 4. 바로 archive해도 되는 후보

실제 이동은 하지 않더라도, 아래 유형은 riskLevel이 medium 이하라면 1차 archive 계획 수립 대상이 될 수 있다.

- 반복 테스트 세션
- auto-safe 테스트 기록
- run-plan 테스트 기록
- cancel-plan 테스트 기록
- delegate 테스트 기록
- Gemini OpenAI-compatible 실패 테스트 기록

이 항목들은 현재 운영 기준을 직접 설명하기보다는, 과거 실험을 보여주는 성격이 강하다.

## 5. 아직 archive하면 안 되는 후보

아래 항목은 아직 archive하면 안 된다.

- `identity`
- `goals`
- `decisions`
- role definitions
- `secretary / CEO / model routing / current state` 관련 항목
- `company_state.json`
- `_company/_shared`
- `_company/_agents`

이들은 현재 정책과 운영 기준을 구성하는 핵심 자료이므로, archive 전 보존 여부를 다시 확인해야 한다.

## 6. 다음 액션 제안

다음 단계는 아래 순서가 적절하다.

1. `REVIEW_REQUIRED` 항목 먼저 수동 검토
2. `SUMMARY_CANDIDATE` 요약 문서 생성
3. `ARCHIVE_CANDIDATE` 중 안전한 것만 1차 archive 계획 수립
4. 실제 이동 전 backup 여부 확인

이 순서를 따르면 삭제나 이동으로 인한 기준 손실을 줄일 수 있다.

## 7. 결론

현재 상태에서는 아직 삭제하지 않는다.

다음 단계는 아래 둘 중 하나다.

- `brain-archive-move-plan-v1`
- `SUMMARY_CANDIDATE` 요약 문서

즉, 지금 필요한 것은 삭제가 아니라, 검토와 archive 계획의 확정이다.

