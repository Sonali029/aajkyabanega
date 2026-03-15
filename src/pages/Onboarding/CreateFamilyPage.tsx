import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createFamily } from '../../services/family.service';
import { updateUserFamilyId } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

interface FamilyForm { name: string; }

const CreateFamilyPage: React.FC = () => {
    const { user, appUser, refreshUser } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm<FamilyForm>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const onSubmit = async (data: FamilyForm) => {
        if (!user || !appUser) return;
        setLoading(true);
        try {
            const family = await createFamily(
                data.name,
                user.uid,
                appUser.displayName,
                appUser.email,
                appUser.avatarColor || '#FF6B35'
            );
            await updateUserFamilyId(user.uid, family.id);
            await refreshUser();
            navigate('/');
        } catch {
            setError('Failed to create family. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-blob b1" />
            <div className="auth-bg-blob b2" />
            <div className="auth-card animate-up">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🏠</div>
                    <h1 className="auth-title">Create Your Family</h1>
                    <p className="auth-subtitle">
                        Give your family a name and start settling those meal debates!
                    </p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="field-group">
                        <label className="field-label">Family Name</label>
                        <input
                            className={`field-input ${errors.name ? 'error' : ''}`}
                            type="text"
                            placeholder="e.g. The Sharma Family, Our House 🏡"
                            {...register('name', { required: 'Family name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
                        />
                        {errors.name && <span className="field-error">{errors.name.message}</span>}
                    </div>

                    {error && <div className="field-error" style={{ textAlign: 'center', fontSize: 14 }}>{error}</div>}

                    <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Family 🎉'}
                    </button>
                </form>

                <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        💡 <strong style={{ color: 'var(--text-primary)' }}>After creating:</strong> You can invite family members by going to the <strong>Family</strong> tab and sending them a WhatsApp or email invite.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateFamilyPage;
