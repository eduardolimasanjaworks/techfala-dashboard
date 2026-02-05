'use client';

import { useState } from 'react';
import { Check, Plus, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface ChecklistItem {
    id: string;
    titulo: string;
    concluido: boolean;
}

interface Checklist {
    id: string;
    nome: string;
    items: ChecklistItem[];
}

interface MultiChecklistProps {
    checklists: Checklist[];
    onChecklistsChange?: (checklists: Checklist[]) => void;
}

export function MultiChecklist({ checklists: initialChecklists, onChecklistsChange }: MultiChecklistProps) {
    const [checklists, setChecklists] = useState(initialChecklists);
    const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(
        new Set(initialChecklists.map(c => c.id))
    );
    const [newChecklistName, setNewChecklistName] = useState('');
    const [isAddingChecklist, setIsAddingChecklist] = useState(false);
    const [addingItemTo, setAddingItemTo] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState('');

    // Função helper para atualizar checklists localmente e notificar o pai
    const updateChecklists = (newChecklists: Checklist[]) => {
        setChecklists(newChecklists);
        onChecklistsChange?.(newChecklists);
    };

    const toggleChecklist = (checklistId: string) => {
        setExpandedChecklists(prev => {
            const next = new Set(prev);
            if (next.has(checklistId)) {
                next.delete(checklistId);
            } else {
                next.add(checklistId);
            }
            return next;
        });
    };

    const toggleItem = (checklistId: string, itemId: string) => {
        updateChecklists(checklists.map(checklist =>
            checklist.id === checklistId
                ? {
                    ...checklist,
                    items: checklist.items.map(item =>
                        item.id === itemId ? { ...item, concluido: !item.concluido } : item
                    ),
                }
                : checklist
        ));
    };

    const addChecklist = () => {
        if (newChecklistName.trim()) {
            const newChecklist: Checklist = {
                id: `checklist-${Date.now()}`,
                nome: newChecklistName,
                items: [],
            };
            updateChecklists([...checklists, newChecklist]);
            setExpandedChecklists(prev => new Set([...prev, newChecklist.id]));
            setNewChecklistName('');
            setIsAddingChecklist(false);
        }
    };

    const deleteChecklist = (checklistId: string) => {
        updateChecklists(checklists.filter(c => c.id !== checklistId));
        setExpandedChecklists(prev => {
            const next = new Set(prev);
            next.delete(checklistId);
            return next;
        });
    };

    const addItem = (checklistId: string) => {
        if (newItemText.trim()) {
            const newItem: ChecklistItem = {
                id: `item-${Date.now()}`,
                titulo: newItemText,
                concluido: false,
            };
            updateChecklists(checklists.map(checklist =>
                checklist.id === checklistId
                    ? { ...checklist, items: [...checklist.items, newItem] }
                    : checklist
            ));
            setNewItemText('');
            setAddingItemTo(null);
        }
    };

    const deleteItem = (checklistId: string, itemId: string) => {
        updateChecklists(checklists.map(checklist =>
            checklist.id === checklistId
                ? { ...checklist, items: checklist.items.filter(item => item.id !== itemId) }
                : checklist
        ));
    };

    const getChecklistProgress = (checklist: Checklist) => {
        if (checklist.items.length === 0) return 0;
        const completed = checklist.items.filter(item => item.concluido).length;
        return (completed / checklist.items.length) * 100;
    };

    return (
        <div className="space-y-4">
            {/* Checklists */}
            {checklists.map((checklist) => {
                const progress = getChecklistProgress(checklist);
                const isExpanded = expandedChecklists.has(checklist.id);

                return (
                    <div
                        key={checklist.id}
                        className="bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg overflow-hidden"
                    >
                        {/* Checklist Header */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <button
                                    onClick={() => toggleChecklist(checklist.id)}
                                    className="flex items-center gap-2 flex-1 text-left group"
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-[#8B5CF6]" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#8B5CF6]" />
                                    )}
                                    <h4 className="font-semibold text-white">{checklist.nome}</h4>
                                    <span className="text-sm text-[#9CA3AF]">
                                        ({checklist.items.filter(i => i.concluido).length}/{checklist.items.length})
                                    </span>
                                </button>
                                <button
                                    onClick={() => deleteChecklist(checklist.id)}
                                    className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-[#151520] rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#8B5CF6] to-[#00D084] h-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Checklist Items */}
                        {isExpanded && (
                            <div className="px-4 pb-4 space-y-2">
                                {checklist.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-2 bg-[#151520] rounded hover:bg-[#1A1A2E] transition-colors group"
                                    >
                                        <button
                                            onClick={() => toggleItem(checklist.id, item.id)}
                                            className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${item.concluido
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
                                            onClick={() => deleteItem(checklist.id, item.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add New Item */}
                                {addingItemTo === checklist.id ? (
                                    <div className="flex items-center gap-2 p-2 bg-[#151520] rounded">
                                        <input
                                            type="text"
                                            value={newItemText}
                                            onChange={(e) => setNewItemText(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addItem(checklist.id)}
                                            placeholder="Nome da tarefa..."
                                            className="flex-1 bg-transparent text-white text-sm border-none outline-none placeholder-[#9CA3AF]"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => addItem(checklist.id)}
                                            className="text-[#00D084] hover:text-[#00965F] transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setAddingItemTo(null);
                                                setNewItemText('');
                                            }}
                                            className="text-[#9CA3AF] hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setAddingItemTo(checklist.id)}
                                        className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-[#1F1F2E] rounded text-[#9CA3AF] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors text-sm"
                                    >
                                        <Plus className="w-3 h-3" />
                                        <span>Adicionar tarefa</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Add New Checklist */}
            {isAddingChecklist ? (
                <div className="flex items-center gap-2 p-4 bg-[#0A0A0F] border border-[#8B5CF6] rounded-lg">
                    <input
                        type="text"
                        value={newChecklistName}
                        onChange={(e) => setNewChecklistName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addChecklist()}
                        placeholder="Nome do checklist..."
                        className="flex-1 bg-transparent text-white border-none outline-none placeholder-[#9CA3AF]"
                        autoFocus
                    />
                    <button
                        onClick={addChecklist}
                        className="text-[#00D084] hover:text-[#00965F] transition-colors"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            setIsAddingChecklist(false);
                            setNewChecklistName('');
                        }}
                        className="text-[#9CA3AF] hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setIsAddingChecklist(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#1F1F2E] rounded-lg text-[#9CA3AF] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Criar novo checklist</span>
                </button>
            )}
        </div>
    );
}
