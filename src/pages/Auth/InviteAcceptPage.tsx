import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { isInviteMagicLink, signInWithInviteLink, registerUser } from '../../services/auth.service';
import { getInviteByToken, addMemberToFamily, acceptInvite } from '../../services/family.service';
import { updateUserFamilyId } from '../../services/auth.service';
import { Invite } from '../../types';
import { generateAvatarColor } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

interface AcceptForm {
    name: string;
    password: string;
}

const InviteAcceptPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const [invite, setInvite] = useState<Invite | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'loading' | 'form' | 'done'>('loading');
    const { register, handleSubmit, formState: { errors } } = useForm<AcceptForm>();

    useEffect(() => {
        const init = async () => {
            if (!token) { setError('Invalid invite link.'); setLoading(false); return; }
            const inv = await getInviteByToken(token);
            if (!inv || inv.status !== 'pending') {
                setError('This invite link has expired or already been used.'); setLoading(false); return;
            }
            setInvite(inv);
            setStep('form');
            setLoading(false);
        };
        init();
    }, [token]);

    const onSubmit = async (data: AcceptForm) => {
        if (!invite || !token) return;
        setLoading(true);
        try {
            // Check if this is a magic link sign-in
            let userId: string;
            let displayName: string; // Declare displayName here

            if (isInviteMagicLink(window.location.href)) {
                const email = window.localStorage.getItem('emailForInviteSignIn') || invite.email;
                const user = await signInWithInviteLink(email, window.location.href);
                userId = user.uid;
                displayName = user.displayName || data.name; // Use user.displayName if available, otherwise data.name
            } else {
                const appUser = await registerUser(invite.email, data.password, data.name);
                userId = appUser.uid;
                displayName = data.name; // For registration, displayName comes from form data
            }

            const avatarColor = generateAvatarColor(displayName);
            await addMemberToFamily(invite.familyId, userId, displayName, invite.email, avatarColor);
            await updateUserFamilyId(userId, invite.familyId);
            await acceptInvite(token);
            await refreshUser();

            setStep('done');
            setTimeout(() => navigate('/'), 1500);
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message || 'Failed to accept invite.');
            } else {
                setError('Failed to accept invite.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 'loading') {
        return (
            <div className="auth-page">
                <div className="spinner" />
                <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading invite...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="auth-page">
                <div className="auth-card text-center animate-up">
                    <div style={{ fontSize: 56 }}>😢</div>
                    <h2 style={{ marginTop: 16, marginBottom: 8 }}>Invite Not Found</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
                    <a href="/login" className="btn btn-primary">Go to Login</a>
                </div>
            </div>
        );
    }

    if (step === 'done') {
        return (
            <div className="auth-page">
                <div className="auth-card text-center animate-up">
                    <div style={{ fontSize: 56 }}>🎉</div>
                    <h2 style={{ marginTop: 16, marginBottom: 8 }}>Welcome to the family!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Redirecting to your family's meal planner...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-blob b1" />
            <div className="auth-bg-blob b2" />
            <div className="auth-card animate-up">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🎉</div>
                    <h1 className="auth-title">You're Invited!</h1>
                    <p className="auth-subtitle">
                        <strong style={{ color: 'var(--accent)' }}>{invite?.invitedByName}</strong> invited you to join{' '}
                        <strong style={{ color: 'var(--primary)' }}>{invite?.familyName}</strong> on Aaj Kya Banega?
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="field-group">
                        <label className="field-label">Your Name</label>
                        <input
                            className={`field-input ${errors.name ? 'error' : ''}`}
                            type="text" defaultValue={invite?.name}
                            placeholder="How should we call you?"
                            {...register('name', { required: 'Name is required' })}
                        />
                        {errors.name && <span className="field-error">{errors.name.message}</span>}
                    </div>

                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <input className="field-input" type="email" value={invite?.email} readOnly
                            style={{ opacity: 0.6 }} />
                    </div>

                    {!isInviteMagicLink(window.location.href) && (
                        <div className="field-group">
                            <label className="field-label">Create Password</label>
                            <input
                                className={`field-input ${errors.password ? 'error' : ''}`}
                                type="password" placeholder="Min 6 characters"
                                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
                            />
                            {errors.password && <span className="field-error">{errors.password.message}</span>}
                        </div>
                    )}

                    {error && <div className="field-error" style={{ textAlign: 'center', fontSize: 14 }}>{error}</div>}

                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? 'Joining...' : `Join ${invite?.familyName} 🏠`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InviteAcceptPage;
