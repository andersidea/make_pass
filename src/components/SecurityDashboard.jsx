import React from 'react';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { checkPasswordStrength, checkDuplicatePasswords } from '../utils/passwordUtils';

const SecurityDashboard = ({ items }) => {
    const passwords = items.filter(item => item.type === 'password');
    const duplicates = checkDuplicatePasswords(items);

    // 비밀번호 강도 분석
    const strengthAnalysis = passwords.map(item => ({
        ...item,
        strength: checkPasswordStrength(item.fields?.password || '')
    }));

    const weakPasswords = strengthAnalysis.filter(p => p.strength.strength === 'weak');
    const mediumPasswords = strengthAnalysis.filter(p => p.strength.strength === 'medium');
    const strongPasswords = strengthAnalysis.filter(p => p.strength.strength === 'strong');

    // 보안 점수 계산 (0-100)
    const securityScore = Math.round(
        (strongPasswords.length * 100 + mediumPasswords.length * 50) /
        (passwords.length || 1)
    );

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <Shield className="text-indigo-600" size={24} />
                <h2 className="text-xl font-bold text-gray-800">보안 대시보드</h2>
            </div>

            {/* 보안 점수 */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">보안 점수</span>
                    <span className={`text-2xl font-bold ${securityScore >= 80 ? 'text-green-600' :
                            securityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {securityScore}점
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all ${securityScore >= 80 ? 'bg-green-500' :
                                securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${securityScore}%` }}
                    />
                </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{strongPasswords.length}</div>
                    <div className="text-xs text-green-700">강력</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-2xl font-bold text-yellow-600">{mediumPasswords.length}</div>
                    <div className="text-xs text-yellow-700">보통</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                    <div className="text-2xl font-bold text-red-600">{weakPasswords.length}</div>
                    <div className="text-xs text-red-700">취약</div>
                </div>
            </div>

            {/* 경고 */}
            {duplicates.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-orange-600 flex-shrink-0" size={20} />
                        <div>
                            <div className="font-semibold text-orange-800 mb-1">중복된 비밀번호 발견</div>
                            <div className="text-sm text-orange-700">
                                {duplicates.length}개의 비밀번호가 여러 사이트에서 사용되고 있습니다.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {weakPasswords.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                        <div>
                            <div className="font-semibold text-red-800 mb-1">취약한 비밀번호</div>
                            <div className="text-sm text-red-700">
                                {weakPasswords.length}개의 비밀번호가 취약합니다. 변경을 권장합니다.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {securityScore >= 80 && duplicates.length === 0 && weakPasswords.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                        <div>
                            <div className="font-semibold text-green-800 mb-1">훌륭합니다!</div>
                            <div className="text-sm text-green-700">
                                모든 비밀번호가 안전하게 관리되고 있습니다.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecurityDashboard;
