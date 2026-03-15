import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { AppUser, Family } from '../types';
import { getUserProfile } from '../services/auth.service';
import { getFamily } from '../services/family.service';

interface AuthContextType {
    user: User | null;
    appUser: AppUser | null;
    family: Family | null;
    loading: boolean;
    refreshFamily: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    appUser: null,
    family: null,
    loading: true,
    refreshFamily: async () => { },
    refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserData = async (firebaseUser: User | null) => {
        if (!firebaseUser) {
            setAppUser(null);
            setFamily(null);
            return;
        }
        const profile = await getUserProfile(firebaseUser.uid);
        setAppUser(profile);
        if (profile?.familyId) {
            const fam = await getFamily(profile.familyId);
            setFamily(fam);
        } else {
            setFamily(null);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            await loadUserData(firebaseUser);
            setLoading(false);
        });
        return unsub;
    }, []);

    const refreshFamily = async () => {
        if (appUser?.familyId) {
            const fam = await getFamily(appUser.familyId);
            setFamily(fam);
        }
    };

    const refreshUser = async () => {
        if (user) {
            const profile = await getUserProfile(user.uid);
            setAppUser(profile);
            if (profile?.familyId) {
                const fam = await getFamily(profile.familyId);
                setFamily(fam);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, appUser, family, loading, refreshFamily, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
