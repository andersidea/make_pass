import React, { useState } from 'react';
import { Shield, Mail, Phone, HelpCircle, ArrowRight } from 'lucide-react';

const SecuritySetup = ({ onComplete }) => {
    const [recoveryMethod, setRecoveryMethod] = useState(''); // 'email', 'phone', 'questions'
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [securityAnswers, setSecurityAnswers] = useState(['', '', '']);
    const [error, setError] = useState('');

    const securityQuestions = [
        '어머니의 이름은 무엇입니까?',
        '가장 좋아하는 음식은 무엇입니까?',
        '태어난 도시는 어디입니까?'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!recoveryMethod) {
            setError('복구 방법을 선택해주세요.');
            return;
        }

        const securityData = {
            method: recoveryMethod,
            timestamp: Date.now()
        };

        if (recoveryMethod === 'email') {
            if (!email || !email.includes('@')) {
                setError('올바른 이메일 주소를 입력해주세요.');
                return;
            }
            securityData.email = email;
        } else if (recoveryMethod === 'phone') {
            if (!phone || phone.length < 10) {
                setError('올바른 핸드폰 번호를 입력해주세요.');
                return;
            }
            securityData.phone = phone;
        } else if (recoveryMethod === 'questions') {
            if (securityAnswers.some(a => !a.trim())) {
                setError('모든 보안 질문에 답변해주세요.');
                return;
            }
            securityData.questions = securityQuestions.map((q, i) => ({
                question: q,
                answer: securityAnswers[i].trim()
            }));
        }

        onComplete(securityData);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                    <Shield className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">계정 복구 설정</h2>
                <p className="text-gray-600 text-sm">
                    비밀번호를 잊어버렸을 때 계정을 복구할 방법을 선택하세요
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 복구 방법 선택 */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        복구 방법 선택
                    </label>

                    {/* 이메일 옵션 */}
                    <div
                        onClick={() => setRecoveryMethod('email')}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${recoveryMethod === 'email'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${recoveryMethod === 'email' ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                <Mail className={recoveryMethod === 'email' ? 'text-blue-600' : 'text-gray-600'} size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-800">이메일 인증</div>
                                <div className="text-sm text-gray-500">인증 코드를 이메일로 받기</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${recoveryMethod === 'email'
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300'
                                }`}>
                                {recoveryMethod === 'email' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 핸드폰 옵션 */}
                    <div
                        onClick={() => setRecoveryMethod('phone')}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${recoveryMethod === 'phone'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${recoveryMethod === 'phone' ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                <Phone className={recoveryMethod === 'phone' ? 'text-green-600' : 'text-gray-600'} size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-800">SMS 인증</div>
                                <div className="text-sm text-gray-500">인증 코드를 문자로 받기</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${recoveryMethod === 'phone'
                                    ? 'border-green-500 bg-green-500'
                                    : 'border-gray-300'
                                }`}>
                                {recoveryMethod === 'phone' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 보안 질문 옵션 */}
                    <div
                        onClick={() => setRecoveryMethod('questions')}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${recoveryMethod === 'questions'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${recoveryMethod === 'questions' ? 'bg-purple-100' : 'bg-gray-100'
                                }`}>
                                <HelpCircle className={recoveryMethod === 'questions' ? 'text-purple-600' : 'text-gray-600'} size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-800">보안 질문</div>
                                <div className="text-sm text-gray-500">미리 설정한 질문에 답변하기</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 ${recoveryMethod === 'questions'
                                    ? 'border-purple-500 bg-purple-500'
                                    : 'border-gray-300'
                                }`}>
                                {recoveryMethod === 'questions' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 이메일 입력 */}
                {recoveryMethod === 'email' && (
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이메일 주소
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="example@email.com"
                            required
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            💡 비밀번호 복구 시 이 이메일로 인증 코드가 전송됩니다
                        </p>
                    </div>
                )}

                {/* 핸드폰 입력 */}
                {recoveryMethod === 'phone' && (
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            핸드폰 번호
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="01012345678"
                            maxLength="11"
                            required
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            💡 비밀번호 복구 시 이 번호로 인증 코드가 전송됩니다
                        </p>
                    </div>
                )}

                {/* 보안 질문 답변 */}
                {recoveryMethod === 'questions' && (
                    <div className="pt-2 space-y-4">
                        {securityQuestions.map((question, index) => (
                            <div key={index}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {index + 1}. {question}
                                </label>
                                <input
                                    type="text"
                                    value={securityAnswers[index]}
                                    onChange={(e) => {
                                        const newAnswers = [...securityAnswers];
                                        newAnswers[index] = e.target.value;
                                        setSecurityAnswers(newAnswers);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="답변 입력"
                                    required
                                />
                            </div>
                        ))}
                        <p className="text-xs text-gray-500">
                            💡 답변은 정확하게 기억해야 합니다 (대소문자 구분 안함)
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    다음
                    <ArrowRight size={18} />
                </button>
            </form>
        </div>
    );
};

export default SecuritySetup;
