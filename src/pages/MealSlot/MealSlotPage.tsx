import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ThumbsUp, MessageCircle, Send, Shuffle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMealSlotDay, useNominations, useNominateDish, useToggleVote, useAddComment, useScheduleRandomDish } from '../../hooks/useMealSlot';
import { useDishes } from '../../hooks/useDishes';
import { MealSlotType, Nomination, MEAL_SLOT_EMOJIS } from '../../types';
import { getMealSlotLabel, formatDateDisplay } from '../../utils/helpers';
import { getInitials, generateAvatarColor } from '../../utils/helpers';

const MealSlotPage: React.FC = () => {
    const { date: dateStr, slot } = useParams<{ date: string; slot: string }>();
    const navigate = useNavigate();
    const { appUser } = useAuth();
    const [showNominatePicker, setShowNominatePicker] = useState(false);
    const [openComments, setOpenComments] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const mealSlot = slot as MealSlotType;

    const { slotDay } = useMealSlotDay(date, mealSlot);
    const { nominations } = useNominations(date, mealSlot);
    const { dishes } = useDishes();
    const nominateMutation = useNominateDish();
    const voteMutation = useToggleVote();
    const commentMutation = useAddComment();
    const schedulerMutation = useScheduleRandomDish();

    const scheduledDish = slotDay?.scheduledDishId
        ? dishes.find(d => d.id === slotDay.scheduledDishId)
        : null;

    const eligibleDishes = dishes.filter(d => d.mealSlots.includes(mealSlot));

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handlePickRandom = async () => {
        try {
            await schedulerMutation.mutateAsync({ date, slot: mealSlot });
            showToast('🎲 Dish selected randomly!');
        } catch (e) {
            showToast((e as Error).message || 'Failed to pick dish', 'error');
        }
    };

    const handleNominate = async (dishId: string) => {
        try {
            await nominateMutation.mutateAsync({ date, slot: mealSlot, dishId });
            setShowNominatePicker(false);
            showToast('✅ Nomination added!');
        } catch {
            showToast('Failed to nominate', 'error');
        }
    };

    const handleVote = async (nom: Nomination) => {
        if (!appUser) return;
        const hasVoted = !!nom.votes[appUser.uid];
        try {
            await voteMutation.mutateAsync({ date, slot: mealSlot, nominationId: nom.id, hasVoted });
        } catch { showToast('Vote failed', 'error'); }
    };

    const handleComment = async (nominationId: string) => {
        if (!commentText.trim()) return;
        try {
            await commentMutation.mutateAsync({ date, slot: mealSlot, nominationId, text: commentText.trim() });
            setCommentText('');
            showToast('💬 Comment added!');
        } catch { showToast('Comment failed', 'error'); }
    };

    return (
        <div className="animate-up" style={{ minHeight: '100vh' }}>
            {/* Back header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                        {MEAL_SLOT_EMOJIS[mealSlot]} {getMealSlotLabel(mealSlot)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {formatDateDisplay(date)}
                    </div>
                </div>
            </div>

            {/* Scheduled Dish Hero */}
            <div className="scheduled-hero">
                {scheduledDish ? (
                    <>
                        <div className="scheduled-label">Today's Pick</div>
                        <div className="scheduled-dish-name">{scheduledDish.name}</div>
                        <div className="scheduled-dish-sub">
                            {scheduledDish.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                        </div>
                        <div className="scheduled-emoji" aria-hidden>
                            🍽️
                        </div>
                    </>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <div className="scheduled-label">No dish selected yet</div>
                        <div className="scheduled-dish-name" style={{ fontSize: 18, opacity: 0.7 }}>
                            {eligibleDishes.length > 0
                                ? 'Let the scheduler pick — or nominate below!'
                                : 'Add dishes to this meal slot first'}
                        </div>
                        {eligibleDishes.length > 0 && (
                            <button
                                className="btn btn-primary btn-sm"
                                style={{ marginTop: 16 }}
                                onClick={handlePickRandom}
                                disabled={schedulerMutation.isPending}
                            >
                                <Shuffle size={14} />
                                {schedulerMutation.isPending ? 'Picking...' : 'Pick Random Dish'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Nominated Dishes for Today */}
            {(() => {
                // Get unique dishes from nominations
                const nominatedDishesMap = new Map();
                nominations.forEach(nom => {
                    if (nom.dish) {
                        nominatedDishesMap.set(nom.dish.id, nom.dish);
                    }
                });
                const nominatedDishes = Array.from(nominatedDishesMap.values());

                return nominatedDishes.length > 0 && (
                    <div className="section">
                        <div className="section-title">Dishes nominated today ({nominatedDishes.length})</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {nominatedDishes.map(dish => (
                                <div key={dish.id} style={{
                                    padding: '6px 12px', background: 'var(--bg-card)',
                                    border: `1px solid ${slotDay?.scheduledDishId === dish.id ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 500,
                                    color: slotDay?.scheduledDishId === dish.id ? 'var(--primary)' : 'var(--text-secondary)',
                                }}>
                                    🍽️ {dish.name}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Nominations */}
            <div className="section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div className="section-title" style={{ marginBottom: 0 }}>
                        Nominations {nominations.length > 0 && `(${nominations.length})`}
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowNominatePicker(true)}
                    >
                        <Plus size={14} /> Nominate
                    </button>
                </div>

                {nominations.length === 0 ? (
                    <div className="empty-state" style={{ padding: '32px 16px' }}>
                        <div className="empty-state-icon">🙋</div>
                        <div className="empty-state-title">No nominations yet</div>
                        <div className="empty-state-text">Be the first to suggest a dish for {getMealSlotLabel(mealSlot)}!</div>
                    </div>
                ) : (
                    nominations.map(nom => {
                        const voteCount = Object.keys(nom.votes || {}).length;
                        const hasVoted = appUser ? !!nom.votes[appUser.uid] : false;
                        const isCommentsOpen = openComments === nom.id;

                        return (
                            <div key={nom.id} className="nomination-card">
                                <div className="nomination-header">
                                    <div>
                                        <div className="nomination-dish-name">
                                            {nom.dish ? `🍽️ ${nom.dish.name}` : '...'}
                                        </div>
                                        <div className="nomination-by">
                                            Nominated by <strong>{nom.nominatedByName}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button
                                        className={`vote-btn ${hasVoted ? 'voted' : ''}`}
                                        onClick={() => handleVote(nom)}
                                        disabled={voteMutation.isPending}
                                    >
                                        <ThumbsUp size={14} />
                                        {voteCount > 0 ? `${voteCount} vote${voteCount !== 1 ? 's' : ''}` : 'Vote'}
                                    </button>
                                    <button
                                        className="vote-btn"
                                        onClick={() => setOpenComments(isCommentsOpen ? null : nom.id)}
                                    >
                                        <MessageCircle size={14} />
                                        {nom.comments?.length > 0 ? `${nom.comments.length} comment${nom.comments.length !== 1 ? 's' : ''}` : 'Comment'}
                                    </button>
                                </div>

                                {isCommentsOpen && (
                                    <div className="comments-section">
                                        {nom.comments?.map((c, i) => (
                                            <div key={i} className="comment">
                                                <div
                                                    className="avatar avatar-sm"
                                                    style={{ background: generateAvatarColor(c.userName) }}
                                                >
                                                    {getInitials(c.userName)}
                                                </div>
                                                <div>
                                                    <div className="comment-author">{c.userName}</div>
                                                    <div className="comment-text">{c.text}</div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="comment-input-row">
                                            <input
                                                className="comment-input"
                                                placeholder="Add a comment..."
                                                value={commentText}
                                                onChange={e => setCommentText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleComment(nom.id)}
                                            />
                                            <button className="btn btn-primary btn-icon btn-sm" onClick={() => handleComment(nom.id)}>
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Nominate Dish Picker */}
            {showNominatePicker && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                        zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    }}
                    onClick={() => setShowNominatePicker(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)', borderRadius: '20px 20px 0 0',
                            padding: '20px 16px 32px', maxHeight: '70vh', overflowY: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
                            Pick a dish to nominate
                        </div>
                        {eligibleDishes.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">🍽️</div>
                                <div className="empty-state-title">No dishes for {getMealSlotLabel(mealSlot)}</div>
                                <div className="empty-state-text">Go to Dishes tab to add some!</div>
                            </div>
                        ) : (
                            eligibleDishes.map(dish => (
                                <div
                                    key={dish.id}
                                    className="dish-card"
                                    onClick={() => handleNominate(dish.id)}
                                >
                                    <div className="dish-icon">🍽️</div>
                                    <div>
                                        <div className="dish-name">{dish.name}</div>
                                        <div className="dish-meta">{dish.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default MealSlotPage;
