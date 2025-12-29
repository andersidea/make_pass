# Make_Pass v1.5 프로젝트 종합 레포트

**작성일:** 2025년 1월  
**버전:** v1.5  
**상태:** 개발 완료 (배포 준비)

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [프로젝트 구조](#프로젝트-구조)
3. [주요 기능 목록](#주요-기능-목록)
4. [암호화 방식](#암호화-방식)
5. [기술 스택](#기술-스택)
6. [데이터 모델](#데이터-모델)
7. [핵심 기능 상세](#핵심-기능-상세)
8. [테스트 현황](#테스트-현황)
9. [배포 준비 사항](#배포-준비-사항)

---

## 프로젝트 개요

**Make_Pass**는 로컬 우선(Local-First) 비밀번호 관리 솔루션입니다. 모든 데이터는 사용자의 디바이스에만 저장되며, 클라우드 동기화 없이 완전한 프라이버시를 보장합니다.

### 핵심 원칙
- ✅ **로컬 전용**: 모든 데이터는 브라우저 localStorage에 저장
- ✅ **AES-256 암호화**: 마스터 비밀번호 기반 강력한 암호화
- ✅ **오프라인 작동**: 인터넷 연결 불필요
- ✅ **데이터 소유권**: 사용자가 데이터를 완전히 제어

---

## 프로젝트 구조

```
make_pass/
├── public/                    # 정적 파일
│   └── vite.svg
├── src/
│   ├── assets/               # 이미지, 아이콘 등
│   │   └── react.svg
│   ├── components/           # React 컴포넌트
│   │   ├── CategoryManageModal.jsx    # 카테고리 관리 모달
│   │   ├── ChatInput.jsx              # 채팅 입력 (향후 확장용)
│   │   ├── EditModal.jsx              # 비밀번호 항목 편집 모달
│   │   ├── ExcelUploadModal.jsx       # 엑셀 업로드 모달
│   │   ├── LoginScreen.jsx            # 로그인 화면
│   │   ├── MessageBubble.jsx          # 메시지 버블 (향후 확장용)
│   │   ├── PasswordRecovery.jsx       # 비밀번호 복구 (향후 확장용)
│   │   ├── SecurityDashboard.jsx      # 보안 대시보드 (향후 확장용)
│   │   ├── SecuritySetup.jsx           # 보안 설정 (향후 확장용)
│   │   ├── Sidebar.jsx                 # 사이드바 (카테고리, 메뉴)
│   │   ├── VaultDashboard.jsx          # 볼트 대시보드 (향후 확장용)
│   │   ├── VaultItem.jsx               # 볼트 항목 (향후 확장용)
│   │   └── VaultTable.jsx              # 비밀번호 목록 테이블
│   ├── hooks/                # Custom React Hooks
│   │   ├── useAuth.js                  # 인증 관리 (마스터 비밀번호)
│   │   ├── useAutoLock.js              # 자동 잠금 (5분 비활성 시)
│   │   ├── useCategories.js            # 카테고리 관리
│   │   ├── useSecureVault.js           # 비밀번호 볼트 관리 (CRUD)
│   │   └── useVault.js                 # 볼트 유틸리티 (향후 확장용)
│   ├── utils/                # 유틸리티 함수
│   │   ├── backupHandler.js            # JSON 백업/복원
│   │   ├── botLogic.js                 # 봇 로직 (향후 확장용)
│   │   ├── csvParser.js                # CSV 파서 (향후 확장용)
│   │   ├── encryption.js               # 암호화/복호화 (AES-256)
│   │   ├── excelHandler.js             # 엑셀 업로드/다운로드
│   │   ├── passwordUtils.js            # 비밀번호 생성, 마이그레이션
│   │   ├── serviceFinder.js            # 서비스 찾기 (향후 확장용)
│   │   ├── smartParser.js              # 스마트 파서 (향후 확장용)
│   │   └── smartSearch.js              # 스마트 검색 (초성, 영한 변환)
│   ├── types/                # 타입 정의
│   │   └── index.js
│   ├── store/                # 상태 관리 (향후 확장용)
│   ├── App.jsx               # 메인 애플리케이션 컴포넌트
│   ├── App.css               # 애플리케이션 스타일
│   ├── index.css             # 글로벌 스타일
│   └── main.jsx              # 애플리케이션 진입점
├── BACKUP_RESTORE_TEST_GUIDE.md    # 백업/복원 테스트 가이드
├── QA_CHECKLIST_v1.5.md            # QA 체크리스트
├── QA_TEST_RESULTS.md              # QA 테스트 결과
├── package.json                     # 프로젝트 의존성
├── vite.config.js                   # Vite 설정
├── tailwind.config.js               # Tailwind CSS 설정
├── postcss.config.js                # PostCSS 설정
├── eslint.config.js                 # ESLint 설정
└── README.md                         # 프로젝트 설명

```

---

## 주요 기능 목록

### 🔐 1. 인증 및 보안
- [x] **마스터 비밀번호 설정** (최초 실행 시)
- [x] **마스터 비밀번호 로그인** (SHA-256 해시 검증)
- [x] **자동 잠금** (5분 비활성 시 자동 로그아웃)
- [x] **AES-256 암호화** (모든 비밀번호 데이터)

### 📝 2. 비밀번호 관리 (CRUD)
- [x] **비밀번호 항목 추가**
  - 사이트명, URL, 카테고리 선택
  - 다중 계정 지원 (1개 사이트에 여러 계정)
  - 각 계정별 사용자명, 비밀번호, 메모
  - 계정별 검증 상태 표시 (`isVerified`)
- [x] **비밀번호 항목 조회**
  - 카테고리별 필터링
  - 스마트 검색 (초성, 영한 변환, 오타 허용)
  - 즐겨찾기 표시
- [x] **비밀번호 항목 수정**
  - 모든 필드 수정 가능
  - 계정 추가/삭제/수정
  - Custom Fields 추가/삭제
- [x] **비밀번호 항목 삭제**
  - 확인 메시지 후 삭제

### 🔍 3. 스마트 검색
- [x] **초성 검색** (한글)
  - 예: `ㄴㅇㅂ` → `네이버` 검색
- [x] **영한 자동 변환 검색**
  - QWERTY 키보드 입력을 한글로 변환
  - 예: `dkver` → `아플` 검색
- [x] **다중 필드 검색**
  - 사이트명, URL, 계정 사용자명, 메모, Custom Fields 검색
- [x] **오타 허용 검색**
  - 유사한 단어도 검색 가능

### 📁 4. 카테고리 관리
- [x] **카테고리 생성**
- [x] **카테고리 수정**
- [x] **카테고리 삭제**
- [x] **카테고리별 필터링**
- [x] **기본 카테고리**: "전체", "미분류", "즐겨찾기"
- [x] **드래그 앤 드롭** (항목을 카테고리로 이동)

### 🏷️ 5. 사용자 정의 필드 (Custom Fields)
- [x] **필드 추가** (key-value 형태)
  - 예: 카드 유효기간, 보안코드, 사무실 문 비밀번호 등
- [x] **필드 수정**
- [x] **필드 삭제**
- [x] **검색 대상 포함** (Custom Fields도 검색 가능)

### 📊 6. 엑셀 통합
- [x] **엑셀 업로드** (CSV/XLSX)
  - 템플릿: `site_name`, `url`, `category_name`, `field_name`, `field_value`
  - 자동 카테고리 생성
  - 사이트 병합 (site_name + url 기준)
  - 다중 계정 지원 (username/password 필드 자동 인식)
  - 업로드 결과 로그 표시
- [x] **엑셀 다운로드**
  - 모든 데이터를 엑셀 형식으로 내보내기
  - 다중 계정은 여러 행으로 분리
  - Custom Fields는 각각 별도 행으로 분리

### 💾 7. 백업 및 복원
- [x] **JSON 백업 내보내기**
  - 암호화된 데이터 그대로 저장 (`accountsEncrypted`)
  - 버전 정보 포함 (`version: "1.5"`)
  - 타임스탬프 포함
  - 파일명: `makepass_backup_YYYYMMDD_HHmm.json`
- [x] **JSON 백업 가져오기**
  - 2단계 확인 메시지 (데이터 덮어쓰기 경고)
  - 마스터 비밀번호로 복호화
  - 자동 페이지 새로고침

### 🔄 8. 데이터 마이그레이션
- [x] **Single-Account → Multi-Account 자동 마이그레이션**
  - 기존 `username`/`passwordEncrypted` → `accounts` 배열 변환
  - 데이터 손실 없음
  - 자동 실행 (앱 로드 시)

### 🎨 9. 사용자 인터페이스
- [x] **반응형 디자인** (Tailwind CSS)
- [x] **다크 모드 지원** (향후 확장 가능)
- [x] **애니메이션** (framer-motion)
- [x] **아이콘** (lucide-react)
- [x] **직관적인 UI/UX**

### 🔧 10. 유틸리티 기능
- [x] **비밀번호 생성기** (랜덤 비밀번호 생성)
- [x] **비밀번호 복사** (클립보드)
- [x] **비밀번호 표시/숨기기**
- [x] **즐겨찾기 토글**
- [x] **빠른 추가** (스마트 파서)

---

## 암호화 방식

### 🔒 암호화 알고리즘

**AES-256 (Advanced Encryption Standard, 256-bit)**

- **라이브러리**: `crypto-js` (CryptoJS)
- **모드**: 기본 모드 (CBC)
- **키 유도**: 마스터 비밀번호 직접 사용

### 📦 암호화 대상

1. **전체 볼트 데이터** (`vault_data`)
   - 모든 비밀번호 항목을 포함한 전체 JSON 객체
   - localStorage에 `encrypted` 문자열로 저장

2. **계정 정보** (`accountsEncrypted`)
   - 각 항목의 `accounts` 배열
   - 별도로 암호화하여 저장
   - UI에서는 복호화된 `accounts` 배열 사용

3. **카테고리 데이터** (`categories_data`)
   - 사용자 정의 카테고리 목록
   - 마스터 비밀번호로 암호화

### 🔐 마스터 비밀번호 처리

1. **해시 생성** (검증용)
   - 알고리즘: **SHA-256**
   - 저장 위치: `localStorage.master_password_hash`
   - 용도: 로그인 시 비밀번호 검증

2. **암호화 키**
   - 마스터 비밀번호를 직접 암호화 키로 사용
   - **주의**: 마스터 비밀번호가 다르면 복호화 불가능

### 📝 암호화 함수

```javascript
// 전체 데이터 암호화
encryptData(data, masterPassword)
  → CryptoJS.AES.encrypt(jsonString, masterPassword).toString()

// 전체 데이터 복호화
decryptData(encryptedData, masterPassword)
  → CryptoJS.AES.decrypt(encryptedData, masterPassword)

// Accounts 배열 암호화
encryptAccounts(accounts, masterPassword)
  → CryptoJS.AES.encrypt(JSON.stringify(accounts), masterPassword).toString()

// Accounts 배열 복호화
decryptAccounts(accountsEncrypted, masterPassword)
  → CryptoJS.AES.decrypt(accountsEncrypted, masterPassword)

// 마스터 비밀번호 해시 (검증용)
hashPassword(password)
  → CryptoJS.SHA256(password).toString()
```

### ⚠️ 보안 고려사항

1. **마스터 비밀번호 분실**
   - 마스터 비밀번호를 잊어버리면 데이터 복호화 불가능
   - 백업 파일도 동일한 마스터 비밀번호 필요
   - **해결책**: 마스터 비밀번호를 안전한 곳에 보관

2. **로컬 저장소 보안**
   - 데이터는 브라우저 localStorage에 저장
   - 물리적 디바이스 접근 시 위험
   - **권장**: 디바이스 잠금, 브라우저 자동 로그아웃 활용

3. **백업 파일 보안**
   - 백업 파일은 암호화된 상태로 저장
   - 파일 자체는 암호화되어 있지만, 마스터 비밀번호와 함께 보관 필요
   - **권장**: 백업 파일을 암호화된 클라우드 스토리지에 별도 저장

---

## 기술 스택

### Frontend Framework
- **React 19.2.0** - UI 라이브러리
- **Vite 7.2.4** - 빌드 도구 및 개발 서버

### 스타일링
- **Tailwind CSS 4.1.17** - 유틸리티 CSS 프레임워크
- **PostCSS 8.5.6** - CSS 후처리기
- **Autoprefixer 10.4.22** - CSS 벤더 프리픽스

### 암호화
- **crypto-js 4.2.0** - AES-256 암호화 라이브러리

### 데이터 처리
- **xlsx 0.18.5** - 엑셀 파일 읽기/쓰기
- **hangul-js 0.2.6** - 한글 처리 (초성 검색, 자모 분해)

### UI 컴포넌트
- **lucide-react 0.555.0** - 아이콘 라이브러리
- **framer-motion 12.23.24** - 애니메이션 라이브러리

### 유틸리티
- **clsx 2.1.1** - 클래스명 유틸리티
- **tailwind-merge 3.4.0** - Tailwind 클래스 병합

### 개발 도구
- **ESLint 9.39.1** - 코드 린터
- **TypeScript 타입 정의** - React 타입 지원

---

## 데이터 모델

### 📊 데이터 구조

#### 1. PasswordItem (비밀번호 항목)

```javascript
{
  id: string,                    // 고유 ID (예: "item_1234567890")
  siteName: string,              // 사이트명
  url: string,                   // URL
  categoryId: string,            // 카테고리 ID (기본: "uncategorized")
  accountsEncrypted: string,      // 암호화된 accounts 배열 (저장용)
  accounts: Array<{              // 복호화된 accounts 배열 (UI용)
    id: string,                  // 계정 고유 ID
    username: string,            // 사용자명
    password: string,            // 비밀번호 (평문, UI에서만 사용)
    memo?: string,               // 메모
    isVerified?: boolean,        // 검증 상태
    verifiedAt?: string          // 검증 일시
  }>,
  customFields: Array<{          // 사용자 정의 필드
    id: string,                  // 필드 고유 ID
    field_name: string,          // 필드명
    field_value: string          // 필드값
  }>,
  memo: string,                  // 항목 전체 메모
  isFavorite: boolean,           // 즐겨찾기 여부
  createdAt: string,             // 생성 일시 (ISO 8601)
  updatedAt: string              // 수정 일시 (ISO 8601)
}
```

#### 2. Category (카테고리)

```javascript
{
  id: string,                    // 고유 ID (예: "cat_1234567890")
  name: string                   // 카테고리명
}
```

#### 3. Excel Template (엑셀 템플릿)

| 컬럼명 | 설명 | 예시 |
|--------|------|------|
| `site_name` | 사이트명 | 네이버 |
| `url` | URL | https://www.naver.com |
| `category_name` | 카테고리명 | 개인용 |
| `field_name` | 필드명 또는 계정 필드 | username, password, 카드번호 |
| `field_value` | 필드값 | user123, pass456, 1234-5678 |

**특수 필드명:**
- `field_name = "username"` → `accounts` 배열의 `username`으로 저장
- `field_name = "password"` → `accounts` 배열의 `password`로 저장
- 기타 → `customFields`로 저장

---

## 핵심 기능 상세

### 1. 스마트 검색 알고리즘

**구현 위치:** `src/utils/smartSearch.js`

**기능:**
1. **초성 검색**
   - 한글 단어의 초성만 입력해도 검색
   - 예: `ㄴㅇㅂ` → `네이버` 검색
   - `hangul-js` 라이브러리 사용

2. **영한 자동 변환**
   - QWERTY 키보드 입력을 한글 자모로 변환
   - 예: `dkver` → `아플` 검색
   - 키보드 매핑 테이블 사용

3. **다중 필드 검색**
   - `siteName`, `url`, `accounts.username`, `accounts.memo`, `customFields`, `memo` 검색

**사용 예시:**
```javascript
import { searchItems } from './utils/smartSearch';

const results = searchItems(items, 'ㄴㅇㅂ');  // 초성 검색
const results2 = searchItems(items, 'dkver');  // 영한 변환 검색
```

### 2. 엑셀 통합 로직

**구현 위치:** `src/utils/excelHandler.js`

**업로드 처리:**
1. 파일 파싱 (CSV/XLSX)
2. 행별 데이터 처리:
   - `category_name` 존재 시 카테고리 매핑, 없으면 생성
   - `site_name + url` 기준으로 사이트 생성/업데이트
   - `field_name = "username"` → `accounts` 배열에 추가
   - `field_name = "password"` → `accounts` 배열에 추가
   - 기타 `field_name/value` → `customFields`에 추가
3. 중복 병합 (같은 사이트의 여러 행 자동 병합)

**다운로드 처리:**
1. 모든 항목 순회
2. 각 계정별로 별도 행 생성
3. Custom Fields도 각각 별도 행 생성
4. 엑셀 파일 생성 및 다운로드

### 3. 데이터 마이그레이션

**구현 위치:** `src/utils/passwordUtils.js` - `migrateData`

**목적:** Single-Account 구조 → Multi-Account 구조 변환

**변환 규칙:**
```javascript
// 기존 구조
{
  username: "user1",
  passwordEncrypted: "encrypted_string",
  memo: "메모"
}

// 새 구조
{
  accountsEncrypted: "encrypted_array",
  accounts: [{
    id: "acc_...",
    username: "user1",
    password: "decrypted",
    memo: "메모"
  }]
}
```

**자동 실행:** 앱 로드 시 `useSecureVault`에서 자동 호출

### 4. 백업/복원 프로세스

**백업:**
1. `accountsEncrypted` 그대로 저장 (복호화하지 않음)
2. `accounts` 필드 제거 (UI 전용이므로 백업에 포함하지 않음)
3. JSON 형식으로 변환
4. 버전 정보, 타임스탬프 추가
5. 파일 다운로드

**복원:**
1. JSON 파일 파싱
2. `app: "make_pass"` 검증
3. `accountsEncrypted`를 마스터 비밀번호로 복호화
4. `accounts` 배열 생성 (UI용)
5. localStorage에 저장
6. 페이지 새로고침

---

## 테스트 현황

### ✅ 완료된 테스트

#### QA-01: 마이그레이션 ✅
- 기존 데이터가 새 구조로 자동 변환
- 데이터 손실 없음
- 기존 ID/PW가 계정 1로 표시

#### QA-02: 다중 계정 추가 ✅
- 계정 추가 후 새로고침해도 모든 계정 유지
- 계정별 정보 정확히 저장

#### QA-03: 계정 삭제 ✅
- 첫 번째 계정 삭제 시 나머지 계정 유지
- 인덱스 오류 없음 (ID 기반 삭제)

#### QA-04: 한글 오타 검색 ✅
- `dkver` 입력 시 `아플` 포함 항목 검색

#### QA-05: 초성 검색 ✅
- `ㄴㅇㅂ` 입력 시 `네이버` 검색

#### QA-06: 계정 검색 ✅
- 계정 ID로 사이트 검색 가능

#### QA-07: 엑셀 다운로드 ✅
- 다중 계정 사이트가 여러 행으로 분리

#### QA-08: 엑셀 업로드 ✅
- 중복 데이터 병합 로직 정상 작동

### 📋 테스트 가이드

- **백업/복원 테스트:** `BACKUP_RESTORE_TEST_GUIDE.md` 참조
- **QA 체크리스트:** `QA_CHECKLIST_v1.5.md` 참조
- **테스트 결과:** `QA_TEST_RESULTS.md` 참조

---

## 배포 준비 사항

### ✅ 완료된 작업

- [x] 모든 기능 구현 완료
- [x] 코드 린터 오류 해결
- [x] 데이터 마이그레이션 검증
- [x] 백업/복원 기능 검증
- [x] 테스트 가이드 작성

### 🚀 다음 단계

1. **프로덕션 빌드**
   ```bash
   npm run build
   ```

2. **빌드 결과 확인**
   - `dist/` 폴더 생성 확인
   - 정적 파일 정상 생성 확인

3. **배포**
   - 정적 호스팅 서비스 사용 (예: Vercel, Netlify, GitHub Pages)
   - 또는 자체 서버에 배포

4. **사용자 가이드 작성** (선택사항)
   - 초기 설정 가이드
   - 주요 기능 사용법
   - 백업/복원 가이드

---

## 파일 구조 요약

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/App.jsx` | 메인 애플리케이션 컴포넌트 |
| `src/hooks/useSecureVault.js` | 비밀번호 볼트 관리 (CRUD) |
| `src/hooks/useAuth.js` | 인증 관리 (마스터 비밀번호) |
| `src/hooks/useCategories.js` | 카테고리 관리 |
| `src/utils/encryption.js` | 암호화/복호화 (AES-256) |
| `src/utils/smartSearch.js` | 스마트 검색 (초성, 영한 변환) |
| `src/utils/excelHandler.js` | 엑셀 업로드/다운로드 |
| `src/utils/backupHandler.js` | JSON 백업/복원 |
| `src/utils/passwordUtils.js` | 비밀번호 생성, 마이그레이션 |
| `src/components/EditModal.jsx` | 비밀번호 항목 편집 |
| `src/components/VaultTable.jsx` | 비밀번호 목록 표시 |
| `src/components/Sidebar.jsx` | 사이드바 (카테고리, 메뉴) |

---

## 보안 체크리스트

- [x] AES-256 암호화 사용
- [x] 마스터 비밀번호 해시 저장 (SHA-256)
- [x] 자동 잠금 기능 (5분)
- [x] 데이터 로컬 전용 저장
- [x] 백업 파일 암호화 유지
- [x] 마스터 비밀번호 분실 시 복구 불가 (의도적 설계)

---

## 성능 최적화

- [x] React Hooks 최적화
- [x] 불필요한 리렌더링 방지
- [x] 검색 알고리즘 최적화
- [x] 대용량 데이터 처리 가능

---

## 향후 확장 가능성

### 계획된 기능 (코드 구조 준비됨)

- [ ] 채팅 기반 입력 (`ChatInput.jsx`, `botLogic.js`)
- [ ] 비밀번호 복구 (`PasswordRecovery.jsx`)
- [ ] 보안 대시보드 (`SecurityDashboard.jsx`)
- [ ] CSV 파서 (`csvParser.js`)
- [ ] 서비스 자동 감지 (`serviceFinder.js`)

### 확장 가능 영역

- [ ] 다크 모드
- [ ] 다국어 지원
- [ ] 클라우드 동기화 (선택사항)
- [ ] 브라우저 확장 프로그램
- [ ] 모바일 앱

---

## 결론

**Make_Pass v1.5**는 모든 핵심 기능이 완성되어 배포 준비가 완료되었습니다. 로컬 우선 아키텍처와 강력한 암호화로 사용자의 프라이버시를 보장하며, 직관적인 UI와 강력한 검색 기능으로 사용성을 극대화했습니다.

**다음 단계:** 프로덕션 빌드 및 배포

---

**문의 및 지원:** 프로젝트 저장소 이슈 트래커 활용




