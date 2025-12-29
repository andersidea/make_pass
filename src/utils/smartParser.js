// 스마트 입력 파서: 자유로운 형식 지원
import { findServiceUrl } from './serviceFinder';

export const parseSmartInput = (text) => {
    const trimmed = text.trim();

    let url = null;
    let id = null;
    let password = null;
    let type = 'uncategorized';
    let title = '미분류 항목';
    let isKnowledge = false; // 지식(메모) 타입 여부

    // 긴 문장 감지 (지식 타입 후보) - 30자 이상이고 URL이나 명확한 계정 정보가 없으면
    if (trimmed.length >= 30) {
        const hasUrl = /(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(trimmed);
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed);
        const hasIdPwPattern = /\b(id|아이디|ID|username|user|userid)\s*[:=]?\s*\w+\s+(pw|password|비밀번호|PW|pass)\s*[:=]?\s*\w+/i.test(trimmed);
        
        if (!hasUrl && !hasEmail && !hasIdPwPattern) {
            // 긴 문장이고 명확한 계정 정보가 없으면 지식 타입으로 판단
            isKnowledge = true;
            type = 'memo';
            title = trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : '');
        }
    }

    // URL 추출 (어디에 있든)
    const urlMatch = trimmed.match(/(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?/);
    if (urlMatch) {
        url = urlMatch[0];
        title = extractServiceName(url);
        type = 'password';
        isKnowledge = false;
    }

    // 이메일 추출
    const emailMatch = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
        id = emailMatch[0];
        if (!type || type === 'uncategorized') {
            type = 'password';
            isKnowledge = false;
            if (!title || title === '미분류 항목') {
                title = emailMatch[0].split('@')[1].split('.')[0];
                title = title.charAt(0).toUpperCase() + title.slice(1);
            }
        }
    }

    // 전화번호 추출
    const phoneMatch = trimmed.match(/(\+?82)?[-\s]?0?1[0-9][-\s]?\d{3,4}[-\s]?\d{4}/);
    if (phoneMatch) {
        const phoneNumber = phoneMatch[0];
        type = 'phone';

        // 이름 추출 (전화번호가 아닌 나머지 텍스트)
        const nameText = trimmed.replace(phoneNumber, '').trim();
        if (nameText) {
            title = nameText;
        } else {
            title = '연락처';
        }

        id = phoneNumber;
    }

    // 금융 키워드 감지 (국민, 신한, 계좌, 카드, 한도 등)
    const financeKeywords = ['국민', '신한', '하나', '우리', '기업', '농협', '카드', '계좌', '한도', '카카오뱅크', '토스', 'card', 'bank', 'finance', 'credit', 'debit'];
    const hasFinanceKeyword = financeKeywords.some(keyword => trimmed.toLowerCase().includes(keyword.toLowerCase()));
    
    if (hasFinanceKeyword && !isKnowledge && type === 'uncategorized') {
        type = 'account';
        // 은행명 추출 시도
        const bankMatch = trimmed.match(/(국민|신한|하나|우리|기업|농협|카카오뱅크|토스)/);
        if (bankMatch) {
            title = bankMatch[0] + ' ' + (trimmed.includes('카드') ? '카드' : '계좌');
        } else {
            title = trimmed.includes('카드') ? '카드' : '계좌';
        }
    }

    // 계좌번호 추출
    const accountMatch = trimmed.match(/\d{2,4}[-\s]\d{2,6}[-\s]\d{2,8}/);
    if (accountMatch && !phoneMatch) {
        id = accountMatch[0];
        type = 'account';
        if (!title || title === '미분류 항목') {
            title = '계좌';
        }
    }

    // 비밀번호 추출 (URL, 이메일, 전화번호, 계좌번호가 아닌 나머지)
    let remaining = trimmed;
    if (url) remaining = remaining.replace(url, '');
    if (id) remaining = remaining.replace(id, '');

    // 남은 텍스트에서 단어 추출
    const words = remaining.trim().split(/\s+/).filter(w => w.length > 0);

    // 계정 정보 패턴 감지 강화 (naver.com id pw, 서비스명 아이디 비밀번호 등)
    const idPwPattern = /\b(?:([a-zA-Z0-9.-]+\.(?:com|net|org|kr|co\.kr))\s+)?(?:id|아이디|ID|username|user|userid)\s*[:=]?\s*(\w+)\s+(?:pw|password|비밀번호|PW|pass)\s*[:=]?\s*(\w+)/i;
    const idPwMatch = trimmed.match(idPwPattern);
    
    if (idPwMatch && !isKnowledge) {
        // 패턴 매칭: naver.com id pw 또는 서비스명 id pw
        if (idPwMatch[1]) {
            // URL/서비스명 포함
            url = idPwMatch[1].startsWith('http') ? idPwMatch[1] : `https://${idPwMatch[1]}`;
            title = extractServiceName(idPwMatch[1]);
        } else if (words.length > 0) {
            // 첫 단어가 서비스명일 가능성
            title = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            const foundUrl = findServiceUrl(words[0]);
            if (foundUrl) url = foundUrl;
        }
        id = idPwMatch[2] || idPwMatch[3];
        password = idPwMatch[4] || idPwMatch[3];
        type = 'password';
        isKnowledge = false;
    } else if (type === 'password' && !id && words.length >= 2 && !isKnowledge) {
        // 일반적인 패턴: 첫 단어를 ID로, 마지막 단어를 비밀번호로
        id = words[0];
        password = words[words.length - 1];
        
        // 첫 단어가 서비스명일 가능성 (URL이 없을 때)
        if (!url && words.length > 2) {
            title = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            const foundUrl = findServiceUrl(words[0]);
            if (foundUrl) {
                url = foundUrl;
            }
        }
    } else if (type === 'password' && words.length > 0 && !isKnowledge) {
        password = words[words.length - 1]; // 마지막 단어를 비밀번호로

        // 첫 단어가 서비스명일 가능성 (URL이 없을 때)
        if (!url && words.length > 1) {
            title = words[0].charAt(0).toUpperCase() + words[0].slice(1);
            const foundUrl = findServiceUrl(words[0]);
            if (foundUrl) {
                url = foundUrl;
            }
        }
    }

    // URL이 없지만 이메일이 있으면 서비스명 추출 시도
    if (!url && id && type === 'password' && id.includes('@')) {
        const domain = id.split('@')[1];
        if (domain) {
            const serviceName = domain.split('.')[0];
            title = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
            const foundUrl = findServiceUrl(serviceName);
            if (foundUrl) {
                url = foundUrl;
            }
        }
    }

    // 지식 타입으로 판단된 경우
    if (isKnowledge) {
        return {
            type: 'memo',
            title: title || trimmed.substring(0, 50),
            fields: {
                memo: trimmed,
                rawInput: text
            },
            category: 'memo',
            group: null,
            createdAt: new Date().toISOString(),
            needsReview: false,
            isKnowledge: true
        };
    }

    // 분류 실패 시 미분류로
    if (!url && !id && !password && !isKnowledge) {
        type = 'uncategorized';
        title = '미분류 항목';
    }

    return {
        type,
        title,
        fields: {
            url: url || '',
            id: id || '',
            password: password || '',
            phoneNumber: type === 'phone' ? id : '',
            accountNumber: type === 'account' ? id : '',
            rawInput: text
        },
        category: getCategoryFromType(type),
        group: url ? getServiceGroup(url) : null,
        createdAt: new Date().toISOString(),
        needsReview: type === 'uncategorized',
        isKnowledge: false
    };
};

// URL에서 서비스명 추출
const extractServiceName = (url) => {
    try {
        const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const name = domain.split('.')[0];
        return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
        return 'Unknown';
    }
};

// 타입에서 카테고리 결정
const getCategoryFromType = (type) => {
    const categoryMap = {
        'password': 'password',
        'account': 'finance',
        'phone': 'contact',
        'uncategorized': 'pending'
    };
    return categoryMap[type] || 'pending';
};

// 서비스 그룹 결정 (유사 사이트 그룹핑)
const getServiceGroup = (url) => {
    const domain = url.toLowerCase();

    // Google 계정
    if (domain.includes('google') || domain.includes('gmail') || domain.includes('youtube')) {
        return 'Google';
    }
    // Meta 계정
    if (domain.includes('facebook') || domain.includes('instagram') || domain.includes('whatsapp')) {
        return 'Meta';
    }
    // Microsoft 계정
    if (domain.includes('microsoft') || domain.includes('outlook') || domain.includes('xbox')) {
        return 'Microsoft';
    }
    // 금융
    if (domain.includes('bank') || domain.includes('card')) {
        return 'Finance';
    }

    return null;
};
