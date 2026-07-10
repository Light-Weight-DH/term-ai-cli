# term-ai CLI Zero to Hero 가이드

이 문서는 `term-ai-cli` 프로젝트를 처음 보는 사람이 **프로젝트 구조, 실행 흐름, 핵심 로직, JavaScript/Node.js 문법, 테스트 방식**까지 한 번에 이해하도록 만든 교육용 가이드입니다.

대상 독자는 다음과 같습니다.

- JavaScript, Node.js, npm, CLI 프로젝트가 무엇인지 아직 모르는 사람
- `term-ai`가 터미널 입력을 어떻게 가로채고 AI 명령어를 셸에 넣는지 알고 싶은 사람
- 이 프로젝트를 유지보수하거나 기능을 추가하려는 사람

이 문서에서 말하는 **Zero**의 기준은 “사용 언어와 런타임, 프레임워크/라이브러리의 차이도 아직 모른다”입니다. 그래서 바로 코드 설명으로 들어가지 않고, 먼저 이 프로젝트를 이해하는 데 필요한 최소 배경지식부터 설명합니다.

---

## 0. 진짜 Zero를 위한 배경지식

이 프로젝트를 이해하려면 다음 질문에 답할 수 있어야 합니다.

- JavaScript는 무엇인가?
- Node.js는 무엇인가?
- npm은 무엇인가?
- CLI 프로그램은 무엇인가?
- 프레임워크와 라이브러리는 무엇이 다른가?
- `package.json`, `src`, `bin`, `test` 같은 폴더는 왜 있는가?

아래 내용을 먼저 이해하면 뒤의 프로젝트 구조와 코드가 훨씬 쉽게 보입니다.

### 0.1 JavaScript란 무엇인가

JavaScript는 원래 웹 브라우저에서 버튼 클릭, 화면 변경, 입력 처리 같은 동작을 만들기 위해 많이 쓰이던 프로그래밍 언어입니다.

예를 들어 브라우저에서 이런 일을 JavaScript로 합니다.

```js
console.log("Hello JavaScript");
```

하지만 지금의 JavaScript는 브라우저 안에서만 쓰이지 않습니다. 서버, CLI, 자동화 도구, 데스크톱 앱, 테스트 도구 등에도 널리 쓰입니다.

이 프로젝트도 JavaScript로 작성되어 있지만, 브라우저에서 실행되는 웹앱이 아닙니다. **터미널에서 실행되는 CLI 프로그램**입니다.

### 0.2 Node.js란 무엇인가

JavaScript 자체는 언어입니다. 언어만 있다고 프로그램이 실행되는 것은 아닙니다. 실행해주는 환경이 필요합니다.

브라우저 밖에서 JavaScript를 실행하게 해주는 대표적인 런타임이 **Node.js**입니다.

```bash
node some-file.js
```

위 명령은 `some-file.js`라는 JavaScript 파일을 Node.js로 실행하라는 뜻입니다.

이 프로젝트의 실행 명령도 결국 Node.js를 사용합니다.

```bash
node src/index.js
```

Node.js가 브라우저 JavaScript와 다른 점은 파일, 운영체제, 프로세스, 터미널 같은 시스템 자원에 접근할 수 있다는 것입니다.

예를 들어 이 프로젝트는 Node.js 덕분에 다음을 할 수 있습니다.

- 설정 파일 읽고 쓰기
- 외부 명령 실행하기
- 실제 셸 프로세스 띄우기
- 터미널 입력과 출력 다루기
- OpenAI/Anthropic API 호출하기

### 0.3 npm이란 무엇인가

**npm**은 Node.js 생태계의 패키지 관리자입니다.

패키지는 다른 사람이 만들어 둔 재사용 가능한 코드 묶음입니다. 이 프로젝트는 모든 기능을 직접 구현하지 않고, 필요한 도구를 npm 패키지로 가져와 씁니다.

예를 들어:

| 패키지 | 왜 쓰는가 |
|---|---|
| `commander` | CLI 명령어를 쉽게 만들기 위해 |
| `chalk` | 터미널 출력에 색을 넣기 위해 |
| `inquirer` | 터미널에서 선택지/비밀번호 입력을 받기 위해 |
| `node-pty` | 실제 셸을 프로그램 안에서 띄우기 위해 |

의존성 설치는 보통 이렇게 합니다.

```bash
npm install
```

테스트 실행은 이렇게 합니다.

```bash
npm test
```

여기서 `npm test`가 실제로 무엇을 실행하는지는 `package.json`의 `scripts`에 적혀 있습니다.

### 0.4 `package.json`이란 무엇인가

`package.json`은 Node.js 프로젝트의 설명서이자 설정 파일입니다.

이 파일에는 보통 다음 정보가 들어갑니다.

- 프로젝트 이름
- 버전
- 실행 명령
- 필요한 패키지 목록
- Node.js 최소 버전
- CLI 명령어로 연결할 파일

이 프로젝트의 핵심 설정은 다음과 같습니다.

```json
{
  "name": "@icingrain/term-ai",
  "version": "0.3.0",
  "type": "module",
  "bin": {
    "term-ai": "./bin/term-ai"
  },
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test"
  }
}
```

이 뜻을 쉽게 풀면 다음과 같습니다.

| 설정 | 의미 |
|---|---|
| `name` | npm 패키지 이름 |
| `version` | 현재 패키지 버전 |
| `type: "module"` | JavaScript 파일에서 ES Module 문법을 사용 |
| `bin` | `term-ai` 명령을 실행하면 `./bin/term-ai`가 실행됨 |
| `scripts.start` | `npm start`를 치면 `node src/index.js` 실행 |
| `scripts.test` | `npm test`를 치면 `node --test` 실행 |

### 0.5 CLI 프로그램이란 무엇인가

CLI는 Command Line Interface의 줄임말입니다. 마우스로 버튼을 누르는 프로그램이 아니라, 터미널에서 명령어로 사용하는 프로그램입니다.

예를 들어 다음은 모두 CLI 사용입니다.

```bash
node --version
npm install
git status
term-ai init
```

이 프로젝트의 결과물도 CLI입니다.

사용자는 다음처럼 실행합니다.

```bash
term-ai
```

그러면 일반 셸처럼 보이는 세션이 시작되고, 사용자는 그 안에서 `#ai ...` 요청을 입력할 수 있습니다.

### 0.6 셸과 터미널은 무엇인가

초보자는 터미널과 셸을 같은 것으로 생각하기 쉽지만, 엄밀히는 다릅니다.

| 용어 | 의미 |
|---|---|
| 터미널 | 사용자가 글자를 입력하고 출력을 보는 창 또는 환경 |
| 셸 | 사용자가 입력한 명령어를 해석해 실행하는 프로그램 |

예를 들어 macOS에서 터미널 앱을 열면 그 안에서 보통 `zsh`라는 셸이 실행됩니다.

이 프로젝트는 `node-pty`를 이용해 프로그램 안에서 실제 셸을 하나 띄웁니다. 그래서 사용자는 `term-ai` 안에서도 평소처럼 `ls`, `cd`, `git status` 같은 명령을 입력할 수 있습니다.

### 0.7 프레임워크와 라이브러리의 차이

이 프로젝트는 React, Next.js, Express 같은 큰 웹 프레임워크를 쓰지 않습니다.

대신 여러 작은 라이브러리를 조합해서 CLI를 만듭니다.

둘의 차이는 이렇게 이해하면 됩니다.

| 구분 | 설명 | 예시 |
|---|---|---|
| 라이브러리 | 내가 필요할 때 불러서 쓰는 도구 | `chalk`, `commander`, `inquirer` |
| 프레임워크 | 전체 구조와 실행 흐름을 어느 정도 정해주는 틀 | React, Next.js, Express |

이 프로젝트에서는 전체 흐름을 프레임워크가 대신 정해주지 않습니다. `src/index.js`가 직접 각 모듈을 조립합니다.

그래서 이 프로젝트를 읽을 때는 “어떤 프레임워크 규칙을 따라야 하지?”보다 “`src/index.js`가 어떤 파일을 어떤 순서로 부르는가?”를 보는 것이 중요합니다.

### 0.8 소스 코드 폴더 이름 감각 잡기

Node.js 프로젝트에서 자주 보이는 폴더 이름은 역할을 암시합니다.

| 이름 | 보통 의미 | 이 프로젝트에서의 역할 |
|---|---|---|
| `bin/` | 실행 파일 위치 | `term-ai` 명령 진입점 |
| `src/` | 실제 소스 코드 | CLI 본체 구현 |
| `test/` | 테스트 코드 | 핵심 로직 단위 테스트 |
| `.github/workflows/` | GitHub Actions 자동화 | 릴리스 자동화 |
| `node_modules/` | 설치된 npm 패키지 | 직접 수정하지 않는 외부 의존성 |

`node_modules/`는 매우 큰 폴더이고, npm이 관리합니다. 보통 직접 읽거나 수정하지 않습니다.

### 0.9 이 프로젝트를 읽기 위한 최소 지도

완전 처음이라면 아래 정도만 기억하고 다음 장으로 넘어가면 됩니다.

```text
JavaScript = 이 프로젝트의 프로그래밍 언어
Node.js    = JavaScript를 터미널/운영체제 위에서 실행하는 런타임
npm        = 필요한 패키지를 설치하고 scripts를 실행하는 도구
CLI        = 터미널에서 명령어로 쓰는 프로그램
라이브러리 = 필요한 기능을 가져다 쓰는 코드 묶음
PTY        = 프로그램 안에서 실제 터미널처럼 셸을 띄우는 기술
```

이제부터는 이 배경지식을 바탕으로 `term-ai-cli` 프로젝트 자체를 살펴봅니다.

---

## 1. 이 프로젝트가 하는 일

`term-ai`는 터미널 안에서 자연어 요구사항을 받아 셸 명령어로 바꿔주는 Node.js 기반 CLI입니다.

사용자는 일반 셸처럼 터미널을 쓰다가 다음처럼 입력합니다.

```text
#ai 네트워크 포트 8000 켜져 있는지 확인
```

그러면 프로그램은 이 줄을 실제 셸 명령으로 실행하지 않고, AI 프로바이더에게 요청을 보냅니다. AI가 명령어를 생성하면 다음처럼 보여주고, 사용자의 셸 입력줄에 명령어를 채워 넣습니다.

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

중요한 점은 **AI가 만든 명령어를 자동 실행하지 않는다는 것**입니다. 사용자가 직접 검토한 뒤 Enter를 눌러야 실행됩니다.

---

## 2. 전체 동작 흐름 한눈에 보기

```text
사용자 실행
  |
  v
bin/term-ai
  |
  v
src/index.js
  |
  +-- term-ai init ---------------> src/config/configManager.js
  |                                  설정 파일 생성: ~/.term-ai-cli/config.json
  |
  +-- term-ai 또는 term-ai run ----> 설정 로드
                                     AI provider 선택
                                     PTY 셸 세션 시작
                                     입력 감지 시작
                                           |
                                           v
                                     사용자가 #ai ... 입력
                                           |
                                           v
                                     src/session/inputBridge.js
                                     일반 입력인지 AI 요청인지 판단
                                           |
                                           v
                                     src/core/requirementEngine.js
                                     요청 상태 관리 + 프롬프트 생성
                                           |
                                           v
                                     src/providers/*.js
                                     OpenAI / Anthropic / Codex / Claude CLI 호출
                                           |
                                           v
                                     JSON 응답 파싱
                                           |
                         +-----------------+-----------------+
                         |                                   |
                         v                                   v
                  clarify 응답                         command 응답
                  추가 질문 출력                      명령어 출력
                  답변을 이어붙임                      클립보드 복사
                                                       셸 입력줄에 주입
```

---

## 3. 프로젝트 구조

현재 프로젝트의 핵심 파일 구조는 다음과 같습니다.

```text
term-ai-cli/
├── .github/
│   └── workflows/
│       └── release.yml
├── bin/
│   └── term-ai
├── src/
│   ├── index.js
│   ├── config/
│   │   └── configManager.js
│   ├── core/
│   │   ├── contextRouter.js
│   │   ├── promptBuilder.js
│   │   └── requirementEngine.js
│   ├── providers/
│   │   ├── anthropic.js
│   │   ├── claudeCode.js
│   │   ├── custom.js
│   │   ├── index.js
│   │   ├── openaiApiKey.js
│   │   └── openaiSubscription.js
│   └── session/
│       ├── clipboard.js
│       ├── inputBridge.js
│       └── ptyManager.js
├── test/
│   ├── inputBridge.test.js
│   └── requirementEngine.test.js
├── package.json
├── package-lock.json
├── .gitignore
├── .gitattributes
├── README.md
├── OFFLINE-INSTALL.md
├── LICENSE
└── ZERO_TO_HERO_GUIDE.md
```

각 영역의 역할은 다음과 같습니다.

| 영역 | 역할 |
|---|---|
| `bin/` | npm 전역 명령어가 실제로 실행하는 진입점 |
| `src/index.js` | CLI 명령 정의, 설정 로드, 전체 실행 흐름 조립 |
| `src/config/` | `term-ai init` 설정 마법사와 설정 파일 저장/로드 |
| `src/core/` | 자연어 요구사항을 AI 요청으로 바꾸는 핵심 로직 |
| `src/providers/` | OpenAI, Anthropic, Codex CLI, Claude CLI 등 AI 호출 어댑터 |
| `src/session/` | 실제 셸 세션, 키 입력 감지, 클립보드 처리 |
| `test/` | Node.js 내장 테스트 러너 기반 단위 테스트 |
| `.github/workflows/` | GitHub Actions 기반 릴리스 자동화 |
| `README.md`, `OFFLINE-INSTALL.md`, `LICENSE` | 사용자 문서, 오프라인 설치 안내, 라이선스 |

---

## 4. 사용된 언어와 런타임

이 프로젝트는 **Node.js 18 이상**에서 동작하는 **JavaScript ES Module** 프로젝트입니다.

`package.json`의 핵심 설정은 다음과 같습니다.

```json
{
  "type": "module",
  "bin": {
    "term-ai": "./bin/term-ai"
  },
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 4.1 `type: "module"`의 의미

`"type": "module"`이 있으면 `.js` 파일에서 CommonJS의 `require()` 대신 ES Module 문법을 기본으로 씁니다.

```js
import chalk from "chalk";
import { Command } from "commander";

export function something() {}
```

이 프로젝트의 대부분 파일이 `import`, `export`를 사용합니다.

단, `src/index.js`에서는 `package.json`을 읽기 위해 `createRequire()`를 사용합니다.

```js
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const packageInfo = require("../package.json");
```

ES Module 환경에서는 일반적으로 `require`가 없기 때문에, JSON 파일을 CommonJS 방식으로 읽고 싶을 때 이렇게 `createRequire()`를 씁니다.

### 4.2 실행 파일 shebang

`bin/term-ai`는 npm이 전역 명령으로 연결하는 실행 파일입니다.

```js
#!/usr/bin/env node
import "../src/index.js";
```

첫 줄 `#!/usr/bin/env node`는 Unix 계열 시스템에서 이 파일을 Node.js로 실행하라는 뜻입니다.

---

## 5. 의존성 이해하기

`package.json` 기준 주요 의존성은 네 가지입니다.

| 패키지 | 사용 위치 | 역할 |
|---|---|---|
| `commander` | `src/index.js` | CLI 명령어 파서 |
| `chalk` | `src/index.js` | 터미널 출력 색상 |
| `inquirer` | `src/config/configManager.js` | 대화형 설정 마법사 |
| `node-pty` | `src/session/ptyManager.js` | 실제 셸을 pseudo-terminal로 실행 |

### 5.1 commander

`commander`는 `term-ai init`, `term-ai run` 같은 CLI 명령을 정의합니다.

```js
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
```

### 5.2 chalk

`chalk`는 터미널 문구에 색을 입힙니다.

```js
console.log(chalk.yellow("설정이 없습니다."));
process.stdout.write(chalk.green("[생성된 명령어]"));
```

### 5.3 inquirer

`inquirer`는 터미널에서 선택지, 비밀번호 입력, 일반 입력 등을 받습니다.

```js
const { provider } = await inquirer.prompt([
  {
    type: "list",
    name: "provider",
    message: "사용할 AI 프로바이더를 선택하세요:",
    choices: [
      { name: "OpenAI (API 키)", value: "openai_api_key" }
    ]
  }
]);
```

### 5.4 node-pty

`node-pty`는 프로그램 안에서 진짜 터미널 셸을 띄우기 위해 씁니다.

```js
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols,
  rows,
  cwd: process.cwd(),
  env: process.env
});
```

`term-ai`가 일반 셸처럼 보이면서도 입력을 중간에서 감지할 수 있는 핵심이 이 부분입니다.

---

## 6. 진입점: `src/index.js`

`src/index.js`는 프로젝트의 조립 담당입니다.

주요 책임은 다음과 같습니다.

1. CLI 명령 정의
2. 설정 로드
3. AI provider 생성
4. 셸 PTY 세션 시작
5. 입력 브리지 연결
6. AI 요청 처리 결과를 셸 입력줄에 주입

### 6.1 `init` 명령

```js
program
  .command("init")
  .description("AI 프로바이더 설정 마법사 실행")
  .action(async () => {
    await runInitWizard();
  });
```

사용자가 `term-ai init`을 실행하면 `runInitWizard()`가 실행됩니다.

이 함수는 `src/config/configManager.js`에 있습니다.

### 6.2 기본 실행 명령

```js
program
  .command("run", { isDefault: true })
  .description("셸 세션을 시작하고 '#ai <요구사항>' 입력으로 명령어를 생성받습니다")
  .action(async () => {
    const config = loadConfig();
    // ...
  });
```

`{ isDefault: true }` 때문에 사용자가 그냥 `term-ai`만 실행해도 `run` 명령이 실행됩니다.

### 6.3 설정이 없을 때

```js
const config = loadConfig();
if (!config) {
  console.log(chalk.yellow("설정이 없습니다. 먼저 `term-ai init`을 실행하세요."));
  process.exit(1);
}
```

설정 파일이 없으면 프로그램은 AI provider를 만들 수 없으므로 종료합니다.

### 6.4 provider 생성

```js
const provider = getProvider(config);
```

`getProvider()`는 설정에 적힌 provider 종류에 맞춰 OpenAI, Anthropic, Codex CLI, Claude CLI, custom provider 중 하나를 선택합니다.

### 6.5 셸 세션 시작

```js
const { ptyProcess, sessionLog, getVisibleLine } = spawnShellSession();
```

여기서 실제 셸이 열립니다.

- `ptyProcess`: 셸에 입력을 쓰거나 출력을 받을 수 있는 객체
- `sessionLog`: 최근 터미널 출력 기록
- `getVisibleLine`: 현재 화면상 입력줄 추적 함수

### 6.6 RequirementEngine 생성

```js
const engine = new RequirementEngine({ provider, shell: shellName, platform, sessionLog });
```

`RequirementEngine`은 자연어 요구사항을 AI 프롬프트로 바꾸고, AI 응답을 `clarify` 또는 `command` 형태로 정리합니다.

### 6.7 입력 브리지 연결

```js
const inputBridge = attachInputBridge(ptyProcess, {
  triggerPrefix: "#ai ",
  getVisibleLine,
  onTriggerLine: async (requirementText) => {
    // AI 처리
  }
});
```

`attachInputBridge()`는 사용자가 치는 키 입력을 감시합니다.

- 일반 입력이면 그대로 셸에 보냅니다.
- `#ai `로 시작하는 줄이면 셸에 보내지 않고 `onTriggerLine` 콜백으로 넘깁니다.

---

## 7. 설정 관리: `src/config/configManager.js`

설정 파일은 프로젝트 내부가 아니라 사용자 홈 디렉토리 아래에 저장됩니다.

```js
const CONFIG_DIR = path.join(os.homedir(), ".term-ai-cli");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");
```

즉 실제 경로는 보통 다음과 같습니다.

```text
~/.term-ai-cli/config.json
```

### 7.1 설정 로드

```js
export function loadConfig() {
  ensureDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  } catch (err) {
    throw new Error(`설정 파일을 읽을 수 없습니다: ${err.message}`);
  }
}
```

초보자가 여기서 알아야 할 문법은 다음과 같습니다.

- `fs.existsSync(path)`: 파일 또는 디렉토리 존재 여부 확인
- `fs.readFileSync(path, "utf-8")`: 파일을 문자열로 읽기
- `JSON.parse(text)`: JSON 문자열을 객체로 변환
- `try/catch`: 실패 가능성이 있는 코드를 감싸 오류 처리

### 7.2 설정 저장

```js
export function saveConfig(config) {
  ensureDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
```

`JSON.stringify(config, null, 2)`는 객체를 보기 좋은 JSON 문자열로 바꿉니다. 마지막 숫자 `2`는 들여쓰기 공백 2칸을 의미합니다.

### 7.3 Codex / Claude 실행 파일 탐지

```js
const lookupCmd = process.platform === "win32" ? "where codex" : "which codex";
```

운영체제에 따라 명령어가 달라집니다.

- Windows: `where codex`
- macOS/Linux: `which codex`

이런 분기에는 삼항 연산자가 사용됩니다.

```js
condition ? valueWhenTrue : valueWhenFalse
```

---

## 8. 셸 세션 관리: `src/session/ptyManager.js`

이 파일은 `term-ai`가 실제 터미널처럼 동작하도록 만드는 핵심입니다.

### 8.1 SessionLog

```js
export class SessionLog {
  constructor(maxBytes = 20000) {
    this.maxBytes = maxBytes;
    this.buffer = "";
    this.cwd = os.homedir();
  }

  append(chunk) {
    this.buffer += chunk;
    if (this.buffer.length > this.maxBytes) {
      this.buffer = this.buffer.slice(this.buffer.length - this.maxBytes);
    }
  }

  tail(lines = 200) {
    const all = this.buffer.split(/\r?\n/);
    return all.slice(-lines).join("\n");
  }
}
```

`SessionLog`는 최근 터미널 출력을 메모리에 저장합니다. AI에게 모든 터미널 출력을 보내면 프롬프트가 너무 커지므로, 최근 일부만 유지합니다.

여기서 중요한 문법은 다음과 같습니다.

- `class`: 객체 설계도
- `constructor`: 객체 생성 시 실행되는 초기화 함수
- `this`: 현재 객체 자신
- 기본 매개변수 `maxBytes = 20000`
- 정규식 `/\r?\n/`: Windows와 Unix 줄바꿈을 모두 처리
- `slice(-lines)`: 배열 뒤쪽 일부만 가져오기

### 8.2 VisibleLineTracker

`VisibleLineTracker`는 현재 터미널 화면의 입력줄을 추적합니다.

```js
class VisibleLineTracker {
  constructor() {
    this.line = "";
  }

  append(chunk) {
    const text = stripTerminalControls(chunk);

    for (const ch of text) {
      if (ch === "\r" || ch === "\n") {
        this.line = "";
        continue;
      }
      // ...
    }
  }
}
```

터미널 출력에는 색상, 커서 이동 같은 제어 문자가 섞입니다. `stripTerminalControls()`는 이런 ANSI escape sequence를 제거합니다.

### 8.3 셸 감지

```js
export function detectDefaultShell() {
  if (process.platform === "win32") {
    return process.env.COMSPEC ? "powershell.exe" : "cmd.exe";
  }
  return process.env.SHELL || "/bin/bash";
}
```

운영체제별 기본 셸을 고릅니다.

- Windows: PowerShell 또는 cmd
- macOS/Linux: `$SHELL` 환경변수 또는 `/bin/bash`

### 8.4 PTY 셸 생성

```js
const ptyProcess = pty.spawn(shell, [], {
  name: "xterm-color",
  cols,
  rows,
  cwd: process.cwd(),
  env: process.env
});
```

이 코드는 현재 프로세스 안에서 별도의 셸 프로세스를 띄웁니다.

- `cols`, `rows`: 터미널 크기
- `cwd`: 현재 작업 디렉토리
- `env`: 환경변수

### 8.5 출력 중계

```js
ptyProcess.onData((data) => {
  sessionLog.append(data);
  visibleLineTracker.append(data);
  process.stdout.write(data);
});
```

PTY에서 출력이 오면 세 가지 일을 합니다.

1. `sessionLog`에 기록
2. 현재 입력줄 추적기에 반영
3. 실제 사용자 터미널에 그대로 출력

### 8.6 명령어 주입

```js
export function injectCommand(ptyProcess, commandText) {
  if (process.platform === "win32") {
    ptyProcess.write(commandText);
    return Promise.resolve();
  }

  ptyProcess.write("\x03");

  return new Promise((resolve) => {
    setTimeout(() => {
      ptyProcess.write(`\x1b[200~${commandText}\x1b[201~`);
      resolve();
    }, 50);
  });
}
```

Unix 계열에서는 먼저 `\x03` 즉 Ctrl-C를 보내 현재 입력줄을 정리합니다. 그다음 bracketed paste sequence를 사용해 명령어를 붙여넣듯 주입합니다.

명령어 끝에 Enter를 보내지 않기 때문에 자동 실행되지 않습니다.

---

## 9. 입력 감지: `src/session/inputBridge.js`

`inputBridge.js`는 이 프로젝트에서 가장 섬세한 파일입니다. 사용자의 키 입력을 셸로 바로 보낼지, AI 요청으로 가로챌지 결정합니다.

### 9.1 핵심 아이디어

사용자가 입력하는 문자를 한 글자씩 받습니다.

- 입력이 `#ai ` 후보라면 잠시 셸로 보내지 않고 보류합니다.
- `#ai `로 완성된 뒤 Enter가 들어오면 AI 요청으로 처리합니다.
- `#ai `가 아닌 일반 명령이면 보류했던 문자까지 셸로 보냅니다.

### 9.2 내부 상태

```js
let shadowLine = "";
let withheldLine = "";
let isPassthroughLine = false;
let captureEnabled = true;
let inputSequenceBuffer = "";
```

각 변수의 의미는 다음과 같습니다.

| 변수 | 의미 |
|---|---|
| `shadowLine` | 사용자가 입력한 현재 줄 전체를 추적 |
| `withheldLine` | 아직 셸에 보내지 않고 보류 중인 문자 |
| `isPassthroughLine` | 이 줄은 일반 셸 입력으로 판정되어 바로 넘기는 중인지 여부 |
| `captureEnabled` | 입력 감지를 켜거나 끄는 플래그 |
| `inputSequenceBuffer` | 터미널 제어 시퀀스가 잘려 들어오는 경우를 처리하는 버퍼 |

### 9.3 트리거 후보 판단

```js
const isTriggerCandidate = (line) => triggerPrefix.startsWith(line) || line.startsWith(triggerPrefix);
```

예를 들어 `triggerPrefix`가 `#ai `일 때:

| 현재 입력 | 결과 | 이유 |
|---|---|---|
| `#` | 후보 | `#ai `로 이어질 수 있음 |
| `#a` | 후보 | `#ai `로 이어질 수 있음 |
| `#ai ` | 후보 | 트리거 완성 |
| `#ai 포트` | 후보 | 트리거로 시작함 |
| `ls` | 후보 아님 | 일반 명령 |

### 9.4 트리거 텍스트 추출

```js
const extractTriggerText = (line) => {
  if (line.startsWith(triggerPrefix)) {
    return line.slice(triggerPrefix.length).trim();
  }

  const triggerIndex = line.indexOf(triggerPrefix);
  if (triggerIndex === -1) return null;
  return line.slice(triggerIndex + triggerPrefix.length).trim();
};
```

`#ai 실행 프로세스 목록`에서 `실행 프로세스 목록`만 꺼냅니다.

여기서 쓰인 문법:

- `startsWith()`: 문자열이 특정 접두어로 시작하는지 확인
- `slice(start)`: 문자열 일부 추출
- `trim()`: 앞뒤 공백 제거
- `return null`: 트리거가 없음을 명시

### 9.5 Enter 처리

```js
if (code === 13 || code === 10) {
  const line = shadowLine;
  const visibleLine = getVisibleLine?.() || "";
  const pendingText = withheldLine;
  const shouldPassThrough = isPassthroughLine;
  resetLineState();

  const handleEnter = () => {
    const requirementText =
      extractTriggerText(line) || (hasTerminalControlInput(line) ? extractTriggerText(refreshedVisibleLine) : null);

    if (requirementText !== null) {
      ptyProcess.write("\x15");
      if (onTriggerLine) onTriggerLine(requirementText);
      return;
    }

    ptyProcess.write(shouldPassThrough ? ch : pendingText + ch);
  };
}
```

Enter가 들어오면 현재 줄이 `#ai` 요청인지 판단합니다.

- AI 요청이면 `onTriggerLine(requirementText)` 호출
- 일반 입력이면 셸에 그대로 전달

`getVisibleLine?.()`는 optional chaining입니다. `getVisibleLine`이 없으면 에러를 내지 않고 `undefined`를 반환합니다.

### 9.6 왜 추가 질문 때 capture를 끄는가

`src/index.js`에서 AI가 `clarify`를 반환하면 사용자의 답변을 `readline`으로 받습니다.

```js
inputBridge.setCaptureEnabled(false);
const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

이때도 input bridge가 계속 켜져 있으면 사용자의 추가 답변이 일반 셸 입력처럼 감지될 수 있습니다. 그래서 잠시 raw input capture를 끄고, 질문 답변이 끝나면 다시 켭니다.

---

## 10. 요구사항 엔진: `src/core/requirementEngine.js`

`RequirementEngine`은 사용자의 자연어 요청 한 턴을 관리합니다.

### 10.1 activeTurn

```js
this.activeTurn = {
  mainRequest,
  supplementalDetails: []
};
```

하나의 요청은 다음 두 부분으로 구성됩니다.

- `mainRequest`: 사용자가 처음 입력한 `#ai ...` 내용
- `supplementalDetails`: AI가 되물었을 때 사용자가 추가로 답한 내용들

예를 들어:

```text
mainRequest: "로그 지워줘"
supplementalDetails: ["./logs 폴더 안의 7일 지난 로그만"]
```

### 10.2 메인 요청과 후속 답변

```js
async submitMain(userText) {
  this.startTurn(userText);
  return this.runActiveTurn();
}

async submitFollowUp(userText) {
  this.appendFollowUp(userText);
  return this.runActiveTurn();
}
```

처음 요청은 `submitMain()`, 추가 답변은 `submitFollowUp()`으로 들어옵니다.

둘 다 결국 `runActiveTurn()`을 호출합니다.

### 10.3 세션 컨텍스트 사용 여부 결정

```js
const route = routeContextUsage(this.activeTurn);
const sessionSnapshot = route.includeSession ? this.sessionLog.snapshot() : null;
```

모든 요청에 터미널 기록을 넣지 않습니다. 요청만으로 충분하면 현재 요청만 사용하고, “방금”, “실패한 서버”, “이 프로젝트”처럼 이전 맥락이 필요할 때만 세션 기록을 포함합니다.

### 10.4 프롬프트 생성

```js
const systemPrompt = buildSystemPrompt({
  shell: this.shell,
  platform: this.platform,
  includeSession: route.includeSession
});

const userPrompt = buildUserPrompt({
  mainRequest: this.activeTurn.mainRequest,
  supplementalDetails: this.activeTurn.supplementalDetails,
  sessionSnapshot,
  includeSession: route.includeSession,
  routeReason: route.reason
});
```

시스템 프롬프트는 AI의 역할과 응답 형식을 지정합니다. 사용자 프롬프트는 실제 요청과 필요한 경우 세션 정보를 담습니다.

### 10.5 provider 호출

```js
const raw = await this.provider.generate({ systemPrompt, userPrompt });
```

provider는 OpenAI일 수도 있고, Anthropic일 수도 있고, CLI 기반 provider일 수도 있습니다. 하지만 `RequirementEngine` 입장에서는 `generate()`만 호출하면 되도록 통일되어 있습니다.

이런 설계를 어댑터 패턴처럼 볼 수 있습니다.

### 10.6 JSON 파싱

```js
function safeParseJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
```

AI가 실수로 코드블록을 붙여 응답할 수 있기 때문에, ```json 같은 문자열을 제거한 뒤 JSON으로 파싱합니다.

### 10.7 결과 타입

`RequirementEngine`은 세 가지 종류의 결과를 반환합니다.

```js
{ type: "clarify", question: "어떤 로그를 지우려는지 알려주세요." }
```

```js
{ type: "command", command: "find ./logs -type f -mtime +7 -delete", explanation: "..." }
```

```js
{ type: "error", raw: "..." }
```

---

## 11. 컨텍스트 라우팅: `src/core/contextRouter.js`

이 파일은 “세션 기록을 AI에게 보낼지 말지” 결정합니다.

### 11.1 self-contained 요청

```js
const SELF_CONTAINED_PATTERNS = [
  /포트\s*\d+/i,
  /port\s*\d+/i,
  /현재\s*폴더|현재\s*디렉토리|working directory|pwd/i,
  /디스크|용량|disk/i
];
```

예를 들어 “포트 8000 확인”은 이전 터미널 출력이 없어도 명령어를 만들 수 있습니다. 이런 요청은 세션 기록을 보내지 않습니다.

### 11.2 context-dependent 요청

```js
const AMBIGUOUS_PATTERNS = [
  /방금|아까|이전|위에|위의|최근|마지막/,
  /고쳐|수정|다시\s*실행|재시작|열어줘|찾아줘/,
  /실패|에러|오류|로그|결과|출력/,
  /그거|그 파일|해당/
];
```

“방금 실패한 서버 다시 띄워줘”는 이전 출력이 필요합니다. 이런 요청은 세션 기록을 포함합니다.

### 11.3 결정 함수

```js
export function routeContextUsage({ mainRequest, supplementalDetails = [] }) {
  const normalized = [mainRequest, ...supplementalDetails].join("\n").trim();

  if (SELF_CONTAINED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { includeSession: false, reason: "self-contained-command" };
  }

  if (AMBIGUOUS_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return { includeSession: true, reason: "context-dependent-language" };
  }

  return { includeSession: false, reason: "default-self-contained" };
}
```

여기서 중요한 문법:

- 배열 spread: `[mainRequest, ...supplementalDetails]`
- `Array.prototype.some()`: 하나라도 조건을 만족하면 `true`
- 정규식 `pattern.test(text)`: 문자열이 패턴에 맞는지 검사
- 객체 반환: `{ includeSession: false, reason: "..." }`

---

## 12. 프롬프트 생성: `src/core/promptBuilder.js`

프롬프트 빌더는 AI에게 보낼 문자열을 만듭니다.

### 12.1 시스템 프롬프트

```js
export function buildSystemPrompt({ shell, platform, includeSession }) {
  const contextPolicy = includeSession
    ? "사용자의 요구사항과 현재 터미널 세션 정보(작업 디렉토리, 최근 명령/출력)를 참고해서"
    : "현재 사용자 요구사항만 기준으로";

  return `당신은 터미널 명령어 생성 어시스턴트입니다.
${contextPolicy}
${platform} 환경, ${shell} 셸에서 바로 실행 가능한 명령어를 만듭니다.`;
}
```

여기서 쓰인 문법은 template literal입니다.

```js
`문자열 안에 ${variable} 삽입 가능`
```

여러 줄 문자열도 쉽게 만들 수 있습니다.

### 12.2 사용자 프롬프트

```js
const supplementalBlock = supplementalDetails.length > 0
  ? `\n\n[추가 정보]\n${supplementalDetails.map((detail) => `- ${detail}`).join("\n")}`
  : "";
```

추가 정보 배열이 있으면 bullet list로 바꿉니다.

여기서 중요한 메서드:

- `map()`: 배열의 각 원소를 변환
- `join("\n")`: 배열을 줄바꿈으로 연결
- 삼항 연산자: 조건에 따라 다른 값 선택

---

## 13. AI provider 구조

`src/providers/index.js`는 provider registry입니다.

```js
const registry = {
  openai_api_key: openaiApiKey,
  openai_subscription: openaiSubscription,
  anthropic: anthropic,
  claude_code: claudeCode,
  custom: custom
};
```

설정 파일의 `provider` 값에 따라 실제 구현을 고릅니다.

```js
export function getProvider(config) {
  const impl = registry[config.provider];
  if (!impl) {
    throw new Error(`알 수 없는 provider: ${config.provider}`);
  }
  return {
    generate: (args) => impl.generate({ config, ...args })
  };
}
```

이렇게 반환된 객체는 항상 같은 인터페이스를 가집니다.

```js
provider.generate({ systemPrompt, userPrompt })
```

### 13.1 OpenAI API key provider

`src/providers/openaiApiKey.js`는 OpenAI Chat Completions API를 직접 호출합니다.

```js
const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`
  },
  body: JSON.stringify({
    model: config.model || "gpt-5.5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2
  })
});
```

Node.js 18 이상에서는 전역 `fetch()`를 사용할 수 있습니다.

### 13.2 Anthropic provider

`src/providers/anthropic.js`는 Anthropic Messages API를 호출합니다.

OpenAI와 달리 `system` 필드가 별도로 있고, `messages`에는 user 메시지만 넣습니다.

```js
body: JSON.stringify({
  model: config.model || "claude-sonnet-5",
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: "user", content: userPrompt }]
})
```

### 13.3 OpenAI subscription provider

`src/providers/openaiSubscription.js`는 API 키를 직접 쓰지 않고, 이미 로그인된 `codex` CLI를 subprocess로 실행합니다.

```js
const child = spawn(binary, args, {
  shell: process.platform === "win32",
  stdio: ["pipe", "pipe", "pipe"]
});
```

`spawn()`은 외부 명령을 실행하는 Node.js API입니다.

이 provider는 임시 디렉토리에 마지막 메시지 파일을 쓰게 하고, 실행이 끝나면 그 파일을 읽습니다.

```js
const tempDir = await mkdtemp(path.join(os.tmpdir(), "term-ai-codex-"));
const outputPath = path.join(tempDir, "last-message.txt");
```

마지막에는 반드시 정리합니다.

```js
finally {
  await rm(tempDir, { recursive: true, force: true });
}
```

### 13.4 Claude Code provider

`src/providers/claudeCode.js`는 `claude` CLI를 실행합니다.

```js
const args = ["-p", "--output-format", "json", "--system-prompt", systemPrompt];
```

Claude CLI가 JSON 형식으로 반환한 값을 파싱하고 `result` 필드만 꺼냅니다.

```js
const parsed = JSON.parse(stdout);
return parsed.result.trim();
```

### 13.5 custom provider

`src/providers/custom.js`는 OpenAI 호환 Chat Completions 엔드포인트를 호출합니다.

Ollama, vLLM, OpenRouter, 사내 게이트웨이처럼 OpenAI 형식을 흉내 내는 서비스에 연결할 수 있습니다.

---

## 14. 클립보드 처리: `src/session/clipboard.js`

생성된 명령어는 셸 입력줄에만 들어가는 것이 아니라 클립보드에도 복사됩니다.

운영체제별 명령은 다릅니다.

```js
function candidatesForPlatform(platform) {
  if (platform === "darwin") {
    return [{ command: "pbcopy", args: [] }];
  }

  if (platform === "win32") {
    return [{ command: "clip.exe", args: [] }];
  }

  return [
    { command: "wl-copy", args: [] },
    { command: "xclip", args: ["-selection", "clipboard"] },
    { command: "xsel", args: ["--clipboard", "--input"] }
  ];
}
```

Linux에서는 환경마다 클립보드 도구가 다를 수 있으므로 여러 후보를 순서대로 시도합니다.

```js
export async function copyToClipboard(text, platform = process.platform) {
  for (const candidate of candidatesForPlatform(platform)) {
    const copied = await runClipboardCommand(candidate, text);
    if (copied) return true;
  }

  return false;
}
```

---

## 15. 주요 JavaScript 문법 정리

이 프로젝트를 이해하려면 아래 문법을 알아야 합니다.

### 15.1 import / export

```js
import { loadConfig } from "./config/configManager.js";
export function loadConfig() {}
```

다른 파일의 값을 가져오고 내보내는 ES Module 문법입니다.

### 15.2 async / await

```js
async function run() {
  const result = await provider.generate({ systemPrompt, userPrompt });
}
```

비동기 작업을 동기 코드처럼 읽기 쉽게 작성합니다.

이 프로젝트에서는 다음 작업들이 비동기입니다.

- AI API 호출
- CLI subprocess 실행
- 사용자 질문 입력
- 파일 읽기/삭제 일부

### 15.3 Promise

```js
return new Promise((resolve, reject) => {
  child.on("close", (code) => {
    if (code !== 0) {
      reject(new Error("실패"));
      return;
    }
    resolve(result);
  });
});
```

이벤트 기반 API를 `await` 가능한 형태로 감쌀 때 Promise를 씁니다.

### 15.4 구조 분해 할당

```js
const { ptyProcess, sessionLog, getVisibleLine } = spawnShellSession();
```

객체에서 필요한 속성만 꺼냅니다.

### 15.5 객체 spread

```js
config = { ...config, ...answers };
```

기존 객체와 새 객체를 합칩니다. 뒤에 있는 값이 앞의 값을 덮어씁니다.

### 15.6 optional chaining

```js
const visibleLine = getVisibleLine?.() || "";
const content = data.choices?.[0]?.message?.content ?? "";
```

중간 값이 `null` 또는 `undefined`여도 에러를 내지 않고 안전하게 접근합니다.

### 15.7 nullish coalescing

```js
return data.choices?.[0]?.message?.content ?? "";
```

왼쪽 값이 `null` 또는 `undefined`일 때만 오른쪽 값을 사용합니다.

### 15.8 정규식

```js
/포트\s*\d+/i
```

- `\s*`: 공백 0개 이상
- `\d+`: 숫자 1개 이상
- `i`: 대소문자 무시

### 15.9 이벤트 리스너

```js
process.stdin.on("data", (data) => {
  // 키 입력 처리
});
```

Node.js에서는 스트림과 프로세스가 이벤트를 발생시킵니다. 이벤트가 발생하면 등록된 콜백이 실행됩니다.

### 15.10 Node.js 전역과 내장 모듈

이 프로젝트에서 자주 쓰는 Node.js 값은 다음과 같습니다.

| 값 | 의미 |
|---|---|
| `process.platform` | 현재 OS: `darwin`, `win32`, `linux` 등 |
| `process.env` | 환경변수 |
| `process.stdin` | 표준 입력 |
| `process.stdout` | 표준 출력 |
| `process.exit(code)` | 프로세스 종료 |

내장 모듈은 다음처럼 `node:` 접두어를 붙여 가져올 수 있습니다.

```js
import readline from "node:readline/promises";
import assert from "node:assert/strict";
```

---

## 16. 테스트 구조

이 프로젝트는 별도 테스트 프레임워크 없이 Node.js 내장 테스트 러너를 씁니다.

```json
"scripts": {
  "test": "node --test"
}
```

실행:

```bash
npm test
```

### 16.1 RequirementEngine 테스트

`test/requirementEngine.test.js`는 추가 질문 흐름을 검증합니다.

검증하는 내용:

1. 첫 AI 응답이 `clarify`이면 사용자에게 질문한다.
2. 사용자의 추가 답변은 새 `#ai` 요청이 아니라 supplemental input으로 들어간다.
3. 두 번째 provider 호출 프롬프트에 `[핵심 요청]`과 `[추가 정보]`가 모두 들어간다.

핵심 패턴:

```js
const calls = [];
const provider = {
  async generate(payload) {
    calls.push(payload);
    // 호출 횟수에 따라 다른 응답 반환
  }
};
```

실제 AI API를 호출하지 않고 fake provider를 만들어 엔진만 테스트합니다.

### 16.2 inputBridge 테스트

`test/inputBridge.test.js`는 stale trigger text 문제를 검증합니다.

`process.stdin`을 실제 터미널 대신 fake EventEmitter로 바꿉니다.

```js
const fakeStdin = new EventEmitter();
fakeStdin.emit("data", Buffer.from("#ai 실행 프로세스 목록"));
```

이 테스트는 `resetInputState()` 호출 후 이전 `#ai` 텍스트가 남아서 다음 Enter를 잘못 처리하지 않는지 확인합니다.

---

## 17. 개발자가 알아야 할 실행 명령

### 17.1 의존성 설치

```bash
npm install
```

### 17.2 로컬 실행

```bash
npm start
```

또는 npm link 후:

```bash
npm link
term-ai
```

### 17.3 설정 마법사

```bash
term-ai init
```

### 17.4 테스트

```bash
npm test
```

### 17.5 문법 체크

README에 적힌 방식은 다음과 같습니다.

```bash
find src -type f -name '*.js' -print0 | xargs -0 -n1 node --check
node --check bin/term-ai
```

---

## 18. 릴리스 자동화: `.github/workflows/release.yml`

이 프로젝트에는 GitHub Actions 기반 릴리스 워크플로가 있습니다.

```yaml
name: release

on:
  push:
    branches:
      - master
  workflow_dispatch:
```

트리거는 두 가지입니다.

1. `master` 브랜치에 push될 때
2. GitHub UI에서 수동으로 `workflow_dispatch` 실행할 때

### 18.1 릴리스 job 흐름

워크플로는 대략 다음 순서로 동작합니다.

```text
저장소 체크아웃
  -> Node.js 18 설정
  -> npm ci로 의존성 설치
  -> npm test 실행
  -> patch 버전 증가
  -> npm pack으로 tarball 생성
  -> 버전 bump 커밋 생성
  -> git tag 생성
  -> master에 push
  -> GitHub Release 생성 및 .tgz 첨부
```

핵심 단계는 다음과 같습니다.

```yaml
- name: Run tests
  run: npm test

- name: Bump patch version
  run: |
    npm version patch --no-git-tag-version
    VERSION=$(node -p "require('./package.json').version")
    echo "VERSION=$VERSION" >> "$GITHUB_ENV"

- name: Create release tarball
  run: npm pack
```

여기서 `npm version patch --no-git-tag-version`은 `0.3.0` 같은 버전을 `0.3.1`로 올리되, npm이 자동으로 git tag를 만들지는 않게 합니다. 이후 워크플로가 직접 커밋과 tag를 만듭니다.

### 18.2 YAML 문법 포인트

이 파일은 JavaScript가 아니라 YAML입니다.

초보자가 알아야 할 문법은 다음과 같습니다.

| 문법 | 의미 |
|---|---|
| `key: value` | 객체 속성 |
| 들여쓰기 | 계층 구조 표현 |
| `- item` | 배열 항목 |
| `run: |` | 여러 줄 shell script |
| `${{ env.VERSION }}` | GitHub Actions expression |

이 워크플로는 코드 실행 로직에는 직접 관여하지 않지만, 패키지를 릴리스하는 운영 흐름을 담당합니다.

---

## 19. 기능 추가 시 어디를 고쳐야 할까

### 19.1 새 AI provider 추가

수정할 위치:

1. `src/providers/newProvider.js` 생성
2. `src/providers/index.js` registry에 추가
3. `src/config/configManager.js`의 provider 선택지와 설정 질문 추가

새 provider는 다음 인터페이스를 맞추면 됩니다.

```js
export async function generate({ config, systemPrompt, userPrompt }) {
  return "AI가 반환한 JSON 문자열";
}
```

### 19.2 `#ai` 접두어 변경

수정 위치:

```js
attachInputBridge(ptyProcess, {
  triggerPrefix: "#ai ",
  // ...
});
```

`src/index.js`에서 `triggerPrefix`를 바꾸면 됩니다. 단, README 예시와 테스트도 함께 맞춰야 합니다.

### 19.3 컨텍스트 라우팅 규칙 개선

수정 위치:

```text
src/core/contextRouter.js
```

새로운 힌트 단어나 self-contained 패턴을 추가하면 됩니다.

예를 들어 “도커”, “컨테이너” 요청에서 세션 맥락이 필요하다면 `CONTEXT_HINTS`나 `AMBIGUOUS_PATTERNS`에 추가할 수 있습니다.

### 19.4 프롬프트 정책 변경

수정 위치:

```text
src/core/promptBuilder.js
```

AI 응답 JSON 형식, 위험 명령어 안내, 설명 언어 등을 바꾸려면 시스템 프롬프트를 수정합니다.

### 19.5 터미널 입력 처리 개선

수정 위치:

```text
src/session/inputBridge.js
```

이 파일은 상태가 복잡하므로 변경 전후에 꼭 테스트를 추가하는 것이 좋습니다. 특히 화살표 키, 붙여넣기, 한글 입력, raw mode 동작은 터미널 환경마다 다르게 보일 수 있습니다.

---

## 20. 이 프로젝트의 설계 포인트

### 20.1 실행과 제안을 분리한다

AI는 명령어를 “제안”만 합니다. 실제 실행은 사용자가 Enter로 확정합니다.

이 설계는 위험한 명령어를 바로 실행하지 않도록 하는 안전장치입니다.

### 20.2 provider를 추상화한다

`RequirementEngine`은 OpenAI인지 Anthropic인지 모릅니다. 오직 `provider.generate()`만 호출합니다.

덕분에 provider 추가가 비교적 쉽습니다.

### 20.3 세션 컨텍스트는 필요할 때만 보낸다

터미널 로그는 민감하거나 길 수 있습니다. `contextRouter.js`는 필요할 때만 세션 기록을 프롬프트에 포함하도록 합니다.

### 20.4 입력 감지는 보수적으로 한다

`#ai` 후보 입력은 잠시 보류하지만, 일반 명령으로 판정되면 곧바로 셸로 흘려보냅니다.

또한 `#`은 많은 셸에서 주석 문자라 감지 실패 시 위험한 실행으로 이어질 가능성이 낮습니다.

---

## 21. 처음부터 끝까지 따라 읽는 추천 순서

처음 공부한다면 아래 순서로 읽는 것이 좋습니다.

1. `README.md`
   - 사용자 관점에서 무엇을 하는 도구인지 파악
2. `package.json`
   - Node.js 프로젝트 설정, 실행 명령, 의존성 확인
3. `bin/term-ai`
   - CLI 진입점 확인
4. `src/index.js`
   - 전체 조립 흐름 이해
5. `src/config/configManager.js`
   - 설정 파일 생성/로드 이해
6. `src/session/ptyManager.js`
   - 실제 셸 세션이 어떻게 열리는지 이해
7. `src/session/inputBridge.js`
   - `#ai` 입력 감지 방식 이해
8. `src/core/requirementEngine.js`
   - AI 요청 턴 관리 이해
9. `src/core/contextRouter.js`
   - 세션 로그 사용 여부 결정 이해
10. `src/core/promptBuilder.js`
    - AI에게 어떤 프롬프트를 보내는지 이해
11. `src/providers/*.js`
    - provider별 API/CLI 호출 방식 이해
12. `test/*.test.js`
    - 중요한 동작을 어떻게 검증하는지 이해

---

## 22. 핵심 용어 사전

| 용어 | 설명 |
|---|---|
| CLI | Command Line Interface. 터미널에서 쓰는 프로그램 |
| PTY | Pseudo Terminal. 프로그램 안에서 실제 터미널처럼 동작하는 가상 터미널 |
| Provider | AI 응답을 생성하는 구현체. OpenAI, Anthropic, Codex CLI 등 |
| Prompt | AI에게 보내는 지시문과 사용자 요청 |
| Session Log | 현재 터미널 세션의 최근 출력 기록 |
| Raw Mode | 터미널 입력을 줄 단위가 아니라 키 입력 단위로 받는 모드 |
| Escape Sequence | 터미널 색상, 커서 이동, 붙여넣기 등을 표현하는 제어 문자열 |
| Bracketed Paste | 터미널에 붙여넣기 시작/끝을 알려주는 제어 시퀀스 |
| Subprocess | Node.js 프로세스가 실행하는 외부 명령 프로세스 |

---

## 23. 최종 mental model

이 프로젝트를 한 문장으로 요약하면 다음과 같습니다.

> `term-ai`는 PTY로 실제 셸을 띄우고, 사용자의 키 입력 중 `#ai` 요청만 가로채 AI provider에 보낸 뒤, 반환된 명령어를 자동 실행하지 않고 셸 입력줄에 안전하게 채워 넣는 Node.js CLI입니다.

핵심 파일을 역할별로 다시 압축하면 다음과 같습니다.

```text
src/index.js
  전체 흐름 조립

src/session/inputBridge.js
  사용자 키 입력 감지

src/session/ptyManager.js
  실제 셸 세션 실행과 명령어 주입

src/core/requirementEngine.js
  사용자 요청 턴 관리와 AI 응답 해석

src/core/contextRouter.js
  세션 로그를 쓸지 결정

src/core/promptBuilder.js
  AI 프롬프트 생성

src/providers/*.js
  실제 AI API 또는 CLI 호출

src/config/configManager.js
  사용자 설정 생성과 저장
```

이 구조만 이해하면, 새 provider 추가, 프롬프트 변경, 입력 트리거 변경, 컨텍스트 라우팅 개선 같은 대부분의 유지보수 작업을 시작할 수 있습니다.
