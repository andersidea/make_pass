import { useState, useEffect } from 'react';

// 프로덕션 환경 체크
const isDevelopment = process.env.NODE_ENV !== 'production';

export const useVault = () => {
    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('vault_items');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            if (isDevelopment) {
                console.error('Failed to load items', e);
            }
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('vault_items', JSON.stringify(items));
        } catch (e) {
            if (isDevelopment) {
                console.error('Failed to save items', e);
            }
        }
    }, [items]);

    const addItem = (item) => {
        setItems(prev => [{ id: Date.now().toString(), ...item }, ...prev]);
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    return { items, addItem, deleteItem };
};
