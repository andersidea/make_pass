import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Save, GripVertical } from 'lucide-react';

const CategoryManageModal = ({ categories, onClose, onCreate, onUpdate, onDelete, onReorder }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('web'); // 'finance' | 'web' | 'memo'
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [editingType, setEditingType] = useState('web');

    const handleCreate = () => {
        if (!newCategoryName.trim()) return;
        onCreate(newCategoryName.trim(), newCategoryType);
        setNewCategoryName('');
        setNewCategoryType('web');
    };

    const handleStartEdit = (category) => {
        setEditingId(category.id);
        setEditingName(category.name);
        setEditingType(category.type || 'web');
    };

    const handleSaveEdit = (id) => {
        if (!editingName.trim()) return;
        const category = categories.find(c => c.id === id);
        // 시스템 카테고리는 type 변경 불가
        if (category?.isSystem) {
            onUpdate(id, { name: editingName.trim() });
        } else {
            onUpdate(id, { name: editingName.trim(), type: editingType });
        }
        setEditingId(null);
        setEditingName('');
        setEditingType('web');
    };

    const handleDelete = (category) => {
        if (category.isSystem) {
            alert('시스템 카테고리는 삭제할 수 없습니다.');
            return;
        }
        if (window.confirm(`"${category.name}" 카테고리를 삭제하시겠습니까?\n이 카테고리의 항목들은 "미분류"로 이동됩니다.`)) {
            onDelete(category.id);
        }
    };

    // 타입별 그룹으로 분류 (금융, 비밀번호, 메모로 분리)
    const financeCategories = categories.filter(c => c.type === 'finance').sort((a, b) => (a.order || 0) - (b.order || 0));
    const accountCategories = categories.filter(c => c.type === 'web').sort((a, b) => (a.order || 0) - (b.order || 0));
    const memoCategories = categories.filter(c => c.type === 'memo').sort((a, b) => (a.order || 0) - (b.order || 0));

    const renderCategoryItem = (category, isSystem = false) => {
        const isEditing = editingId === category.id;
        const typeLabel = category.type === 'finance' ? '금융 자산 관리' : category.type === 'memo' ? '메모 관리' : '비밀번호 관리';
        const groupLabel = category.type === 'finance' ? '금융 자산 관리' : category.type === 'web' ? '비밀번호 관리' : '메모 관리';

        return (
            <div
                key={category.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group"
                draggable={!isSystem}
                onDragStart={(e) => {
                    if (!isSystem) {
                        e.dataTransfer.setData('categoryId', category.id);
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('categoryId');
                    if (draggedId !== category.id && onReorder && !isSystem) {
                        const newOrder = [...categories];
                        const draggedIndex = newOrder.findIndex(c => c.id === draggedId);
                        const targetIndex = newOrder.findIndex(c => c.id === category.id);
                        if (draggedIndex !== -1 && targetIndex !== -1) {
                            const [removed] = newOrder.splice(draggedIndex, 1);
                            newOrder.splice(targetIndex, 0, removed);
                            onReorder(newOrder.map(c => c.id));
                        }
                    }
                }}
            >
                {/* 드래그 핸들 (시스템 카테고리는 드래그 불가) */}
                {!isSystem && (
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                        <GripVertical size={16} />
                    </div>
                )}
                {isSystem && <div className="w-4" />}
                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(category.id);
                                if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                        />
                        {!isSystem && (
                            <select
                                value={editingType}
                                onChange={(e) => setEditingType(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                                <option value="finance">금융 자산 관리</option>
                                <option value="web">비밀번호 관리</option>
                                <option value="memo">메모 관리</option>
                            </select>
                        )}
                        <button
                            onClick={() => handleSaveEdit(category.id)}
                            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            <Save size={16} />
                        </button>
                        <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{category.name}</span>
                                {isSystem && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">시스템</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {typeLabel} · {groupLabel}
                            </div>
                        </div>
                        <button
                            onClick={() => handleStartEdit(category)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="수정"
                        >
                            <Edit2 size={16} />
                        </button>
                        {!isSystem && (
                            <button
                                onClick={() => handleDelete(category)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="삭제"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">카테고리 설정</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* 내용 */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* 새 카테고리 추가 */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">새 카테고리 추가</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="카테고리 이름"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <select
                                value={newCategoryType}
                                onChange={(e) => setNewCategoryType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="finance">금융 자산 관리</option>
                                <option value="web">비밀번호 관리</option>
                                <option value="memo">메모 관리</option>
                            </select>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                추가
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            타입에 따라 자동으로 해당 그룹에 배치됩니다
                        </p>
                    </div>

                    {/* 금융 자산 관리 그룹 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">[금융 자산 관리]</span>
                        </div>
                        <div className="space-y-2">
                            {financeCategories.map(category => 
                                renderCategoryItem(category, category.isSystem)
                            )}
                            {financeCategories.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">카테고리가 없습니다</p>
                            )}
                        </div>
                    </div>

                    {/* 비밀번호 관리 그룹 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">[비밀번호 관리]</span>
                        </div>
                        <div className="space-y-2">
                            {accountCategories.map(category => 
                                renderCategoryItem(category, category.isSystem)
                            )}
                            {accountCategories.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">카테고리가 없습니다</p>
                            )}
                        </div>
                    </div>

                    {/* 메모 관리 그룹 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">[메모 관리]</span>
                        </div>
                        <div className="space-y-2">
                            {memoCategories.map(category => 
                                renderCategoryItem(category, category.isSystem)
                            )}
                            {memoCategories.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">카테고리가 없습니다</p>
                            )}
                        </div>
                    </div>
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

export default CategoryManageModal;