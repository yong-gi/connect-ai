# Connect AI Model Routing Policy v1

## 1. 배경

Connect AI는 외부 API만 사용하는 구조가 아니다.  
로컬 Qwen과 외부 Gemini를 조화롭게 사용해 비용과 품질을 함께 잡는 것이 핵심이다.

사용자는 기본적으로 비서/영숙과 대화한다.  
CEO는 사용자-facing 대화자가 아니라, 내부 의사결정과 작업 분배를 맡는 역할이다.

즉, Connect AI의 모델 라우팅은 단순히 "가장 강한 모델을 모든 역할에 붙이는 방식"이 아니라,  
역할별 책임과 비용, 품질, 안전성을 함께 고려하는 정책이어야 한다.

## 2. 공식 역할 9개

Connect AI의 공식 역할은 아래 9개다.

1. CEO
2. 레오
3. 인스타그램
4. 디자이너
5. 코다리
6. 현빈
7. 영숙/비서
8. Writer
9. Researcher

## 3. planner에 대한 설명

`planner`는 공식 역할이 아니다.  
`plannerModel`은 `/go`, `/delegate`에서 CEO의 작업 분배 기능을 수행할 때 쓰는 내부 purpose다.

따라서 `planner`를 사용자-facing 역할로 추가하지 않는다.  
사용자가 직접 "planner"와 대화하는 UX는 만들지 않는다.

`plannerModel`은 CEO의 분배 품질을 높이기 위한 내부 라우팅이며,  
역할 체계에는 포함하지 않는다.

## 4. 모델 라우팅 정책 v1

### 4.1 영숙/비서/secretary/yeongsuk/assistant

- 항상 로컬 Qwen `defaultModel`을 사용한다.
- 외부 API로 라우팅하지 않는다.
- `workerModel`, `externalApiModel`, `Gemini` 경로를 타지 않는다.

### 4.2 CEO

- Gemini 우선
- 실패 시 Qwen fallback
- 내부 의사결정과 작업 분배 품질을 높이는 역할로 사용한다.

### 4.3 현빈 / business / hyunbin

- Gemini 우선
- 실패 시 Qwen fallback
- 비즈니스 판단, 수익화, 가격, 전략 의사결정에 사용한다.

### 4.4 planner purpose

- Gemini 우선
- 실패 시 Qwen fallback
- `/go`, `/delegate`에서 CEO의 작업 분배 기능을 수행할 때 사용한다.

### 4.5 코다리 / codari / developer

- 기본 로컬 Qwen
- 품질이 부족하거나 더 강한 검토가 필요할 때만 외부 검토를 고려한다.

### 4.6 Researcher

- 기본 로컬 Qwen
- 외부 사실 확인이 필요한 경우는 추후 외부 검토 대상으로 본다.

### 4.7 Writer

- 기본 로컬 Qwen

### 4.8 레오 / YouTube

- 기본 로컬 Qwen

### 4.9 인스타그램

- 기본 로컬 Qwen

### 4.10 디자이너

- 기본 로컬 Qwen

## 5. settings.json 권장 예시

아래는 권장 예시다.

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

주의:
- API Key는 절대 문서에 실제 값으로 넣지 않는다.
- `workerModel`은 비워 두는 것을 권장한다.
- `plannerModel`, `ceoModel`, `businessModel`, `hyunbinModel`만 Gemini로 두는 것이 v1의 기본 예시다.
- 나머지 역할은 비워 두어 기본적으로 로컬 Qwen을 사용하게 한다.

## 6. 테스트 기준

v1 정책 기준으로 아래 동작을 확인한다.

- `/go` 실행 시 planner는 Gemini
- Researcher는 Qwen
- Business/현빈은 Gemini
- Writer는 Qwen
- CEO는 Gemini
- `/status` 완료 4개
- `/results` 결과 표시
- `/queue` 비어 있음
- `/live` Safe Auto OFF

## 7. 운영 주의사항

- API Key는 User Settings JSON에만 저장한다.
- 프로젝트 파일에 키를 저장하지 않는다.
- `workerModel`에 Gemini를 넣으면 여러 worker가 외부 API를 탈 수 있으므로 신중히 사용한다.
- 테스트를 반복하면 brain 지식이 계속 늘어나므로, 추후 테스트 데이터 정리가 필요하다.

## 8. 현재 완료 상태

- Telegram Mobile Control v1 완료
- `/go`, `/status`, `/results`, `/stop` 완료
- Safe Auto 완료
- role model routing v1 완료
- Gemini native provider 완료
- role routing policy v1 완료
