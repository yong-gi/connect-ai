# Brain Cleanup Candidates v1

## 1. 문서 목적

이 문서는 실제 삭제 전에 brain 정리 후보를 사람이 검토할 수 있게 분류하기 위한 후보 목록 문서다.

중요한 점은 이 문서가 **삭제 문서가 아니라 후보 목록 문서**라는 것이다.

즉, 이 문서는 다음 작업을 바로 수행하라는 뜻이 아니다.

- 삭제
- 이동
- 아카이브 실행

대신 어떤 것이 보존되어야 하고, 어떤 것이 아카이브/요약/삭제/보류 대상인지 구분하기 위한 기준점을 제공한다.

## 2. 분류 기준

아래 기준으로 brain 후보를 분류한다.

### A. 보존

현재 정책, 역할, 라우팅, 모바일 UX 기준에 필요한 지식은 보존한다.

예시:

- `identity`
- `goals`
- `decisions`
- `role definitions`
- `model routing policy`
- `current state`

### B. 아카이브

과거 테스트 기록이지만 나중에 참고 가치가 있는 것은 아카이브 후보로 둔다.

예시:

- Safe Auto 테스트 세션
- run-plan 테스트 세션
- cancel-plan 테스트 세션
- Gemini OpenAI-compatible 실패 과정

### C. 요약 후 대체

중복이 많아서 원문 전체보다 요약본이 더 유용한 것은 요약 후 대체 후보로 둔다.

예시:

- 반복된 `/go` 테스트 결과
- 5060 AI 수익화 강의 반복 산출물
- 여러 번의 role routing 실험 결과

### D. 삭제 후보

명백한 임시/중복/실패 기록은 삭제 후보로 분류한다.

주의: 실제 삭제는 하지 않고 후보로만 둔다.

예시:

- API key invalid 테스트
- 의미 없는 반복 로그
- 이미 정책 문서로 대체된 오래된 판단

### E. 보류

아직 운영 지식인지 테스트 기록인지 애매한 것은 보류 후보로 둔다.

예시:

- Researcher 외부/로컬 판단 관련 자료
- Codari Qwen 품질 테스트 관련 자료
- 아직 정책이 확정되지 않은 역할 관련 자료

## 3. 보존 후보 목록

보존 후보는 파일/폴더 단위로 보는 것이 우선이다.

### 3.1 최우선 보존 폴더

- `_company/_shared`
- `_company/_agents`
- `company_state.json`

### 3.2 보존 우선 파일군

- `identity` 관련 파일
- `goals` 관련 파일
- `decisions` 관련 파일
- role definitions 관련 파일
- model routing policy와 직접 연결되는 자료
- current state와 연결되는 자료

### 3.3 보존 판단 기준

- 현재 정책과 직접 연결되는가
- 모바일 UX와 직접 연결되는가
- 역할/라우팅 규칙과 직접 연결되는가
- 이후 brain 정리 후에도 기준점 역할을 하는가

## 4. 아카이브 후보 목록

아카이브 후보는 "지우기"가 아니라 "별도 보관"이 목적이다.

### 4.1 sessions 하위 반복 테스트 세션

- `_company/sessions` 하위의 반복 세션
- delegate 테스트 세션
- 동일 목적의 여러 세션 결과

### 4.2 auto-safe 테스트 세션

- auto-safe 반복 테스트
- auto-safe timer 관련 세션
- auto-safe on/off/run-once 실험 기록

### 4.3 run-plan 테스트 세션

- run-plan lock 이전/이후 테스트
- run-ready / run-safe와 함께 반복된 세션

### 4.4 cancel-plan 테스트 세션

- taskId 역추적 전후의 cancel-plan 세션
- plan 단위 취소와 taskId 취소 검증 기록

### 4.5 Gemini OpenAI-compatible 실패 테스트

- Gemini OpenAI-compatible 응답 길이 부족 테스트
- format reject / missing sections 테스트
- local fallback이 발생했던 실험 기록

## 5. 요약 후 대체 후보

원문 전체보다 요약본이 더 유용한 후보는 아래와 같다.

- 5060 AI 수익화 강의 테스트 결과 반복본
- 동일 목표로 생성된 Researcher 결과 반복본
- 동일 목표로 생성된 Writer 결과 반복본
- 동일 목표로 생성된 CEO 결과 반복본
- role routing 실험 과정의 중복 로그

이 항목들은 원문을 계속 보관하기보다, 요약본 하나로 대체하는 방향이 적절하다.

## 6. 삭제 후보

주의: 실제 삭제는 하지 말고 후보로만 작성한다.

삭제 후보는 아래와 같다.

- API key invalid 테스트 결과
- 명백한 실패 로그
- 의미 없는 반복 로그
- 현재 상태와 충돌하는 오래된 우선순위 기록
- 이미 정책 문서로 대체된 과거 판단

삭제 후보는 백업/아카이브/요약 여부를 먼저 확인한 뒤에만 최종 판단해야 한다.

## 7. 보류 후보

아직 운영 지식인지 테스트 기록인지 애매한 자료는 보류한다.

보류 후보 예시는 아래와 같다.

- Researcher 모델 라우팅 판단 자료
- Codari Qwen 품질 테스트 자료
- 아직 정책이 확정되지 않은 역할 관련 자료

보류 후보는 현재 상태 문서와 model-routing-policy 문서로 다시 확인해야 한다.

## 8. 정리 작업 순서 제안

정리 작업은 아래 순서가 안전하다.

1. 보존 후보 먼저 확정
2. 아카이브 후보 이동 계획 수립
3. 요약 후 대체 후보 요약 문서 작성
4. 삭제 후보는 백업 후 마지막에 처리
5. `/ceo`, `/go` 재검증

## 9. 실제 정리 전 체크리스트

실제 정리 전에는 다음을 확인한다.

- current-state 문서 최신 여부 확인
- model-routing-policy 문서 최신 여부 확인
- brain 백업 여부 확인
- 삭제 대상 목록 수동 확인
- API key나 민감정보 포함 여부 확인
- 정리 후 테스트 명령 확인

## 10. 다음 액션

다음 단계에서 검토할 액션은 아래와 같다.

- archive 폴더 구조 제안
- brain cleanup safe script 설계 여부 결정
- 실제 파일 이동/삭제 전 dry-run 방식 설계

