import React, { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { generatePassword } from '../utils/passwordUtils';

const PasswordGeneratorPage = ({ onPasswordGenerated }) => {
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [length, setLength] = useState(16);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleGenerate = useCallback(() => {
        const password = generatePassword({
            length,
            includeUppercase,
            includeLowercase,
            includeNumbers,
            includeSymbols
        });
        setGeneratedPassword(password);
        setCopied(false);
    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

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

    // 초기 생성 및 설정 변경 시 자동 재생성
    useEffect(() => {
        handleGenerate();
    }, [handleGenerate]);

    return (
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="max-w-3xl mx-auto">
                {/* 헤더 */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🔑 비밀번호 생성기</h1>
                    <p className="text-gray-600">강력하고 안전한 비밀번호를 생성하세요</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                    {/* 생성된 비밀번호 표시 */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">생성된 비밀번호</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={generatedPassword}
                                readOnly
                                className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl font-mono text-xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-6 py-4 rounded-xl transition-all font-medium flex items-center gap-2 min-w-[140px] justify-center ${
                                    copied
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                }`}
                                title="복사"
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                {copied ? '복사됨!' : '복사'}
                            </button>
                        </div>
                    </div>

                    {/* 설정 */}
                    <div className="space-y-6 border-t border-gray-200 pt-6">
                        {/* 길이 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                길이: <span className="text-indigo-600 font-bold text-lg">{length}</span>자
                            </label>
                            <input
                                type="range"
                                min="8"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>8자</span>
                                <span>64자</span>
                            </div>
                        </div>

                        {/* 옵션 */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">포함할 문자 유형</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={includeUppercase}
                                        onChange={(e) => setIncludeUppercase(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">대문자 (A-Z)</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={includeLowercase}
                                        onChange={(e) => setIncludeLowercase(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">소문자 (a-z)</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={includeNumbers}
                                        onChange={(e) => setIncludeNumbers(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">숫자 (0-9)</span>
                                </label>
                                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-all">
                                    <input
                                        type="checkbox"
                                        checked={includeSymbols}
                                        onChange={(e) => setIncludeSymbols(e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">특수문자 (!@#$...)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* 재생성 버튼 */}
                    <button
                        onClick={handleGenerate}
                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                        <RefreshCw size={20} />
                        새 비밀번호 생성
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordGeneratorPage;

