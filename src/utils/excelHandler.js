import * as XLSX from 'xlsx';

/**
 * 헤더 정규화 및 키워드 매핑 함수 (유연한 헤더 인식)
 */
const normalizeHeader = (header) => {
    return String(header).toLowerCase().replace(/[_\s]/g, '');
};

/**
 * 헤더에서 키워드를 찾아 매핑 (한국어/영어 모두 지원)
 */
const mapHeaderToField = (header, normalized) => {
    // 서비스명 / 사이트명 (웹 타입)
    if (normalized.includes('서비스명') || normalized.includes('서비스') || 
        normalized.includes('sitename') || normalized.includes('servicename') ||
        (normalized.includes('site') && !normalized.includes('field'))) {
        return 'site_name';
    }
    
    // 기관명 (금융 타입)
    if (normalized.includes('기관명') || normalized.includes('기관') ||
        normalized.includes('institutionname') || normalized.includes('institution') ||
        normalized.includes('bankname') || normalized.includes('bank')) {
        return 'institution_name';
    }
    
    // 제목 (메모 타입)
    if (normalized.includes('제목') || normalized.includes('title')) {
        return 'title';
    }
    
    // URL
    if (normalized.includes('url') || normalized.includes('웹사이트') || normalized.includes('웹주소')) {
        return 'url';
    }
    
    // 계좌번호 (금융 타입)
    if (normalized.includes('계좌번호') || normalized.includes('계좌') ||
        normalized.includes('accountnumber') || normalized.includes('account') ||
        normalized.includes('cardnumber') || normalized.includes('카드번호')) {
        return 'account_number';
    }
    
    // 예금주 (금융 타입)
    if (normalized.includes('예금주') || normalized.includes('accountHolder') ||
        normalized.includes('accountholder') || normalized.includes('holder')) {
        return 'account_holder';
    }
    
    // 비밀번호
    if (normalized.includes('비밀번호') || normalized.includes('password') ||
        normalized.includes('pw') || normalized.includes('pass')) {
        return 'password';
    }
    
    // 아이디
    if (normalized.includes('아이디') || normalized.includes('id') ||
        normalized.includes('username') || normalized.includes('userid')) {
        return 'username';
    }
    
    // 카테고리
    if (normalized.includes('category') || normalized.includes('카테고리') ||
        normalized.includes('분류')) {
        return 'category_name';
    }
    
    // 내용 (메모 타입)
    if (normalized.includes('내용') || normalized.includes('content') ||
        normalized.includes('memo') || normalized.includes('메모') ||
        normalized.includes('본문')) {
        return 'content';
    }
    
    // 태그
    if (normalized.includes('태그') || normalized.includes('tag') ||
        normalized.includes('tags')) {
        return 'tags';
    }
    
    // 필드명
    if (normalized.includes('fieldname') || (normalized.includes('field') && normalized.includes('name')) ||
        normalized.includes('필드명')) {
        return 'field_name';
    }
    
    // 필드값
    if (normalized.includes('fieldvalue') || (normalized.includes('field') && normalized.includes('value')) ||
        normalized.includes('필드값')) {
        return 'field_value';
    }
    
    // 수정일
    if (normalized.includes('수정일') || normalized.includes('modified') ||
        normalized.includes('updated') || normalized.includes('lastmodified')) {
        return 'modified_date';
    }
    
    return null;
};

/**
 * 엑셀/CSV 파일 파싱 (통합 함수 - 확장자 무관)
 * CSV와 XLSX 모두 지원
 */
export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const fileName = file.name.toLowerCase();
        const isCSV = fileName.endsWith('.csv');
        
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                let workbook;
                let jsonData;
                
                if (isCSV) {
                    // CSV 파일 처리
                    const csvText = e.target.result;
                    workbook = XLSX.read(csvText, { type: 'string' });
                } else {
                    // XLSX/XLS 파일 처리
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array' });
                }
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonData || jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // 첫 번째 행에서 헤더 찾기 (유연한 매핑)
                const headers = Object.keys(jsonData[0] || {});
                const headerMap = {};
                headers.forEach(h => {
                    const normalized = normalizeHeader(h);
                    const fieldType = mapHeaderToField(h, normalized);
                    if (fieldType) {
                        headerMap[fieldType] = h;
                    }
                });

                const rows = [];
                jsonData.forEach(row => {
                    const mappedRow = {};
                    
                    // 기본 필드 매핑
                    mappedRow.site_name = headerMap.site_name && row[headerMap.site_name] ? String(row[headerMap.site_name]).trim() : '';
                    mappedRow.institution_name = headerMap.institution_name && row[headerMap.institution_name] ? String(row[headerMap.institution_name]).trim() : '';
                    mappedRow.title = headerMap.title && row[headerMap.title] ? String(row[headerMap.title]).trim() : '';
                    mappedRow.url = headerMap.url && row[headerMap.url] ? String(row[headerMap.url]).trim() : '';
                    mappedRow.account_number = headerMap.account_number && row[headerMap.account_number] ? String(row[headerMap.account_number]).trim() : '';
                    mappedRow.account_holder = headerMap.account_holder && row[headerMap.account_holder] ? String(row[headerMap.account_holder]).trim() : '';
                    mappedRow.password = headerMap.password && row[headerMap.password] ? String(row[headerMap.password]).trim() : '';
                    mappedRow.username = headerMap.username && row[headerMap.username] ? String(row[headerMap.username]).trim() : '';
                    mappedRow.category_name = headerMap.category_name && row[headerMap.category_name] ? String(row[headerMap.category_name]).trim() : '';
                    mappedRow.content = headerMap.content && row[headerMap.content] ? String(row[headerMap.content]).trim() : '';
                    mappedRow.tags = headerMap.tags && row[headerMap.tags] ? String(row[headerMap.tags]).trim() : '';
                    mappedRow.field_name = headerMap.field_name && row[headerMap.field_name] ? String(row[headerMap.field_name]).trim() : '';
                    mappedRow.field_value = headerMap.field_value && row[headerMap.field_value] ? String(row[headerMap.field_value]).trim() : '';
                    mappedRow.modified_date = headerMap.modified_date && row[headerMap.modified_date] ? String(row[headerMap.modified_date]).trim() : '';
                    
                    // 데이터가 하나라도 있으면 추가 (site_name, institution_name, title 중 하나라도 있으면)
                    if (mappedRow.site_name || mappedRow.institution_name || mappedRow.title || mappedRow.url) {
                        rows.push(mappedRow);
                    }
                });

                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        
        if (isCSV) {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
};

/**
 * CSV 텍스트 파싱 (XLSX 라이브러리 사용)
 * @deprecated parseExcelFile이 CSV/XLSX 모두 지원하므로 이 함수는 하위 호환성을 위해 유지
 */
export const parseCSVText = (csvText) => {
    try {
        // XLSX로 CSV 파싱
        const workbook = XLSX.read(csvText, { type: 'string' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) return [];

        const headers = Object.keys(jsonData[0] || {});
        const headerMap = {};
        headers.forEach(h => {
            const normalized = normalizeHeader(h);
            const fieldType = mapHeaderToField(h, normalized);
            if (fieldType) {
                headerMap[fieldType] = h;
            }
        });

        const rows = [];
        jsonData.forEach(row => {
            const mappedRow = {};
            mappedRow.site_name = headerMap.site_name && row[headerMap.site_name] ? String(row[headerMap.site_name]).trim() : '';
            mappedRow.institution_name = headerMap.institution_name && row[headerMap.institution_name] ? String(row[headerMap.institution_name]).trim() : '';
            mappedRow.title = headerMap.title && row[headerMap.title] ? String(row[headerMap.title]).trim() : '';
            mappedRow.url = headerMap.url && row[headerMap.url] ? String(row[headerMap.url]).trim() : '';
            mappedRow.category_name = headerMap.category_name && row[headerMap.category_name] ? String(row[headerMap.category_name]).trim() : '';
            mappedRow.field_name = headerMap.field_name && row[headerMap.field_name] ? String(row[headerMap.field_name]).trim() : '';
            mappedRow.field_value = headerMap.field_value && row[headerMap.field_value] ? String(row[headerMap.field_value]).trim() : '';

            if (mappedRow.site_name || mappedRow.institution_name || mappedRow.title || mappedRow.url) {
                rows.push(mappedRow);
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

    // 항목별로 그룹화 및 처리 (웹, 금융, 메모 모두 지원)
    rows.forEach(row => {
        // 데이터 타입 판별: institution_name이 있으면 금융, title/content가 있으면 메모, 그 외는 웹
        const isFinance = row.institution_name && row.institution_name.trim();
        const isMemo = (row.title && row.title.trim()) || (row.content && row.content.trim());
        const isWeb = (row.site_name && row.site_name.trim()) || (row.url && row.url.trim());
        
        // 데이터가 하나도 없으면 스킵
        if (!isFinance && !isMemo && !isWeb) return;

        // 키 생성: 타입별로 다른 키 사용
        let itemKey;
        if (isFinance) {
            itemKey = `finance|${(row.institution_name || '').trim()}|${(row.account_number || '').trim()}`;
        } else if (isMemo) {
            itemKey = `memo|${(row.title || '').trim()}`;
        } else {
            itemKey = `web|${(row.site_name || '').trim()}|${(row.url || '').trim()}`;
        }
        
        if (!siteMap[itemKey]) {
            // 기존 항목 찾기
            let existingItem = null;
            if (isFinance) {
                existingItem = existingItems.find(item => 
                    item.institutionName && (item.institutionName || '').trim() === (row.institution_name || '').trim() &&
                    item.accountCardNumber && (item.accountCardNumber || '').trim() === (row.account_number || '').trim()
                );
            } else if (isMemo) {
                existingItem = existingItems.find(item => 
                    item.siteName && (item.siteName || '').trim() === (row.title || '').trim()
                );
            } else {
                existingItem = existingItems.find(item => 
                    (item.siteName || '').trim() === (row.site_name || '').trim() &&
                    (item.url || '').trim() === (row.url || '').trim()
                );
            }

            if (existingItem) {
                siteMap[itemKey] = {
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
                    siteName: isFinance ? (row.institution_name || '').trim() : (isMemo ? (row.title || '').trim() : (row.site_name || '').trim()),
                    url: isWeb ? (row.url || '').trim() : '',
                    categoryId: categoryId,
                    accounts: [], // Multi-Account
                    customFields: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                
                // 금융 타입 필드 추가
                if (isFinance) {
                    newItem.type = 'finance';
                    newItem.institutionName = (row.institution_name || '').trim();
                    newItem.accountCardNumber = (row.account_number || '').trim();
                    newItem.accountHolder = (row.account_holder || '').trim();
                }
                
                // 메모 타입 필드 추가
                if (isMemo) {
                    newItem.type = 'memo';
                    newItem.memo = (row.content || '').trim();
                    if (row.tags && row.tags.trim()) {
                        newItem.tags = row.tags.split(',').map(t => t.trim()).filter(t => t);
                    }
                }
                
                const addedItemId = onAddItem(newItem);
                // onAddItem이 반환하는 ID 사용
                const addedItem = existingItems.find(i => i.id === addedItemId) || newItem;
                siteMap[itemKey] = {
                    item: { ...addedItem, id: addedItemId || `temp_${Date.now()}` },
                    needsUpdate: false
                };
                stats.sitesCreated++;
            }
        }

        // accounts 초기화 확인
        if (!siteMap[itemKey].item.accounts) {
            siteMap[itemKey].item.accounts = [];
        }

        // 웹 타입인 경우에만 username/password 처리
        if (isWeb) {
            // username 필드 처리
            if (row.username && row.username.trim()) {
                const username = row.username.trim();
                const existingAccountIndex = siteMap[itemKey].item.accounts.findIndex(
                    acc => acc.username === username
                );
                
                if (existingAccountIndex >= 0) {
                    // 기존 account 업데이트
                    siteMap[itemKey].item.accounts[existingAccountIndex].username = username;
                } else {
                    // 새 account 생성
                    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    siteMap[itemKey].item.accounts.push({
                        id: accountId,
                        username: username,
                        password: (row.password || '').trim(),
                        memo: '',
                        isVerified: false,
                        verifiedAt: null
                    });
                    stats.accountsAdded++;
                }
                siteMap[itemKey].needsUpdate = true;
            }
            
            // password 필드 처리 (username과 독립적으로)
            if (row.password && row.password.trim()) {
                if (siteMap[itemKey].item.accounts.length > 0) {
                    const lastAccount = siteMap[itemKey].item.accounts[siteMap[itemKey].item.accounts.length - 1];
                    if (!lastAccount.password) {
                        lastAccount.password = row.password.trim();
                    }
                } else if (row.username && row.username.trim()) {
                    // username과 함께 처리됨 (위에서)
                } else {
                    // account가 없으면 새로 생성
                    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    siteMap[itemKey].item.accounts.push({
                        id: accountId,
                        username: '',
                        password: row.password.trim(),
                        memo: '',
                        isVerified: false,
                        verifiedAt: null
                    });
                    stats.accountsAdded++;
                }
                siteMap[itemKey].needsUpdate = true;
            }
        }

        // field_name과 field_value가 있는 경우 Custom Field로 처리
        if (row.field_name && row.field_name.trim() && row.field_value) {
            const field = {
                id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                field_name: row.field_name.trim(),
                field_value: String(row.field_value).trim()
            };

            // 중복 체크 (같은 field_name이 이미 있으면 업데이트)
            if (!siteMap[itemKey].item.customFields) {
                siteMap[itemKey].item.customFields = [];
            }
            
            const existingFieldIndex = siteMap[itemKey].item.customFields.findIndex(
                f => f.field_name === row.field_name.trim()
            );

            if (existingFieldIndex >= 0) {
                siteMap[itemKey].item.customFields[existingFieldIndex] = field;
            } else {
                siteMap[itemKey].item.customFields.push(field);
            }

            siteMap[itemKey].needsUpdate = true;
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
