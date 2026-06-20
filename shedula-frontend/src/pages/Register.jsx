import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── password strength indicator (Theme Aware) ─────────────────────────
function PasswordStrength({ password }) {
    let strength = 0;
    let color = 'var(--text-sub)';
    let text = 'Weak';

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength === 0) { color = '#ef4444'; text = 'Very Weak'; }
    else if (strength === 1) { color = '#f97316'; text = 'Weak'; }
    else if (strength === 2) { color = '#f59e0b'; text = 'Fair'; }
    else if (strength === 3) { color = '#84cc16'; text = 'Good'; }
    else { color = '#10b981'; text = 'Strong'; }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <div style={{ height: '4px', flex: 1, backgroundColor: 'var(--input-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(strength / 4) * 100}%`, backgroundColor: color, transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '50px' }}>
                {text}
            </span>
        </div>
    );
}

// ─── requirement checkbox (Theme Aware) ────────────────────────────────
function RequirementCheck({ text, met }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: met ? '#10b981' : 'var(--text-sub)', fontWeight: '600', transition: 'color 0.3s' }}>
            <span style={{ color: met ? '#10b981' : 'var(--border-color)', fontSize: '1.1rem' }}>
                {met ? '✓' : '○'}
            </span>
            {text}
        </div>
    );
}

// ─── elite toast notification ──────────────────────────────────────────
function Toast({ message, type = 'error' }) {
    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            padding: '16px 24px',
            borderRadius: '16px',
            backgroundColor: type === 'error' ? '#fee2e2' : '#f0fdf4',
            color: type === 'error' ? '#b91c1c' : '#15803d',
            fontWeight: '800',
            fontSize: '0.95rem',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            <span style={{ fontSize: '1.2rem' }}>{type === 'error' ? '❌' : '✅'}</span> {message}
        </div>
    );
}

// ─── elite input field with validation ──────────────────────────────────
function InputField({ type = 'text', placeholder, value, onChange, error = '', icon = null, required = false }) {
    return (
        <div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {icon && (
                    <span style={{ position: 'absolute', left: '16px', fontSize: '1.2rem', color: 'var(--text-sub)' }}>
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className="elite-input"
                    style={{
                        width: '100%',
                        padding: icon ? '16px 16px 16px 48px' : '16px',
                        borderRadius: '14px',
                        border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        backgroundColor: error ? 'rgba(239, 68, 68, 0.05)' : 'var(--input-bg)',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                        fontWeight: '500'
                    }}
                />
            </div>
            {error && <p style={{ fontSize: '0.85rem', color: '#ef4444', margin: '6px 0 0 4px', fontWeight: '700' }}>⚠️ {error}</p>}
        </div>
    );
}

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // 🚀 GLOBAL THEME ENGINE INITIALIZATION
    useEffect(() => {
        const root = document.documentElement;
        const currentTheme = localStorage.getItem('shedula_theme') || 'System';

        const applyTheme = (themeName) => {
            if (themeName === 'Dark' || (themeName === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.style.setProperty('--bg-main', '#020617');
                root.style.setProperty('--bg-card', '#0f172a');
                root.style.setProperty('--text-main', '#f8fafc');
                root.style.setProperty('--text-sub', '#94a3b8');
                root.style.setProperty('--border-color', '#1e293b');
                root.style.setProperty('--input-bg', '#1e293b');
                root.style.setProperty('--input-focus', 'rgba(59, 130, 246, 0.2)');
            } else {
                root.style.setProperty('--bg-main', '#f8fafc');
                root.style.setProperty('--bg-card', '#ffffff');
                root.style.setProperty('--text-main', '#0f172a');
                root.style.setProperty('--text-sub', '#64748b');
                root.style.setProperty('--border-color', '#e2e8f0');
                root.style.setProperty('--input-bg', '#f1f5f9');
                root.style.setProperty('--input-focus', 'rgba(59, 130, 246, 0.1)');
            }
        };

        applyTheme(currentTheme);

        if (currentTheme === 'System') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = () => applyTheme('System');
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'Full name is required';
        else if (name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';

        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (!agreedToTerms) newErrors.terms = 'You must agree to the terms';

        return newErrors;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        setErrors({});
        setLoading(true);

        try {
            await api.post('/api/users/register', { name, email, password });
            setToast({ message: 'Account created! Initializing login sequence...', type: 'success' });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setToast({ message: 'Registration failed. Email may already be in use.', type: 'error' });
            setTimeout(() => setToast(null), 4000);
        } finally {
            setLoading(false);
        }
    };

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const hasLength = password.length >= 6;
    const hasUpperAndNumber = /[A-Z]/.test(password) && /[0-9]/.test(password);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)', fontFamily: '"Inter", "SF Pro Display", sans-serif', padding: '20px', transition: 'background-color 0.4s ease' }}>

            {/* ─── ELITE ANIMATED BACKGROUND ─── */}
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)', animation: 'float 20s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate' }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 60%)', animation: 'float 25s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate-reverse 2s' }}></div>
            </div>

            {/* ─── REGISTER CARD ─── */}
            <div className="fade-in-up" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '500px', padding: '56px 48px', backgroundColor: 'var(--bg-card)', borderRadius: '28px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', transition: 'background-color 0.4s ease, border-color 0.4s ease' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', borderRadius: '20px', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.5)' }}>🚀</div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 12px 0', letterSpacing: '-1px' }}>
                        Join Shedula
                    </h1>
                    <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                        Create your account and start building smarter
                    </p>
                </div>

                {/* Toast Notification */}
                {toast && <Toast message={toast.message} type={toast.type} />}

                {/* Registration Form */}
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <InputField
                        type="text"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setErrors({ ...errors, name: '' }); }}
                        error={errors.name}
                        icon="👤"
                        required
                    />

                    <InputField
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); }}
                        error={errors.email}
                        icon="✉️"
                        required
                    />

                    {/* Password */}
                    <div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '16px', fontSize: '1.2rem', color: 'var(--text-sub)', zIndex: 2 }}>🔒</span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                className="elite-input"
                                onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }}
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 56px 16px 48px',
                                    borderRadius: '14px',
                                    border: `1px solid ${errors.password ? '#ef4444' : 'var(--border-color)'}`,
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    backgroundColor: errors.password ? 'rgba(239, 68, 68, 0.05)' : 'var(--input-bg)',
                                    color: 'var(--text-main)',
                                    boxSizing: 'border-box',
                                    fontWeight: '500'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-sub)', transition: 'color 0.2s', padding: 0 }}
                                onMouseOver={e => e.currentTarget.style.color = '#3b82f6'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-sub)'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        {errors.password && <p style={{ fontSize: '0.85rem', color: '#ef4444', margin: '6px 0 0 4px', fontWeight: '700' }}>⚠️ {errors.password}</p>}
                        {password && <PasswordStrength password={password} />}
                    </div>

                    {/* Dynamic Password Requirements */}
                    {password && (
                        <div style={{ backgroundColor: 'var(--input-bg)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <RequirementCheck text="At least 6 characters" met={hasLength} />
                            <RequirementCheck text="Uppercase letter & number" met={hasUpperAndNumber} />
                        </div>
                    )}

                    {/* Confirm Password */}
                    <div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ position: 'absolute', left: '16px', fontSize: '1.2rem', color: 'var(--text-sub)', zIndex: 2 }}>🔐</span>
                            <input
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                className="elite-input"
                                onChange={(e) => { setConfirmPassword(e.target.value); setErrors({ ...errors, confirmPassword: '' }); }}
                                required
                                style={{
                                    width: '100%',
                                    padding: '16px 16px 16px 48px',
                                    borderRadius: '14px',
                                    border: `1px solid ${errors.confirmPassword ? '#ef4444' : confirmPassword && passwordsMatch ? '#10b981' : 'var(--border-color)'}`,
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                    backgroundColor: errors.confirmPassword ? 'rgba(239, 68, 68, 0.05)' : confirmPassword && passwordsMatch ? 'rgba(16, 185, 129, 0.05)' : 'var(--input-bg)',
                                    color: 'var(--text-main)',
                                    boxSizing: 'border-box',
                                    fontWeight: '500'
                                }}
                            />
                        </div>
                        {confirmPassword && passwordsMatch && <p style={{ fontSize: '0.85rem', color: '#10b981', margin: '6px 0 0 4px', fontWeight: '700' }}>✓ Passwords match</p>}
                        {errors.confirmPassword && <p style={{ fontSize: '0.85rem', color: '#ef4444', margin: '6px 0 0 4px', fontWeight: '700' }}>⚠️ {errors.confirmPassword}</p>}
                    </div>

                    {/* Terms & Conditions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: 'var(--input-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => { setAgreedToTerms(e.target.checked); setErrors({ ...errors, terms: '' }); }}
                            style={{ marginTop: '2px', cursor: 'pointer', width: '20px', height: '20px', accentColor: '#3b82f6', flexShrink: 0 }}
                        />
                        <label onClick={() => { setAgreedToTerms(!agreedToTerms); setErrors({ ...errors, terms: '' }); }} style={{ fontSize: '0.9rem', color: 'var(--text-sub)', lineHeight: '1.5', margin: 0, cursor: 'pointer', fontWeight: '500' }}>
                            I agree to the <span style={{ color: '#3b82f6', fontWeight: '700' }}>Terms of Service</span> and <span style={{ color: '#3b82f6', fontWeight: '700' }}>Privacy Policy</span>
                        </label>
                    </div>
                    {errors.terms && <p style={{ fontSize: '0.85rem', color: '#ef4444', margin: '-16px 0 0 4px', fontWeight: '700' }}>⚠️ {errors.terms}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px 24px',
                            backgroundColor: loading ? 'var(--border-color)' : '#10b981',
                            color: loading ? 'var(--text-sub)' : 'white',
                            border: 'none',
                            borderRadius: '14px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: '800',
                            fontSize: '1.05rem',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(16, 185, 129, 0.4)',
                            marginTop: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#059669';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 15px 30px -5px rgba(16, 185, 129, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#10b981';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 10px 20px -5px rgba(16, 185, 129, 0.4)';
                            }
                        }}
                    >
                        {loading ? 'Processing...' : 'Create Account'}
                    </button>
                </form>

                {/* Footer Link */}
                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', margin: 0, fontWeight: '500' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '800', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#059669'} onMouseOut={e => e.currentTarget.style.color = '#10b981'}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideUpFade { 
                    0% { opacity: 0; transform: translateY(40px); } 
                    100% { opacity: 1; transform: translateY(0); } 
                }
                .fade-in-up { animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-40px) scale(1.05); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                /* Elite Input Focus Physics */
                .elite-input:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 4px var(--input-focus) !important;
                }
                /* Hide Webkit Autofill Background */
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active{
                    -webkit-box-shadow: 0 0 0 30px var(--input-bg) inset !important;
                    -webkit-text-fill-color: var(--text-main) !important;
                    transition: background-color 5000s ease-in-out 0s;
                }
            `}</style>
        </div>
    );
}