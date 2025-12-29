import React, { useState, useEffect } from 'react';
import { KeyRound, ArrowLeft, CheckCircle, XCircle, Mail, Phone, RefreshCw } from 'lucide-react';

const PasswordRecovery = ({ onBack, onRecover, securityData }) => {
    const [step, setStep] = useState(1); // 1: 인증, 2: 새 비밀번호
    const [verificationCode, setVerificationCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [answers, setAnswers] = useState({});
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const recoveryMethod = securityData?.method || 'questions';

    // 인증 코드 생성 및 전송 시뮬레이션
    const sendVerificationCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedCode(code);
        setCodeSent(true);
        setCountdown(180); // 3분
        setError('');

        // 실제로는 백엔드 API 호출
        if (recoveryMethod === 'email') {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`📧 이메일 발송 시뮬레이션: ${securityData.email}`);
                console.log(`인증 코드: ${code}`);
            }
            alert(`[데모] 이메일로 인증 코드가 발송되었습니다.\n코드: ${code}\n\n실제 서비스에서는 이메일로 전송됩니다.`);
        } else if (recoveryMethod === 'phone') {
            if (process.env.NODE_ENV !== 'production') {
                console.log(`📱 SMS 발송 시뮬레이션: ${securityData.phone}`);
                console.log(`인증 코드: ${code}`);
            }
            alert(`[데모] SMS로 인증 코드가 발송되었습니다.\n코드: ${code}\n\n실제 서비스에서는 문자로 전송됩니다.`);
        }
    };

    // 카운트다운 타이머
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 인증 코드 검증
    const handleVerifyCode = (e) => {
        e.preventDefault();
        setError('');

        if (verificationCode === generatedCode) {
            setStep(2);
        } else {
            setError('인증 코드가 올바르지 않습니다.');
        }
    };

    // 보안 질문 답변 확인
    const handleVerifyAnswers = (e) => {
        e.preventDefault();
        setError('');

        const allCorrect = securityData.questions.every((q, index) => {
            const userAnswer = (answers[index] || '').trim().toLowerCase();
            const correctAnswer = q.answer.trim().toLowerCase();
            return userAnswer === correctAnswer;
        });

        if (allCorrect) {
            setStep(2);
        } else {
            setError('보안 질문의 답변이 올바르지 않습니다.');
        }
    };

    // 새 비밀번호 설정
    const handleResetPassword = (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        onRecover(newPassword);
        setSuccess(true);

        setTimeout(() => {
            onBack();
        }, 3000);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="text-green-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">비밀번호 재설정 완료!</h2>
                    <p className="text-gray-600">새로운 비밀번호로 로그인해주세요.</p>
                    <div className="mt-6">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
                        <KeyRound className="text-purple-600" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">비밀번호 찾기</h1>
                    <p className="text-gray-500">
                        {step === 1
                            ? recoveryMethod === 'email' ? '이메일로 인증 코드를 받으세요'
                                : recoveryMethod === 'phone' ? 'SMS로 인증 코드를 받으세요'
                                    : '보안 질문에 답변해주세요'
                            : '새로운 비밀번호를 설정하세요'
                        }
                    </p>
                </div>

                {/* Step 1: 인증 */}
                {step === 1 && (
                    <>
                        {/* 이메일/SMS 인증 */}
                        {(recoveryMethod === 'email' || recoveryMethod === 'phone') && (
                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                {/* 연락처 정보 표시 */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                                    {recoveryMethod === 'email' ? (
                                        <>
                                            <Mail className="text-blue-600" size={24} />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">등록된 이메일</div>
                                                <div className="font-semibold text-gray-800">{securityData.email}</div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Phone className="text-green-600" size={24} />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">등록된 핸드폰</div>
                                                <div className="font-semibold text-gray-800">{securityData.phone}</div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* 인증 코드 발송 버튼 */}
                                {!codeSent ? (
                                    <button
                                        type="button"
                                        onClick={sendVerificationCode}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                                    >
                                        인증 코드 발송
                                    </button>
                                ) : (
                                    <>
                                        {/* 인증 코드 입력 */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700">
                                                    인증 코드
                                                </label>
                                                {countdown > 0 && (
                                                    <span className="text-sm text-red-600 font-semibold">
                                                        {formatTime(countdown)}
                                                    </span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-widest font-semibold"
                                                placeholder="000000"
                                                maxLength="6"
                                                autoFocus
                                                required
                                            />
                                        </div>

                                        {/* 재발송 버튼 */}
                                        <button
                                            type="button"
                                            onClick={sendVerificationCode}
                                            disabled={countdown > 120}
                                            className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <RefreshCw size={16} />
                                            인증 코드 재발송
                                        </button>

                                        {error && (
                                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                                <XCircle size={18} />
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                                        >
                                            인증하기
                                        </button>
                                    </>
                                )}
                            </form>
                        )}

                        {/* 보안 질문 인증 */}
                        {recoveryMethod === 'questions' && (
                            <form onSubmit={handleVerifyAnswers} className="space-y-4">
                                {securityData.questions.map((q, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {q.question}
                                        </label>
                                        <input
                                            type="text"
                                            value={answers[index] || ''}
                                            onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="답변 입력"
                                            required
                                        />
                                    </div>
                                ))}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                        <XCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                                >
                                    다음
                                </button>
                            </form>
                        )}
                    </>
                )}

                {/* Step 2: 새 비밀번호 설정 */}
                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
                            <CheckCircle size={18} />
                            본인 확인이 완료되었습니다
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                새 비밀번호
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="새 비밀번호 입력 (최소 8자)"
                                autoFocus
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                비밀번호 확인
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="비밀번호 재입력"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <XCircle size={18} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                        >
                            비밀번호 재설정
                        </button>
                    </form>
                )}

                {/* 뒤로가기 버튼 */}
                <button
                    onClick={onBack}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 py-2 transition-colors"
                >
                    <ArrowLeft size={18} />
                    로그인으로 돌아가기
                </button>
            </div>
        </div>
    );
};

export default PasswordRecovery;
