import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';

/**
 * Clear all meal slots for today and force re-scheduling
 */
export const resetTodayMealSlots = async (familyId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const slots = ['breakfast', 'lunch', 'dinner'];

    console.group('🗑️ Resetting Today\'s Meal Slots');
    console.log('Date:', today);
    console.log('Family ID:', familyId);

    for (const slot of slots) {
        const slotId = `${today}_${slot}`;
        try {
            await deleteDoc(doc(db, `families/${familyId}/mealSlots`, slotId));
            console.log(`✅ Deleted ${slotId}`);
        } catch (error: any) {
            if (error.code === 'not-found') {
                console.log(`⚠️ ${slotId} doesn't exist (that's ok)`);
            } else {
                console.error(`❌ Error deleting ${slotId}:`, error);
            }
        }
    }

    console.log('✅ Reset complete! Refresh the page to re-schedule.');
    console.groupEnd();

    return today;
};

// Make available globally
if (typeof window !== 'undefined') {
    (window as any).resetTodayMealSlots = resetTodayMealSlots;
}
