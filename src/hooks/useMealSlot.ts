import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
    subscribeMealSlotDay,
    subscribeNominations,
    addNomination,
    toggleVote,
    addComment,
    scheduleRandomDish,
} from '../services/mealSlot.service';
import { MealSlotDay, MealSlotType, Nomination } from '../types';
import { useDishes } from './useDishes';

export const useMealSlotDay = (date: Date, slot: MealSlotType) => {
    const { family } = useAuth();
    const [slotDay, setSlotDay] = useState<MealSlotDay | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!family?.id) return;
        setLoading(true);
        const unsub = subscribeMealSlotDay(family.id, date, slot, (data) => {
            setSlotDay(data);
            setLoading(false);
        });
        return unsub;
    }, [family?.id, date.toDateString(), slot]);

    return { slotDay, loading };
};

export const useNominations = (date: Date, slot: MealSlotType) => {
    const { family } = useAuth();
    const { dishes } = useDishes();
    const [nominations, setNominations] = useState<Nomination[]>([]);

    useEffect(() => {
        if (!family?.id) {
            setNominations([]);
            return;
        }

        // Clear nominations immediately when date/slot changes
        setNominations([]);

        const unsub = subscribeNominations(family.id, date, slot, (noms) => {
            // Attach dish data
            const enriched = noms.map((n) => ({
                ...n,
                dish: dishes.find((d) => d.id === n.dishId),
            }));
            setNominations(enriched);
        });
        return unsub;
    }, [family?.id, date.toDateString(), slot]);

    // Update dish data when dishes change without re-subscribing
    useEffect(() => {
        setNominations(prev => prev.map((n) => ({
            ...n,
            dish: dishes.find((d) => d.id === n.dishId),
        })));
    }, [dishes]);

    return { nominations };
};

export const useNominateDish = () => {
    const { family, appUser } = useAuth();
    return useMutation({
        mutationFn: ({
            date,
            slot,
            dishId,
        }: {
            date: Date;
            slot: MealSlotType;
            dishId: string;
        }) => {
            if (!family?.id || !appUser) throw new Error('Not authenticated');
            return addNomination(family.id, date, slot, {
                dishId,
                nominatedBy: appUser.uid,
                nominatedByName: appUser.displayName,
            });
        },
    });
};

export const useToggleVote = () => {
    const { family, appUser } = useAuth();
    return useMutation({
        mutationFn: ({
            date,
            slot,
            nominationId,
            hasVoted,
        }: {
            date: Date;
            slot: MealSlotType;
            nominationId: string;
            hasVoted: boolean;
        }) => {
            if (!family?.id || !appUser) throw new Error('Not authenticated');
            return toggleVote(family.id, date, slot, nominationId, appUser.uid, hasVoted);
        },
    });
};

export const useAddComment = () => {
    const { family, appUser } = useAuth();
    return useMutation({
        mutationFn: ({
            date,
            slot,
            nominationId,
            text,
        }: {
            date: Date;
            slot: MealSlotType;
            nominationId: string;
            text: string;
        }) => {
            if (!family?.id || !appUser) throw new Error('Not authenticated');
            return addComment(family.id, date, slot, nominationId, {
                userId: appUser.uid,
                userName: appUser.displayName,
                text,
            });
        },
    });
};

// Client-side scheduler: picks a random dish and writes it to mealSlot doc
export const useScheduleRandomDish = () => {
    const { family } = useAuth();
    const { dishes } = useDishes();
    return useMutation({
        mutationFn: ({ date, slot }: { date: Date; slot: MealSlotType }) => {
            if (!family?.id) throw new Error('No family');
            const eligible = dishes.filter((d) => d.mealSlots.includes(slot));
            if (eligible.length === 0) throw new Error('No dishes configured for this slot');
            const randomDish = eligible[Math.floor(Math.random() * eligible.length)];
            return scheduleRandomDish(family.id, date, slot, randomDish.id);
        },
    });
};
