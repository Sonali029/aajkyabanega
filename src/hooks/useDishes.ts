import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { addDish, deleteDish } from '../services/dish.service';
import { Dish, MealSlotType } from '../types';
import { useEffect, useState } from 'react';
import { subscribeDishes } from '../services/dish.service';

export const useDishes = () => {
    const { family } = useAuth();
    const [dishes, setDishes] = useState<Dish[]>([]);

    useEffect(() => {
        if (!family?.id) return;
        const unsub = subscribeDishes(family.id, setDishes);
        return unsub;
    }, [family?.id]);

    return { dishes };
};

export const useDishesByMealSlot = (slot: MealSlotType) => {
    const { dishes } = useDishes();
    return dishes.filter((d) => d.mealSlots.includes(slot));
};



export const useAddDish = () => {
    const { family, appUser } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Omit<Dish, 'id' | 'createdAt' | 'addedBy' | 'addedByName'>) => {
            if (!family?.id || !appUser) throw new Error('Not authenticated');
            return addDish(family.id, {
                ...data,
                addedBy: appUser.uid,
                addedByName: appUser.displayName,
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dishes'] }),
    });
};

export const useDeleteDish = () => {
    const { family } = useAuth();
    return useMutation({
        mutationFn: (dishId: string) => {
            if (!family?.id) throw new Error('No family');
            return deleteDish(family.id, dishId);
        },
    });
};
