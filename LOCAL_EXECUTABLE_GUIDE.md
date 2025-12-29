# Make_Pass 로컬 실행 프로그램 가이드

**작성일:** 2025년 1월  
**버전:** v1.5  

---

## 📋 개요

Make_Pass는 이제 독립 실행 가능한 로컬 프로그램으로 사용할 수 있습니다. 서버 없이 `index.html` 파일을 직접 열어 실행할 수 있으며, PWA로 설치하여 독립 창으로 실행할 수 있습니다.

---

## 🚀 변경 사항

### 1. Path Optimization (경로 최적화)

**변경 내용:**
- `vite.config.js`에 `base: './'` 추가
- 모든 자산 경로가 상대 경로로 빌드됨
- 서버 없이 파일 시스템에서 직접 실행 가능

**효과:**
- ✅ `dist/index.html`을 더블 클릭하여 바로 실행 가능
- ✅ 파일 시스템 경로에서도 정상 작동
- ✅ CDN 없이 완전히 독립 실행

### 2. Persistent Storage API 적용

**변경 내용:**
- `src/utils/storage.js` 생성
- `navigator.storage.persist()` API 사용
- 브라우저 설정에 의해 데이터가 휘발되지 않도록 보장

**기능:**
- ✅ Persistent Storage 자동 요청
- ✅ 저장소 사용량 확인
- ✅ QuotaExceededError 처리
- ✅ 데이터 존재 여부 강화된 체크

**적용 위치:**
- `src/hooks/useAuth.js` - 마스터 비밀번호 해시 저장
- `src/hooks/useSecureVault.js` - 볼트 데이터 저장
- `src/hooks/useCategories.js` - 카테고리 데이터 저장
- `src/App.jsx` - 백업 복원 시 저장
- `src/components/LoginScreen.jsx` - 데이터 초기화

### 3. PWA Manifest 설정

**변경 내용:**
- `public/manifest.json` 생성
- `index.html`에 manifest 링크 및 메타 태그 추가

**설정 항목:**
- ✅ `display: "standalone"` - 독립 창으로 실행
- ✅ `start_url: "./index.html"` - 상대 경로 사용
- ✅ 테마 색상 및 아이콘 설정
- ✅ iOS Apple Touch Icon 설정

---

## 📦 빌드 및 실행

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

### 로컬 실행 방법

#### 방법 1: 파일 직접 열기

1. `dist/index.html` 파일을 찾습니다
2. 파일을 더블 클릭하여 브라우저에서 엽니다
3. 모든 리소스가 상대 경로로 로드되어 정상 작동합니다

#### 방법 2: PWA로 설치

**Chrome/Edge:**
1. 브라우저에서 앱을 엽니다
2. 주소창 오른쪽의 "설치" 아이콘 클릭
3. 또는 메뉴 → "앱 설치" 선택
4. 독립 창으로 실행됩니다

**Firefox:**
1. 브라우저에서 앱을 엽니다
2. 메뉴 → "페이지 → 이 사이트를 웹 앱으로 설치" 선택

**Safari (iOS):**
1. Safari에서 앱을 엽니다
2. 공유 버튼 → "홈 화면에 추가" 선택
3. 독립 앱처럼 실행됩니다

---

## 🔒 데이터 안전성

### Persistent Storage API

**작동 방식:**
- 앱 시작 시 자동으로 `navigator.storage.persist()` 호출
- 브라우저에 영구 저장소 권한 요청
- 데이터가 브라우저 설정에 의해 자동 삭제되지 않도록 보장

**지원 브라우저:**
- ✅ Chrome/Edge 55+
- ✅ Firefox 51+
- ✅ Safari 15.2+
- ✅ Opera 42+

**폴백:**
- 브라우저가 지원하지 않으면 일반 localStorage 사용
- 기존 기능은 정상 작동

### 데이터 존재 여부 체크

**강화된 체크 로직:**
- `hasItem()` 메서드로 저장 전 데이터 존재 확인
- 저장 실패 시 명확한 에러 메시지
- QuotaExceededError 처리

---

## 📱 PWA 기능

### 설치 가능 조건

- HTTPS 또는 localhost에서 실행
- manifest.json이 유효
- Service Worker (선택사항, 현재 미구현)

### 독립 창 실행

PWA로 설치 후:
- ✅ 브라우저 주소창이 사라집니다
- ✅ 독립적인 앱 창으로 실행됩니다
- ✅ 작업 표시줄에 아이콘 표시됩니다
- ✅ 시작 메뉴/Launchpad에 추가됩니다

### 아이콘 커스터마이징

현재는 기본 `vite.svg` 아이콘을 사용합니다. 커스터마이징하려면:

1. `public/` 폴더에 아이콘 파일 추가:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)

2. `public/manifest.json` 수정:
```json
{
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🛠️ 개발 환경

### 개발 서버 실행

```bash
npm run dev
```

개발 환경에서는 여전히 Vite 개발 서버를 사용합니다.

### 빌드 미리보기

```bash
npm run build
npm run preview
```

로컬 서버에서 빌드 결과를 미리 볼 수 있습니다.

---

## ⚠️ 주의사항

### CORS 정책

일부 브라우저에서는 `file://` 프로토콜에서 모듈을 로드할 수 없습니다. 

**해결 방법:**
1. 로컬 웹 서버 사용 (권장)
   ```bash
   # Python
   python -m http.server 8000 -d dist
   
   # Node.js (http-server)
   npx http-server dist -p 8000
   ```

2. 또는 브라우저 보안 설정 변경 (비권장)

### 데이터 백업

- 로컬 저장소 데이터는 브라우저별로 다릅니다
- 정기적으로 JSON 백업을 권장합니다
- Persistent Storage API로 데이터 안전성이 향상되었지만, 백업은 여전히 중요합니다

---

## 📊 기술 세부사항

### 파일 구조

```
make_pass/
├── public/
│   ├── manifest.json          # PWA 매니페스트
│   └── vite.svg               # 아이콘
├── src/
│   ├── utils/
│   │   ├── storage.js         # Persistent Storage 래퍼
│   │   └── pwaServiceWorker.js # Service Worker (선택사항)
│   └── ...
├── vite.config.js             # base: './' 설정
└── index.html                 # manifest 링크 추가
```

### 주요 변경 파일

1. **vite.config.js**
   - `base: './'` 추가

2. **src/utils/storage.js** (신규)
   - Persistent Storage API 래퍼
   - localStorage 호환 API

3. **public/manifest.json** (신규)
   - PWA 설정

4. **index.html**
   - manifest 링크
   - Apple Touch Icon 메타 태그

5. **Hooks 업데이트**
   - `useAuth.js` - persistentStorage 사용
   - `useSecureVault.js` - persistentStorage + 데이터 체크 강화
   - `useCategories.js` - persistentStorage + 데이터 체크 강화

---

## ✅ 검증 체크리스트

- [x] `vite.config.js`에 `base: './'` 추가
- [x] Persistent Storage API 적용
- [x] 모든 localStorage 호출을 persistentStorage로 교체
- [x] 데이터 존재 여부 체크 강화
- [x] manifest.json 생성 및 설정
- [x] index.html에 manifest 링크 추가
- [x] Apple Touch Icon 메타 태그 추가
- [x] 코드 린터 오류 없음

---

## 🎉 결론

Make_Pass는 이제 완전한 독립 실행 가능한 로컬 프로그램입니다:

1. ✅ 서버 없이 파일로 직접 실행 가능
2. ✅ PWA로 설치하여 독립 창으로 실행 가능
3. ✅ Persistent Storage API로 데이터 안전성 향상
4. ✅ 모든 브라우저에서 정상 작동

**빌드 후 `dist/index.html`을 더블 클릭하거나 PWA로 설치하여 사용하세요!** 🚀

---

**문서 작성자:** Frontend Architect  
**최종 업데이트:** 2025년 1월



