# Make_Pass v1.5 프로젝트 요약

## 📁 파일 구조

```
make_pass/
├── src/
│   ├── components/          # React 컴포넌트 (13개)
│   ├── hooks/              # Custom Hooks (5개)
│   ├── utils/              # 유틸리티 함수 (9개)
│   ├── App.jsx             # 메인 애플리케이션
│   └── main.jsx            # 진입점
├── package.json            # 의존성 관리
└── vite.config.js          # 빌드 설정
```

## 🎯 주요 기능 목록

### 핵심 기능
1. **비밀번호 저장/조회/수정/삭제** (CRUD)
2. **다중 계정 지원** (1개 사이트에 여러 계정)
3. **비밀번호 생성** (랜덤 생성기)
4. **카테고리 관리** (생성/수정/삭제/필터링)
5. **스마트 검색** (초성, 영한 변환, 오타 허용)
6. **사용자 정의 필드** (Custom Fields, key-value)
7. **엑셀 업로드/다운로드** (CSV/XLSX)
8. **JSON 백업/복원**
9. **자동 잠금** (5분 비활성 시)
10. **데이터 마이그레이션** (Single → Multi-Account)

### 보안 기능
- 마스터 비밀번호 인증
- AES-256 암호화
- 로컬 전용 저장 (클라우드 없음)

## 🔒 암호화 방식

### 사용 알고리즘
- **AES-256** (Advanced Encryption Standard, 256-bit)
- **SHA-256** (마스터 비밀번호 해시, 검증용)

### 라이브러리
- **crypto-js 4.2.0**

### 암호화 대상
1. 전체 볼트 데이터 (`vault_data`)
2. 계정 정보 (`accountsEncrypted`)
3. 카테고리 데이터 (`categories_data`)

### 암호화 함수
```javascript
// 전체 데이터
encryptData(data, masterPassword)
decryptData(encryptedData, masterPassword)

// Accounts 배열
encryptAccounts(accounts, masterPassword)
decryptAccounts(accountsEncrypted, masterPassword)

// 마스터 비밀번호 해시
hashPassword(password)  // SHA-256
```

## 📊 데이터 모델

### PasswordItem
```javascript
{
  id: string,
  siteName: string,
  url: string,
  categoryId: string,
  accountsEncrypted: string,      // 암호화된 계정 배열
  accounts: Array<{               // 복호화된 계정 배열 (UI용)
    id: string,
    username: string,
    password: string,
    memo?: string,
    isVerified?: boolean
  }>,
  customFields: Array<{
    id: string,
    field_name: string,
    field_value: string
  }>,
  memo: string,
  isFavorite: boolean,
  createdAt: string,
  updatedAt: string
}
```

### Category
```javascript
{
  id: string,
  name: string
}
```

## 🛠️ 기술 스택

- **React 19.2.0** - UI 프레임워크
- **Vite 7.2.4** - 빌드 도구
- **Tailwind CSS 4.1.17** - 스타일링
- **crypto-js 4.2.0** - 암호화
- **xlsx 0.18.5** - 엑셀 처리
- **hangul-js 0.2.6** - 한글 처리
- **lucide-react 0.555.0** - 아이콘
- **framer-motion 12.23.24** - 애니메이션

## 📝 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/App.jsx` | 메인 애플리케이션 |
| `src/hooks/useSecureVault.js` | 비밀번호 볼트 관리 |
| `src/hooks/useAuth.js` | 인증 관리 |
| `src/utils/encryption.js` | 암호화/복호화 |
| `src/utils/smartSearch.js` | 스마트 검색 |
| `src/utils/excelHandler.js` | 엑셀 처리 |
| `src/utils/backupHandler.js` | 백업/복원 |

## ✅ 테스트 현황

- [x] 마이그레이션 테스트
- [x] 다중 계정 테스트
- [x] 검색 기능 테스트
- [x] 엑셀 업로드/다운로드 테스트
- [x] 백업/복원 테스트

## 🚀 배포 준비

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과: dist/ 폴더
```

---

**상세 정보:** `PROJECT_REPORT_v1.5.md` 참조




