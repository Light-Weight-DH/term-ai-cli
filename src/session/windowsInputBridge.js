export function attachWindowsInputBridge(ptyProcess, { triggerPrefix = "#ai ", onTriggerLine }) {
  let captureEnabled = true;
  const debugInput = process.env.TERM_AI_DEBUG_INPUT === "1";

  const normalizeLine = (value) => value.replace(/\r?\n$/, "");

  const extractTriggerText = (line) => {
    if (line.startsWith(triggerPrefix)) {
      return line.slice(triggerPrefix.length).trim();
    }

    const triggerIndex = line.indexOf(triggerPrefix);
    if (triggerIndex === -1) return null;
    return line.slice(triggerIndex + triggerPrefix.length).trim();
  };

  const resetInputState = () => {};

  const setCaptureEnabled = (enabled) => {
    captureEnabled = enabled;

    process.stdin.setRawMode?.(false);

    if (enabled) {
      process.stdin.resume();
      return;
    }

    process.stdin.pause();
  };

  setCaptureEnabled(true);

  const onData = (data) => {
    if (!captureEnabled) {
      return;
    }

    const raw = data.toString("utf8");
    const line = normalizeLine(raw);

    if (debugInput) {
      process.stderr.write(`\n[term-ai windows data] raw=${JSON.stringify(raw)} line=${JSON.stringify(line)}\n`);
    }

    const requirementText = extractTriggerText(line);
    if (requirementText !== null) {
      if (onTriggerLine) onTriggerLine(requirementText);
      return;
    }

    ptyProcess.write(`${line}\r`);
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
