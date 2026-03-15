import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useDishes } from '../../hooks/useDishes';
import { MealSlotType, MEAL_SLOT_EMOJIS } from '../../types';
import { getMealSlotLabel } from '../../utils/helpers';
import { POPULAR_DISHES } from '../../data/staticDishes';

const DishBrowserPage: React.FC = () => {
    const { dishes } = useDishes();
    const navigate = useNavigate();
    const [selectedSlot, setSelectedSlot] = useState<MealSlotType>('breakfast');
    const [search, setSearch] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const filteredDishes = dishes.filter(d => {
        const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
        return matchSearch && d.mealSlots.includes(selectedSlot);
    });

    const isShowingPopular = isSearchFocused || search.trim().length > 0;
    const popularDishesFiltered = POPULAR_DISHES.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) &&
        d.mealSlots.includes(selectedSlot)
    ).slice(0, 15);

    return (
        <div className="animate-up">
            <div className="page-header">
                <h1 className="page-header-title">🍽️ Dishes</h1>
                <p className="page-header-sub">Browse by meal</p>
            </div>

            {/* Slot tabs */}
            {!isShowingPopular && (
                <div className="slot-tabs" style={{ paddingBottom: 16 }}>
                    {(['breakfast', 'lunch', 'dinner'] as MealSlotType[]).map(slot => (
                        <button
                            key={slot}
                            className={`slot-tab ${selectedSlot === slot ? 'active' : ''}`}
                            onClick={() => setSelectedSlot(slot)}
                        >
                            {MEAL_SLOT_EMOJIS[slot]} {getMealSlotLabel(slot)}
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="search-bar">
                <Search className="search-icon" size={18} />
                <input
                    placeholder="Search dishes..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => {
                        // Delay handle blur to allow click on popular dishes
                        setTimeout(() => setIsSearchFocused(false), 200);
                    }}
                />
            </div>

            {/* Dish List */}
            <div className="section" style={{ paddingTop: 4 }}>
                {isShowingPopular ? (
                    <div>
                        <div style={{ padding: '12px 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                            POPULAR DISHES
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {popularDishesFiltered.length === 0 ? (
                                <div className="text-muted" style={{ fontSize: 14, padding: '16px 0', textAlign: 'center' }}>
                                    No popular dishes match your search.
                                </div>
                            ) : (
                                popularDishesFiltered.map((dish, idx) => (
                                    <div
                                        key={idx}
                                        className="dish-card"
                                        style={{ marginBottom: 0, cursor: 'pointer' }}
                                        onClick={() => navigate('/dishes/add')}
                                    >
                                        {dish.imageUrl ? (
                                            <div style={{
                                                width: 48, height: 48, borderRadius: 12, marginRight: 12,
                                                backgroundImage: `url(${dish.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center center',
                                                flexShrink: 0
                                            }} />
                                        ) : (
                                            <div className="dish-icon" style={{ width: 48, height: 48, fontSize: 24, borderRadius: 12, marginRight: 12 }}>
                                                🍽️
                                            </div>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="dish-name" style={{ fontSize: 16 }}>{dish.name}</div>
                                            <div className="dish-meta" style={{ fontSize: 12, marginTop: 0 }}>
                                                {dish.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                                            </div>
                                        </div>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            border: '2px solid var(--border-strong)',
                                            marginLeft: 12, flexShrink: 0
                                        }}></div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    filteredDishes.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🍽️</div>
                            <div className="empty-state-title">No dishes found</div>
                            <div className="empty-state-text">
                                {dishes.length === 0
                                    ? 'Your menu is empty. Add your first dish!'
                                    : 'Try a different filter or add this dish.'}
                            </div>
                        </div>
                    ) : (
                        filteredDishes.map(dish => (
                            <div key={dish.id} className="dish-card">
                                {dish.imageUrl ? (
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 14, marginRight: 16,
                                        backgroundImage: `url(${dish.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center center',
                                        flexShrink: 0
                                    }} />
                                ) : (
                                    <div className="dish-icon" style={{ width: 56, height: 56, fontSize: 28, borderRadius: 14, marginRight: 16 }}>
                                        🍽️
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="dish-name" style={{ fontSize: 17 }}>{dish.name}</div>
                                    <div className="dish-meta" style={{ fontSize: 13 }}>
                                        {dish.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                        {dish.mealSlots.map(s => (
                                            <span key={s} style={{
                                                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                                                background: 'var(--bg-input)', color: 'var(--text-muted)', fontWeight: 500
                                            }}>
                                                {MEAL_SLOT_EMOJIS[s]} {getMealSlotLabel(s)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>

            {/* FAB */}
            <Link to="/dishes/add" className="fab">
                <Plus />
            </Link>
        </div>
    );
};

export default DishBrowserPage;
