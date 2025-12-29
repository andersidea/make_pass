# Make_Pass 로컬 서버 실행 가이드

## 🚀 로컬 개발 서버 실행 방법

### 방법 1: Vite 개발 서버 (권장)

이 프로젝트는 Vite를 사용하므로 다음 명령어로 로컬 서버를 실행할 수 있습니다:

```bash
npm run dev
```

실행 후 브라우저에서 자동으로 열리거나, 다음 URL로 접속하세요:
- **http://localhost:5173** (기본 포트)

### 방법 2: Vite 프리뷰 (빌드 후 테스트)

프로덕션 빌드를 테스트하려면:

```bash
npm run build
npm run preview
```

접속 URL:
- **http://localhost:4173** (기본 포트)

### 방법 3: Live Server (VS Code 확장)

VS Code를 사용하는 경우:

1. **Live Server** 확장 설치
2. `dist/index.html` 파일에서 우클릭
3. **"Open with Live Server"** 선택

또는 단순 HTML 서버:

```bash
# Python이 설치되어 있다면
python -m http.server 8000

# Node.js가 설치되어 있다면
npx http-server dist -p 8000
```

접속 URL:
- **http://localhost:8000**

---

## ⚠️ CORS 오류 해결

`file:///` 경로로 직접 열 때 발생하는 CORS 오류는 **반드시 HTTP 서버를 통해 실행**해야 합니다.

### 이유
- 브라우저 보안 정책상 `file:///` 프로토콜에서는 `manifest.json`, 모듈 로딩 등이 제한됩니다.
- `http://localhost`를 통해 실행하면 모든 기능이 정상 작동합니다.

---

## 📋 프로젝트 구조

```
make_pass/
├── src/              # 소스 코드
├── dist/             # 빌드 결과물 (npm run build 후 생성)
├── package.json      # 프로젝트 설정
├── vite.config.js    # Vite 설정
└── index.html        # 엔트리 포인트
```

---

## 🛠️ 명령어 요약

```bash
# 개발 서버 실행 (핫 리로드 지원)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린터 실행
npm run lint
```

---

## 💡 팁

1. **개발 중**: `npm run dev` 사용 (코드 변경 시 자동 새로고침)
2. **배포 전 테스트**: `npm run build` → `npm run preview`
3. **최종 배포**: `dist/` 폴더를 압축하여 배포

---

## 🔒 데이터 저장 위치

모든 데이터는 브라우저의 **localStorage**에 저장됩니다:
- 마스터 비밀번호 해시
- 암호화된 비밀번호 데이터
- 카테고리 정보
- 설정 정보

브라우저 개발자 도구 (F12) → Application → Local Storage에서 확인 가능합니다.

---

## 📞 문제 해결

### 포트가 이미 사용 중인 경우

```bash
# 다른 포트 사용 (예: 3000)
npm run dev -- --port 3000
```

### 모듈을 찾을 수 없는 오류

```bash
# 의존성 재설치
npm install
```

---

**항상 `http://localhost`를 통해 실행하세요!** ✅


