import { Command } from "commander";
import chalk from "chalk";
import { createRequire } from "module";
import readline from "node:readline/promises";
import os from "os";

import { loadConfig, runInitWizard } from "./config/configManager.js";
import { copyToClipboard } from "./session/clipboard.js";
import { injectCommand, spawnShellSession } from "./session/ptyManager.js";
import { attachInputBridge } from "./session/inputBridge.js";
import { attachWindowsInputBridge } from "./session/windowsInputBridge.js";
import { askWindowsClarification } from "./session/windowsClarificationPrompt.js";
import { getProvider } from "./providers/index.js";
import { RequirementEngine } from "./core/requirementEngine.js";

const require = createRequire(import.meta.url);
const packageInfo = require("../package.json");

const program = new Command();

program
  .name("term-ai")
  .description("세션 컨텍스트 + 요구사항 기반 터미널 명령어 생성 어시스턴트");

program
  .command("init")
  .description("AI 프로바이더 설정 마법사 실행")
  .action(async () => {
    await runInitWizard();
  });

program
  .command("run", { isDefault: true })
  .description("셸 세션을 시작하고 '#ai <요구사항>' 입력으로 명령어를 생성받습니다")
  .action(async () => {
    const config = loadConfig();
    if (!config) {
      console.log(chalk.yellow("설정이 없습니다. 먼저 `term-ai init`을 실행하세요."));
      process.exit(1);
    }

    const provider = getProvider(config);
    const platform = os.platform();
    const shellName = platform === "win32" ? "PowerShell/cmd" : (process.env.SHELL || "bash");

    console.log(
      chalk.cyan(
        `\nterm-ai v${packageInfo.version} 세션 시작 (${process.argv[1]}).\n` +
        `명령어가 필요하면 "#ai <요구사항>" 을 입력하고 Enter 하세요.\n` +
        `(예: #ai 로그 파일들 중 100MB 넘는 것만 찾아줘)\n`
      )
    );

    let inputBridge;
    let cleanedUp = false;

    const cleanupInput = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      inputBridge?.dispose?.();
      process.stdin.setRawMode?.(false);
      process.stdin.resume();
    };

    const { ptyProcess, sessionLog, getVisibleLine } = spawnShellSession({ onExit: cleanupInput });
    const engine = new RequirementEngine({ provider, shell: shellName, platform, sessionLog });

    process.once("exit", cleanupInput);
    process.once("SIGINT", () => {
      cleanupInput();
      process.exit(130);
    });
    process.once("SIGTERM", () => {
      cleanupInput();
      process.exit(143);
    });

    const onTriggerLine = async (requirementText) => {
      if (!requirementText) return;

      process.stdout.write(chalk.gray(`\n[AI 처리 중...] "${requirementText}"\n`));

      try {
        let result = await engine.submitMain(requirementText);

        while (result.type === "clarify") {
          inputBridge.setCaptureEnabled(false);
          const questionText =
            `${chalk.yellow(`[AI 되묻기] ${result.question}`)}\n` +
            `${chalk.gray("추가 정보를 바로 입력하세요. 비워두고 Enter를 누르면 취소됩니다.")}\n> `;
          let answer;
          try {
            if (process.platform === "win32") {
              answer = await askWindowsClarification(questionText);
            } else {
              const prompt = readline.createInterface({
                input: process.stdin,
                output: process.stdout
              });
              try {
                answer = (await prompt.question(questionText)).trim();
              } finally {
                prompt.close();
              }
            }
          } finally {
            inputBridge.setCaptureEnabled(true);
          }

          if (!answer) {
            engine.reset();
            process.stdout.write(chalk.gray("[AI 요청을 취소했습니다.]\n"));
            return;
          }

          process.stdout.write(chalk.gray(`[AI 추가 정보] "${answer}"\n`));
          result = await engine.submitFollowUp(answer);
        }

        if (result.type === "command") {
          const copied = await copyToClipboard(result.command, platform);
          process.stdout.write(chalk.green(`\n[생성된 명령어]\n${result.command}\n`));
          if (result.explanation) {
            process.stdout.write(chalk.gray(`(설명: ${result.explanation})\n`));
          }
          process.stdout.write(
            copied
              ? chalk.gray(`[셸 입력줄에 채웠습니다. 클립보드에도 복사했습니다. 검토 후 Enter로 실행하세요.]\n`)
              : chalk.gray(`[셸 입력줄에 채웠습니다. 검토 후 Enter로 실행하세요.]\n`)
          );
          inputBridge.resetInputState();
          inputBridge.setCaptureEnabled(false);
          try {
            await injectCommand(ptyProcess, result.command);
          } finally {
            inputBridge.resetInputState();
            inputBridge.setCaptureEnabled(true);
          }
        } else {
          process.stdout.write(chalk.red(`[오류] 응답을 해석하지 못했습니다:\n${result.raw}\n`));
        }
      } catch (err) {
        inputBridge.setCaptureEnabled(true);
        process.stdout.write(chalk.red(`[오류] ${err.message}\n`));
      }
    };

    inputBridge = process.platform === "win32"
      ? attachWindowsInputBridge(ptyProcess, {
          triggerPrefix: "#ai ",
          getVisibleLine,
          onTriggerLine
        })
      : attachInputBridge(ptyProcess, {
          triggerPrefix: "#ai ",
          getVisibleLine,
          onTriggerLine
        });
  });

program.parseAsync(process.argv);
