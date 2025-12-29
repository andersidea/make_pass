export const processUserMessage = (text, context) => {
    const lower = text.toLowerCase();

    // 1. Check for CSV Import
    if (lower.includes('csv') || lower.includes('가져오기')) {
        return {
            text: "CSV 파일을 채팅창에 드래그 앤 드롭해주시면 제가 분석해드릴게요! (크롬/웨일 설정 > 비밀번호 > 내보내기)",
            nextState: 'WAITING_INPUT',
            context
        };
    }

    // 2. State Machine
    switch (context.state) {
        case 'WAITING_INPUT':
            return analyzeIntent(text, context);

        case 'ASKING_ID':
            return {
                text: "비밀번호는 무엇인가요?",
                nextState: 'ASKING_PW',
                context: { ...context, tempId: text }
            };

        case 'ASKING_PW':
            return {
                text: `완료되었습니다! [${context.tempService}] 카드를 생성했습니다.`,
                nextState: 'WAITING_INPUT',
                action: 'CREATE_PASSWORD',
                data: {
                    type: 'password',
                    title: context.tempService,
                    fields: {
                        id: context.tempId,
                        password: text
                    }
                },
                context: {}
            };

        case 'ASKING_ACCOUNT_NUMBER':
            return {
                text: `저장했습니다! [${context.tempBank}] 계좌 카드를 생성했습니다.`,
                nextState: 'WAITING_INPUT',
                action: 'CREATE_ACCOUNT',
                data: {
                    type: 'account',
                    title: context.tempBank,
                    fields: {
                        accountNumber: text
                    }
                },
                context: {}
            };

        case 'ASKING_PHONE_NUMBER':
            return {
                text: `저장했습니다! [${context.tempName}] 연락처 카드를 생성했습니다.`,
                nextState: 'WAITING_INPUT',
                action: 'CREATE_PHONE',
                data: {
                    type: 'phone',
                    title: context.tempName,
                    fields: {
                        phoneNumber: text
                    }
                },
                context: {}
            };

        default:
            return {
                text: "죄송합니다. 제가 이해하지 못했어요. 다시 말씀해주시겠어요?",
                nextState: 'WAITING_INPUT',
                context
            };
    }
};

const analyzeIntent = (text, context) => {
    const lower = text.toLowerCase();

    // Intent: Save Password
    if (lower.includes('비번') || lower.includes('비밀번호') || lower.includes('password')) {
        const words = text.split(' ');
        const service = words[0];

        return {
            text: `[${service}] 비밀번호를 저장할까요? 아이디를 알려주세요.`,
            nextState: 'ASKING_ID',
            context: { ...context, tempService: service }
        };
    }

    // Intent: Save Account
    if (lower.includes('계좌')) {
        const words = text.split(' ');
        const bank = words[0];
        return {
            text: `[${bank}] 계좌를 저장할까요? 계좌번호를 입력해주세요.`,
            nextState: 'ASKING_ACCOUNT_NUMBER',
            context: { ...context, tempBank: bank }
        };
    }

    // Intent: Save Phone Number
    if (lower.includes('전화번호') || lower.includes('연락처') || lower.includes('번호')) {
        const words = text.split(' ');
        const name = words[0];
        return {
            text: `[${name}] 연락처를 저장할까요? 전화번호를 입력해주세요.`,
            nextState: 'ASKING_PHONE_NUMBER',
            context: { ...context, tempName: name }
        };
    }

    // Intent: Open Wallet
    if (lower.includes('지갑') || lower.includes('보여줘') || lower.includes('리스트')) {
        return {
            text: "네, 지갑을 열어드릴게요!",
            action: 'OPEN_WALLET',
            nextState: 'WAITING_INPUT',
            context
        };
    }

    return {
        text: "어떤 정보를 도와드릴까요? (예: '구글 비번 저장해줘', '국민은행 계좌 저장해줘', '엄마 전화번호 저장해줘', '지갑 열어줘')",
        nextState: 'WAITING_INPUT',
        context
    };
};
