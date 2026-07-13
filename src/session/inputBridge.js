// PTY로 향하는 키 입력을 중계하되, 트리거 접두어(기본 "#ai ") 후보 줄은
// Enter 전까지 셸로 보내지 않고 onTriggerLine 콜백으로 넘긴다.
//
// 주의: 화살표 키로 커서를 이동하며 편집하는 경우까지는 지원하지 않는
// 단순화된 라인 버퍼입니다 (일반적인 타이핑 + 백스페이스만 정확히 추적).
//
// '#'은 bash/zsh/PowerShell에서 주석 문자이므로, 만약 감지에 실패해서
// 그 줄이 실제로 셸에 전달되더라도 대부분 아무 동작 없이 무시됩니다
// (cmd.exe는 예외적으로 에러를 내지만 위험한 부작용은 없음).
export function attachInputBridge(ptyProcess, { triggerPrefix = "#ai ", onTriggerLine, getVisibleLine }) {
  let shadowLine = "";
  let withheldLine = "";
  let isPassthroughLine = false;
  let captureEnabled = true;
  let inputSequenceBuffer = "";
  const debugInput = process.env.TERM_AI_DEBUG_INPUT === "1";
  const pasteStart = "\x1b[200~";
  const pasteEnd = "\x1b[201~";
  const focusIn = "\x1b[I";
  const focusOut = "\x1b[O";
  const ignoredInputSequences = [pasteStart, pasteEnd, focusIn, focusOut];

  const resetLineState = () => {
    shadowLine = "";
    withheldLine = "";
    isPassthroughLine = false;
  };

  const isTriggerCandidate = (line) => triggerPrefix.startsWith(line) || line.startsWith(triggerPrefix);

  const extractTriggerText = (line) => {
    if (line.startsWith(triggerPrefix)) {
      return line.slice(triggerPrefix.length).trim();
    }

    const triggerIndex = line.indexOf(triggerPrefix);
    if (triggerIndex === -1) return null;
    return line.slice(triggerIndex + triggerPrefix.length).trim();
  };

  const splitCompleteInput = (value) => {
    const maxSequenceLength = Math.max(...ignoredInputSequences.map((sequence) => sequence.length));

    for (let suffixLength = 1; suffixLength < maxSequenceLength; suffixLength += 1) {
      const suffix = value.slice(-suffixLength);
      if (ignoredInputSequences.some((sequence) => sequence.startsWith(suffix))) {
        return [value.slice(0, -suffixLength), suffix];
      }
    }

    return [value, ""];
  };

  const stripIgnoredInputSequences = (value) => {
    return ignoredInputSequences.reduce((text, sequence) => text.split(sequence).join(""), value);
  };

  const formatInputBytes = (value) => {
    return [...Buffer.from(value, "utf8")].map((byte) => byte.toString(16).padStart(2, "0")).join(" ");
  };

  const hasTerminalControlInput = (line) => line.includes("\x1b");

  const resetInputState = () => {
    inputSequenceBuffer = "";
    resetLineState();
  };

  const setCaptureEnabled = (enabled) => {
    captureEnabled = enabled;

    if (enabled) {
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      return;
    }

    resetLineState();
    process.stdin.setRawMode?.(false);
    process.stdin.pause();
  };

  setCaptureEnabled(true);

  const onData = (data) => {
    if (!captureEnabled) {
      return;
    }

    inputSequenceBuffer += data.toString("utf8");
    const [completeInput, remainingInput] = splitCompleteInput(inputSequenceBuffer);
    inputSequenceBuffer = remainingInput;
    const str = stripIgnoredInputSequences(completeInput);

    if (debugInput && completeInput) {
      process.stderr.write(`\n[term-ai debug input] raw=${JSON.stringify(completeInput)} hex=${formatInputBytes(completeInput)} parsed=${JSON.stringify(str)}\n`);
    }

    for (const ch of str) {
      const code = ch.charCodeAt(0);

      if (code === 13 || code === 10) {
        // Enter
        const line = shadowLine;
        const visibleLine = getVisibleLine?.() || "";
        const pendingText = withheldLine;
        const shouldPassThrough = isPassthroughLine;
        resetLineState();

        const handleEnter = () => {
          const refreshedVisibleLine = getVisibleLine?.() || visibleLine;

          if (debugInput) {
            process.stderr.write(
              `\n[term-ai debug enter] shadow=${JSON.stringify(line)} visible=${JSON.stringify(refreshedVisibleLine)}\n`
            );
          }

          const requirementText =
            extractTriggerText(line) || (hasTerminalControlInput(line) ? extractTriggerText(refreshedVisibleLine) : null);

          if (requirementText !== null) {
            ptyProcess.write("\x15");
            if (onTriggerLine) onTriggerLine(requirementText);
            return;
          }

          ptyProcess.write(shouldPassThrough ? ch : pendingText + ch);
        };

        if (hasTerminalControlInput(line)) {
          setTimeout(handleEnter, 30);
        } else {
          handleEnter();
        }
        continue;
      }

      if (code === 127 || code === 8) {
        // Backspace
        shadowLine = shadowLine.slice(0, -1);
        if (isPassthroughLine) {
          ptyProcess.write(ch);
        } else {
          withheldLine = withheldLine.slice(0, -1);
        }
        continue;
      }

      shadowLine += ch;
      if (isPassthroughLine) {
        ptyProcess.write(ch);
        continue;
      }

      if (isTriggerCandidate(shadowLine)) {
        withheldLine += ch;
        continue;
      }

      ptyProcess.write(withheldLine + ch);
      withheldLine = "";
      isPassthroughLine = true;
    }
  };

  const dispose = () => {
    captureEnabled = false;
    process.stdin.off("data", onData);
    process.stdin.setRawMode?.(false);
    process.stdin.resume();
  };

  process.stdin.on("data", onData);

  return {
    setCaptureEnabled,
    resetInputState,
    dispose
  };
}
