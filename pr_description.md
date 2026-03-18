## 개요
KidsEdu 유아 교육 앱 — TTS/오디오 무음 수정, 두더지잡기 반응 버그 수정, 게임 완료 스티커 보상 추가, 색칠하기 스케치 그림 22종 추가

## 주요 변경사항

### [P0] TTS/오디오 무음 수정
- AppLayout iOS AudioContext unlock 개선 (빈 문자열 → 공백 문자)
- use-tts cancel 후 50ms 딜레이 추가로 음성 재생 안정화
- sound-manager 동적 AudioContext 생성 및 unlock 처리 강화
- SpeakGamePage, BalloonGamePage 오디오 재생 안정화

### [P0] 두더지잡기 무반응 수정
- WhackAMoleGamePage gameStateRef로 stale closure 버그 해결
- spawnMole 타이머가 최신 게임 상태를 참조하도록 수정

### [P1] 게임 완료 시 스티커 보상
- gamification-store에 checkAndGrantStickers 액션 추가
- use-game-logic finish()에서 자동으로 스티커 부여 호출
- RewardCelebration에 새 스티커 스프링 애니메이션 표시
- QuizGamePage 결과 화면에 보상 스티커 표시 연동

### [P1] 색칠하기 스케치 그림 추가
- 22종 Canvas2D 스케치 드로잉 데이터 추가 (sketches.ts 신규)
  - 동물 7종, 탈것 5종, 자연 5종, 기타 5종
- ColoringGamePage 전면 리팩토링 — 카테고리 탭 + 썸네일 미리보기 + 스케치 기반 캔버스
- data/index.ts에 sketches export 추가

### E2E 테스트
- 색칠하기 스케치, 게임 보상 스티커, 두더지잡기 E2E 테스트 3건 추가
- 전체 E2E 테스트 59개 통과 / 0개 실패

## 검증 결과
- 타입 체크: PASS
- 린트: PASS
- 빌드: PASS
- E2E 테스트: 59개 통과 / 0개 실패

## 스크린샷
<!-- 추후 추가 -->

## 체크리스트
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 테스트 통과
- [x] 빌드 성공

🤖 AutoDev로 자동 생성됨
