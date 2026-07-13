# 오프라인 설치 안내

`term-ai`는 일반 npm 설치를 기본으로 사용합니다.  
오프라인 환경이나 native 의존성 설치가 어려운 환경에서는 GitHub Release에 포함된 운영체제별 실행 아카이브를 사용할 수 있습니다.

## 언제 쓰는가

- 인터넷이 막힌 환경
- `npm install`이 정책상 어렵거나 오래 걸리는 환경
- Windows에서 `node-pty` native 빌드 도구 설치를 피하고 싶은 환경
- 배포본만 전달해서 바로 실행해야 하는 환경

## 사용 방법

릴리스 자산에서 현재 운영체제에 맞는 파일을 받습니다.

- macOS: `term-ai-<version>-macos.tar.gz`
- Windows: `term-ai-<version>-windows.zip`

압축을 푼 뒤, 폴더 안에서 바로 실행할 수 있습니다.

macOS:

```bash
tar -xzf term-ai-0.3.17-macos.tar.gz
cd term-ai-0.3.17-macos
node bin/term-ai
```

Windows PowerShell:

```powershell
Expand-Archive .\term-ai-0.3.17-windows.zip
cd .\term-ai-0.3.17-windows\term-ai-0.3.17-windows
node .\bin\term-ai
```

전역 명령어처럼 쓰고 싶으면 압축을 푼 폴더에서 링크를 걸 수 있습니다.

macOS:

```bash
npm link
term-ai
```

Windows PowerShell:

```powershell
npm link
term-ai
```

`npm link`는 현재 폴더의 패키지를 전역 명령어로 연결합니다. 릴리스 아카이브에는 `node_modules`가 포함되어 있으므로 일반적인 `npm install` 단계는 필요하지 않습니다.

## 참고

- 릴리스 파일은 운영체제별로 따로 받는 것이 안전합니다.
- Windows는 `node-pty` native 모듈 때문에 macOS 배포본을 재사용하면 안 됩니다.
- npm에 배포된 패키지는 일반 설치용이고, GitHub Release 아카이브는 의존성 포함 실행용입니다.
