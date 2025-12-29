import React, { useState, useEffect } from 'react';
import { X, Copy, RefreshCw, Check } from 'lucide-react';
import { generatePassword } from '../utils/passwordUtils';

const PasswordGeneratorModal = ({ onClose, onPasswordGenerated }) => {
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        const password = generatePassword({
            length,
            includeUppercase,
            includeLowercase,
            includeNumbers,
            includeSymbols
        });
        setGeneratedPassword(password);
        setCopied(false);
    };

    const handleCopy = async () => {
        if (!generatedPassword) return;
        try {
            await navigator.clipboard.writeText(generatedPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            if (onPasswordGenerated) {
                onPasswordGenerated(generatedPassword);
            }
        } catch (err) {
            // 클립보드 복사 실패 시
        }
    };

    // 초기 생성
    useEffect(() => {
        handleGenerate();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">🔑 비밀번호 생성기</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* 내용 */}
                <div className="p-6 space-y-6">
                    {/* 생성된 비밀번호 표시 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">생성된 비밀번호</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={generatedPassword}
                                readOnly
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-3 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                                    copied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                                title="복사"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? '복사됨!' : '복사'}
                            </button>
                        </div>
                    </div>

                    {/* 설정 */}
                    <div className="space-y-4">
                        {/* 길이 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                길이: {length}자
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="32"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>8</span>
                                <span>32</span>
                            </div>
                        </div>

                        {/* 옵션 */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">옵션</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeUppercase}
                                        onChange={(e) => setIncludeUppercase(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">대문자 (A-Z)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeLowercase}
                                        onChange={(e) => setIncludeLowercase(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">소문자 (a-z)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeNumbers}
                                        onChange={(e) => setIncludeNumbers(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">숫자 (0-9)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeSymbols}
                                        onChange={(e) => setIncludeSymbols(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">특수문자 (!@#$...)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 재생성 버튼 */}
                    <button
                        onClick={handleGenerate}
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        새 비밀번호 생성
                    </button>
                </div>

                {/* 푸터 */}
                <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordGeneratorModal;
