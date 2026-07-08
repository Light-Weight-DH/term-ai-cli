import * as openaiApiKey from "./openaiApiKey.js";
import * as openaiSubscription from "./openaiSubscription.js";
import * as anthropic from "./anthropic.js";
import * as claudeCode from "./claudeCode.js";
import * as custom from "./custom.js";

const registry = {
  openai_api_key: openaiApiKey,
  openai_subscription: openaiSubscription,
  anthropic: anthropic,
  claude_code: claudeCode,
  custom: custom
};

export function getProvider(config) {
  const impl = registry[config.provider];
  if (!impl) {
    throw new Error(`알 수 없는 provider: ${config.provider}`);
  }
  return {
    generate: (args) => impl.generate({ config, ...args })
  };
}
