// 서비스명으로 URL 자동 검색
const serviceDatabase = {
    // 한국 서비스
    '단티': 'https://www.dantii.com',
    '네이버': 'https://www.naver.com',
    '카카오': 'https://www.kakaocorp.com',
    '쿠팡': 'https://www.coupang.com',
    '배민': 'https://www.baemin.com',
    '당근': 'https://www.daangn.com',
    '토스': 'https://toss.im',
    '국민은행': 'https://www.kbstar.com',
    '신한은행': 'https://www.shinhan.com',
    '우리은행': 'https://www.wooribank.com',

    // 글로벌 서비스
    'google': 'https://www.google.com',
    'gmail': 'https://mail.google.com',
    'youtube': 'https://www.youtube.com',
    'facebook': 'https://www.facebook.com',
    'instagram': 'https://www.instagram.com',
    'twitter': 'https://www.twitter.com',
    'netflix': 'https://www.netflix.com',
    'amazon': 'https://www.amazon.com',
    'github': 'https://www.github.com',
    'notion': 'https://www.notion.so',
    'slack': 'https://www.slack.com',
    'discord': 'https://www.discord.com',
};

export const findServiceUrl = (serviceName) => {
    const lower = serviceName.toLowerCase().trim();

    // 1. 직접 매칭
    if (serviceDatabase[lower]) {
        return serviceDatabase[lower];
    }

    // 2. 부분 매칭 (예: "구글" -> "google")
    for (const [key, url] of Object.entries(serviceDatabase)) {
        if (key.includes(lower) || lower.includes(key)) {
            return url;
        }
    }

    // 3. 데이터베이스에 없는 서비스는 null 반환 (외부 URL 생성 금지)
    return null;
};

export const addCustomService = (name, url) => {
    serviceDatabase[name.toLowerCase()] = url;
};
