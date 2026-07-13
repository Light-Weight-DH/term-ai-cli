import test from "node:test";
import assert from "node:assert/strict";

import { candidatesForPlatform } from "../src/session/clipboard.js";

test("windows clipboard falls back across clip, cmd, and powershell", () => {
  assert.deepEqual(candidatesForPlatform("win32"), [
    { command: "clip.exe", args: [] },
    { command: "cmd.exe", args: ["/c", "clip"] },
    { command: "powershell.exe", args: ["-NoProfile", "-Command", "Set-Clipboard -Value ([Console]::In.ReadToEnd())"] }
  ]);
});
