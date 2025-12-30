/**
 * 테스트 데이터 생성 스크립트
 * 200개 이상의 허수 데이터 생성 (각 카테고리당 50개 이상)
 */

// 테스트 데이터 생성기
const generateTestData = () => {
    const items = [];
    let idCounter = 1;
    
    // 랜덤 문자열 생성
    const randomString = (length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    
    // 복잡한 비밀번호 생성
    const generateComplexPassword = () => {
        const length = 12 + Math.floor(Math.random() * 16); // 12-27자리
        return randomString(length);
    };
    
    // 카드번호 생성 (16자리)
    const generateCardNumber = () => {
        let card = '';
        for (let i = 0; i < 16; i++) {
            card += Math.floor(Math.random() * 10).toString();
        }
        return card;
    };
    
    // 계좌번호 생성
    const generateAccountNumber = () => {
        const banks = ['110', '120', '130', '140', '150'];
        const bank = banks[Math.floor(Math.random() * banks.length)];
        const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `${bank}-${number}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    };
    
    // 유효기간 생성 (MM/YY)
    const generateExpiryDate = () => {
        const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
        const year = (25 + Math.floor(Math.random() * 10)).toString().padStart(2, '0');
        return `${month}/${year}`;
    };
    
    // 긴 텍스트 생성 (메모용)
    const generateLongText = () => {
        const sentences = [
            '이것은 매우 긴 텍스트입니다. 여러 문장으로 구성되어 있습니다.',
            '프로젝트 관리와 관련된 중요한 정보들이 포함되어 있습니다.',
            '회의 내용과 아이디어, 그리고 다양한 노트들이 기록되어 있습니다.',
            '각 문단은 의미있는 내용을 담고 있으며, 전체적으로 일관성 있는 구조를 가지고 있습니다.',
            '데이터베이스 성능 최적화와 관련된 다양한 고려사항들이 포함되어 있습니다.',
            '사용자 경험 개선을 위한 다양한 아이디어와 제안사항들이 정리되어 있습니다.',
            '시스템 아키텍처 설계와 관련된 중요한 결정사항들이 문서화되어 있습니다.',
            '보안 취약점 분석과 대응 방안에 대한 상세한 내용이 포함되어 있습니다.',
            'API 설계 원칙과 베스트 프랙티스에 대한 가이드라인이 정리되어 있습니다.',
            '프로젝트 일정 관리와 리소스 할당에 대한 전략이 수립되어 있습니다.'
        ];
        
        const paragraphs = Math.floor(Math.random() * 10) + 5; // 5-14 문단
        let text = '';
        for (let i = 0; i < paragraphs; i++) {
            const sentenceCount = Math.floor(Math.random() * 5) + 3; // 3-7 문장
            for (let j = 0; j < sentenceCount; j++) {
                text += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
            }
            text += '\n\n';
        }
        return text.trim();
    };
    
    const now = new Date().toISOString();
    
    // 금융 자산 관리 카테고리별 데이터 생성
    const financeCategories = ['finance-bank', 'finance-card', 'finance-loan', 'finance-other'];
    const financeBanks = ['국민은행', '신한은행', '하나은행', '우리은행', '카카오뱅크', '토스뱅크', 'KB국민카드', '신한카드', '하나카드', '삼성카드'];
    const financeNames = ['주거래 계좌', '적금 계좌', '예금 계좌', '신용카드', '체크카드', '대출 계좌', '보험 계약', '펀드 계좌'];
    
    financeCategories.forEach((categoryId, catIndex) => {
        const isCard = categoryId === 'finance-card';
        const count = 50 + Math.floor(Math.random() * 10); // 50-59개
        
        for (let i = 0; i < count; i++) {
            const bankIndex = Math.floor(Math.random() * financeBanks.length);
            const nameIndex = Math.floor(Math.random() * financeNames.length);
            
            const item = {
                id: `test_finance_${idCounter++}`,
                type: 'finance',
                categoryId: categoryId,
                siteName: `${financeBanks[bankIndex]} ${financeNames[nameIndex]}`,
                institutionName: financeBanks[bankIndex],
                accountHolder: `홍길동${Math.floor(Math.random() * 100)}`,
                createdAt: now,
                updatedAt: now,
                customFields: []
            };
            
            if (isCard) {
                item.accountCardNumber = generateCardNumber();
                item.expiryDate = generateExpiryDate();
                item.paymentDate = (Math.floor(Math.random() * 28) + 1).toString();
                item.creditLimit = (Math.floor(Math.random() * 5000) + 1000) * 100000; // 1억-6억
                item.securityCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            } else {
                item.accountCardNumber = generateAccountNumber();
                item.securityCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            }
            
            items.push(item);
        }
    });
    
    // 비밀번호 관리 카테고리별 데이터 생성
    const webCategories = ['web-shopping', 'web-portal', 'web-finance', 'web-work'];
    const webServices = {
        'web-shopping': ['쿠팡', '11번가', 'G마켓', '옥션', '인터파크', '위메프', '티몬', '스마일배송'],
        'web-portal': ['네이버', '다음', '구글', '야후', '줌', 'Gmail', '아웃룩', '프로톤메일'],
        'web-finance': ['국민은행', '신한은행', '하나은행', '카카오뱅크', '토스', 'KB증권', '키움증권', 'NH투자증권'],
        'web-work': ['슬랙', '트렐로', '아사나', '노션', '구글워크스페이스', '마이크로소프트365', '지라', '컨플루언스']
    };
    
    webCategories.forEach((categoryId) => {
        const services = webServices[categoryId];
        const count = 50 + Math.floor(Math.random() * 10); // 50-59개
        
        for (let i = 0; i < count; i++) {
            const service = services[Math.floor(Math.random() * services.length)];
            const username = `user${Math.floor(Math.random() * 10000)}${randomString(4)}`;
            
            const item = {
                id: `test_web_${idCounter++}`,
                type: 'web',
                categoryId: categoryId,
                siteName: service,
                serviceName: service,
                url: `https://${service.toLowerCase().replace(/\s+/g, '')}.com`,
                accounts: [{
                    id: `acc_${idCounter}_1`,
                    username: username,
                    displayName: '',
                    password: generateComplexPassword(),
                    memo: '',
                    isVerified: Math.random() > 0.7,
                    verifiedAt: Math.random() > 0.7 ? now : null
                }],
                createdAt: now,
                updatedAt: now,
                customFields: [],
                lastVerifiedAt: Math.random() > 0.5 ? now : null,
                passwordChangedAt: Math.random() > 0.5 ? now : null,
                oldPasswords: []
            };
            
            items.push(item);
        }
    });
    
    // 메모 관리 카테고리별 데이터 생성
    const memoCategories = ['memo-idea', 'memo-personal', 'memo-meeting', 'memo-scrap'];
    const memoTitles = {
        'memo-idea': ['프로젝트 아이디어', '기능 개선 제안', '신규 서비스 기획', 'UX 개선 방안', '기술 스택 검토'],
        'memo-personal': ['개인 목표', '학습 계획', '독서 노트', '여행 계획', '일기'],
        'memo-meeting': ['스프린트 회의록', '프로젝트 리뷰', '기획 회의', '디자인 리뷰', '코드 리뷰'],
        'memo-scrap': ['유용한 링크', '참고 자료', '기사 스크랩', '문서 모음', '리소스 정리']
    };
    
    memoCategories.forEach((categoryId) => {
        const titles = memoTitles[categoryId];
        const count = 50 + Math.floor(Math.random() * 10); // 50-59개
        
        for (let i = 0; i < count; i++) {
            const title = titles[Math.floor(Math.random() * titles.length)] + ` ${Math.floor(Math.random() * 100)}`;
            const tags = [];
            const tagCount = Math.floor(Math.random() * 5) + 1; // 1-5개
            const tagPool = ['중요', '참고', '완료', '진행중', '아이디어', '회의', '문서', '프로젝트'];
            for (let j = 0; j < tagCount; j++) {
                const tag = tagPool[Math.floor(Math.random() * tagPool.length)];
                if (!tags.includes(tag)) tags.push(tag);
            }
            
            const item = {
                id: `test_memo_${idCounter++}`,
                type: 'memo',
                categoryId: categoryId,
                siteName: title,
                title: title,
                memo: generateLongText(),
                tags: tags,
                createdAt: now,
                updatedAt: now,
                customFields: []
            };
            
            items.push(item);
        }
    });
    
    return items;
};

// Node.js 환경에서 실행 시
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateTestData };
}

// 브라우저 환경에서 실행 시
if (typeof window !== 'undefined') {
    window.generateTestData = generateTestData;
}



