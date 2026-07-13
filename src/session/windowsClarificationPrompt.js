import { spawn } from "child_process";
import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";

export function sanitizeWindowsClarificationAnswer(text) {
  return text
    .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?;]*_/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/(?<![\d;])\d{1,3}(?:;\d+){2,6}_/g, "")
    .replace(/;\d{1,3}(?:;\d+){2,6}_/g, "")
    .trim();
}

export function buildPowerShellClarificationArgs(outputPath) {
  return [
    "-NoProfile",
    "-Command",
    `$answer = [Console]::ReadLine(); Set-Content -LiteralPath '${outputPath.replace(/'/g, "''")}' -Value $answer -NoNewline -Encoding UTF8`
  ];
}

export async function askWindowsClarification(questionText) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "term-ai-clarify-"));
  const outputPath = path.join(tempDir, "answer.txt");

  try {
    process.stdout.write(questionText);

    await new Promise((resolve, reject) => {
      const child = spawn("powershell.exe", buildPowerShellClarificationArgs(outputPath), {
        stdio: ["inherit", "inherit", "pipe"]
      });

      let stderr = "";
      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("error", (err) => {
        reject(new Error(`PowerShell 입력 프롬프트 실행 실패: ${err.message}`));
      });

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`PowerShell 입력 프롬프트 실패 (exit ${code}): ${stderr}`));
          return;
        }

        resolve();
      });
    });

    const answer = await readFile(outputPath, "utf-8");
    return sanitizeWindowsClarificationAnswer(answer);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
