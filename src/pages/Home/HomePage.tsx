import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { startOfDay, addDays, format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useMealSlotDay, useNominations } from '../../hooks/useMealSlot';
import { useDishes } from '../../hooks/useDishes';
import { formatDateDisplay, getMealSlotLabel } from '../../utils/helpers';
import { MEAL_SLOT_EMOJIS, MealSlotType } from '../../types';
import DateStrip from '../../components/calendar/DateStrip';
import '../../utils/debugFirestore'; // Load debug utilities
import '../../utils/resetToday'; // Load reset utility

interface MealCardProps {
    slot: MealSlotType;
    date: Date;
}

interface NominationStatsProps {
    slot: MealSlotType;
    date: Date;
}

const NominationStats: React.FC<NominationStatsProps> = ({ slot, date }) => {
    const { nominations } = useNominations(date, slot);

    // Get unique nominated dishes count
    const nominatedDishesMap = new Map();
    nominations.forEach(nom => {
        if (nom.dish) {
            nominatedDishesMap.set(nom.dish.id, nom.dish);
        }
    });
    const count = nominatedDishesMap.size;

    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px 10px', textAlign: 'center'
        }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{MEAL_SLOT_EMOJIS[slot]}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{count}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {getMealSlotLabel(slot)}
            </div>
        </div>
    );
};

const MealCard: React.FC<MealCardProps> = ({ slot, date }) => {
    const { slotDay } = useMealSlotDay(date, slot);
    const { dishes } = useDishes();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Debug logging
    useEffect(() => {
        const mealSlotId = `${dateStr}_${slot}`;
        console.log(`🍽️ MealCard ${slot}:`, {
            expectedMealSlotId: mealSlotId,
            dateStr,
            slotDay,
            scheduledDishId: slotDay?.scheduledDishId,
            scheduledDishName: slotDay?.scheduledDishName,
            dateFromSlotDay: slotDay?.date,
            isMatch: slotDay?.date === dateStr
        });

        // Alert if dates don't match!
        if (slotDay && slotDay.date !== dateStr) {
            console.error(`❌ DATE MISMATCH for ${slot}!`, {
                expected: dateStr,
                actual: slotDay.date,
                slotDay
            });
        }
    }, [slotDay, slot, dateStr]);

    const scheduledDish = slotDay?.scheduledDishId
        ? dishes.find(d => d.id === slotDay.scheduledDishId)
        : null;

    // Get dish name: from dish object, or from scheduledDishName (for static/auto-scheduled dishes)
    const dishName = scheduledDish?.name || slotDay?.scheduledDishName;
    const dishAddedBy = scheduledDish?.addedByName || 'Scheduler';

    const slotDishCount = dishes.filter(d => d.mealSlots.includes(slot)).length;

    return (
        <Link to={`/mealslot/${dateStr}/${slot}`} className="meal-slot-card">
            <div className={`meal-slot-icon ${slot}`}>
                {MEAL_SLOT_EMOJIS[slot]}
            </div>
            <div className="meal-slot-info">
                <div className="meal-slot-name">{getMealSlotLabel(slot)}</div>
                <div className="meal-slot-dish">
                    {dishName
                        ? <span style={{ whiteSpace: 'normal', display: 'block' }}>{`🍽️ ${dishName}`} <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: 13 }}>
                            {slotDay?.autoScheduled ? 'auto-picked' : `chosen by ${dishAddedBy.split(' ')[0]}`}
                        </span></span>
                        : <span style={{ color: 'var(--text-muted)' }}>Not planned yet</span>
                    }
                </div>
                {!dishName && (
                    <div className="meal-slot-meta">
                        {slotDishCount === 0 ? 'Tap to view dishes' : 'Tap to nominate or view dishes'}
                    </div>
                )}
            </div>
            <div className={`meal-slot-status ${slotDay?.status ?? 'pending'}`}>
                {slotDay?.status === 'scheduled' ? 'Scheduled' :
                    slotDay?.status === 'confirmed' ? 'Confirmed' : 'Pending'}
            </div>
        </Link>
    );
};

const HomePage: React.FC = () => {
    const { family } = useAuth();
    const { dishes } = useDishes();
    const [today, setToday] = useState(startOfDay(new Date()));
    const [selectedDate, setSelectedDate] = useState(today);

    // Debug logging on mount
    useEffect(() => {
        console.group('🏠 HomePage Mounted');
        console.log('Today:', today);
        console.log('Today formatted:', format(today, 'yyyy-MM-dd'));
        console.log('Selected Date:', selectedDate);
        console.log('Selected Date formatted:', format(selectedDate, 'yyyy-MM-dd'));
        console.log('Family ID:', family?.id);
        console.groupEnd();

        // Make family ID available for debug commands
        if (family?.id) {
            (window as any).FAMILY_ID = family.id;
            console.log('💡 Quick Fix Commands:');
            console.log('  resetTodayMealSlots(window.FAMILY_ID).then(() => location.reload()) - Clear today & refresh');
            console.log('');
            console.log('💡 Debug Commands:');
            console.log('  debugFirestore.debugToday() - Check current date');
            console.log('  debugFirestore.debugMealSlots(window.FAMILY_ID) - See all meal slots');
            console.log('  debugFirestore.clearMealSlotsForDate(window.FAMILY_ID, "2026-03-11") - Clear specific date');
        }
    }, []);

    // Note: Auto-scheduling is now handled by Firebase Cloud Functions
    // No need for client-side polling - the server handles it automatically!

    // Midnight reset logic
    useEffect(() => {
        const calculateMsUntilMidnight = () => {
            const now = new Date();
            const tomorrow = addDays(startOfDay(now), 1);
            return tomorrow.getTime() - now.getTime();
        };

        let timeoutId: ReturnType<typeof setTimeout>;

        const scheduleMidnightRefresh = () => {
            const msUntilMidnight = calculateMsUntilMidnight();
            timeoutId = setTimeout(() => {
                const newToday = startOfDay(new Date());
                setToday(newToday);
                setSelectedDate(newToday); // Reset to today on midnight
                scheduleMidnightRefresh();
            }, msUntilMidnight + 1000); // Add 1 sec buffer to be safe
        };

        scheduleMidnightRefresh();
        return () => clearTimeout(timeoutId);
    }, []);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

    const slots: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

    return (
        <div className="animate-up">
            {/* Date & Greeting */}
            <div className="date-banner" style={{ paddingBottom: 0 }}>
                <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div className="date-today">{greeting} 👋</div>
                        <div className="date-sub">{formatDateDisplay(selectedDate)} · {family?.name}</div>
                    </div>
                    {/* Embedded Calendar Strip right beside the greeting */}
                    <div style={{ marginTop: '4px' }}>
                        <DateStrip
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                        />
                    </div>
                </div>
            </div>

            {/* Meal Slots */}
            <div className="section" style={{ paddingTop: 0 }}>
                <div className="section-title">
                    {selectedDate.getTime() === today.getTime() ? "Today's Menu" : "Menu"}
                </div>
                {slots.map(slot => (
                    <MealCard key={slot} slot={slot} date={selectedDate} />
                ))}
            </div>

            {/* Nominated Dishes Stats */}
            <div className="section" style={{ paddingTop: 0 }}>
                <div className="section-title">
                    {selectedDate.getTime() === today.getTime() ? "Dishes Nominated Today" : "Dishes Nominated"}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {(['breakfast', 'lunch', 'dinner'] as MealSlotType[]).map(slot => (
                        <NominationStats key={slot} slot={slot} date={selectedDate} />
                    ))}
                </div>
            </div>

            {/* No dishes CTA */}
            {dishes.length === 0 && (
                <div className="section" style={{ paddingTop: 8 }}>
                    <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Add your first dish!</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                            Browse cuisines or add favourite dishes to your family menu so the scheduler can pick for you.
                        </p>
                        <Link to="/dishes" className="btn btn-primary btn-sm">Browse Dishes</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;


