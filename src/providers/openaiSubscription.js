import { spawn } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";

export function buildCodexArgs({ model, outputPath, ignoreUserConfig = false } = {}) {
  const args = ["exec", "--skip-git-repo-check", "--ephemeral"];

  if (ignoreUserConfig) {
    args.push("--ignore-user-config");
  }

  if (outputPath) {
    args.push("--output-last-message", outputPath);
  }

  if (model) {
    args.push("--model", model);
  }

  args.push("-");
  return args;
}

export function extractCodexStdout(stdout) {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.at(-1) || "";
}

function hasUnexpectedOption(error, option) {
  return String(error.message).includes(`unexpected argument '${option}'`);
}

function hasConfigSchemaError(error) {
  const message = String(error.message);
  return message.includes("Error loading config.toml") && message.includes("invalid type");
}

function buildConfigSchemaError(error) {
  return new Error(
    `${error.message}\n` +
      "Codex CLI 설정 파일이 현재 설치된 codex 버전과 호환되지 않습니다. " +
      "`codex update`로 CLI를 업데이트하거나, `%USERPROFILE%\\.codex\\config.toml`의 features 설정을 현재 버전에 맞게 정리하세요."
  );
}

// 자체 OAuth 재구현 대신, 사용자가 이미 `codex login`으로 인증해둔
// 공식 Codex CLI를 서브프로세스로 실행해서 ChatGPT 구독 기반 사용량을 그대로 활용한다.
// 전제조건: `codex` 바이너리가 PATH에 있고 로그인이 완료되어 있어야 함.
export async function generate({ config, systemPrompt, userPrompt }) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "term-ai-codex-"));
  const outputPath = path.join(tempDir, "last-message.txt");

  try {
    const binary = config.codexBinary || "codex";
    const combinedPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const runCodex = ({ useOutputFile, ignoreUserConfig = false }) => new Promise((resolve, reject) => {
      const args = buildCodexArgs({
        model: config.model,
        outputPath: useOutputFile ? outputPath : null,
        ignoreUserConfig
      });
      const child = spawn(binary, args, {
        shell: process.platform === "win32",
        stdio: ["pipe", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";
      let settled = false;

      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      child.stdout.on("data", (d) => (stdout += d.toString()));
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.stdin.on("error", (err) => {
        fail(new Error(`codex stdin 쓰기 실패: ${err.message}`));
      });

      child.on("error", (err) => {
        fail(
          new Error(
            `codex 실행 파일을 찾을 수 없습니다 (${binary}). 설치 및 'codex login' 완료 여부를 확인하세요. 원본 오류: ${err.message}`
          )
        );
      });

      child.on("close", async (code) => {
        if (settled) return;
        settled = true;

        if (code !== 0) {
          reject(new Error(`codex 실행 실패 (exit ${code}): ${stderr}`));
          return;
        }

        try {
          if (useOutputFile) {
            const lastMessage = await readFile(outputPath, "utf-8");
            resolve(lastMessage.trim() || stdout.trim());
            return;
          }

          resolve(extractCodexStdout(stdout));
        } catch (err) {
          reject(new Error(`codex 응답 파일을 읽을 수 없습니다: ${err.message}`));
        }
      });

      child.stdin.end(combinedPrompt, "utf-8");
    });

    try {
      return await runCodex({ useOutputFile: true });
    } catch (err) {
      if (String(err.message).includes("unexpected argument '--output-last-message'")) {
        return runCodex({ useOutputFile: false });
      }

      if (!hasConfigSchemaError(err)) {
        throw err;
      }

      try {
        return await runCodex({ useOutputFile: true, ignoreUserConfig: true });
      } catch (retryErr) {
        if (hasUnexpectedOption(retryErr, "--ignore-user-config")) {
          throw buildConfigSchemaError(err);
        }

        if (String(retryErr.message).includes("unexpected argument '--output-last-message'")) {
          try {
            return await runCodex({ useOutputFile: false, ignoreUserConfig: true });
          } catch (fallbackErr) {
            if (hasUnexpectedOption(fallbackErr, "--ignore-user-config")) {
              throw buildConfigSchemaError(err);
            }
            throw fallbackErr;
          }
        }

        throw retryErr;
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
