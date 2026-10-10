# 카메라 모션 게임 POC 결과 (2026-10-10)

## 환경과 적용 방식

- 프로젝트: `zio-playground`의 React 19 / Vite 6 웹 PWA. React Native, Expo, Android/iOS 네이티브 빌드 구성은 없다.
- 렌더링: 기존 React UI와 HTML Canvas 러너. 기존 `motion` 라이브러리는 프로젝트에서 사용 중이지만, 프레임 단위 게임 화면에는 Canvas를 사용했다.
- 카메라: 기존 라이브러리 없음. 브라우저 `getUserMedia`로 전면 카메라를 요청하며 HTTPS 또는 localhost와 카메라 권한이 필요하다.
- 포즈: `@mediapipe/tasks-vision` 1.1.0, Pose Landmarker Lite 모델(float16). 모델과 SIMD WebAssembly 실행 파일을 프로젝트에 포함해 같은 출처에서 로드한다. CPU delegate와 모듈형 Web Worker에서 추론한다. 모델 SHA-256: `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`.
- WebAssembly와 모델 출처: [MediaPipe Vision npm 패키지](https://www.npmjs.com/package/@mediapipe/tasks-vision), [공식 Pose Landmarker Lite 모델](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task). MediaPipe의 Apache 2.0 고지는 `docs/third-party/mediapipe-LICENSE.txt`에 포함했다.
- 실제 시험 환경: Mac, macOS 26.6.2, FaceTime HD 카메라(640×480, 30fps), Google Chrome 154.0.0.0. 합성 영상 스트림(30fps)과 MediaPipe 공식 샘플 사람 사진은 Playwright Headless Chromium 154.0.0.0에서 별도로 시험했다. 스마트폰 기기·모바일 OS·어린이·TV 미러링은 시험하지 못했다.

## 구현 경로

`카메라 영상 → ImageBitmap(최대 약 15fps 제출) → Worker의 Pose Landmarker → 어깨·엉덩이·무릎·발목 8점 → 2.5초 서 있는 자세 보정 → 5프레임 이력/EMA/2프레임 debounce/점프·앉기 cooldown → Canvas 러너 → 운영체제 화면 미러링`

- 화면: `/games/motion-poc`. 게임 목록에 개발용 링크를 추가했으며 기존 게임 수·보상 흐름에는 넣지 않았다.
- 화면 미리보기는 거울처럼 반전하고 랜드마크 좌표도 함께 반전해 좌우 조작을 맞췄다. 카메라·관절선·측정값 표시를 각각 전환할 수 있다.
- 전신이 잘리거나 관절 신뢰도가 낮으면 즉시 게임 입력을 멈춘다. 사람을 350ms 넘게 잃으면 보정값을 초기화한다. 보정 중에는 중앙에 서고 무릎을 펴도록 안내한다.
- WebAssembly와 모델은 첫 실행 시 로드된다. 다운로드 크기는 약 18MB다. 이후에는 PWA 런타임 캐시가 사용된다. 첫 실행은 네트워크가 필요하다.

## 측정 결과

| 항목 | 관측값 | 해석 |
|---|---:|---|
| 실제 Mac 카메라 FPS | 30 | FaceTime HD 카메라 영상 트랙이 `live`, 640×480·30fps로 확인됨 |
| 실제 Mac 카메라 입력 중 Pose FPS | 15 | 2초 간격 3회 측정 모두 15fps. 화면 판정은 `NO_BODY` |
| 실제 Mac 카메라 입력 중 Canvas FPS | 75 | 2초 간격 3회 측정 모두 75fps. 화면 판정은 `NO_BODY` |
| 실제 Mac 카메라 입력 중 1회 추론 | 15~16ms | `NO_BODY` 상태에서 게임 입력 중단 확인. 카메라 앞의 실제 장면은 별도 평가하지 않음 |
| 합성 카메라 FPS | 30~31 | 브라우저가 표시한 영상 프레임 수. 실제 스마트폰 카메라 FPS 아님 |
| Pose 추론 FPS | 15~16 | 한 번에 한 프레임만 Worker에 전송; 설정상 최소 65ms 간격 |
| Canvas 렌더링 FPS | 약 60 | 데스크톱 브라우저의 `requestAnimationFrame` |
| 1회 Pose 추론 시간 | 약 16~19ms | 화면에 표시된 당시 값, 데스크톱 CPU |
| 캡처→게임 렌더 평균 | 약 29~32ms | 합성 사진 좌우 이동·상향 이동 실험의 브라우저 내부 근사값 |
| 몸 움직임 시작→게임 반응 | 미측정 | 사람과 실제 카메라가 없어 산출 불가 |
| TV 표시까지 지연 | 미측정 | 화면 미러링 기기 없음 |

측정 방법: Canvas에서 30fps로 반복 출력한 사람 사진을 가상 카메라 스트림으로 주입하고 4초 정지 후 사진을 좌우 또는 위로 옮겼다. MediaPipe 모델이 실제로 추론해 `BODY_DETECTED`, `MOVING_LEFT`, `MOVING_RIGHT`, `JUMPING` 상태를 냈고, 보정 전·후 게임 동작과 지연 표시를 확인했다. 앉은 사진은 `CALIBRATING` 상태에서 기준 자세로 채택되지 않음을 확인했다. `캡처→렌더` 값은 프레임 생성 시각부터 해당 입력이 적용된 다음 Canvas 프레임까지이며, 신체 움직임이 시작된 순간과 디스플레이·미러링 지연을 포함하지 않는다.

## 동작 인식 결과

| 동작 | 검증한 내용 | 실제 유아 사용성 평가 |
|---|---|---|
| JUMP | 합성 영상 상향 이동에서 MediaPipe `JUMPING` 및 게임 반응 확인. 순수 분류기 테스트에서 중복 점프 억제 확인 | **판정 보류**: 실제 점프 영상 없음 |
| CROUCH | 분류기 좌표 시퀀스에서 `CROUCHING`과 단일 슬라이드 입력 확인. 앉은 자세 보정 차단 확인 | **판정 보류**: 실제 앉기 영상 없음 |
| LEFT | 사진의 수평 이동에서 `MOVING_LEFT`와 게임 반응 확인 | **판정 보류**: 실제 이동 영상 없음 |
| RIGHT | 사진의 수평 이동에서 `MOVING_RIGHT`와 게임 반응 확인 | **판정 보류**: 실제 이동 영상 없음 |

요청된 3단계(안정적 / 사용 가능하지만 개선 필요 / 사용 어려움)는 실제 어린이와 기기에서 동작별 반복 시도가 있어야 부여할 수 있다. 합성 프레임을 그 등급으로 바꾸면 인식률을 과장하게 된다.

## 문제점과 남은 시험

- 조명, 어린아이 체형, 빠른 움직임, 실제 카메라와의 거리·각도에 따른 오검출률을 측정하지 못했다.
- 자세를 확실히 서 있는 상태로 보정해야 하며, 무릎·발목이 화면 밖이면 입력을 멈춘다. 일부 카메라 높이에서는 전신을 담기 어려울 수 있다.
- Worker용 모듈형 SIMD WebAssembly 지원과 첫 다운로드 시간은 실제 대상 Android/iOS 브라우저에서 확인해야 한다.
- 화면 미러링의 지연과 방향, 스마트폰 화면 발열·배터리 소모는 미측정이다. 앱에서 TV 연결·연산을 수행하지 않는다.
- 러너의 장애물·충돌은 측정용 최소 구현이다. 인식 품질 평가는 점수보다 동작 로그와 오검출 횟수를 우선해야 한다.

## 결론

**2. 추가 POC 필요.** 실제 Mac 카메라 → MediaPipe 추론 → 사람 미검출 시 입력 중단을 확인했다. 합성 사람 영상으로는 보정·동작 판정 → 게임 반응까지 확인했다. 교육 앱 적용 가능 여부는 실제 스마트폰 전면 카메라와 어린이의 점프·앉기·좌우 이동을 각각 반복 측정하고, TV 미러링 지연까지 기록한 뒤 결정한다.

### 실제 기기 기록 방법

1. 스마트폰을 고정하고 전신이 보이게 한 뒤 HTTPS에서 `/games/motion-poc`을 열어 카메라 권한을 준다. TV에는 운영체제 화면 미러링을 연결한다.
2. 중앙에서 2.5초 보정한다. 동작별로 최소 10회 수행하고 성공·누락·중복·다른 동작 오검출을 기록한다.
3. 조명과 거리를 바꿔 반복한다. 화면의 카메라 FPS, Pose FPS, 렌더 FPS, 캡처→렌더 값을 기록하고, 고속 촬영 또는 외부 계측으로 몸 움직임 시작→TV 반응 지연을 별도로 측정한다.
