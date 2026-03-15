import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { useAddDish } from '../../hooks/useDishes';
import { MealSlotType, MEAL_SLOT_EMOJIS } from '../../types';
import { getMealSlotLabel } from '../../utils/helpers';

interface DishForm {
    name: string;
    description: string;
    isVeg: string;
}

const ALL_SLOTS: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

const AddDishPage: React.FC = () => {
    const navigate = useNavigate();
    const addDish = useAddDish();
    const { register, handleSubmit, formState: { errors } } = useForm<DishForm>({
        defaultValues: { isVeg: 'true' }
    });
    const [selectedSlots, setSelectedSlots] = useState<MealSlotType[]>([]);
    const [slotError, setSlotError] = useState('');
    const [toast, setToast] = useState('');

    const toggleSlot = (slot: MealSlotType) => {
        setSelectedSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
        );
        setSlotError('');
    };

    const onSubmit = async (data: DishForm) => {
        if (selectedSlots.length === 0) {
            setSlotError('Select at least one meal slot');
            return;
        }
        try {
            await addDish.mutateAsync({
                name: data.name.trim(),
                mealSlots: selectedSlots,
                description: data.description,
                isVeg: data.isVeg === 'true',
            });
            setToast('✅ Dish added!');
            setTimeout(() => navigate('/dishes'), 1200);
        } catch {
            setToast('❌ Failed to add dish');
            setTimeout(() => setToast(''), 3000);
        }
    };

    return (
        <div className="animate-up" style={{ paddingBottom: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
                <button className="icon-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Add a Dish</div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Name */}
                <div className="field-group">
                    <label className="field-label">Dish Name *</label>
                    <input
                        className={`field-input ${errors.name ? 'error' : ''}`}
                        placeholder="e.g. Chole Bhature, Pasta Arrabiata"
                        {...register('name', { required: 'Dish name is required' })}
                    />
                    {errors.name && <span className="field-error">{errors.name.message}</span>}
                </div>

                {/* Name */}

                {/* Meal Slots */}
                <div className="field-group">
                    <label className="field-label">Meal Slots * (pick all that apply)</label>
                    <div className="meal-slot-checkboxes">
                        {ALL_SLOTS.map(slot => (
                            <div
                                key={slot}
                                className={`slot-checkbox ${selectedSlots.includes(slot) ? 'checked' : ''}`}
                                onClick={() => toggleSlot(slot)}
                            >
                                {MEAL_SLOT_EMOJIS[slot]} {getMealSlotLabel(slot)}
                            </div>
                        ))}
                    </div>
                    {slotError && <span className="field-error">{slotError}</span>}
                </div>

                {/* Veg / Non-veg */}
                <div className="field-group">
                    <label className="field-label">Type</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[{ value: 'true', label: '🟢 Vegetarian' }, { value: 'false', label: '🔴 Non-Veg' }].map(opt => (
                            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: 'pointer', flex: 1, fontSize: 14, fontWeight: 500 }}>
                                <input type="radio" value={opt.value} {...register('isVeg')} style={{ accentColor: 'var(--primary)' }} />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="field-group">
                    <label className="field-label">Description (optional)</label>
                    <input
                        className="field-input"
                        placeholder="Any notes about this dish..."
                        {...register('description')}
                    />
                </div>

                <button
                    className="btn btn-primary btn-full"
                    type="submit"
                    disabled={addDish.isPending}
                    style={{ marginTop: 8 }}
                >
                    {addDish.isPending ? 'Adding...' : '+ Add to Family Menu'}
                </button>
            </form>

            {toast && <div className={`toast ${toast.startsWith('✅') ? 'success' : 'error'}`}>{toast}</div>}
        </div>
    );
};

export default AddDishPage;
