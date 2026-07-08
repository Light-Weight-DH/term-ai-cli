# @icingrain/term-ai

Natural language requirements -> shell commands, directly inside your terminal.

`term-ai` starts an interactive shell session, watches for lines that begin with `#ai `, asks an AI provider to generate a command, then places the generated command back on your shell input line for review before execution. If the request needs more detail, it asks a direct follow-up question in the terminal and keeps that follow-up attached to the same request.

Korean guide: [README-ko.md](README-ko.md)

## What It Does

- Turns Korean or English requests into shell commands.
- Uses the current terminal session only when the request needs context.
- Supports direct typing, paste, and basic zsh/bash history recall for `#ai ...` requests.
- Never auto-runs generated commands. You review the command and press Enter yourself.
- Can use OpenAI API, Codex CLI subscription mode, Anthropic API, Claude Code CLI, or a custom OpenAI-compatible endpoint.

## How It Works

1. Start `term-ai`.
2. Use the shell normally.
3. Type a request with the `#ai ` prefix.
4. `term-ai` decides whether the current request needs session context.
5. If the request is ambiguous, `term-ai` asks a direct follow-up question in the terminal.
6. You answer the follow-up in-place, without typing another `#ai` line.
7. The selected AI provider returns a JSON command response.
8. The command is copied to the clipboard and placed on the shell input line.
9. Press Enter to execute, or edit/cancel it like a normal shell command.

Example:

```text
#ai 네트워크 포트 8000 켜져 있는지 확인
```

Generated command:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

## Install

For global CLI use:

```bash
npm install -g @icingrain/term-ai
```

For local project use:

```bash
npm install @icingrain/term-ai
```

For development from this repository:

```bash
npm install
npm link
```

Then run:

```bash
term-ai
```

## Initial Setup

```bash
term-ai init
```

Available providers:

1. OpenAI API key
2. OpenAI ChatGPT subscription via Codex CLI
3. Anthropic Claude API key
4. Anthropic Claude Code via Claude CLI
5. Custom OpenAI-compatible API endpoint

For Codex CLI mode, install and log in to Codex first:

```bash
codex login
```

For Claude Code CLI mode, install and log in to Claude Code first:

```bash
claude
```

## Usage

Start a session:

```bash
term-ai
```

Ask for a command:

```text
#ai 현재 폴더에서 가장 큰 파일 10개 찾아줘
```

The generated command is shown, copied to the clipboard, and inserted into the shell input line. It is not executed until you press Enter.

If the request is ambiguous, the AI may ask a follow-up question:

```text
#ai 로그 지워줘
```

Then answer directly in the follow-up prompt:

```text
./logs 폴더 안의 7일 지난 로그만
```

## Context Routing

`term-ai` does not always send terminal history to the AI provider.

Self-contained requests skip session context:

```text
#ai 네트워크 포트 8000 켜져 있는지 확인
```

Context-dependent requests include recent terminal output:

```text
#ai 방금 실패한 서버 다시 띄워줘
```

This avoids simple requests being polluted by old terminal output and keeps follow-up questions attached to the current request instead of starting a new one.

## Notes

- macOS and zsh/bash are the primary tested environment.
- Windows native PowerShell/cmd input-line insertion still needs separate QA.
- Generated commands are inserted using bracketed paste on macOS/Linux.
- Session log context is kept in memory and trimmed to a recent window.
- API keys and provider settings are stored outside the project at `~/.term-ai-cli/config.json`.

## Development

Run syntax checks:

```bash
find src -type f -name '*.js' -print0 | xargs -0 -n1 node --check
node --check bin/term-ai
```

## License

Apache License 2.0
