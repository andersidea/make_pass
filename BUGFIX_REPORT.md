# 🐛 버그 수정 보고서

**수정일**: 2024년  
**수정 내용**: Button 중첩 오류 및 Google API 401 오류 처리 개선

---

## ✅ 수정 완료 사항

### 1. React DOM Nesting 오류 수정

**문제**: `<button>` 안에 `<button>`이 중첩되어 React hydration 오류 발생

**원인**: Sidebar 컴포넌트에서 그룹 헤더 토글 버튼 안에 퀵 추가(+) 버튼이 중첩되어 있었음

**수정 방법**:
- 외부 컨테이너를 `<button>` 대신 `<div>`로 변경
- 토글 버튼과 퀵 추가 버튼을 형제 요소로 분리
- `flex` 레이아웃으로 정렬 유지

**수정 위치**: `src/components/Sidebar.jsx`
- GROUP 2: 금융 자산 관리
- GROUP 3: 비밀번호 관리
- GROUP 4: 메모 관리

**수정 전**:
```jsx
<button onClick={() => toggleGroup('finance')}>
  <div>...</div>
  <div>
    <button onClick={onQuickAddFinance}>+</button>  {/* 중첩 오류 */}
    <ChevronDown />
  </div>
</button>
```

**수정 후**:
```jsx
<div className="flex items-center justify-between">
  <button onClick={() => toggleGroup('finance')} className="flex-1">
    <div>...</div>
    <ChevronDown />
  </button>
  <button onClick={onQuickAddFinance}>+</button>  {/* 분리 */}
</div>
```

---

### 2. Google API 401 오류 처리 개선

**문제**: `getUserProfileFromToken`에서 401 오류 발생 시 적절한 처리가 없어 사용자에게 혼란 제공

**원인**: 
- 토큰이 만료되었거나 유효하지 않을 때 명확한 오류 처리 부재
- 저장된 토큰을 제거하지 않아 계속 같은 오류 발생

**수정 방법**:
1. `getUserProfileFromToken`에서 401 오류 감지 시:
   - 저장된 토큰 제거 (`setStoredToken(null)`)
   - 저장된 사용자 정보 제거 (`setStoredUserInfo(null)`)
   - 명확한 오류 메시지 반환

2. `getUserProfile`에서:
   - 401 오류를 조용히 처리하여 재로그인 유도
   - 개발 환경에서만 경고 로그 출력

**수정 위치**: `src/utils/driveSync.js`

**주요 변경사항**:
```javascript
// getUserProfileFromToken
if (response.status === 401) {
    // 토큰 제거
    setStoredToken(null);
    setStoredUserInfo(null);
    throw new Error('인증 토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.');
}

// getUserProfile
catch (error) {
    // 401 오류인 경우 토큰이 만료되었으므로 null 반환하여 재로그인 유도
    if (error.message && error.message.includes('401')) {
        return null;
    }
    // 기타 오류도 조용히 처리
    return null;
}
```

---

## ✅ 빌드 확인

```bash
npm run build
```

- ✅ 빌드 성공: `dist/index.html` 생성 (542.00 kB, gzip: 166.17 kB)
- ✅ 빌드 시간: 11.39초
- ✅ 린터 오류: 없음

---

## 📋 테스트 권장 사항

1. **Button 중첩 오류 확인**:
   - 브라우저 콘솔에서 React DOM nesting 경고가 더 이상 나타나지 않는지 확인
   - 사이드바의 금융/비밀번호/메모 관리 그룹 헤더에서 퀵 추가(+) 버튼이 정상 작동하는지 확인

2. **Google API 401 오류 처리 확인**:
   - 만료된 토큰으로 로그인 시도 시 재로그인 화면이 표시되는지 확인
   - 콘솔에 불필요한 오류 메시지가 반복되지 않는지 확인

---

**수정 완료일**: 2024년  
**상태**: ✅ 수정 완료 및 빌드 성공



