'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface ChecklistItem {
    id: string;
    titulo: string;
    concluido: boolean;
}

interface ProjectChecklistProps {
    items: ChecklistItem[];
}

export function ProjectChecklist({ items: initialItems }: ProjectChecklistProps) {
    const [items, setItems] = useState(initialItems);
    const [newItemText, setNewItemText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, concluido: !item.concluido } : item
        ));
    };

    const addItem = () => {
        if (newItemText.trim()) {
            const newItem: ChecklistItem = {
                id: `item-${Date.now()}`,
                titulo: newItemText,
                concluido: false,
            };
            setItems([...items, newItem]);
            setNewItemText('');
            setIsAdding(false);
        }
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const completedCount = items.filter(item => item.concluido).length;
    const totalCount = items.length;
    const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#B0B0B0]">
                        {completedCount} de {totalCount} concluídas
                    </span>
                    <span className="text-sm font-semibold text-white">
                        {Math.round(progressPercentage)}%
                    </span>
                </div>
                <div className="w-full bg-[#0A0A0F] rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-[#8B5CF6] to-[#00D084] h-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-[#0A0A0F] rounded-lg hover:bg-[#151520] transition-colors group"
                    >
                        <button
                            onClick={() => toggleItem(item.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.concluido
                                    ? 'bg-[#00D084] border-[#00D084]'
                                    : 'border-[#9CA3AF] hover:border-[#8B5CF6]'
                                }`}
                        >
                            {item.concluido && <Check className="w-3 h-3 text-[#0A0A0F]" />}
                        </button>
                        <span
                            className={`flex-1 text-sm transition-all ${item.concluido
                                    ? 'text-[#9CA3AF] line-through'
                                    : 'text-white'
                                }`}
                        >
                            {item.titulo}
                        </span>
                        <button
                            onClick={() => deleteItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add New Item */}
            {isAdding ? (
                <div className="flex items-center gap-2 p-3 bg-[#0A0A0F] rounded-lg">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem()}
                        placeholder="Nome da tarefa..."
                        className="flex-1 bg-transparent text-white text-sm border-none outline-none placeholder-[#9CA3AF]"
                        autoFocus
                    />
                    <button
                        onClick={addItem}
                        className="text-[#00D084] hover:text-[#00965F] transition-colors"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setIsAdding(false);
                            setNewItemText('');
                        }}
                        className="text-[#9CA3AF] hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-[#1F1F2E] rounded-lg text-[#9CA3AF] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Adicionar nova tarefa</span>
                </button>
            )}
        </div>
    );
}
