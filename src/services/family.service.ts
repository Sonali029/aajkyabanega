import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    query,
    where,
    serverTimestamp,
    Timestamp,
    onSnapshot,
    deleteDoc,
} from 'firebase/firestore';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import {
    Family,
    Member,
    Invite,
    MealConfig,
} from '../types';
import { nanoid } from '../utils/helpers';

const DEFAULT_MEAL_CONFIG: MealConfig = {
    breakfast: { time: '08:00', schedulerOffsetMins: 60, enabled: true },
    lunch: { time: '13:00', schedulerOffsetMins: 60, enabled: true },
    dinner: { time: '20:00', schedulerOffsetMins: 60, enabled: true },
};

// ── Family CRUD ─────────────────────────────────────────────────────────────

export const createFamily = async (
    name: string,
    userId: string,
    userName: string,
    userEmail: string,
    avatarColor: string
): Promise<Family> => {
    const familyRef = doc(collection(db, 'families'));
    const familyData = {
        name,
        createdBy: userId,
        createdAt: serverTimestamp(),
        mealConfig: DEFAULT_MEAL_CONFIG,
    };
    await setDoc(familyRef, familyData);

    // Add creator as admin member
    await setDoc(doc(db, `families/${familyRef.id}/members`, userId), {
        id: userId,
        name: userName,
        email: userEmail,
        role: 'admin',
        avatarColor,
        joinedAt: serverTimestamp(),
    });

    return {
        id: familyRef.id,
        name,
        createdBy: userId,
        createdAt: new Date(),
        mealConfig: DEFAULT_MEAL_CONFIG,
    };
};

export const getFamily = async (familyId: string): Promise<Family | null> => {
    const snap = await getDoc(doc(db, 'families', familyId));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
        id: snap.id,
        name: d.name,
        createdBy: d.createdBy,
        createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
        mealConfig: d.mealConfig ?? DEFAULT_MEAL_CONFIG,
    };
};

export const updateMealConfig = async (
    familyId: string,
    mealConfig: MealConfig
) => {
    await updateDoc(doc(db, 'families', familyId), { mealConfig });
};

// ── Members ─────────────────────────────────────────────────────────────────

export const getFamilyMembers = async (familyId: string): Promise<Member[]> => {
    const snap = await getDocs(collection(db, `families/${familyId}/members`));
    return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        joinedAt: (d.data().joinedAt as Timestamp)?.toDate() ?? new Date(),
    })) as Member[];
};

export const subscribeFamilyMembers = (
    familyId: string,
    callback: (members: Member[]) => void
) => {
    return onSnapshot(
        collection(db, `families/${familyId}/members`),
        (snap) => {
            const members = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
                joinedAt: (d.data().joinedAt as Timestamp)?.toDate() ?? new Date(),
            })) as Member[];
            callback(members);
        }
    );
};

export const addMemberToFamily = async (
    familyId: string,
    userId: string,
    name: string,
    email: string,
    avatarColor: string
) => {
    await setDoc(doc(db, `families/${familyId}/members`, userId), {
        id: userId,
        name,
        email,
        role: 'member',
        avatarColor,
        joinedAt: serverTimestamp(),
    });
};

// ── Invites ─────────────────────────────────────────────────────────────────

export const createInvite = async (
    familyId: string,
    familyName: string,
    email: string,
    inviteeName: string,
    invitedBy: string,
    invitedByName: string
): Promise<Invite> => {
    const token = nanoid();
    const inviteRef = doc(collection(db, `families/${familyId}/invites`));
    const inviteData = {
        id: inviteRef.id,
        email,
        name: inviteeName,
        invitedBy,
        invitedByName,
        familyId,
        familyName,
        status: 'pending',
        token,
        createdAt: serverTimestamp(),
    };
    await setDoc(inviteRef, inviteData);

    // Also store in global invites collection for token lookup
    await setDoc(doc(db, 'invites', token), inviteData);

    return {
        ...inviteData,
        status: 'pending' as const,
        createdAt: new Date(),
    };
};

export const getInviteByToken = async (token: string): Promise<Invite | null> => {
    const snap = await getDoc(doc(db, 'invites', token));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
        ...d,
        createdAt: (d.createdAt as Timestamp)?.toDate() ?? new Date(),
    } as Invite;
};

export const acceptInvite = async (token: string) => {
    await updateDoc(doc(db, 'invites', token), { status: 'accepted' });
};

export const getFamilyInvites = async (familyId: string): Promise<Invite[]> => {
    const snap = await getDocs(
        query(
            collection(db, `families/${familyId}/invites`),
            where('status', '==', 'pending')
        )
    );
    return snap.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
    })) as Invite[];
};

export const deleteInvite = async (familyId: string, inviteId: string) => {
    await deleteDoc(doc(db, `families/${familyId}/invites`, inviteId));
};

// ── Invite Email via Firebase Auth ───────────────────────────────────────────

const ACTION_CODE_SETTINGS = (token: string) => ({
    url: `${import.meta.env.VITE_APP_BASE_URL}/invite/accept?token=${token}`,
    handleCodeInApp: true,
});

export const sendFamilyInviteLink = async (
    inviteToken: string,
    email: string
): Promise<void> => {
    await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS(inviteToken));
    window.localStorage.setItem('emailForInviteSignIn', email);
};
