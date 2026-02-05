'use client';

import { useState } from 'react';
import { MessageSquare, Plus, X, Send } from 'lucide-react';

interface Comment {
    id: string;
    autor: string;
    data: string;
    texto: string;
}

interface ProjectCommentsProps {
    comments: Comment[];
}

export function ProjectComments({ comments: initialComments }: ProjectCommentsProps) {
    const [comments, setComments] = useState(initialComments);
    const [isAdding, setIsAdding] = useState(false);
    const [newComment, setNewComment] = useState('');

    const addComment = () => {
        if (newComment.trim()) {
            const today = new Date();
            const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

            const comment: Comment = {
                id: `comment-${Date.now()}`,
                autor: 'Você', // Em produção, viria do usuário logado
                data: formattedDate,
                texto: newComment,
            };

            setComments([...comments, comment]);
            setNewComment('');
            setIsAdding(false);
        }
    };

    const deleteComment = (id: string) => {
        setComments(comments.filter(c => c.id !== id));
    };

    return (
        <div className="space-y-4">
            {/* Lista de Comentários */}
            {comments.length > 0 ? (
                <div className="space-y-3">
                    {comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="p-4 bg-[#0A0A0F] rounded-lg border border-[#1F1F2E] hover:border-[#8B5CF6]/30 transition-colors group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-white text-sm font-semibold">
                                        {comment.autor.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{comment.autor}</p>
                                        <p className="text-xs text-[#9CA3AF]">{comment.data}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteComment(comment.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-red-500 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-[#D0D0D0] leading-relaxed pl-10">
                                {comment.texto}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-[#9CA3AF] mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-[#9CA3AF]">Nenhum comentário ainda</p>
                </div>
            )}

            {/* Adicionar Novo Comentário */}
            {isAdding ? (
                <div className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreva seu comentário..."
                        className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-lg text-white text-sm placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-none"
                        rows={3}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={addComment}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm font-medium hover:bg-[#7C3AED] transition-colors"
                        >
                            <Send className="w-4 h-4" />
                            Enviar
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setNewComment('');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#1F1F2E] text-[#9CA3AF] rounded-lg text-sm font-medium hover:bg-[#151520] transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#1F1F2E] rounded-lg text-[#9CA3AF] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Adicionar comentário</span>
                </button>
            )}
        </div>
    );
}
