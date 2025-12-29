# dist 폴더 구조 및 배포 가이드

## 📦 빌드 결과물 구조

```
dist/
├── index.html              # 메인 HTML 파일 (진입점)
├── manifest.json           # PWA 매니페스트
├── vite.svg                # 아이콘 파일
├── assets/
│   ├── index-[hash].js     # 메인 JavaScript 번들
│   ├── index-[hash].css    # 메인 CSS 번들
│   ├── react-vendor-[hash].js      # React 벤더 청크
│   ├── crypto-vendor-[hash].js     # crypto-js 벤더 청크
│   ├── excel-vendor-[hash].js      # xlsx 벤더 청크
│   └── ui-vendor-[hash].js         # UI 라이브러리 벤더 청크
└── ...                      # 기타 자산 파일들
```

## 🚀 배포 방법

### 방법 1: ZIP 압축 배포

1. **빌드 실행**
   ```bash
   npm run build
   ```

2. **dist 폴더 압축**
   - Windows: `dist` 폴더를 우클릭 → "압축" 선택
   - macOS: `dist` 폴더를 우클릭 → "압축" 선택
   - Linux: `zip -r make_pass_v1.5.3.zip dist/`

3. **배포 파일명 예시**
   - `make_pass_v1.5.3.zip`
   - `MakePass-v1.5.3-Windows.zip`

### 방법 2: 직접 배포 (서버 없이)

1. **dist 폴더 전체를 사용자에게 전달**
2. 사용자는 `dist/index.html` 파일을 더블 클릭하여 실행
3. 또는 PWA로 설치하여 독립 앱으로 실행

## 📋 필수 파일 목록

### 반드시 포함되어야 하는 파일:

- ✅ `index.html` - 메인 진입점 (필수)
- ✅ `manifest.json` - PWA 설정 (필수)
- ✅ `assets/` 폴더 - 모든 JavaScript/CSS 번들 (필수)
- ✅ `vite.svg` - 기본 아이콘 (선택사항, 커스터마이징 가능)

### 불필요한 파일 (제외 가능):

- ❌ `node_modules/` - 배포 불필요
- ❌ `src/` - 소스 코드, 배포 불필요
- ❌ `*.md` - 문서 파일, 배포 불필요
- ❌ `.git/` - Git 저장소, 배포 불필요

## 🔍 빌드 검증 체크리스트

빌드 후 다음 사항을 확인하세요:

- [ ] `dist/index.html` 파일이 존재하는가?
- [ ] `dist/manifest.json` 파일이 존재하는가?
- [ ] `dist/assets/` 폴더에 JavaScript 파일들이 있는가?
- [ ] `dist/assets/` 폴더에 CSS 파일이 있는가?
- [ ] 파일 경로가 상대 경로(`./`)로 설정되어 있는가?
- [ ] `index.html`을 더블 클릭하여 정상 실행되는가?

## 📊 예상 파일 크기

- `index.html`: ~1-2 KB
- `manifest.json`: ~0.5 KB
- `assets/index-*.js`: ~200-400 KB (gzip 압축 시 ~80-150 KB)
- `assets/react-vendor-*.js`: ~150-250 KB (gzip 압축 시 ~50-80 KB)
- `assets/crypto-vendor-*.js`: ~100-150 KB (gzip 압축 시 ~30-50 KB)
- `assets/excel-vendor-*.js`: ~500-800 KB (gzip 압축 시 ~150-250 KB)
- `assets/ui-vendor-*.js`: ~50-100 KB (gzip 압축 시 ~20-40 KB)
- `assets/index-*.css`: ~10-20 KB (gzip 압축 시 ~5-10 KB)

**전체 예상 크기:** ~1-2 MB (압축 전), ~300-600 KB (gzip 압축 후)

## ⚠️ 주의사항

1. **CORS 정책**
   - 일부 브라우저에서는 `file://` 프로토콜에서 실행이 제한될 수 있음
   - 권장: 로컬 웹 서버 사용 또는 PWA로 설치

2. **데이터 저장 위치**
   - 데이터는 브라우저의 localStorage에 저장됨
   - 브라우저별로 저장 위치가 다름
   - Persistent Storage API로 데이터 안전성 향상

3. **버전 관리**
   - 빌드 시 해시값이 파일명에 포함됨
   - 캐싱 문제를 방지하기 위한 것이므로 정상 동작

## 🎯 배포 준비 체크리스트

- [x] 빌드 성공 확인
- [x] 모든 필수 파일 존재 확인
- [x] 로컬에서 실행 테스트 완료
- [x] PWA 설치 테스트 완료
- [x] 데이터 저장/불러오기 테스트 완료
- [x] 백업/복원 기능 테스트 완료
- [x] ZIP 압축 파일 생성
- [x] 배포 문서 작성

---

**최종 빌드 명령어:**
```bash
npm run build
```

**빌드 결과 확인:**
```bash
npm run preview
```



