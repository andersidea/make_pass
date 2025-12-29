import * as XLSX from 'xlsx';

/**
 * 엑셀 파일 파싱 (XLSX)
 * 템플릿: site_name, url, category_name, field_name, field_value
 */
export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData || jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // 헤더 정규화 (대소문자, 언더스코어 무시)
                const normalizeHeader = (header) => {
                    return String(header).toLowerCase().replace(/[_\s]/g, '');
                };

                // 첫 번째 행에서 헤더 찾기
                const headers = Object.keys(jsonData[0] || {});
                const headerMap = {};
                headers.forEach(h => {
                    const normalized = normalizeHeader(h);
                    if (normalized.includes('sitename') || (normalized.includes('site') && !normalized.includes('field'))) {
                        headerMap.site_name = h;
                    } else if (normalized.includes('url')) {
                        headerMap.url = h;
                    } else if (normalized.includes('category')) {
                        headerMap.category_name = h;
                    } else if (normalized.includes('fieldname') || (normalized.includes('field') && normalized.includes('name'))) {
                        headerMap.field_name = h;
                    } else if (normalized.includes('fieldvalue') || (normalized.includes('field') && normalized.includes('value'))) {
                        headerMap.field_value = h;
                    }
                });

                const rows = [];
                jsonData.forEach(row => {
                    const siteName = headerMap.site_name && row[headerMap.site_name] ? String(row[headerMap.site_name]).trim() : '';
                    const url = headerMap.url && row[headerMap.url] ? String(row[headerMap.url]).trim() : '';
                    const categoryName = headerMap.category_name && row[headerMap.category_name] ? String(row[headerMap.category_name]).trim() : '';
                    const fieldName = headerMap.field_name && row[headerMap.field_name] ? String(row[headerMap.field_name]).trim() : '';
                    const fieldValue = headerMap.field_value && row[headerMap.field_value] ? String(row[headerMap.field_value]).trim() : '';

                    if (siteName || url) {
                        rows.push({
                            site_name: siteName,
                            url: url,
                            category_name: categoryName,
                            field_name: fieldName,
                            field_value: fieldValue
                        });
                    }
                });

                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * CSV 텍스트 파싱 (XLSX 라이브러리 사용)
 */
export const parseCSVText = (csvText) => {
    try {
        // XLSX로 CSV 파싱
        const workbook = XLSX.read(csvText, { type: 'string' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) return [];

        // 헤더 정규화
        const normalizeHeader = (header) => {
            return String(header).toLowerCase().replace(/[_\s]/g, '');
        };

        const headers = Object.keys(jsonData[0] || {});
        const headerMap = {};
        headers.forEach(h => {
            const normalized = normalizeHeader(h);
            if (normalized.includes('sitename') || (normalized.includes('site') && !normalized.includes('field'))) {
                headerMap.site_name = h;
            } else if (normalized.includes('url')) {
                headerMap.url = h;
            } else if (normalized.includes('category')) {
                headerMap.category_name = h;
            } else if (normalized.includes('fieldname') || (normalized.includes('field') && normalized.includes('name'))) {
                headerMap.field_name = h;
            } else if (normalized.includes('fieldvalue') || (normalized.includes('field') && normalized.includes('value'))) {
                headerMap.field_value = h;
            }
        });

        const rows = [];
        jsonData.forEach(row => {
            const siteName = headerMap.site_name && row[headerMap.site_name] ? String(row[headerMap.site_name]).trim() : '';
            const url = headerMap.url && row[headerMap.url] ? String(row[headerMap.url]).trim() : '';
            const categoryName = headerMap.category_name && row[headerMap.category_name] ? String(row[headerMap.category_name]).trim() : '';
            const fieldName = headerMap.field_name && row[headerMap.field_name] ? String(row[headerMap.field_name]).trim() : '';
            const fieldValue = headerMap.field_value && row[headerMap.field_value] ? String(row[headerMap.field_value]).trim() : '';

            if (siteName || url) {
                rows.push({
                    site_name: siteName,
                    url: url,
                    category_name: categoryName,
                    field_name: fieldName,
                    field_value: fieldValue
                });
            }
        });

        return rows;
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('CSV parsing error:', error);
        }
        return [];
    }
};

/**
 * 엑셀 데이터를 Site와 SiteField로 변환하여 처리
 */
export const processExcelData = (rows, existingCategories, existingItems, onCreateCategory, onAddItem, onUpdateItem) => {
    const categoryMap = {}; // category_name -> category_id
    const siteMap = {}; // site_key -> { item, needsUpdate }
    
    // 기존 카테고리 매핑
    existingCategories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
    });
    categoryMap['미분류'] = 'uncategorized';
    categoryMap[''] = 'uncategorized';

    const stats = {
        categoriesCreated: 0,
        sitesCreated: 0,
        sitesUpdated: 0,
        accountsAdded: 0,
        fieldsAdded: 0,
        errors: []
    };

    // 먼저 모든 카테고리 생성
    const uniqueCategories = new Set();
    rows.forEach(row => {
        if (row.category_name && row.category_name.trim() && !categoryMap[row.category_name.toLowerCase()]) {
            uniqueCategories.add(row.category_name);
        }
    });

    uniqueCategories.forEach(catName => {
        const categoryId = onCreateCategory(catName);
        categoryMap[catName.toLowerCase()] = categoryId;
        stats.categoriesCreated++;
    });

    // Site별로 그룹화 및 처리
    rows.forEach(row => {
        if (!row.site_name && !row.url) return;

        const siteKey = `${(row.site_name || '').trim()}|${(row.url || '').trim()}`;
        
        if (!siteMap[siteKey]) {
            // 기존 Site 찾기
            const existingItem = existingItems.find(item => 
                (item.siteName || '').trim() === (row.site_name || '').trim() &&
                (item.url || '').trim() === (row.url || '').trim()
            );

            if (existingItem) {
                siteMap[siteKey] = {
                    item: { 
                        ...existingItem, 
                        accounts: [...(existingItem.accounts || [])],
                        customFields: [...(existingItem.customFields || [])] 
                    },
                    needsUpdate: false
                };
            } else {
                const categoryId = row.category_name && row.category_name.trim()
                    ? (categoryMap[row.category_name.toLowerCase()] || 'uncategorized')
                    : 'uncategorized';
                
                const newItem = {
                    siteName: (row.site_name || '').trim(),
                    url: (row.url || '').trim(),
                    categoryId: categoryId,
                    accounts: [], // Multi-Account
                    customFields: [],
                    createdAt: new Date().toISOString()
                };
                
                const addedItemId = onAddItem(newItem);
                // onAddItem이 반환하는 ID 사용
                const addedItem = existingItems.find(i => i.id === addedItemId) || newItem;
                siteMap[siteKey] = {
                    item: { ...addedItem, id: addedItemId || `temp_${Date.now()}` },
                    needsUpdate: false
                };
                stats.sitesCreated++;
            }
        }

        // accounts 초기화 확인
        if (!siteMap[siteKey].item.accounts) {
            siteMap[siteKey].item.accounts = [];
        }

        // field_name이 'username' 또는 'password'인 경우 account로 처리
        // 아니면 customField로 처리
        const fieldNameLower = (row.field_name || '').trim().toLowerCase();
        
        if (fieldNameLower === 'username' || fieldNameLower === 'user') {
            // username인 경우: 같은 username이 있으면 업데이트, 없으면 새 account 생성
            const username = String(row.field_value).trim();
            const existingAccountIndex = siteMap[siteKey].item.accounts.findIndex(
                acc => acc.username === username
            );
            
            if (existingAccountIndex >= 0) {
                // 기존 account 업데이트
                siteMap[siteKey].item.accounts[existingAccountIndex].username = username;
            } else {
                // 새 account 생성
                const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                siteMap[siteKey].item.accounts.push({
                    id: accountId,
                    username: username,
                    password: '',
                    memo: '',
                    isVerified: false,
                    verifiedAt: null
                });
                stats.accountsAdded++;
            }
            siteMap[siteKey].needsUpdate = true;
        } else if (fieldNameLower === 'password' || fieldNameLower === 'pw') {
            // password인 경우: 마지막 account에 password 추가
            if (siteMap[siteKey].item.accounts.length > 0) {
                const lastAccount = siteMap[siteKey].item.accounts[siteMap[siteKey].item.accounts.length - 1];
                lastAccount.password = String(row.field_value).trim();
            } else {
                // account가 없으면 새로 생성
                const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                siteMap[siteKey].item.accounts.push({
                    id: accountId,
                    username: '',
                    password: String(row.field_value).trim(),
                    memo: '',
                    isVerified: false,
                    verifiedAt: null
                });
                stats.accountsAdded++;
            }
            siteMap[siteKey].needsUpdate = true;
        } else if (row.field_name && row.field_name.trim() && row.field_value) {
            // 그 외는 Custom Field로 처리
            const field = {
                id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                field_name: row.field_name.trim(),
                field_value: String(row.field_value).trim()
            };

            // 중복 체크 (같은 field_name이 이미 있으면 업데이트)
            if (!siteMap[siteKey].item.customFields) {
                siteMap[siteKey].item.customFields = [];
            }
            
            const existingFieldIndex = siteMap[siteKey].item.customFields.findIndex(
                f => f.field_name === row.field_name.trim()
            );

            if (existingFieldIndex >= 0) {
                siteMap[siteKey].item.customFields[existingFieldIndex] = field;
            } else {
                siteMap[siteKey].item.customFields.push(field);
            }

            siteMap[siteKey].needsUpdate = true;
            stats.fieldsAdded++;
        }
    });

    // 최종 업데이트
    Object.values(siteMap).forEach(({ item, needsUpdate }) => {
        if (needsUpdate && item.id && !item.id.startsWith('temp_')) {
            // accounts가 있으면 포함하여 업데이트
            onUpdateItem(item.id, {
                ...item,
                accounts: item.accounts || [],
                customFields: item.customFields || []
            });
            stats.sitesUpdated++;
        }
    });

    return stats;
};

/**
 * 모든 데이터를 엑셀 형식으로 다운로드
 */
export const downloadExcel = (items, categories, encryptionKey = null) => {
    // 로그: 입력 데이터 확인
    console.log('📊 [downloadExcel] 입력 데이터 확인:');
    console.log('   - items 개수:', items?.length || 0);
    console.log('   - categories 개수:', categories?.length || 0);
    console.log('   - items 샘플:', items?.[0] ? {
        id: items[0].id,
        siteName: items[0].siteName,
        hasAccounts: !!items[0].accounts,
        accountsLength: items[0].accounts?.length || 0,
        hasAccountsEncrypted: !!items[0].accountsEncrypted,
        hasCustomFields: !!items[0].customFields,
        customFieldsLength: items[0].customFields?.length || 0
    } : '데이터 없음');

    // 데이터 유효성 검증
    if (!items || !Array.isArray(items) || items.length === 0) {
        console.warn('⚠️ [downloadExcel] 다운로드할 데이터가 없습니다.');
        throw new Error('다운로드할 데이터가 없습니다.');
    }

    // category_id -> category_name 매핑
    const categoryMap = {};
    if (categories && Array.isArray(categories)) {
        categories.forEach(cat => {
            if (cat && cat.id) {
                categoryMap[cat.id] = cat.name || '알 수 없음';
            }
        });
    }
    categoryMap['uncategorized'] = '미분류';

    // 타입별로 데이터 분리 및 필드 재구성
    // 'Passwords' 시트: 서비스명, 아이디, 비밀번호, 웹사이트, 메모
    // 'Finance' 시트: 기관명, 계좌번호, 예금주, 보안정보, 메모
    // 'Notes' 시트: 제목, 내용, 태그, 수정일
    
    const passwordRows = []; // Passwords 시트용
    const financeRows = [];   // Finance 시트용
    const memoRows = [];      // Notes 시트용
    
    items.forEach((item) => {
        if (!item) return;
        
        // 아이템 타입 판별
        const itemType = item.type || (
            item.institutionName || item.accountCardNumber 
                ? 'finance' 
                : (item.memo && (!item.accounts || item.accounts.length === 0)) 
                    ? 'memo' 
                    : 'web'
        );
        
        // 비밀번호 타입 (web) → 'Passwords' 시트
        if (itemType === 'web' || (item.accounts && item.accounts.length > 0)) {
            const siteName = item.siteName || item.serviceName || '';
            const url = item.url || '';
            const memo = item.memo || '';
            
            // accounts가 있으면 각 계정별로 row 생성
            if (item.accounts && Array.isArray(item.accounts) && item.accounts.length > 0) {
                item.accounts.forEach((account) => {
                    passwordRows.push({
                        '서비스명': siteName,
                        '아이디': account.username || '',
                        '비밀번호': account.password || '',
                        '웹사이트': url,
                        '메모': memo || (account.memo || '')
                    });
                });
            } else {
                // accounts가 없어도 서비스명만 있으면 row 생성
                if (siteName) {
                    passwordRows.push({
                        '서비스명': siteName,
                        '아이디': '',
                        '비밀번호': '',
                        '웹사이트': url,
                        '메모': memo
                    });
                }
            }
        }
        
        // 금융 타입 → 'Finance' 시트
        if (itemType === 'finance' || item.institutionName || item.accountCardNumber) {
            const institutionName = item.institutionName || item.siteName || '';
            const accountNumber = item.accountCardNumber || '';
            const accountHolder = item.accountHolder || '';
            
            // 보안정보: 유효기간, 보안번호, 이용한도 등을 조합
            const securityInfo = [];
            if (item.expiryDate) securityInfo.push(`유효기간: ${item.expiryDate}`);
            if (item.securityCode) securityInfo.push(`보안번호: ${item.securityCode}`);
            if (item.creditLimit) securityInfo.push(`이용한도: ${item.creditLimit}`);
            if (item.paymentDate) securityInfo.push(`결제일: ${item.paymentDate}`);
            const securityInfoText = securityInfo.join(', ');
            
            const memo = item.memo || '';
            
            financeRows.push({
                '기관명': institutionName,
                '계좌번호': accountNumber,
                '예금주': accountHolder,
                '보안정보': securityInfoText,
                '메모': memo
            });
        }
        
        // 메모 타입 → 'Notes' 시트
        if (itemType === 'memo' || (item.memo && (!item.accounts || item.accounts.length === 0))) {
            const title = item.siteName || item.title || '';
            const content = item.memo || '';
            const tags = (item.tags && Array.isArray(item.tags)) ? item.tags.join(', ') : '';
            const modifiedDate = item.lastModified || item.updatedAt || item.createdAt || '';
            const formattedDate = modifiedDate ? new Date(modifiedDate).toLocaleDateString('ko-KR') : '';
            
            memoRows.push({
                '제목': title,
                '내용': content,
                '태그': tags,
                '수정일': formattedDate
            });
        }
    });

    console.log('📊 [downloadExcel] 타입별 데이터 분리 완료:');
    console.log('   - Passwords 시트:', passwordRows.length, '개');
    console.log('   - Finance 시트:', financeRows.length, '개');
    console.log('   - Notes 시트:', memoRows.length, '개');

    // 워크북 생성 (멀티 시트)
    try {
        const workbook = XLSX.utils.book_new();
        
        // 'Passwords' 시트 생성 (데이터가 없어도 헤더만 생성)
        const passwordHeaders = ['서비스명', '아이디', '비밀번호', '웹사이트', '메모'];
        if (passwordRows.length > 0) {
            const passwordSheet = XLSX.utils.json_to_sheet(passwordRows);
            XLSX.utils.book_append_sheet(workbook, passwordSheet, 'Passwords');
        } else {
            // 데이터가 없어도 헤더만 있는 빈 시트 생성
            const emptyPasswordSheet = XLSX.utils.aoa_to_sheet([passwordHeaders]);
            XLSX.utils.book_append_sheet(workbook, emptyPasswordSheet, 'Passwords');
        }
        
        // 'Finance' 시트 생성 (데이터가 없어도 헤더만 생성)
        const financeHeaders = ['기관명', '계좌번호', '예금주', '보안정보', '메모'];
        if (financeRows.length > 0) {
            const financeSheet = XLSX.utils.json_to_sheet(financeRows);
            XLSX.utils.book_append_sheet(workbook, financeSheet, 'Finance');
        } else {
            // 데이터가 없어도 헤더만 있는 빈 시트 생성
            const emptyFinanceSheet = XLSX.utils.aoa_to_sheet([financeHeaders]);
            XLSX.utils.book_append_sheet(workbook, emptyFinanceSheet, 'Finance');
        }
        
        // 'Notes' 시트 생성 (데이터가 없어도 헤더만 생성)
        const notesHeaders = ['제목', '내용', '태그', '수정일'];
        if (memoRows.length > 0) {
            const memoSheet = XLSX.utils.json_to_sheet(memoRows);
            XLSX.utils.book_append_sheet(workbook, memoSheet, 'Notes');
        } else {
            // 데이터가 없어도 헤더만 있는 빈 시트 생성
            const emptyNotesSheet = XLSX.utils.aoa_to_sheet([notesHeaders]);
            XLSX.utils.book_append_sheet(workbook, emptyNotesSheet, 'Notes');
        }

        // 파일 다운로드
        const fileName = `password_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        console.log('✅ [downloadExcel] 파일 다운로드 완료:', fileName);
        console.log('   - 시트 개수:', workbook.SheetNames.length);
        console.log('   - 시트 목록:', workbook.SheetNames.join(', '));
        console.log('   - Passwords 시트:', passwordRows.length, '개 행');
        console.log('   - Finance 시트:', financeRows.length, '개 행');
        console.log('   - Notes 시트:', memoRows.length, '개 행');
    } catch (error) {
        console.error('❌ [downloadExcel] 파일 생성 실패:', error);
        throw error;
    }
};
