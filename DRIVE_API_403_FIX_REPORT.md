# Google Drive API 403 에러 수정 보고서

**작업일**: 2024년  
**문제**: `drive.file` 권한과 `appDataFolder` 경로의 불일치로 인한 403 에러  
**상태**: ✅ **수정 완료**

---

## 🔍 문제 분석

### 발생한 문제
- **403 에러**: `drive.file` 권한으로 `appDataFolder` 접근 시 권한 오류 발생
- **원인**: `drive.file` 권한은 사용자가 명시적으로 앱에 부여한 파일에만 접근 가능하며, `appDataFolder`는 특수 공간으로 접근이 제한적임

### 해결 방안
- `appDataFolder` 대신 일반 드라이브 루트 폴더 사용
- `spaces=appDataFolder` 파라미터 제거
- `parents: ['appDataFolder']` 제거하여 루트 폴더에 저장

---

## ✅ 수정 사항

### 1. driveSync.js 함수명 및 로직 변경

#### 변경 사항
- ✅ **`findFileInAppData` → `findFileInDrive`**: 함수명 변경 및 검색 로직 수정
  - `spaces=appDataFolder` 파라미터 제거
  - `'appDataFolder' in parents` 조건 제거
  - 일반 드라이브 공간에서 파일 검색

- ✅ **`uploadFileToAppData` → `uploadFileToDrive`**: 함수명 변경 및 업로드 로직 수정
  - `parents: ['appDataFolder']` 제거 (루트 폴더에 저장)
  - 일반 드라이브 공간에 파일 업로드

- ✅ **`downloadFileFromAppData` → `downloadFileFromDrive`**: 함수명 변경
  - 내부적으로 `findFileInDrive` 사용

**수정 코드**:
```javascript
// findFileInDrive: appDataFolder 제거
const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and trashed=false&fields=files(id,name,modifiedTime)&pageSize=1`,
    // spaces=appDataFolder 제거됨
);

// uploadFileToDrive: parents 제거 (루트에 저장)
form.append('metadata', new Blob([JSON.stringify({ name: fileName })], { type: 'application/json' }));
// parents: ['appDataFolder'] 제거됨
```

---

### 2. 가드 로직 강화 (`driveSyncManager.js`)

#### 변경 사항
- ✅ **`scheduleSave` 가드 로직 추가**: `encryptionKey`가 유효하지 않으면 동기화 시도 중단

**수정 코드**:
```javascript
scheduleSave = (vaultData) => {
    // 가드 로직: encryptionKey가 유효하지 않으면 동기화 시도 중단
    if (!this.encryptionKey || typeof this.encryptionKey !== 'string' || this.encryptionKey.trim() === '') {
        if (isDevelopment) {
            console.warn('scheduleSave: 암호화 키가 유효하지 않아 동기화를 중단합니다.');
        }
        return;
    }
    
    // ... 기존 로직
};
```

---

### 3. useSecureVaultWithDrive.js 가드 로직 추가

#### 변경 사항
- ✅ **초기 동기화 시 가드 로직 추가**: `encryptionKey`가 유효할 때만 `saveVaultToDrive` 실행

**수정 코드**:
```javascript
// Drive에 업로드 (암호화 포함)
// 가드 로직: encryptionKey가 유효할 때만 실행
if (encryptionKey && typeof encryptionKey === 'string' && encryptionKey.trim() !== '') {
    await saveVaultToDrive(itemsToSave, encryptionKey);
}
```

---

## 📋 수정된 파일 목록

1. ✅ `src/utils/driveSync.js`
   - `findFileInAppData` → `findFileInDrive` (함수명 변경 및 로직 수정)
   - `uploadFileToAppData` → `uploadFileToDrive` (함수명 변경 및 로직 수정)
   - `downloadFileFromAppData` → `downloadFileFromDrive` (함수명 변경)
   - `spaces=appDataFolder` 파라미터 제거
   - `parents: ['appDataFolder']` 제거

2. ✅ `src/utils/driveSyncManager.js`
   - `scheduleSave` 가드 로직 추가

3. ✅ `src/hooks/useSecureVaultWithDrive.js`
   - 초기 동기화 시 가드 로직 추가

---

## 🔍 변경 사항 상세

### API 호출 변경

#### 이전 (appDataFolder 사용)
```javascript
// 파일 검색
`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and 'appDataFolder' in parents and trashed=false&spaces=appDataFolder&fields=files(id,name,modifiedTime)&pageSize=1`

// 파일 생성
parents: ['appDataFolder']
```

#### 수정 후 (일반 드라이브 공간 사용)
```javascript
// 파일 검색
`https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false&fields=files(id,name,modifiedTime)&pageSize=1`

// 파일 생성 (루트 폴더에 저장)
parents: [] // 또는 parents 필드 제거
```

---

## ⚠️ 중요 사항

### drive.file 권한 특성
- `drive.file` 권한은 사용자가 명시적으로 앱에 부여한 파일에만 접근 가능
- 파일을 생성하면 자동으로 앱에 부여되므로 접근 가능
- `appDataFolder`는 특수 공간으로 `drive.appdata` 권한이 필요하지만, 현재는 `drive.file` 권한만 사용 중

### 파일 저장 위치
- **이전**: `appDataFolder` (사용자가 볼 수 없는 숨겨진 폴더)
- **현재**: 드라이브 루트 폴더 (사용자가 볼 수 있음)
- **보안**: 파일은 여전히 AES-256으로 암호화되어 저장되므로 내용은 안전

---

## ✅ 수정 완료 체크리스트

- [x] `findFileInAppData` → `findFileInDrive` 함수명 변경
- [x] `uploadFileToAppData` → `uploadFileToDrive` 함수명 변경
- [x] `downloadFileFromAppData` → `downloadFileFromDrive` 함수명 변경
- [x] `spaces=appDataFolder` 파라미터 제거
- [x] `parents: ['appDataFolder']` 제거
- [x] `scheduleSave` 가드 로직 추가
- [x] `useSecureVaultWithDrive.js` 가드 로직 추가
- [x] 모든 함수 호출 업데이트
- [x] 빌드 검증 완료
- [x] 린터 검증 완료

---

## 🚀 다음 단계

1. ✅ **완료**: 403 에러 수정 (appDataFolder → 일반 드라이브 공간)
2. ✅ **완료**: 가드 로직 강화 (동기화 시도 중단)
3. ⏳ **대기**: 동기화 로직 안정화 확인
4. ⏳ **대기**: 200개 데이터 테스트 진행

---

## 🔍 테스트 권장 사항

1. **동기화 테스트**:
   - 로그인 후 드라이브에서 `vault.json` 파일이 루트 폴더에 생성되는지 확인
   - 파일 수정 후 자동 동기화가 정상 작동하는지 확인

2. **에러 처리 테스트**:
   - `encryptionKey`가 없는 상태에서 동기화가 시도되지 않는지 확인
   - 403 에러가 발생하지 않는지 확인

3. **데이터 무결성 테스트**:
   - 파일이 정상적으로 암호화되어 저장되는지 확인
   - 파일을 읽어올 때 정상적으로 복호화되는지 확인

---

**작성일**: 2024년  
**최종 업데이트**: 2024년  
**상태**: ✅ **모든 수정 완료, 빌드 및 린터 검증 완료**



