# 🔧 서브 카테고리 시스템 구현 보고서

**작업일**: 2024년  
**작업 내용**: 금융 자산 관리 카테고리의 서브 카테고리(카드/계좌) 시스템 구현

---

## ✅ 구현 완료 사항

### 1. useCategories 훅에 parentId 필드 추가

**파일**: `src/hooks/useCategories.js`

**변경 사항**:
- 기본 시스템 카테고리에 `parentId` 필드 추가
- 기본 서브 카테고리 추가: `finance-card` (카드), `finance-account` (계좌)
- `createCategory` 함수에 `parentId` 매개변수 추가
- `financeSubCategories` 반환 추가 (parentId가 'finance'인 카테고리)
- `buildCategoryTree` 헬퍼 함수 추가 (트리 구조 생성용)

**코드**:
```javascript
// 기본 시스템 카테고리 정의
const DEFAULT_CATEGORIES = [
    { id: 'finance', name: '금융 자산 관리', type: 'finance', order: 0, isSystem: true, parentId: null },
    { id: 'finance-card', name: '카드', type: 'finance', order: 0, isSystem: true, parentId: 'finance' },
    { id: 'finance-account', name: '계좌', type: 'finance', order: 1, isSystem: true, parentId: 'finance' },
    { id: 'web', name: '비밀번호 관리', type: 'web', order: 1, isSystem: true, parentId: null },
    { id: 'memo', name: '메모 관리', type: 'memo', order: 2, isSystem: true, parentId: null }
];
```

---

### 2. Sidebar에서 아코디언 형태로 서브 카테고리 렌더링

**파일**: `src/components/Sidebar.jsx`

**변경 사항**:
- `financeSubCategories` prop 추가
- `expandedGroups` 상태에 `'finance-sub'` 추가
- 금융 자산 관리 카테고리 아래에 서브 카테고리 아코디언 구현
- 서브 카테고리 토글 버튼 추가 (ChevronDown/ChevronRight 아이콘)

**코드**:
```javascript
{/* 서브 카테고리 아코디언 (금융 자산 관리만) */}
{category.id === 'finance' && financeSubCategories.length > 0 && (
    <div className="ml-4 mt-1">
        <button
            onClick={() => toggleGroup('finance-sub')}
            className="w-full flex items-center justify-between px-2 py-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
            <span>서브 카테고리</span>
            {expandedGroups['finance-sub'] ? (
                <ChevronDown size={12} />
            ) : (
                <ChevronRight size={12} />
            )}
        </button>
        {expandedGroups['finance-sub'] && (
            <div className="mt-1 ml-2 space-y-1">
                {financeSubCategories.map((subCategory) => 
                    renderCategoryButton(subCategory, activeCategory === subCategory.id)
                )}
            </div>
        )}
    </div>
)}
```

---

### 3. EditModal에서 서브 카테고리별 조건부 필드 적용

**파일**: `src/components/EditModal.jsx`

**변경 사항**:
- `getSubCategoryId` 헬퍼 함수 추가
- 금융 타입 필드 렌더링 로직을 IIFE (즉시 실행 함수)로 감싸서 서브 카테고리별 분기 처리
- 카드(`finance-card`)와 계좌(`finance-account`)에 따라 다른 필드 표시:
  - **카드**: 유효기간, 결제일, 이용 한도 필드 표시 (필수)
  - **계좌**: 유효기간, 결제일, 이용 한도 필드 숨김
  - 라벨 텍스트 동적 변경 (예: "카드번호" vs "계좌번호")

**코드**:
```javascript
{/* 금융 타입 전용 필드 (서브 카테고리별로 다른 필드 표시) */}
{currentCategoryType === 'finance' && (() => {
    const subCategoryId = getSubCategoryId(editedItem?.categoryId || '');
    const isCard = subCategoryId === 'finance-card';
    const isAccount = subCategoryId === 'finance-account';
    
    return (
        <div className="border-t border-gray-200 pt-6">
            {/* ... */}
            {/* 카드 전용 필드: 유효기간, 결제일, 이용 한도 */}
            {isCard && (
                <>
                    {/* 유효기간 (MM/YY) - 카드 전용 */}
                    {/* 결제일 - 카드 전용 */}
                    {/* 이용 한도 - 카드 전용 */}
                </>
            )}
            {/* ... */}
        </div>
    );
})()}
```

---

### 4. App.jsx에서 financeSubCategories prop 전달

**파일**: `src/App.jsx`

**변경 사항**:
- `useCategories` 훅에서 `financeSubCategories` 추출
- `Sidebar` 컴포넌트에 `financeSubCategories` prop 전달

**코드**:
```javascript
const { categories, financeCategories, accountCategories, memoCategories, financeSubCategories, createCategory, updateCategory, deleteCategory, reorderCategories } = useCategories(encryptionKey);

// ...

<Sidebar
    // ...
    financeSubCategories={financeSubCategories}
    // ...
/>
```

---

## 📋 주요 기능

### 1. 서브 카테고리 구조

- **부모 카테고리**: `finance` (금융 자산 관리)
- **서브 카테고리**:
  - `finance-card` (카드)
  - `finance-account` (계좌)

### 2. 조건부 필드 표시

#### 카드 (`finance-card`)
- ✅ 카드번호 (4자리 단위 자동 띄어쓰기)
- ✅ 카드주
- ✅ 유효기간 (MM/YY) - **필수**
- ✅ 결제일 (1-31) - **필수**
- ✅ 이용 한도 (원) - **필수**
- ✅ 보안번호 (CVC)

#### 계좌 (`finance-account`)
- ✅ 계좌번호
- ✅ 예금주
- ✅ 보안번호 (계좌 비밀번호)
- ❌ 유효기간 (표시 안 함)
- ❌ 결제일 (표시 안 함)
- ❌ 이용 한도 (표시 안 함)

---

## 🔍 데이터 구조

### 카테고리 객체 구조
```javascript
{
    id: 'finance-card',
    name: '카드',
    type: 'finance',
    order: 0,
    isSystem: true,
    parentId: 'finance' // 부모 카테고리 ID
}
```

### 필터링 로직
```javascript
// 최상위 금융 카테고리 (parentId가 null)
const financeCategories = categories.filter(cat => cat.type === 'finance' && !cat.parentId);

// 서브 카테고리 (parentId가 'finance')
const financeSubCategories = categories.filter(cat => cat.parentId === 'finance');
```

---

## ✅ 테스트 체크리스트

- [x] useCategories에서 parentId 필드 지원 추가
- [x] 기본 서브 카테고리(카드, 계좌) 생성
- [x] Sidebar에서 서브 카테고리 아코디언 렌더링
- [x] EditModal에서 카드/계좌별 조건부 필드 표시
- [x] App.jsx에서 financeSubCategories prop 전달
- [x] 빌드 성공 확인

---

## 📝 다음 단계 (선택사항)

1. **카테고리 설정 모달 업데이트**: CategoryManageModal에서 서브 카테고리 생성/편집 기능 추가
2. **데이터 마이그레이션**: 기존 금융 항목을 적절한 서브 카테고리로 분류하는 로직 추가
3. **필터링 개선**: VaultCardList에서 서브 카테고리별 필터링 지원

---

**작성일**: 2024년  
**상태**: ✅ **구현 완료**


