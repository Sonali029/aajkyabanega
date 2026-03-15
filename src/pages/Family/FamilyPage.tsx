import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus, Copy, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getFamilyMembers,
    getFamilyInvites,
    createInvite,
    sendFamilyInviteLink,
} from '../../services/family.service';
import { Member, Invite } from '../../types';
import { getInitials, generateAvatarColor, getWhatsAppShareText } from '../../utils/helpers';

interface InviteForm { name: string; email: string; }

const FamilyPage: React.FC = () => {
    const { appUser, family } = useAuth();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>();
    const [members, setMembers] = useState<Member[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [lastInviteLink, setLastInviteLink] = useState('');
    const [lastInvite, setLastInvite] = useState<Invite | null>(null);

    const showToast = (msg: string) => {
        setToast(msg); setTimeout(() => setToast(''), 3500);
    };

    const loadData = async () => {
        if (!family?.id) return;
        const [m, i] = await Promise.all([
            getFamilyMembers(family.id),
            getFamilyInvites(family.id),
        ]);
        setMembers(m);
        setInvites(i);
    };

    useEffect(() => { loadData(); }, [family?.id]);

    const onInvite = async (data: InviteForm) => {
        if (!family || !appUser) return;
        setLoading(true);
        try {
            const invite = await createInvite(
                family.id, family.name, data.email, data.name,
                appUser.uid, appUser.displayName
            );
            const inviteLink = `${import.meta.env.VITE_APP_BASE_URL}/invite/accept?token=${invite.token}`;
            setLastInviteLink(inviteLink);
            setLastInvite(invite);

            // Send Firebase magic link email
            await sendFamilyInviteLink(invite.token, data.email);

            showToast('✅ Invite sent to ' + data.email);
            reset();
            loadData();
        } catch (error: unknown) {
            const e = error as { message?: string };
            showToast('❌ Failed to send invite: ' + (e.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(lastInviteLink);
        showToast('🔗 Link copied!');
    };

    const shareViaWhatsApp = () => {
        if (!lastInvite || !appUser || !family) return;
        const text = getWhatsAppShareText(
            lastInvite.name, family.name, appUser.displayName, lastInviteLink
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-up">
            <div className="page-header">
                <h1 className="page-header-title">👨‍👩‍👧‍👦 Family</h1>
                <p className="page-header-sub">{family?.name}</p>
            </div>

            {/* Members */}
            <div className="section">
                <div className="section-title">Members ({members.length})</div>
                <div className="card">
                    {members.map(m => (
                        <div key={m.id} className="member-row">
                            <div
                                className="avatar avatar-md"
                                style={{ background: m.avatarColor || generateAvatarColor(m.name) }}
                            >
                                {getInitials(m.name)}
                            </div>
                            <div className="member-info">
                                <div className="member-name">
                                    {m.name} {m.id === appUser?.uid ? '(You)' : ''}
                                </div>
                                <div className="member-email">{m.email}</div>
                            </div>
                            <div className={`member-role ${m.role}`}>{m.role}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending invites */}
            {invites.length > 0 && (
                <div className="section" style={{ paddingTop: 0 }}>
                    <div className="section-title">Pending Invites</div>
                    <div className="card">
                        {invites.map(inv => (
                            <div key={inv.id} className="pending-invite">
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inv.email}</div>
                                </div>
                                <div className="pending-label">Pending</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite section */}
            <div className="section" style={{ paddingTop: 0 }}>
                <button
                    className="btn btn-secondary btn-full"
                    onClick={() => setShowInviteForm(prev => !prev)}
                >
                    <UserPlus size={16} />
                    {showInviteForm ? 'Cancel' : 'Invite a Family Member'}
                </button>

                {showInviteForm && (
                    <form
                        className="invite-form"
                        style={{ marginTop: 12 }}
                        onSubmit={handleSubmit(onInvite)}
                    >
                        <div style={{ fontWeight: 600, marginBottom: 12 }}>Send Invite</div>
                        <div className="field-group" style={{ marginBottom: 10 }}>
                            <label className="field-label">Their Name</label>
                            <input
                                className={`field-input ${errors.name ? 'error' : ''}`}
                                placeholder="Priya, Raju, etc."
                                {...register('name', { required: 'Name is required' })}
                            />
                            {errors.name && <span className="field-error">{errors.name.message}</span>}
                        </div>
                        <div className="field-group" style={{ marginBottom: 14 }}>
                            <label className="field-label">Their Email</label>
                            <input
                                className={`field-input ${errors.email ? 'error' : ''}`}
                                type="email" placeholder="priya@example.com"
                                {...register('email', { required: 'Email required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                            />
                            {errors.email && <span className="field-error">{errors.email.message}</span>}
                        </div>
                        <button
                            className="btn btn-primary btn-full"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : '✉️ Send Email Invite'}
                        </button>
                    </form>
                )}

                {/* Post-invite options */}
                {lastInviteLink && (
                    <div style={{
                        marginTop: 12, padding: 16,
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Invite link ready!</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Email invite sent. You can also share the link directly:
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-whatsapp btn-sm" style={{ flex: 1 }} onClick={shareViaWhatsApp}>
                                <MessageCircle size={14} /> WhatsApp
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={copyLink}>
                                <Copy size={14} /> Copy Link
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {toast && <div className="toast success">{toast}</div>}
        </div>
    );
};

export default FamilyPage;
