import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Dish, MealSlotType } from '../types';

const toDate = (ts: unknown): Date =>
    ts instanceof Timestamp ? ts.toDate() : new Date();

// ── Dishes ───────────────────────────────────────────────────────────────────

export const addDish = async (
    familyId: string,
    data: Omit<Dish, 'id' | 'createdAt'>
): Promise<Dish> => {
    const ref = await addDoc(collection(db, `families/${familyId}/dishes`), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return { ...data, id: ref.id, createdAt: new Date() };
};

export const getDishes = async (familyId: string): Promise<Dish[]> => {
    const snap = await getDocs(collection(db, `families/${familyId}/dishes`));
    return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toDate(d.data().createdAt),
    })) as Dish[];
};

export const getDishById = async (
    familyId: string,
    dishId: string
): Promise<Dish | null> => {
    const snap = await getDoc(doc(db, `families/${familyId}/dishes`, dishId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data(), createdAt: toDate(snap.data().createdAt) } as Dish;
};

export const subscribeDishes = (
    familyId: string,
    callback: (dishes: Dish[]) => void
) => {
    return onSnapshot(
        collection(db, `families/${familyId}/dishes`),
        (snap) => {
            const dishes = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                createdAt: toDate(d.data().createdAt),
            })) as Dish[];
            callback(dishes);
        }
    );
};

export const updateDish = async (
    familyId: string,
    dishId: string,
    data: Partial<Omit<Dish, 'id'>>
) => {
    await updateDoc(doc(db, `families/${familyId}/dishes`, dishId), data);
};

export const deleteDish = async (familyId: string, dishId: string) => {
    await deleteDoc(doc(db, `families/${familyId}/dishes`, dishId));
};

export const getDishesByMealSlot = async (
    familyId: string,
    slot: MealSlotType
): Promise<Dish[]> => {
    const q = query(
        collection(db, `families/${familyId}/dishes`),
        where('mealSlots', 'array-contains', slot)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: toDate(d.data().createdAt),
    })) as Dish[];
};


