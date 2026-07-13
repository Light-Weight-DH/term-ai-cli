import { spawn } from "child_process";

export function candidatesForPlatform(platform) {
  if (platform === "darwin") {
    return [{ command: "pbcopy", args: [] }];
  }

  if (platform === "win32") {
    return [
      { command: "clip.exe", args: [] },
      { command: "cmd.exe", args: ["/c", "clip"] },
      { command: "powershell.exe", args: ["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"] }
    ];
  }

  return [
    { command: "wl-copy", args: [] },
    { command: "xclip", args: ["-selection", "clipboard"] },
    { command: "xsel", args: ["--clipboard", "--input"] }
  ];
}

function runClipboardCommand({ command, args }, text) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] });

    child.on("error", () => {
      resolve(false);
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.stdin.end(text, "utf-8");
  });
}

export async function copyToClipboard(text, platform = process.platform) {
  for (const candidate of candidatesForPlatform(platform)) {
    const copied = await runClipboardCommand(candidate, text);
    if (copied) return true;
  }

  return false;
}
