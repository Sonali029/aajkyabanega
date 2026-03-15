import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerUser, signInWithGoogle } from '../../services/auth.service';

interface RegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );

const RegisterPage: React.FC = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    // 'unknown' | 'already-exists' | 'ok'
    const [accountStatus, setAccountStatus] = useState<'unknown' | 'already-exists' | 'ok'>('unknown');
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
            navigate('/');
        } catch {
            setError('Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const onSubmit = async (data: RegisterForm) => {
        setError('');
        setLoading(true);
        setAccountStatus('unknown');
        try {
            await registerUser(data.email, data.password, data.name);
            navigate('/onboarding');
        } catch (error: unknown) {
            const e = error as { code?: string; message?: string };
            const code = e.code as string;
            console.error('Registration error:', code, e.message);
            if (code === 'auth/email-already-in-use') {
                setAccountStatus('already-exists');
                setError('You are already registered. Please sign in.');
            } else {
                setError(`Registration failed (${code || e.message}). Please try again.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const isCreateDisabled = loading || accountStatus === 'already-exists';

    return (
        <div className="auth-page">
            <div className="auth-bg-blob b1" />
            <div className="auth-bg-blob b2" />
            <div className="auth-card animate-up">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🍽️</div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join your family on Aaj Kya Banega?</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="field-group">
                        <label className="field-label">Your Name</label>
                        <input
                            className={`field-input ${errors.name ? 'error' : ''}`}
                            type="text" placeholder="Rahul Sharma"
                            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
                        />
                        {errors.name && <span className="field-error">{errors.name.message}</span>}
                    </div>

                    <div className="field-group">
                        <label className="field-label">Email</label>
                        <input
                            className={`field-input ${errors.email ? 'error' : ''}`}
                            type="email" placeholder="you@example.com" autoComplete="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                                onChange: () => { setAccountStatus('unknown'); setError(''); }
                            })}
                        />
                        {errors.email && <span className="field-error">{errors.email.message}</span>}
                    </div>

                    <div className="field-group">
                        <label className="field-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className={`field-input ${errors.password ? 'error' : ''}`}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Min 6 characters"
                                style={{ paddingRight: 44 }}
                                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                                    padding: 0,
                                }}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        {errors.password && <span className="field-error">{errors.password.message}</span>}
                    </div>

                    <div className="field-group">
                        <label className="field-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className={`field-input ${errors.confirmPassword ? 'error' : ''}`}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Repeat password"
                                style={{ paddingRight: 44 }}
                                {...register('confirmPassword', {
                                    required: 'Please confirm password',
                                    validate: val => val === watch('password') || 'Passwords do not match'
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(p => !p)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
                                    padding: 0,
                                }}
                                tabIndex={-1}
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                <EyeIcon open={showConfirmPassword} />
                            </button>
                        </div>
                        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
                    </div>

                    {error && (
                        <div className="field-error" style={{ textAlign: 'center', fontSize: 14 }}>
                            {error}
                            {accountStatus === 'already-exists' && (
                                <>
                                    {' '}<Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                                        Sign in instead →
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-full"
                        type="submit"
                        disabled={isCreateDisabled}
                        style={accountStatus === 'already-exists' ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border, rgba(255,255,255,0.1))' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>or continue with</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border, rgba(255,255,255,0.1))' }} />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || loading}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                            background: 'transparent', border: '1.5px solid var(--border, rgba(255,255,255,0.15))',
                            color: 'var(--text-primary)', fontSize: 15, fontWeight: 600,
                            transition: 'all 0.2s', opacity: (googleLoading || loading) ? 0.6 : 1,
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                        {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                    </button>
                </form>

                <p className="text-center mt-24" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
