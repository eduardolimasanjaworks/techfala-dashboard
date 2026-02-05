'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Plus } from 'lucide-react';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewProjectData) => void;
}

export interface NewProjectData {
    empresa: string;
    gerente: string;
    status: string;
    dataInicio: string;
    tarefasTotais: number;
    tarefasAtivas: number;
    statusOnboarding: string;
}

export function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
    const [formData, setFormData] = useState<NewProjectData>({
        empresa: '',
        gerente: '',
        status: 'No Prazo',
        dataInicio: new Date().toISOString().split('T')[0],
        tarefasTotais: 0,
        tarefasAtivas: 0,
        statusOnboarding: 'Esperando Contrato',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            empresa: '',
            gerente: '',
            status: 'No Prazo',
            dataInicio: new Date().toISOString().split('T')[0],
            tarefasTotais: 0,
            tarefasAtivas: 0,
            statusOnboarding: 'Esperando Contrato',
        });
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#151520] border border-[#1F1F2E] p-6 shadow-2xl shadow-[#8B5CF6]/20 transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-2">
                                        <Plus className="w-6 h-6 text-[#8B5CF6]" />
                                        Novo Projeto
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-[#9CA3AF] hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Empresa */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                            Nome da Empresa *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.empresa}
                                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                            placeholder="Ex: TechCorp Solutions"
                                        />
                                    </div>

                                    {/* Gerente */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                            Gerente do Projeto *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.gerente}
                                            onChange={(e) => setFormData({ ...formData, gerente: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                            placeholder="Ex: Ana Silva"
                                        />
                                    </div>

                                    {/* Row: Status e Data */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                                Status *
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                            >
                                                <option value="No Prazo">No Prazo</option>
                                                <option value="Em Atraso">Em Atraso</option>
                                                <option value="Adiantado">Adiantado</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                                Data de Início *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.dataInicio}
                                                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                                                className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Row: Tarefas */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                                Tarefas Totais
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.tarefasTotais}
                                                onChange={(e) => setFormData({ ...formData, tarefasTotais: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                                placeholder="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                                Tarefas Ativas
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.tarefasAtivas}
                                                onChange={(e) => setFormData({ ...formData, tarefasAtivas: parseInt(e.target.value) || 0 })}
                                                className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Status de Onboarding */}
                                    <div>
                                        <label className="block text-sm font-medium text-[#9CA3AF] mb-2">
                                            Status de Onboarding *
                                        </label>
                                        <select
                                            value={formData.statusOnboarding}
                                            onChange={(e) => setFormData({ ...formData, statusOnboarding: e.target.value })}
                                            className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                                        >
                                            <option value="Esperando Contrato">Esperando Contrato</option>
                                            <option value="Esperando Pagamento">Esperando Pagamento</option>
                                            <option value="Iniciar Onboarding">Iniciar Onboarding</option>
                                        </select>
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex-1 px-6 py-3 border border-[#1F1F2E] rounded-lg text-[#9CA3AF] font-medium hover:bg-[#151520] transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-3 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/30"
                                        >
                                            Criar Projeto
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
