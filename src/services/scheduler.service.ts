import { format, set, isBefore, isAfter } from 'date-fns';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { MealSlotType, Family, Dish } from '../types';
import { getMealSlotId } from './mealSlot.service';
import { POPULAR_DISHES } from '../data/staticDishes';

/**
 * Calculate the scheduler trigger time for a given meal slot
 * Example: If breakfast is at 8:00 AM and offset is 120 mins,
 * scheduler should trigger at 6:00 AM
 */
export const getSchedulerTime = (
    mealTime: string, // "HH:mm" format
    offsetMins: number
): Date => {
    const [hours, mins] = mealTime.split(':').map(Number);
    const today = new Date();
    const mealDateTime = set(today, { hours, minutes: mins, seconds: 0, milliseconds: 0 });

    // Subtract offset
    const schedulerTime = new Date(mealDateTime.getTime() - offsetMins * 60 * 1000);
    return schedulerTime;
};

/**
 * Check if we should auto-schedule a dish for a given slot
 * Returns true if:
 * 1. Current time is past the scheduler time
 * 2. No dish is scheduled yet
 * 3. Meal time hasn't passed yet
 */
export const shouldAutoSchedule = (
    family: Family,
    slot: MealSlotType,
    currentScheduledDishId?: string
): boolean => {
    const slotConfig = family.mealConfig[slot];
    if (!slotConfig.enabled) return false;
    if (currentScheduledDishId) return false; // Already scheduled

    const now = new Date();
    const schedulerTime = getSchedulerTime(slotConfig.time, slotConfig.schedulerOffsetMins);

    // Parse meal time
    const [hours, mins] = slotConfig.time.split(':').map(Number);
    const mealTime = set(now, { hours, minutes: mins, seconds: 0, milliseconds: 0 });

    // Should schedule if: scheduler time has passed AND meal time hasn't passed
    return isAfter(now, schedulerTime) && isBefore(now, mealTime);
};

/**
 * Shuffle array using Fisher-Yates algorithm for true randomness
 */
const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Auto-schedule a random dish for a meal slot
 * Combines static dishes + unique family dishes for maximum variety
 */
export const autoScheduleDish = async (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    familyDishes: Dish[]
): Promise<void> => {
    const slotId = getMealSlotId(date, slot);

    // Check if already scheduled
    const slotDoc = await getDoc(doc(db, `families/${familyId}/mealSlots`, slotId));
    if (slotDoc.exists() && slotDoc.data().scheduledDishId) {
        console.log(`⏭️ Skipping ${slotId} - already scheduled`);
        return; // Already scheduled
    }

    // Get static dishes for this slot
    const staticEligible = POPULAR_DISHES.filter(d => d.mealSlots.includes(slot));

    // Get family dishes for this slot
    const familyEligible = familyDishes.filter(d => d.mealSlots.includes(slot));

    // Create a Set of static dish names (lowercase for case-insensitive comparison)
    const staticDishNames = new Set(
        staticEligible.map(d => d.name.toLowerCase().trim())
    );

    // Filter family dishes to get ONLY unique ones (not in static list)
    const uniqueFamilyDishes = familyEligible.filter(
        d => !staticDishNames.has(d.name.toLowerCase().trim())
    );

    // Combine: ALL static dishes + UNIQUE family dishes
    const allDishes: Array<{ id: string; name: string; source: 'static' | 'family' }> = [
        // Add all static dishes
        ...staticEligible.map(d => ({
            id: `static_${d.name}`,
            name: d.name,
            source: 'static' as const
        })),
        // Add unique family dishes
        ...uniqueFamilyDishes.map(d => ({
            id: d.id,
            name: d.name,
            source: 'family' as const
        }))
    ];

    if (allDishes.length === 0) {
        throw new Error('No dishes available for this slot');
    }

    // Shuffle and pick
    const shuffled = shuffleArray(allDishes);
    const selectedDish = shuffled[0];

    console.log(`🎲 Auto-scheduling for ${slot}:`, {
        selected: selectedDish.name,
        source: selectedDish.source,
        totalPool: allDishes.length,
        breakdown: {
            staticDishes: staticEligible.length,
            uniqueFamilyDishes: uniqueFamilyDishes.length,
            duplicateFamilyDishes: familyEligible.length - uniqueFamilyDishes.length
        }
    });

    // Schedule the dish
    await setDoc(
        doc(db, `families/${familyId}/mealSlots`, slotId),
        {
            date: format(date, 'yyyy-MM-dd'),
            slot,
            scheduledDishId: selectedDish.id,
            scheduledDishName: selectedDish.name,
            scheduledAt: serverTimestamp(),
            status: 'scheduled',
            autoScheduled: true,
            source: selectedDish.source, // Track if from static or family menu
        },
        { merge: true }
    );
};

/**
 * Run the scheduler check for all meal slots for today
 */
export const runSchedulerCheck = async (
    family: Family,
    familyDishes: Dish[]
): Promise<void> => {
    const today = new Date();
    const slots: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

    for (const slot of slots) {
        try {
            const slotId = getMealSlotId(today, slot);
            const slotDoc = await getDoc(doc(db, `families/${family.id}/mealSlots`, slotId));
            const scheduledDishId = slotDoc.exists() ? slotDoc.data().scheduledDishId : undefined;

            if (shouldAutoSchedule(family, slot, scheduledDishId)) {
                await autoScheduleDish(family.id, today, slot, familyDishes);
                console.log(`Auto-scheduled ${slot} for ${format(today, 'yyyy-MM-dd')}`);
            }
        } catch (error) {
            console.error(`Failed to auto-schedule ${slot}:`, error);
        }
    }
};
