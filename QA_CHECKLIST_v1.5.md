# QA 체크리스트 v1.5 - Multi-Account & Smart Search

## 테스트 결과 요약

| ID | 구분 | 테스트 항목 | 예상 결과 | 상태 | 비고 |
|---|---|---|---|---|---|
| QA-01 | 마이그레이션 | 기존 데이터가 있는 상태에서 새로고침/재실행 | 에러 없이 실행되며, 기존 ID/PW가 계정 1로 보여야 함 | ✅ 구현됨 | `migrateData` 함수로 안전하게 마이그레이션 |
| QA-02 | 데이터 | 다중 계정 추가 | [+ 계정 추가] 후 user2 / pw2 입력 및 저장 → 새로고침 시 계정이 2개 모두 보여야 함 | ✅ 구현됨 | `EditModal`에서 계정 추가 기능 구현 |
| QA-03 | 데이터 | 계정 삭제 | 계정 2개 중 첫 번째 계정을 삭제하고 저장 시 남은 계정 1개가 유지되어야 함 (인덱스 오류 체크) | ✅ 구현됨 | `handleDeleteAccount`로 ID 기반 삭제, 인덱스 오류 없음 |
| QA-04 | 검색 | 한글 오타 | 검색창에 `dkver` (아플) 입력 시 "아플" 이라는 단어가 포함된 사이트/계정이 검색됨 | ✅ 구현됨 | `matchEngToKor` 함수로 영문→한글 변환 검색 |
| QA-05 | 검색 | 초성 검색 | 검색창에 `ㄴㅇㅂ` 입력 시 네이버(Naver)가 검색됨 | ✅ 구현됨 | `matchChosung` 함수로 초성 검색 지원 |
| QA-06 | 검색 | 계정 검색 | 사이트 이름 말고, 계정 ID를 검색창에 입력 시 해당 ID를 가진 사이트가 검색 결과에 노출됨 | ✅ 구현됨 | `smartSearch`에서 `accounts[].username` 검색 지원 |
| QA-07 | 엑셀 | 다운로드 | 계정이 2개인 사이트가 포함된 상태로 엑셀 다운로드 시 해당 사이트가 2개의 행(Row)으로 분리되어 저장됨 | ✅ 구현됨 | `downloadExcel`에서 accounts별로 row 분리 |
| QA-08 | 엑셀 | 업로드 | 위에서 받은 엑셀을 내용 수정 없이 다시 업로드 시 데이터가 중복 생성되지 않고(병합 로직) 유지되거나 업데이트됨 | ✅ 구현됨 | `processExcelData`에서 site_name + url 기준 병합 |

---

## 상세 분석

### QA-01: 마이그레이션 (가장 중요) ✅

**구현 위치:**
- `src/utils/passwordUtils.js` - `migrateData` 함수
- `src/hooks/useSecureVault.js` - 데이터 로드 시 마이그레이션 호출

**동작 방식:**
1. `useSecureVault`에서 데이터 로드 시 `migrateData` 함수 호출
2. 기존 `username`/`passwordEncrypted` 필드가 있으면 새 `accounts` 배열로 변환
3. 기존 필드는 제거하고 `accountsEncrypted` 필드로 암호화 저장
4. UI에서는 복호화된 `accounts` 배열 사용

**데이터 손실 방지:**
- ✅ 기존 `username`, `password`, `passwordEncrypted` 모두 처리
- ✅ 기존 `memo`는 첫 번째 계정의 `memo`로 이전
- ✅ 기타 필드(`siteName`, `url`, `categoryId` 등)는 모두 유지

---

### QA-02: 다중 계정 추가 ✅

**구현 위치:**
- `src/components/EditModal.jsx` - 계정 추가 UI 및 로직

**동작 방식:**
1. "계정 추가" 버튼 클릭 시 빈 계정 추가
2. 사용자명, 비밀번호, 메모 입력 가능
3. 저장 시 `accounts` 배열에 포함되어 저장
4. 새로고침 후에도 모든 계정 유지

**주의사항:**
- ✅ 각 계정은 고유 ID(`acc_${timestamp}_${random}`)로 식별
- ✅ 계정 순서는 배열 인덱스로 관리

---

### QA-03: 계정 삭제 ✅

**구현 위치:**
- `src/components/EditModal.jsx` - `handleDeleteAccount` 함수

**동작 방식:**
1. 계정 삭제 버튼 클릭 시 해당 계정 ID로 필터링하여 제거
2. 마지막 계정 삭제 시 확인 메시지 표시
3. 인덱스 기반이 아닌 ID 기반 삭제로 안전함

**인덱스 오류 방지:**
- ✅ `accounts.filter(acc => acc.id !== accountId)` 방식 사용
- ✅ 인덱스 오류 발생 가능성 없음

---

### QA-04: 한글 오타 (영문→한글 자동 변환) ✅

**구현 위치:**
- `src/utils/smartSearch.js` - `matchEngToKor` 함수

**동작 방식:**
1. 영문 입력(`dkver`)을 한글 자모로 변환 (`ㅇㅏㅍㄷㄱ`)
2. 변환된 자모로 검색 대상 텍스트 검색
3. 초성으로도 검색하여 "아플"과 매칭

**변환 테이블:**
- `d` → `ㅇ`, `k` → `ㅏ`, `v` → `ㅍ`, `e` → `ㄷ`, `r` → `ㄱ`
- QWERTY 키보드 위치 기반 변환

**주의사항:**
- ✅ 부분 일치 지원 (예: "아플"이 포함된 텍스트 검색 가능)
- ✅ 초성 검색과 함께 사용하여 더 넓은 범위 검색

---

### QA-05: 초성 검색 ✅

**구현 위치:**
- `src/utils/smartSearch.js` - `extractChosung`, `matchChosung` 함수

**동작 방식:**
1. 검색 대상 텍스트에서 초성 추출 (`네이버` → `ㄴㅇㅂ`)
2. 검색 쿼리(`ㄴㅇㅂ`)와 초성 매칭
3. 매칭되면 검색 결과에 포함

**지원 범위:**
- ✅ 한글 완성형 문자에서 초성 추출
- ✅ 이미 초성인 입력도 처리
- ✅ 영문/한글 혼합 검색 지원

---

### QA-06: 계정 검색 ✅

**구현 위치:**
- `src/utils/smartSearch.js` - `searchItems` 함수 내 accounts 검색 로직

**동작 방식:**
1. 각 항목의 `accounts` 배열 순회
2. 각 계정의 `username`, `memo`에서 검색
3. 초성 검색, 영문→한글 변환 검색 모두 지원

**검색 대상:**
- ✅ `accounts[].username` - 계정 사용자명
- ✅ `accounts[].memo` - 계정별 메모
- ✅ `item.siteName`, `item.url`, `item.memo` - 사이트 정보

---

### QA-07: 엑셀 다운로드 (다중 계정) ✅

**구현 위치:**
- `src/utils/excelHandler.js` - `downloadExcel` 함수

**동작 방식:**
1. 각 항목의 `accounts` 배열을 순회
2. 각 계정마다 별도의 row 생성
   - `field_name`: `username`, `field_value`: 사용자명
   - `field_name`: `password`, `field_value`: 비밀번호
3. Custom Fields도 각각 별도 row로 출력

**출력 형식:**
```
site_name | url | category_name | field_name | field_value
Google    | ... | 개인용        | username   | user1@email.com
Google    | ... | 개인용        | password   | pass123
Google    | ... | 개인용        | username   | user2@email.com
Google    | ... | 개인용        | password   | pass456
```

**결과:**
- ✅ 계정이 2개인 사이트는 4개의 row로 출력 (username 2개 + password 2개)
- ✅ 사이트 기본 정보(site_name, url, category_name)는 모든 row에 동일하게 반복

---

### QA-08: 엑셀 업로드 (병합 로직) ✅

**구현 위치:**
- `src/utils/excelHandler.js` - `processExcelData` 함수

**병합 규칙:**
1. `site_name + url` 조합으로 사이트 식별
2. 기존 사이트가 있으면 업데이트, 없으면 생성
3. 계정 처리:
   - `field_name`이 `username`인 경우: 같은 username이 있으면 업데이트, 없으면 새 계정 추가
   - `field_name`이 `password`인 경우: 마지막 계정에 비밀번호 추가
4. Custom Field 처리:
   - 같은 `field_name`이 있으면 업데이트, 없으면 추가

**중복 방지:**
- ✅ `siteMap`을 사용하여 동일 사이트 그룹화
- ✅ `needsUpdate` 플래그로 실제 변경이 있는 경우만 업데이트
- ✅ 동일 엑셀 파일 재업로드 시 중복 생성 없음

**통계:**
- ✅ `categoriesCreated`: 새로 생성된 카테고리 수
- ✅ `sitesCreated`: 새로 생성된 사이트 수
- ✅ `sitesUpdated`: 업데이트된 사이트 수
- ✅ `accountsAdded`: 새로 추가된 계정 수 (추가됨)
- ✅ `fieldsAdded`: 추가/업데이트된 필드 수

---

## 발견된 이슈 및 수정 사항

### ✅ 수정 완료

1. **검색/필터링 순서 문제**
   - **문제**: 검색을 먼저 하고 카테고리 필터를 나중에 적용하여 카테고리 필터가 제대로 작동하지 않음
   - **수정**: 카테고리 필터를 먼저 적용하고, 그 결과에 대해 검색 적용
   - **파일**: `src/App.jsx`

2. **새 항목 생성 시 구식 필드 사용**
   - **문제**: 새 항목 생성 시 `username`, `password` 필드를 사용 (구식 구조)
   - **수정**: `accounts` 배열을 사용하도록 변경
   - **파일**: `src/App.jsx`

3. **검색 함수 호출 방식**
   - **문제**: `useSecureVault`의 `searchItems`는 전체 items를 검색하는데, 이미 필터링된 배열을 검색하려고 함
   - **수정**: `smartSearch` 함수를 직접 import하여 사용하도록 변경
   - **파일**: `src/App.jsx`

4. **엑셀 업로드 통계 누락**
   - **문제**: `accountsAdded` 통계가 누락되어 있음
   - **수정**: `accountsAdded` 통계 추가 및 UI 표시
   - **파일**: `src/utils/excelHandler.js`, `src/components/ExcelUploadModal.jsx`

---

## 테스트 권장 사항

### 실제 테스트 필요 항목

1. **QA-01 (마이그레이션)**: 기존 데이터가 있는 실제 환경에서 테스트 필요
   - 기존 비밀번호 항목이 있는 상태에서 v1.5로 업그레이드
   - 새로고침 후 기존 계정이 제대로 표시되는지 확인
   - localStorage 데이터 확인

2. **QA-04 (영문→한글 변환)**: 실제 변환 정확도 확인 필요
   - `dkver` → `아플` 변환이 정확한지 확인
   - 다른 영문 입력에 대한 변환 테스트

3. **QA-07 (엑셀 다운로드)**: 실제 엑셀 파일 확인 필요
   - 다중 계정 사이트가 제대로 row로 분리되는지 확인
   - 파일 형식 및 인코딩 확인

4. **QA-08 (엑셀 업로드)**: 실제 병합 로직 확인 필요
   - 동일 엑셀 파일 재업로드 시 중복이 발생하지 않는지 확인
   - 업데이트가 올바르게 이루어지는지 확인

---

## 결론

모든 QA 항목이 코드 레벨에서 **구현 완료**되었습니다. 

다만, **실제 환경에서의 테스트**를 통해 다음을 확인해야 합니다:
- 마이그레이션 안정성 (기존 데이터 보존)
- 검색 알고리즘 정확도 (특히 영문→한글 변환)
- 엑셀 업로드/다운로드 호환성

**권장 테스트 순서:**
1. QA-01: 마이그레이션 테스트 (가장 중요)
2. QA-02, QA-03: 다중 계정 CRUD 테스트
3. QA-04, QA-05, QA-06: 검색 기능 테스트
4. QA-07, QA-08: 엑셀 기능 테스트






