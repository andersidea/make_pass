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

    // 데이터 변환: Site, Accounts, Custom Fields를 row로 분리
    const rows = [];
    
    items.forEach((item, index) => {
        if (!item) {
            console.warn(`⚠️ [downloadExcel] item[${index}]가 null 또는 undefined입니다.`);
            return;
        }
        
        const categoryName = categoryMap[item.categoryId] || '미분류';
        let itemRowCount = 0; // 이 아이템에서 생성된 row 개수 추적
        
        // 디버깅: 각 아이템 구조 로깅 (처음 3개만)
        if (index < 3) {
            console.log(`📦 [downloadExcel] item[${index}] 구조:`, {
                id: item.id,
                type: item.type,
                categoryId: item.categoryId,
                siteName: item.siteName,
                serviceName: item.serviceName,
                institutionName: item.institutionName,
                hasAccounts: !!item.accounts,
                accountsLength: item.accounts?.length || 0,
                hasAccountsEncrypted: !!item.accountsEncrypted,
                hasCustomFields: !!item.customFields,
                customFieldsLength: item.customFields?.length || 0,
                hasMemo: !!item.memo,
                hasTags: !!(item.tags && item.tags.length > 0),
                hasFinanceFields: !!(item.institutionName || item.accountCardNumber)
            });
        }
        
        // 메모 타입 처리 (메모 타입이거나 memo 필드가 있는 경우)
        const isMemoType = item.type === 'memo' || (item.memo && (!item.accounts || item.accounts.length === 0));
        if (isMemoType && item.memo) {
            rows.push({
                site_name: item.siteName || item.title || '',
                url: item.url || '',
                category_name: categoryName,
                field_name: 'memo',
                field_value: String(item.memo || '')
            });
            itemRowCount++;
        }
        
        // 태그 처리 (메모 타입)
        if (isMemoType && item.tags && Array.isArray(item.tags) && item.tags.length > 0) {
            rows.push({
                site_name: item.siteName || item.title || '',
                url: item.url || '',
                category_name: categoryName,
                field_name: 'tags',
                field_value: item.tags.join(', ')
            });
            itemRowCount++;
        }
        
        // 금융 타입 처리
        const isFinanceType = item.type === 'finance' || item.institutionName || item.accountCardNumber || item.accountHolder;
        if (isFinanceType) {
            // 기관명
            if (item.institutionName) {
                rows.push({
                    site_name: item.siteName || item.institutionName || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: 'institution_name',
                    field_value: String(item.institutionName)
                });
                itemRowCount++;
            }
            // 계좌/카드번호
            if (item.accountCardNumber) {
                rows.push({
                    site_name: item.siteName || item.institutionName || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: 'account_card_number',
                    field_value: String(item.accountCardNumber)
                });
                itemRowCount++;
            }
            // 예금주/카드주
            if (item.accountHolder) {
                rows.push({
                    site_name: item.siteName || item.institutionName || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: 'account_holder',
                    field_value: String(item.accountHolder)
                });
                itemRowCount++;
            }
            // 유효기간
            if (item.expiryDate) {
                rows.push({
                    site_name: item.siteName || item.institutionName || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: 'expiry_date',
                    field_value: String(item.expiryDate)
                });
                itemRowCount++;
            }
            // 이용 한도
            if (item.creditLimit !== undefined && item.creditLimit !== null && item.creditLimit !== '') {
                rows.push({
                    site_name: item.siteName || item.institutionName || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: 'credit_limit',
                    field_value: String(item.creditLimit)
                });
                itemRowCount++;
            }
            // 결제일
            if (item.paymentDate !== undefined && item.paymentDate !== null && item.paymentDate !== '') {
                rows.push({
                    site_name: item.siteName || item.institutionName || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: 'payment_date',
                    field_value: String(item.paymentDate)
                });
                itemRowCount++;
            }
        }
        
        // Accounts 처리 (비밀번호 타입 - accountsEncrypted가 있으면 복호화 불가능하므로 이미 복호화된 accounts 사용)
        if (item.accounts && Array.isArray(item.accounts) && item.accounts.length > 0) {
            item.accounts.forEach((account, accIndex) => {
                if (!account) return;
                
                // username row
                if (account.username) {
                    rows.push({
                        site_name: item.siteName || item.serviceName || item.institutionName || '',
                        url: item.url || '',
                        category_name: categoryName,
                        field_name: 'username',
                        field_value: String(account.username)
                    });
                    itemRowCount++;
                }
                // password row
                if (account.password) {
                    rows.push({
                        site_name: item.siteName || item.serviceName || item.institutionName || '',
                        url: item.url || '',
                        category_name: categoryName,
                        field_name: 'password',
                        field_value: String(account.password)
                    });
                    itemRowCount++;
                }
            });
        }
        
        // Custom Fields 처리 (모든 타입)
        if (item.customFields && Array.isArray(item.customFields) && item.customFields.length > 0) {
            item.customFields.forEach((field, fieldIndex) => {
                if (!field) return;
                
                const fieldName = field.field_name || '';
                const fieldValue = field.field_value || '';
                
                // 빈 필드는 제외하지 않고 포함 (사용자가 의도적으로 추가했을 수 있음)
                rows.push({
                    site_name: item.siteName || item.serviceName || item.institutionName || item.title || '',
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: String(fieldName),
                    field_value: String(fieldValue)
                });
                itemRowCount++;
            });
        }
        
        // 어떤 데이터도 없는 경우 기본 row 하나 생성 (제목만이라도)
        if (itemRowCount === 0) {
            const siteName = item.siteName || item.serviceName || item.institutionName || item.title || '';
            if (siteName) {
                rows.push({
                    site_name: siteName,
                    url: item.url || '',
                    category_name: categoryName,
                    field_name: '',
                    field_value: ''
                });
                itemRowCount++;
            } else {
                console.warn(`⚠️ [downloadExcel] item[${index}]에 제목도 없어 기본 row를 생성할 수 없습니다.`, item);
            }
        }
        
        // 디버깅: 각 아이템에서 생성된 row 개수 (처음 3개만)
        if (index < 3) {
            console.log(`   → item[${index}]에서 ${itemRowCount}개의 row 생성됨`);
        }
    });

    // 로그: 변환된 데이터 확인
    console.log('📋 [downloadExcel] 변환된 rows 개수:', rows.length);
    console.log('   - rows 샘플 (최대 3개):', rows.slice(0, 3));

    // 데이터가 없으면 에러
    if (rows.length === 0) {
        console.warn('⚠️ [downloadExcel] 변환된 데이터가 없습니다.');
        throw new Error('다운로드할 데이터가 없습니다. 데이터를 확인해주세요.');
    }

    // 워크북 생성
    try {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sites');

        // 파일 다운로드
        const fileName = `password_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        console.log('✅ [downloadExcel] 파일 다운로드 완료:', fileName);
    } catch (error) {
        console.error('❌ [downloadExcel] 파일 생성 실패:', error);
        throw error;
    }
};
