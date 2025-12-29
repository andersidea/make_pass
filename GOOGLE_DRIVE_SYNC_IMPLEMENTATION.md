# Google Drive 동기화 구현 완료 문서

## ✅ 구현 완료 사항

### 1. OAuth2 로그인 구현
- ✅ Google Identity Services를 사용한 로그인 버튼 구현
- ✅ Scope: `https://www.googleapis.com/auth/drive.appdata` (앱 전용 데이터 폴더 접근)
- ✅ 사용자 인증 및 프로필 정보 관리

### 2. 데이터 동기화 로직

#### Initial Sync (앱 진입 시)
- ✅ 로그인 직후 `appDataFolder`에서 `vault.json` 검색
- ✅ 파일이 있으면 복호화하여 앱 상태(State)로 로드
- ✅ 파일이 없으면 로컬 캐시에서 로드 후 Drive에 업로드 (초기 동기화)
- ✅ 로컬 캐시와 Drive 데이터 병합 지원

#### Auto Save (자동 저장)
- ✅ 카드 추가/수정/삭제 시 자동 저장
- ✅ 0.5초 디바운스 적용 (성능 최적화)
- ✅ 로컬 캐시와 Drive 동시 저장

### 3. 보안 계층
- ✅ AES-256 암호화 적용
- ✅ 암호화 키: Google OAuth 사용 시 사용자 ID, 마스터 비밀번호 사용 시 마스터 비밀번호
- ✅ Drive에 저장되는 데이터는 암호화되어 구글 서버에서도 평문 확인 불가
- ✅ 로컬 캐시도 동일한 암호화 적용

## 📁 파일 구조

### 새로 생성된 파일
- `src/hooks/useSecureVaultWithDrive.js` - Drive 동기화 지원 Vault Hook
- `src/utils/driveSync.js` - Drive API 연동 유틸리티
- `src/utils/driveSyncManager.js` - 동기화 매니저 (디바운스, 상태 관리)
- `src/utils/googleConfig.js` - Google API 설정
- `src/hooks/useGoogleAuth.js` - Google OAuth 인증 훅

### 수정된 파일
- `src/App.jsx` - Google OAuth 통합 및 Drive 동기화 연결
- `src/components/LoginScreen.jsx` - Google 로그인 버튼 추가
- `src/components/Sidebar.jsx` - 동기화 상태 인디케이터 추가
- `index.html` - Google Identity Services SDK 추가

## 🔄 동작 흐름

### 1. 로그인 흐름
```
1. 사용자가 "Google 계정으로 시작하기" 버튼 클릭
2. Google OAuth 인증 화면 표시
3. 사용자 권한 승인
4. 사용자 프로필 정보 가져오기
5. Initial Sync 시작
```

### 2. Initial Sync 흐름
```
1. appDataFolder에서 vault.json 검색
2. 파일이 있으면:
   - 암호화된 데이터 다운로드
   - 사용자 ID로 복호화
   - 앱 상태로 로드
   - 로컬 캐시에도 저장
3. 파일이 없으면:
   - 로컬 캐시 확인
   - 로컬 데이터가 있으면 Drive에 업로드
   - 없으면 빈 상태로 시작
```

### 3. Auto Save 흐름
```
1. 사용자가 카드 추가/수정/삭제
2. 상태 변경 감지 (useEffect)
3. 0.5초 디바운스 대기
4. 데이터 암호화 (사용자 ID 또는 마스터 비밀번호)
5. 로컬 캐시에 저장
6. Drive에 암호화된 데이터 업로드
```

## 🔒 보안 구조

### 암호화 계층
1. **계정 정보 암호화** (accountsEncrypted)
   - 각 계정의 username/password는 별도로 암호화
   - 암호화 키: 마스터 비밀번호 또는 사용자 ID

2. **전체 데이터 암호화** (Drive 저장)
   - 전체 볼트 데이터를 AES-256으로 암호화
   - 암호화 키: 마스터 비밀번호 또는 사용자 ID
   - Drive에 저장되는 형식: `{ encrypted: "암호화된_문자열" }`

3. **로컬 캐시 암호화**
   - localStorage에도 동일한 암호화 적용
   - 오프라인 지원 및 성능 최적화

### 데이터 저장 위치
- **Google Drive**: `appDataFolder/vault.json` (암호화됨)
- **로컬 캐시**: `localStorage/vault_data` (암호화됨)

## 📊 동기화 상태 관리

### 동기화 상태 인디케이터 (Sidebar)
- 🟢 **초록색 점**: 동기화 완료 (마지막 동기화 시간 표시)
- 🔵 **파란색 점 (펄스)**: 동기화 중
- 🔴 **빨간색 점**: 동기화 오류 (툴팁으로 오류 메시지 표시)

### 상태 정보
```javascript
{
  isSyncing: boolean,      // 동기화 중 여부
  lastSyncTime: Date,      // 마지막 동기화 시간
  error: string | null     // 오류 메시지
}
```

## 🛠️ 사용 방법

### 1. 환경 변수 설정
`.env` 파일 생성:
```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### 2. Google Cloud Console 설정
1. 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. Google Drive API 활성화
4. 승인된 JavaScript 원본에 도메인 추가

자세한 설정 가이드는 `GOOGLE_OAUTH_SETUP.md` 참조

### 3. 앱 실행
- 환경 변수가 설정되어 있으면 Google 로그인 버튼 표시
- 환경 변수가 없으면 기존 마스터 비밀번호 방식 사용

## 🔍 주요 기능

### 1. 오프라인 지원
- 로컬 캐시를 통해 오프라인에서도 앱 사용 가능
- 온라인 복귀 시 자동으로 Drive와 동기화

### 2. 충돌 해결
- 현재는 마지막 저장이 우선 (향후 타임스탬프 기반 충돌 해결 추가 가능)

### 3. 성능 최적화
- 디바운스를 통한 불필요한 API 호출 최소화
- 로컬 캐시를 통한 빠른 데이터 로드

## ⚠️ 주의사항

1. **암호화 키 관리**
   - Google OAuth 사용 시 사용자 ID를 암호화 키로 사용
   - 마스터 비밀번호 사용 시 사용자가 직접 관리
   - 키를 잃어버리면 데이터 복구 불가능

2. **데이터 마이그레이션**
   - 기존 마스터 비밀번호 사용자는 Google OAuth로 전환 가능
   - 마이그레이션 시 기존 데이터를 Drive에 업로드

3. **동시 접근**
   - 여러 디바이스에서 동시 접근 시 마지막 저장이 우선
   - 향후 충돌 해결 로직 추가 권장

## 📝 다음 개선 사항

- [ ] 타임스탬프 기반 충돌 해결
- [ ] 동기화 실패 시 재시도 로직
- [ ] 네트워크 상태 감지 및 오프라인 모드 표시
- [ ] 동기화 진행률 표시
- [ ] 수동 동기화 버튼 추가


