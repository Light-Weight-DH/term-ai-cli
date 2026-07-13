import pty from "node-pty";
import os from "os";

// 세션 로그를 메모리 링버퍼로 유지 (최근 N바이트/줄만 보관 -> LLM 프롬프트 컨텍스트 크기 관리)
export class SessionLog {
  constructor(maxBytes = 20000) {
    this.maxBytes = maxBytes;
    this.buffer = "";
    this.cwd = os.homedir();
  }

  append(chunk) {
    this.buffer += chunk;
    if (this.buffer.length > this.maxBytes) {
      this.buffer = this.buffer.slice(this.buffer.length - this.maxBytes);
    }
  }

  // 최근 N줄만 추출 (프롬프트에 넣을 때 사용)
  tail(lines = 200) {
    const all = this.buffer.split(/\r?\n/);
    return all.slice(-lines).join("\n");
  }

  snapshot() {
    return {
      cwd: this.cwd,
      recentOutput: this.tail(200)
    };
  }
}

class VisibleLineTracker {
  constructor() {
    this.line = "";
  }

  append(chunk) {
    const text = stripTerminalControls(chunk);

    for (const ch of text) {
      if (ch === "\r" || ch === "\n") {
        this.line = "";
        continue;
      }

      if (ch === "\b" || ch.charCodeAt(0) === 127) {
        this.line = this.line.slice(0, -1);
        continue;
      }

      if (ch >= " ") {
        this.line += ch;
      }
    }
  }

  currentLine() {
    return this.line;
  }
}

function stripTerminalControls(text) {
  return text
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/\x1b[()][A-Za-z0-9]/g, "");
}

export function detectDefaultShell() {
  if (process.platform === "win32") {
    // PowerShell 우선, 없으면 cmd.exe
    return process.env.COMSPEC ? "powershell.exe" : "cmd.exe";
  }
  return process.env.SHELL || "/bin/bash";
}

// 실제 셸을 PTY로 스폰하고, 출력을 그대로 사용자 터미널에 중계하면서
// 동시에 SessionLog에도 기록한다. stdin 처리는 inputBridge.js에서 별도로 담당
// (트리거 문자열 감지를 위해 raw passthrough와 분리해야 하기 때문).
export function spawnShellSession({ onExit } = {}) {
  const shell = detectDefaultShell();
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 30;

  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols,
    rows,
    cwd: process.cwd(),
    env: process.env
  });

  const sessionLog = new SessionLog();
  const visibleLineTracker = new VisibleLineTracker();

  ptyProcess.onData((data) => {
    sessionLog.append(data);
    visibleLineTracker.append(data);
    process.stdout.write(data);
  });

  process.stdout.on("resize", () => {
    ptyProcess.resize(process.stdout.columns, process.stdout.rows);
  });

  ptyProcess.onExit(() => {
    process.stdin.setRawMode?.(false);
    onExit?.();
    process.exit(0);
  });

  return {
    ptyProcess,
    sessionLog,
    getVisibleLine: () => visibleLineTracker.currentLine()
  };
}

// AI가 생성한 명령어를 세션에 그대로 타이핑하듯 주입 (실행은 사용자가 Enter로 확정)
export function injectCommand(ptyProcess, commandText) {
  if (process.platform === "win32") {
    ptyProcess.write(commandText);
    return Promise.resolve();
  }

  ptyProcess.write("\x03");

  return new Promise((resolve) => {
    setTimeout(() => {
      ptyProcess.write(`\x1b[200~${commandText}\x1b[201~`);
      resolve();
    }, 50);
  });
}
