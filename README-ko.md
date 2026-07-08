# @icingrain/term-ai

`term-ai`는 터미널 안에서 자연어 요구사항을 받아 셸 명령어로 바꿔주는 CLI입니다. `#ai`로 시작하는 한 줄을 입력하면 AI가 명령어를 만들고, 그 명령어를 셸 입력줄에 채워 넣습니다. 사용자가 Enter를 눌러야 실제 실행됩니다.

## 동작 방식

1. `term-ai`를 실행하면 인터랙티브 셸 세션이 시작됩니다.
2. 일반 셸 사용은 그대로 가능합니다.
3. `#ai <요구사항>`을 입력하면 AI가 명령어를 생성합니다.
4. 필요하면 현재 세션 기록을 참고해 판단합니다.
5. 요구사항이 애매하면 터미널 안에서 바로 추가 질문을 합니다.
6. 추가 질문에는 `#ai`를 다시 쓰지 말고, 바로 텍스트로 답합니다.
7. 생성된 명령어는 클립보드에 복사되고 셸 입력줄에도 채워집니다.
8. Enter를 누르면 실행되고, 수정하거나 취소할 수도 있습니다.

## 설치

전역 설치:

```bash
npm install -g @icingrain/term-ai
```

개발용 로컬 설치:

```bash
npm install
npm link
```

## 초기 설정

```bash
term-ai init
```

설정할 수 있는 프로바이더는 다음과 같습니다.

- OpenAI API 키
- OpenAI ChatGPT 구독 기반 Codex CLI
- Anthropic Claude API 키
- Claude Code CLI
- OpenAI 호환 커스텀 엔드포인트

Codex CLI를 쓰려면 먼저 로그인해야 합니다.

```bash
codex login
```

Claude Code를 쓰려면 Claude CLI도 설치되어 있어야 합니다.

```bash
claude
```

## 사용 예시

```text
#ai 네트워크 포트 8000 켜져 있는지 확인
```

애매한 요청이라면 추가 질문이 나옵니다.

```text
#ai 실행 프로세스 목록
```

그 다음에는 바로 이렇게 답합니다.

```text
코덱스 세션에서 모델 사용량 현황
```

## 주의 사항

- macOS 기준으로 먼저 검증했습니다.
- Windows native 셸 동작은 별도 확인이 필요합니다.
- 생성된 명령어는 자동 실행되지 않습니다.
- 세션 기록은 필요할 때만 참고합니다.
- 설정 파일은 프로젝트 안이 아니라 `~/.term-ai-cli/config.json`에 저장됩니다.
