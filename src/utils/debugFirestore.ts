import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Debug utility to inspect and clean meal slot data
 */
export const debugMealSlots = async (familyId: string) => {
    const mealSlotsRef = collection(db, `families/${familyId}/mealSlots`);
    const snapshot = await getDocs(mealSlotsRef);

    console.group('🔍 FIRESTORE DEBUG - Meal Slots');
    console.log('Total meal slot documents:', snapshot.size);

    snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('---');
        console.log('Document ID:', doc.id);
        console.log('Date:', data.date);
        console.log('Slot:', data.slot);
        console.log('Scheduled Dish ID:', data.scheduledDishId);
        console.log('Scheduled Dish Name:', data.scheduledDishName);
        console.log('Status:', data.status);
        console.log('Auto-scheduled:', data.autoScheduled);
        console.log('Full data:', data);
    });

    console.groupEnd();
};

/**
 * Delete all meal slot documents for a specific date
 */
export const clearMealSlotsForDate = async (familyId: string, date: string) => {
    const slots = ['breakfast', 'lunch', 'dinner'];

    for (const slot of slots) {
        const slotId = `${date}_${slot}`;
        try {
            await deleteDoc(doc(db, `families/${familyId}/mealSlots`, slotId));
            console.log(`✅ Deleted ${slotId}`);
        } catch (error) {
            console.log(`⚠️ Could not delete ${slotId}:`, error);
        }
    }

    console.log(`🗑️ Cleared all meal slots for ${date}`);
};

/**
 * Delete ALL meal slot documents (nuclear option - use with caution!)
 */
export const clearAllMealSlots = async (familyId: string) => {
    const mealSlotsRef = collection(db, `families/${familyId}/mealSlots`);
    const snapshot = await getDocs(mealSlotsRef);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`🗑️ Deleted ${snapshot.size} meal slot documents`);
};

/**
 * Check what date the app thinks "today" is
 */
export const debugToday = () => {
    const now = new Date();
    console.group('📅 DATE DEBUG');
    console.log('Current Date Object:', now);
    console.log('ISO String:', now.toISOString());
    console.log('Local Date String:', now.toLocaleDateString());
    console.log('Year:', now.getFullYear());
    console.log('Month (0-indexed):', now.getMonth(), '→', now.getMonth() + 1);
    console.log('Date:', now.getDate());
    console.log('Formatted (yyyy-MM-dd):', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    console.groupEnd();
};

// Make available globally for easy console access
if (typeof window !== 'undefined') {
    (window as any).debugFirestore = {
        debugMealSlots,
        clearMealSlotsForDate,
        clearAllMealSlots,
        debugToday
    };
}
