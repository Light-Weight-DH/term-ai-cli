import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

import { attachInputBridge } from "../src/session/inputBridge.js";

test("resetInputState clears stale trigger text before the next Enter", () => {
  const originalStdin = process.stdin;
  const fakeStdin = new EventEmitter();
  fakeStdin.setRawMode = () => {};
  fakeStdin.resume = () => {};
  fakeStdin.pause = () => {};

  const writes = [];
  const triggerCalls = [];
  const fakePty = {
    write(text) {
      writes.push(text);
    }
  };

  Object.defineProperty(process, "stdin", {
    configurable: true,
    value: fakeStdin
  });

  try {
    const bridge = attachInputBridge(fakePty, {
      triggerPrefix: "#ai ",
      getVisibleLine: () => "",
      onTriggerLine: (text) => {
        triggerCalls.push(text);
      }
    });

    fakeStdin.emit("data", Buffer.from("#ai 실행 프로세스 목록"));
    bridge.resetInputState();
    fakeStdin.emit("data", Buffer.from("\n"));

    assert.equal(triggerCalls.length, 0);
    assert.deepEqual(writes, ["\n"]);
  } finally {
    Object.defineProperty(process, "stdin", {
      configurable: true,
      value: originalStdin
    });
  }
});
