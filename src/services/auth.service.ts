import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { AppUser } from '../types';
import { generateAvatarColor } from '../utils/helpers';

const ACTION_CODE_SETTINGS = (token: string) => ({
    url: `${import.meta.env.VITE_APP_BASE_URL}/invite/accept?token=${token}`,
    handleCodeInApp: true,
});

export const registerUser = async (
    email: string,
    password: string,
    displayName: string
): Promise<AppUser> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });

    const avatarColor = generateAvatarColor(displayName);
    const userData: Omit<AppUser, 'uid'> & { uid: string } = {
        uid: cred.user.uid,
        email,
        displayName,
        avatarColor,
    };

    await setDoc(doc(db, 'users', cred.user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
    });

    return userData;
};

export const loginUser = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
};

export const signInWithGoogle = async (): Promise<AppUser> => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const { user } = cred;

    // Check if user doc already exists, if not create it
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        const avatarColor = generateAvatarColor(user.displayName || user.email || 'User');
        const userData = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            avatarColor,
        };
        await setDoc(userRef, { ...userData, createdAt: serverTimestamp() });
        return userData as AppUser;
    }
    return { uid: snap.id, ...snap.data() } as AppUser;
};

export const logoutUser = async () => {
    await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as AppUser;
};

export const updateUserFamilyId = async (uid: string, familyId: string) => {
    await updateDoc(doc(db, 'users', uid), { familyId });
};

// Send invite magic link email via Firebase Auth
export const sendFamilyInviteLink = async (
    inviteToken: string,
    email: string
): Promise<void> => {
    await sendSignInLinkToEmail(auth, email, ACTION_CODE_SETTINGS(inviteToken));
    // Store email locally for the invited person's device
    window.localStorage.setItem('emailForInviteSignIn', email);
};

export const isInviteMagicLink = (href: string) =>
    isSignInWithEmailLink(auth, href);

export const signInWithInviteLink = async (email: string, href: string) => {
    const cred = await signInWithEmailLink(auth, email, href);
    return cred.user;
};

export const findUserByEmail = async (email: string): Promise<AppUser | null> => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { uid: d.id, ...d.data() } as AppUser;
};

export const updateFcmToken = async (uid: string, familyId: string, token: string) => {
    await updateDoc(doc(db, `families/${familyId}/members`, uid), {
        fcmToken: token,
    });
};
