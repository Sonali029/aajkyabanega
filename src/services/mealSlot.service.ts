import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MealSlotDay, MealSlotType, Nomination, Comment } from '../types';
import { format } from 'date-fns';

const toDate = (ts: unknown): Date =>
    ts instanceof Timestamp ? ts.toDate() : new Date();

export const getMealSlotId = (date: Date, slot: MealSlotType): string =>
    `${format(date, 'yyyy-MM-dd')}_${slot}`;

// ── MealSlotDay ──────────────────────────────────────────────────────────────

export const getMealSlotDay = async (
    familyId: string,
    date: Date,
    slot: MealSlotType
): Promise<MealSlotDay | null> => {
    const id = getMealSlotId(date, slot);
    const snap = await getDoc(doc(db, `families/${familyId}/mealSlots`, id));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
        id: snap.id,
        date: d.date,
        slot: d.slot,
        scheduledDishId: d.scheduledDishId,
        scheduledAt: d.scheduledAt ? toDate(d.scheduledAt) : undefined,
        status: d.status ?? 'pending',
    };
};

export const subscribeMealSlotDay = (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    callback: (slotDay: MealSlotDay | null) => void
) => {
    const id = getMealSlotId(date, slot);
    return onSnapshot(doc(db, `families/${familyId}/mealSlots`, id), (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        const d = snap.data();
        callback({
            id: snap.id,
            date: d.date,
            slot: d.slot,
            scheduledDishId: d.scheduledDishId,
            scheduledDishName: d.scheduledDishName,
            scheduledAt: d.scheduledAt ? toDate(d.scheduledAt) : undefined,
            status: d.status ?? 'pending',
            autoScheduled: d.autoScheduled ?? false,
        });
    });
};

export const scheduleRandomDish = async (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    dishId: string
): Promise<void> => {
    const id = getMealSlotId(date, slot);
    await setDoc(
        doc(db, `families/${familyId}/mealSlots`, id),
        {
            date: format(date, 'yyyy-MM-dd'),
            slot,
            scheduledDishId: dishId,
            scheduledAt: serverTimestamp(),
            status: 'scheduled',
        },
        { merge: true }
    );
};

// ── Nominations ──────────────────────────────────────────────────────────────

export const subscribeNominations = (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    callback: (nominations: Nomination[]) => void
) => {
    const slotId = getMealSlotId(date, slot);
    return onSnapshot(
        collection(db, `families/${familyId}/mealSlots/${slotId}/nominations`),
        (snap) => {
            const nominations = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                nominatedAt: toDate(d.data().nominatedAt),
                comments: (d.data().comments ?? []).map((c: Comment & { createdAt: unknown }) => ({
                    ...c,
                    createdAt: toDate(c.createdAt),
                })),
            })) as Nomination[];
            callback(nominations);
        }
    );
};

export const addNomination = async (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    nomination: Omit<Nomination, 'id' | 'nominatedAt' | 'votes' | 'comments'>
): Promise<string> => {
    const slotId = getMealSlotId(date, slot);
    // Create the meal slot doc if it doesn't exist
    await setDoc(
        doc(db, `families/${familyId}/mealSlots`, slotId),
        { date: format(date, 'yyyy-MM-dd'), slot, status: 'pending' },
        { merge: true }
    );
    const ref = await addDoc(
        collection(db, `families/${familyId}/mealSlots/${slotId}/nominations`),
        {
            ...nomination,
            nominatedAt: serverTimestamp(),
            votes: {},
            comments: [],
        }
    );
    return ref.id;
};

export const toggleVote = async (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    nominationId: string,
    userId: string,
    hasVoted: boolean
) => {
    const slotId = getMealSlotId(date, slot);
    const nomRef = doc(
        db,
        `families/${familyId}/mealSlots/${slotId}/nominations`,
        nominationId
    );
    if (hasVoted) {
        await updateDoc(nomRef, { [`votes.${userId}`]: null });
    } else {
        await updateDoc(nomRef, { [`votes.${userId}`]: true });
    }
};

export const addComment = async (
    familyId: string,
    date: Date,
    slot: MealSlotType,
    nominationId: string,
    comment: Omit<Comment, 'id' | 'createdAt'>
) => {
    const slotId = getMealSlotId(date, slot);
    const nomRef = doc(
        db,
        `families/${familyId}/mealSlots/${slotId}/nominations`,
        nominationId
    );
    const newComment = {
        ...comment,
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    await updateDoc(nomRef, {
        comments: arrayUnion(newComment),
    });
};
