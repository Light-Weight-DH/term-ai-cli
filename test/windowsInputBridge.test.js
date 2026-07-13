import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";

import { attachWindowsInputBridge } from "../src/session/windowsInputBridge.js";

test("windows input bridge routes #ai lines to the trigger handler", () => {
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
    attachWindowsInputBridge(fakePty, {
      triggerPrefix: "#ai ",
      onTriggerLine: (text) => {
        triggerCalls.push(text);
      }
    });

    fakeStdin.emit("data", Buffer.from("#ai 실행 프로세스 목록\r\n"));

    assert.deepEqual(triggerCalls, ["실행 프로세스 목록"]);
    assert.deepEqual(writes, []);
  } finally {
    Object.defineProperty(process, "stdin", {
      configurable: true,
      value: originalStdin
    });
  }
});

test("windows input bridge forwards normal command lines to the shell", () => {
  const originalStdin = process.stdin;
  const fakeStdin = new EventEmitter();
  fakeStdin.setRawMode = () => {};
  fakeStdin.resume = () => {};
  fakeStdin.pause = () => {};

  const writes = [];
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
    attachWindowsInputBridge(fakePty, {
      triggerPrefix: "#ai ",
      onTriggerLine: () => {}
    });

    fakeStdin.emit("data", Buffer.from("dir\r\n"));

    assert.deepEqual(writes, ["dir\r"]);
  } finally {
    Object.defineProperty(process, "stdin", {
      configurable: true,
      value: originalStdin
    });
  }
});

test("windows input bridge dispose removes stdin listener and restores cooked input", () => {
  const originalStdin = process.stdin;
  const fakeStdin = new EventEmitter();
  const rawModeValues = [];
  let resumed = false;
  fakeStdin.setRawMode = (value) => {
    rawModeValues.push(value);
  };
  fakeStdin.resume = () => {
    resumed = true;
  };
  fakeStdin.pause = () => {};

  const writes = [];
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
    const bridge = attachWindowsInputBridge(fakePty, {
      triggerPrefix: "#ai ",
      onTriggerLine: () => {}
    });

    bridge.dispose();
    fakeStdin.emit("data", Buffer.from("dir\r\n"));

    assert.equal(resumed, true);
    assert.deepEqual(rawModeValues, [false, false]);
    assert.deepEqual(writes, []);
  } finally {
    Object.defineProperty(process, "stdin", {
      configurable: true,
      value: originalStdin
    });
  }
});
