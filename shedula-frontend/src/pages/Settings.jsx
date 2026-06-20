import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── Fully Functional Global Avatar Component ──────────────────────────────
function Avatar({ name = '', size = 40 }) {
    // Read the base64 image from local storage
    const [avatarData, setAvatarData] = useState(localStorage.getItem('shedula_avatar'));

    // Reactively update if the picture changes in Settings (or another tab)
    useEffect(() => {
        const handleAvatarUpdate = () => setAvatarData(localStorage.getItem('shedula_avatar'));
        window.addEventListener('storage', handleAvatarUpdate);
        window.addEventListener('avatar-update', handleAvatarUpdate); // Custom event for same-tab updates
        return () => {
            window.removeEventListener('storage', handleAvatarUpdate);
            window.removeEventListener('avatar-update', handleAvatarUpdate);
        };
    }, []);

    // Render the uploaded image if it exists
    if (avatarData) {
        return (
            <img
                src={avatarData}
                alt={name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
        );
    }

    // Fallback to Initials if no picture is uploaded
    const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const bg = colors[name?.charCodeAt(0) % colors.length] || '#f59e0b';
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {initials}
        </div>
    );
}

export default function Settings() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const fileInputRef = useRef(null);

    // 🚀 SMART PROFILE LOGIC
    const rawName = localStorage.getItem('name') || '';
    const rawEmail = localStorage.getItem('email') || localStorage.getItem('username') || '';

    let displayName = 'User';
    if (rawName && rawName !== 'undefined' && rawName.trim() !== '') displayName = rawName;
    else if (rawEmail && rawEmail !== 'undefined' && rawEmail.trim() !== '') displayName = rawEmail.split('@')[0];

    const [userProfile, setUserProfile] = useState({ name: displayName, email: rawEmail });
    const [draftProfile, setDraftProfile] = useState({ name: displayName, email: rawEmail });
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    // Auto-update profile if local storage changes
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'name' || !e.key) {
                const nName = localStorage.getItem('name') || 'User';
                const nEmail = localStorage.getItem('email') || localStorage.getItem('username') || '';
                setUserProfile({ name: nName, email: nEmail });
                setDraftProfile({ name: nName, email: nEmail });
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ── Core States ──
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [toasts, setToasts] = useState([]);

    // ── Fully Functional Theme State ──
    const [theme, setTheme] = useState(localStorage.getItem('shedula_theme') || 'System');

    // 🚀 GLOBAL THEME ENGINE INITIALIZATION
    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = (themeName) => {
            if (themeName === 'Dark' || (themeName === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.style.setProperty('--bg-main', '#020617');
                root.style.setProperty('--bg-card', '#0f172a');
                root.style.setProperty('--text-main', '#f8fafc');
                root.style.setProperty('--text-sub', '#94a3b8');
                root.style.setProperty('--border-color', '#1e293b');
                root.style.setProperty('--sidebar-bg', '#0f172a');
                root.style.setProperty('--input-bg', '#1e293b');
                root.style.setProperty('--input-focus', 'rgba(59, 130, 246, 0.2)');
            } else {
                root.style.setProperty('--bg-main', '#f8fafc');
                root.style.setProperty('--bg-card', '#ffffff');
                root.style.setProperty('--text-main', '#0f172a');
                root.style.setProperty('--text-sub', '#64748b');
                root.style.setProperty('--border-color', '#e2e8f0');
                root.style.setProperty('--sidebar-bg', '#ffffff');
                root.style.setProperty('--input-bg', '#f8fafc');
                root.style.setProperty('--input-focus', 'rgba(59, 130, 246, 0.1)');
            }
        };

        applyTheme(theme);
        localStorage.setItem('shedula_theme', theme);

        if (theme === 'System') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = () => applyTheme('System');
            media.addEventListener('change', listener);
            return () => media.removeEventListener('change', listener);
        }
    }, [theme]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');
        else {
            setIsAuthenticated(true);
            setTimeout(() => setIsLoading(false), 500);
        }
    }, [navigate]);

    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ── 🚀 100% REAL AVATAR UPLOAD LOGIC ──
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verify size limit (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast("File is too large. Maximum size is 2MB.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            // Save to local storage
            localStorage.setItem('shedula_avatar', base64String);
            // Fire custom event to instantly update the Avatar component in the current window
            window.dispatchEvent(new Event('avatar-update'));
            window.dispatchEvent(new Event('storage'));
            toast("Profile picture updated successfully!");
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        localStorage.removeItem('shedula_avatar');
        window.dispatchEvent(new Event('avatar-update'));
        window.dispatchEvent(new Event('storage'));
        toast("Profile picture removed.", "info");
        // Reset the file input so you can upload the same image again if wanted
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            localStorage.setItem('name', draftProfile.name);
            setUserProfile(draftProfile);
            window.dispatchEvent(new Event('storage'));
            toast("Profile details updated successfully!");
        } catch (err) {
            toast("Failed to save profile details.", "error");
        } finally {
            setTimeout(() => setIsSavingProfile(false), 600);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast("New passwords do not match!", "error");
            return;
        }
        setIsSavingPassword(true);
        try {
            await api.put('/api/users/change-password', passwords);
            toast("Vault secured! Password updated successfully.");
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast("Verification failed. Check your current password.", "error");
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleExportData = () => {
        toast("Compiling encrypted data payload...", "info");
        const data = {
            profile: userProfile,
            themePreference: theme,
            avatarConfigured: !!localStorage.getItem('shedula_avatar'),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Shedula_Archive_${userProfile.name.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        toast("Data payload successfully exported!");
    };

    const handleDeleteAccount = async () => {
        const match = window.prompt("CRITICAL: This will destroy your workspace permanently. Type 'DELETE' to confirm:");
        if (match === 'DELETE') {
            try {
                toast("Executing deletion protocol...", "error");
                await api.delete('/api/users/me');
                toast("Account deleted.", "success");
                setTimeout(() => handleLogout(), 1500);
            } catch (err) {
                toast("Protocol failed. Server unreachable.", "error");
            }
        } else if (match !== null) {
            toast("Protocol aborted. Invalid signature.", "info");
        }
    };

    const S = {
        input: { width: '100%', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', boxSizing: 'border-box' },
        btn: (bg, color = '#fff') => ({ padding: '14px 28px', backgroundColor: bg, color, border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }),
        card: { backgroundColor: 'var(--bg-card)', borderRadius: '28px', border: '1px solid var(--border-color)', padding: '48px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)', transition: 'transform 0.3s, box-shadow 0.3s' },
        cardHeader: { margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' },
        cardSub: { margin: '0 0 32px 0', color: 'var(--text-sub)', fontSize: '1rem', lineHeight: '1.5' },
        label: { display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '800', fontSize: '0.80rem', textTransform: 'uppercase', letterSpacing: '1px' }
    };

    if (!isAuthenticated) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", "SF Pro Display", sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>

            <style>{`
                @keyframes iosPop { 0% { opacity: 0; transform: scale(0.95) translateY(5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                .dropdown-pop { animation: iosPop 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards; transform-origin: bottom left; }
                
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in-up { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                .elite-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 4px var(--input-focus) !important; transform: translateY(-2px); }
                .elite-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); }
                
                .theme-btn { flex: 1; padding: 20px; border: 2px solid var(--border-color); border-radius: 20px; background: var(--input-bg); cursor: pointer; display: flex; flex-direction: column; alignItems: center; gap: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 800; color: var(--text-sub); }
                .theme-btn:hover { background: var(--bg-card); transform: translateY(-4px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.1); }
                .theme-btn.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
            `}</style>

            {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
            <aside style={{ width: 260, minWidth: 260, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', padding: '28px 20px', display: 'flex', flexDirection: 'column', zIndex: 10, transition: 'all 0.3s ease' }}>
                <div style={{ padding: '0 8px 36px 8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.5px' }}>
                        Shedula<span style={{ color: '#f59e0b' }}>.</span>
                    </h2>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
                    {[
                        ['🏠', 'Dashboard', '/dashboard'],
                        ['📁', 'My Projects', '/projects'],
                        ['📅', 'Calendar', '/calendar'],
                        ['👥', 'Team', '/team'],
                        ['📊', 'Reports', '/reports'],
                        ['⚙️', 'Settings', '/settings'],
                        ['📥', 'Inbox', '/inbox']
                    ].map(([icon, label, path]) => (
                        <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', backgroundColor: label === 'Settings' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: label === 'Settings' ? '#3b82f6' : 'var(--text-sub)', transition: 'all 0.2s' }} onMouseEnter={e => { if (label !== 'Settings') e.currentTarget.style.backgroundColor = 'var(--input-bg)' }} onMouseLeave={e => { if (label !== 'Settings') e.currentTarget.style.backgroundColor = 'transparent' }}>
                            <span style={{ fontSize: '1.2rem' }}>{icon}</span>{label}
                        </div>
                    ))}
                </nav>

                <div style={{ position: 'relative', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                    <div onClick={() => setProfileMenuOpen(!profileMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        {/* Notice this avatar instantly reacts to uploads */}
                        <Avatar name={userProfile.name} size={42} />
                        <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Workspace Admin</div>
                        </div>
                        <span style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>⋮</span>
                    </div>

                    {profileMenuOpen && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(false); }} />
                            <div className="dropdown-pop" style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: 0, width: '280px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '28px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <Avatar name={userProfile.name} size={72} />
                                    <div>
                                        <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.2rem' }}>{userProfile.name}</div>
                                        <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>{userProfile.email}</div>
                                    </div>
                                    <button onClick={() => setProfileMenuOpen(false)} style={{ marginTop: '12px', padding: '8px 24px', borderRadius: '99px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.target.style.backgroundColor = '#3b82f6'; e.target.style.color = '#fff'; e.target.style.borderColor = '#3b82f6'; }} onMouseLeave={e => { e.target.style.backgroundColor = 'var(--input-bg)'; e.target.style.color = 'var(--text-main)'; e.target.style.borderColor = 'var(--border-color)'; }}>Manage Account</button>
                                </div>
                                <div style={{ padding: '12px' }}>
                                    <div onClick={() => handleLogout()} style={{ padding: '14px 20px', fontSize: '0.95rem', color: '#ef4444', cursor: 'pointer', borderRadius: '16px', display: 'flex', gap: '14px', alignItems: 'center', fontWeight: 800 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <span>🚪</span> Sign Out
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
            <main style={{ flexGrow: 1, padding: '56px 72px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '900px' }}>

                    <header className="fade-in-up" style={{ marginBottom: '48px', animationDelay: '0ms' }}>
                        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px' }}>Settings</h1>
                        <p style={{ margin: '12px 0 0 0', color: 'var(--text-sub)', fontSize: '1.2rem', fontWeight: 500 }}>Control your profile, workspace preferences, and security layers.</p>
                    </header>

                    {!isLoading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '100px' }}>

                            {/* 1. PUBLIC PROFILE */}
                            <div className="fade-in-up elite-card" style={{ ...S.card, animationDelay: '100ms' }}>
                                <h3 style={S.cardHeader}>Profile Information</h3>
                                <p style={S.cardSub}>Update your personal details and public presence.</p>

                                {/* 🚀 100% FUNCTIONAL AVATAR UPLOADER */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <Avatar name={userProfile.name} size={96} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                                        {/* Hidden File Input */}
                                        <input
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current.click()}
                                                style={{ ...S.btn('#3b82f6', 'white'), padding: '10px 20px', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                                            >
                                                Upload New Picture
                                            </button>

                                            {/* Only show Remove button if an avatar exists */}
                                            {localStorage.getItem('shedula_avatar') && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    style={{ ...S.btn('transparent', '#ef4444'), border: '1px solid var(--border-color)', padding: '10px 20px', fontSize: '0.9rem' }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 600 }}>JPG or PNG. Max size 2MB.</span>
                                    </div>
                                </div>

                                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                                        <div>
                                            <label style={S.label}>Full Name</label>
                                            <input type="text" className="elite-input" value={draftProfile.name} onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })} required style={S.input} />
                                        </div>
                                        <div>
                                            <label style={S.label}>Email Address (Read-only)</label>
                                            <input type="email" value={draftProfile.email} disabled style={{ ...S.input, backgroundColor: 'var(--bg-main)', color: 'var(--text-sub)', cursor: 'not-allowed', opacity: 0.6 }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '32px', marginTop: '16px' }}>
                                        <button type="submit" disabled={isSavingProfile} style={{ ...S.btn('var(--text-main)', 'var(--bg-card)'), opacity: isSavingProfile ? 0.7 : 1, transform: isSavingProfile ? 'scale(0.98)' : 'scale(1)' }}>
                                            {isSavingProfile ? 'Synchronizing...' : 'Save Profile Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 2. THEME ENIGNE */}
                            <div className="fade-in-up elite-card" style={{ ...S.card, animationDelay: '150ms' }}>
                                <h3 style={S.cardHeader}>Appearance</h3>
                                <p style={S.cardSub}>Tailor your localized UI experience and layout engines.</p>

                                <div>
                                    <label style={S.label}>UI Theme Engine</label>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        {['Light', 'Dark', 'System'].map(t => (
                                            <button key={t} type="button" className={`theme-btn ${theme === t ? 'active' : ''}`} onClick={() => setTheme(t)}>
                                                <span style={{ fontSize: '1.8rem' }}>{t === 'Light' ? '☀️' : t === 'Dark' ? '🌙' : '💻'}</span> {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. SECURITY */}
                            <div className="fade-in-up elite-card" style={{ ...S.card, animationDelay: '200ms' }}>
                                <h3 style={S.cardHeader}>Security Engine</h3>
                                <p style={S.cardSub}>Enforce access controls and refresh authentication keys.</p>

                                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    <div style={{ maxWidth: '50%' }}>
                                        <label style={S.label}>Current Password Validation</label>
                                        <input type="password" placeholder="••••••••" className="elite-input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required style={S.input} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                                        <div>
                                            <label style={S.label}>New Master Password</label>
                                            <input type="password" placeholder="••••••••" className="elite-input" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required style={S.input} />
                                        </div>
                                        <div>
                                            <label style={S.label}>Verify New Password</label>
                                            <input type="password" placeholder="••••••••" className="elite-input" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required style={S.input} />
                                        </div>
                                    </div>
                                    <div style={{ paddingTop: '8px' }}>
                                        <button type="submit" disabled={isSavingPassword} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)'), border: '1px solid var(--border-color)', opacity: isSavingPassword ? 0.7 : 1 }}>
                                            {isSavingPassword ? 'Encrypting...' : 'Update Authentication Keys'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 4. DANGER ZONE */}
                            <div className="fade-in-up elite-card" style={{ backgroundColor: 'rgba(225, 29, 72, 0.04)', borderRadius: '28px', border: '1px solid rgba(225, 29, 72, 0.2)', padding: '48px', animationDelay: '250ms', transition: 'all 0.3s' }}>
                                <h3 style={{ margin: '0 0 12px 0', color: '#e11d48', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Danger Zone</h3>
                                <p style={{ margin: '0 0 32px 0', color: '#be123c', fontSize: '1rem', lineHeight: '1.5' }}>Destructive and irreversible actions regarding your core dataset.</p>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '32px', marginBottom: '32px', borderBottom: '1px solid rgba(225, 29, 72, 0.15)' }}>
                                    <div style={{ paddingRight: '32px' }}>
                                        <div style={{ color: '#9f1239', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>Download Data Archive</div>
                                        <div style={{ color: '#be123c', fontSize: '0.95rem', marginTop: '6px', lineHeight: '1.5' }}>Generate a complete, machine-readable JSON backup of your configurations, logs, and activity.</div>
                                    </div>
                                    <button onClick={handleExportData} type="button" style={{ ...S.btn('white', '#e11d48'), border: '1px solid #fecaca', flexShrink: 0 }}>Export System JSON</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ paddingRight: '32px' }}>
                                        <div style={{ color: '#9f1239', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.3px' }}>Terminate Account</div>
                                        <div style={{ color: '#be123c', fontSize: '0.95rem', marginTop: '6px', lineHeight: '1.5' }}>Execute permanent deletion of your account record. This action cannot be reversed or recovered.</div>
                                    </div>
                                    <button onClick={handleDeleteAccount} type="button" style={{ ...S.btn('#e11d48'), boxShadow: '0 8px 20px -5px rgba(225, 29, 72, 0.4)', flexShrink: 0 }}>
                                        Delete Account
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </main>

            {/* ── TOASTS ── */}
            <div style={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ padding: '18px 28px', borderRadius: '16px', backgroundColor: t.type === 'error' ? '#fee2e2' : t.type === 'info' ? 'var(--input-bg)' : '#10b981', color: t.type === 'error' ? '#b91c1c' : t.type === 'info' ? 'var(--text-main)' : '#ffffff', border: t.type === 'info' ? '1px solid var(--border-color)' : 'none', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'} {t.msg}
                    </div>
                ))}
            </div>
        </div>
    );
}