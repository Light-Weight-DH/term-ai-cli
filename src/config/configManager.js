import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import inquirer from "inquirer";

const CONFIG_DIR = path.join(os.homedir(), ".term-ai-cli");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

// PATH 및 몇 가지 흔한 설치 위치에서 codex 실행 파일을 찾아본다.
function detectCodexBinary() {
  const lookupCmd = process.platform === "win32" ? "where codex" : "which codex";
  try {
    const out = execSync(lookupCmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (out.length > 0) return out[0];
  } catch {
    // PATH에 없음 -> 아래 흔한 위치들 직접 확인
  }

  const home = os.homedir();
  const candidates =
    process.platform === "win32"
      ? [
          path.join(process.env.APPDATA || "", "npm", "codex.cmd"),
          path.join(home, "AppData", "Roaming", "npm", "codex.cmd")
        ]
      : [
          "/usr/local/bin/codex",
          "/opt/homebrew/bin/codex",
          path.join(home, ".local", "bin", "codex"),
          path.join(home, ".npm-global", "bin", "codex")
        ];

  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

function detectClaudeBinary() {
  const lookupCmd = process.platform === "win32" ? "where claude" : "which claude";
  try {
    const out = execSync(lookupCmd, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (out.length > 0) return out[0];
  } catch {
    return null;
  }

  return null;
}

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch (err) {
    throw new Error(`설정 파일을 읽을 수 없습니다: ${err.message}`);
  }
}

export function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

// 대화형 초기 설정 마법사 (term-ai init)
export async function runInitWizard() {
  const { provider } = await inquirer.prompt([
    {
      type: "list",
      name: "provider",
      message: "사용할 AI 프로바이더를 선택하세요:",
      choices: [
        { name: "OpenAI (API 키)", value: "openai_api_key" },
        { name: "OpenAI (ChatGPT 구독 - Codex CLI 필요)", value: "openai_subscription" },
        { name: "Anthropic Claude (API 키)", value: "anthropic" },
        { name: "Anthropic Claude Code (Claude CLI 필요)", value: "claude_code" },
        { name: "기타 API (OpenAI 호환 엔드포인트)", value: "custom" }
      ]
    }
  ]);

  let config = { provider };

  if (provider === "openai_api_key") {
    const answers = await inquirer.prompt([
      { type: "password", name: "apiKey", message: "OpenAI API 키:", mask: "*" },
      { type: "input", name: "model", message: "모델명:", default: "gpt-5.5" }
    ]);
    config = { ...config, ...answers };
  } else if (provider === "openai_subscription") {
    console.log(
      "\n주의: 이 모드는 시스템에 공식 OpenAI Codex CLI(`codex`)가 설치되어 있고,\n" +
      "이미 `codex login`으로 ChatGPT 계정 로그인이 완료되어 있어야 합니다.\n"
    );

    const detected = detectCodexBinary();
    if (detected) {
      console.log(`codex 실행 파일을 자동으로 찾았습니다: ${detected}\n`);
    } else {
      console.log("codex 실행 파일을 자동으로 찾지 못했습니다. 경로를 직접 입력해주세요.\n");
    }

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "codexBinary",
        message: "codex 실행 파일 경로(또는 PATH상의 이름):",
        default: detected || "codex"
      },
      { type: "input", name: "model", message: "사용할 모델(선택, 비워두면 codex 기본값 사용):", default: "" }
    ]);

    try {
      execSync(`"${answers.codexBinary}" --version`, { stdio: "ignore" });
    } catch {
      console.log(
        `경고: "${answers.codexBinary}" 를 실행할 수 없었습니다. 설치 여부와 경로를 다시 확인해주세요.\n` +
        `(그래도 일단 이 값으로 저장합니다 - 나중에 config.json에서 직접 수정 가능)`
      );
    }

    config = { ...config, ...answers };
  } else if (provider === "anthropic") {
    const answers = await inquirer.prompt([
      { type: "password", name: "apiKey", message: "Anthropic API 키:", mask: "*" },
      { type: "input", name: "model", message: "모델명:", default: "claude-sonnet-5" }
    ]);
    config = { ...config, ...answers };
  } else if (provider === "claude_code") {
    console.log(
      "\n주의: 이 모드는 시스템에 Claude Code CLI(`claude`)가 설치되어 있고,\n" +
      "이미 Claude 계정 로그인이 완료되어 있어야 합니다.\n"
    );

    const detected = detectClaudeBinary();
    if (detected) {
      console.log(`claude 실행 파일을 자동으로 찾았습니다: ${detected}\n`);
    } else {
      console.log("claude 실행 파일을 자동으로 찾지 못했습니다. 경로를 직접 입력해주세요.\n");
    }

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "claudeBinary",
        message: "claude 실행 파일 경로(또는 PATH상의 이름):",
        default: detected || "claude"
      },
      { type: "input", name: "model", message: "사용할 모델(선택, 비워두면 claude 기본값 사용):", default: "" }
    ]);

    try {
      execSync(`"${answers.claudeBinary}" --version`, { stdio: "ignore" });
    } catch {
      console.log(
        `경고: "${answers.claudeBinary}" 를 실행할 수 없었습니다. 설치 여부와 경로를 다시 확인해주세요.\n` +
        `(그래도 일단 이 값으로 저장합니다 - 나중에 config.json에서 직접 수정 가능)`
      );
    }

    config = { ...config, ...answers };
  } else if (provider === "custom") {
    const answers = await inquirer.prompt([
      { type: "input", name: "endpoint", message: "엔드포인트 URL (예: https://.../v1/chat/completions):" },
      { type: "password", name: "apiKey", message: "API 키 (없으면 빈 값으로 Enter):", mask: "*" },
      { type: "input", name: "model", message: "모델명:" }
    ]);
    config = { ...config, ...answers };
  }

  saveConfig(config);
  console.log(`\n설정이 저장되었습니다: ${CONFIG_PATH}`);
  return config;
}

export { CONFIG_PATH, CONFIG_DIR };
