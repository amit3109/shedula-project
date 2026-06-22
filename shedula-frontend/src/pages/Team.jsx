import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ─── Avatar Component ──────────────────────────────────────────────────────
function Avatar({ name = '', size = 40 }) {
    const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const bg = colors[name?.charCodeAt(0) % colors.length] || '#f59e0b';
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0 }}>
            {initials}
        </div>
    );
}

export default function Team() {
    const navigate = useNavigate();
    const searchRef = useRef(null);

    // 🚀 SMART PROFILE LOGIC
    const rawName = localStorage.getItem('name');
    const rawEmail = localStorage.getItem('email') || localStorage.getItem('username') || '';

    let displayName = 'User';
    if (rawName && rawName !== 'undefined' && rawName.trim() !== '') {
        displayName = rawName;
    } else if (rawEmail && rawEmail !== 'undefined' && rawEmail.trim() !== '') {
        displayName = rawEmail.split('@')[0];
    }

    const [userProfile, setUserProfile] = useState({
        name: displayName,
        email: rawEmail
    });
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toasts, setToasts] = useState([]);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Team Member' });

    // 🚀 GLOBAL THEME ENGINE INITIALIZATION & REACTIVE DATA SYNC
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
            } else {
                root.style.setProperty('--bg-main', '#f8fafc');
                root.style.setProperty('--bg-card', '#ffffff');
                root.style.setProperty('--text-main', '#0f172a');
                root.style.setProperty('--text-sub', '#64748b');
                root.style.setProperty('--border-color', '#e2e8f0');
                root.style.setProperty('--sidebar-bg', '#ffffff');
                root.style.setProperty('--input-bg', '#f1f5f9');
            }
        };

        const currentTheme = localStorage.getItem('shedula_theme') || 'System';
        applyTheme(currentTheme);

        const handleStorageChange = (e) => {
            if (e.key === 'shedula_theme') {
                applyTheme(e.newValue);
            }
            if (e.key === 'name' || e.key === 'email' || !e.key) {
                const nName = localStorage.getItem('name');
                const nEmail = localStorage.getItem('email') || localStorage.getItem('username') || '';
                let dName = 'User';
                if (nName && nName !== 'undefined' && nName.trim() !== '') dName = nName;
                else if (nEmail && nEmail !== 'undefined' && nEmail.trim() !== '') dName = nEmail.split('@')[0];
                setUserProfile({ name: dName, email: nEmail });
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');
        else setIsAuthenticated(true);
    }, [navigate]);

    // ── Toast Notification System ──────────────────────────────────────────
    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };

    // ── Data Fetching ──────────────────────────────────────────────────────
    const fetchTeam = async () => {
        setIsLoading(true);
        try {
            const usersResponse = await api.get('/api/users');
            const users = usersResponse.data;

            const projectRes = await api.get('/api/projects');
            const projects = projectRes.data;

            let busyUsers = new Set();
            for (const project of projects) {
                try {
                    const taskRes = await api.get(`/api/tasks/project/${project.id}`);
                    taskRes.data.forEach(task => {
                        if (task.assignedTo) busyUsers.add(task.assignedTo);
                    });
                } catch (err) {
                    console.warn(`Could not fetch tasks for project ${project.id}`);
                }
            }

            const updatedUsers = users.map(user => ({
                ...user,
                isAssigned: busyUsers.has(user.name) || busyUsers.has(user.id?.toString())
            }));

            setTeamMembers(updatedUsers);
        } catch (err) {
            console.error("Error fetching team:", err);
            toast("Failed to load team data.", "error");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchTeam();
    }, [isAuthenticated]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            await api.post('/api/users', {
                name: newMember.name,
                email: newMember.email,
                role: newMember.role,
                password: 'defaultPassword123'
            });
            fetchTeam();
            setShowInviteModal(false);
            setNewMember({ name: '', email: '', role: 'Team Member' });
            toast(`Successfully invited ${newMember.name}!`);
        } catch (err) {
            toast("Failed to invite member. Email might exist.", "error");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (userId, name) => {
        if (!window.confirm(`Remove ${name} from the workspace permanently?`)) return;
        try {
            await api.delete(`/api/users/${userId}`);
            fetchTeam();
            toast(`${name} removed from workspace.`, 'info');
        } catch (err) {
            toast("Failed to remove member.", "error");
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a855f7' };
            case 'Project Manager': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' };
            default: return { bg: 'var(--input-bg)', text: 'var(--text-sub)' };
        }
    };

    const filteredMembers = teamMembers.filter(m =>
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const S = {
        input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', boxSizing: 'border-box' },
        btn: (bg, color = '#fff') => ({ padding: '12px 24px', backgroundColor: bg, color, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s' }),
    };

    if (!isAuthenticated) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", "SF Pro Display", sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>

            <style>{`
                @keyframes iosPop { 
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
                    100% { opacity: 1; transform: scale(1) translateY(0); } 
                }
                .dropdown-pop { 
                    animation: iosPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                    transform-origin: bottom left;
                }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .skeleton-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>

            {/* ── SIDEBAR ────────────────────────────────────────────── */}
            <aside style={{ width: 260, minWidth: 260, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', padding: '24px 20px', display: 'flex', flexDirection: 'column', zIndex: 10, transition: 'all 0.3s ease' }}>
                <div style={{ padding: '0 6px 32px 6px' }}>
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
                        <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', backgroundColor: label === 'Team' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: label === 'Team' ? '#3b82f6' : 'var(--text-sub)', transition: 'all 0.2s' }} onMouseEnter={e => { if (label !== 'Team') e.currentTarget.style.backgroundColor = 'var(--input-bg)'; }} onMouseLeave={e => { if (label !== 'Team') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <span style={{ fontSize: '1.1rem' }}>{icon}</span>{label}
                        </div>
                    ))}
                </nav>

                <div style={{ position: 'relative', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                    <div onClick={() => setProfileMenuOpen(!profileMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: '14px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Avatar name={userProfile.name} size={40} />
                        <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.email}</div>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>⋮</span>
                    </div>

                    {profileMenuOpen && (
                        <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={(e) => { e.stopPropagation(); setProfileMenuOpen(false); }} />
                            <div className="dropdown-pop" style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: 0, width: '280px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', zIndex: 50, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <Avatar name={userProfile.name} size={72} />
                                    <div>
                                        <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '1.1rem' }}>{userProfile.name}</div>
                                        <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>{userProfile.email}</div>
                                    </div>
                                    <button onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }} style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '99px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.backgroundColor = '#3b82f6'} onMouseLeave={e => e.target.style.backgroundColor = 'var(--input-bg)'}>Manage Account</button>
                                </div>
                                <div style={{ padding: '8px' }}>
                                    <div onClick={() => { handleLogout(); }} style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#ef4444', cursor: 'pointer', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 700 }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <span>🚪</span> Sign Out
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
            <main style={{ flexGrow: 1, padding: '48px 56px', overflowY: 'auto', position: 'relative' }}>

                <header className="fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', animationDelay: '0ms' }}>
                    <div>
                        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1px' }}>Directory</h1>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 500 }}>Manage workspace members, roles, and access.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }}>🔍</span>
                            <input ref={searchRef} type="text" placeholder="Search members..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...S.input, paddingLeft: 44, width: '280px', fontWeight: 600 }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                        </div>
                        <button onClick={() => setShowInviteModal(true)} style={{ ...S.btn('#3b82f6'), boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                            + Invite Member
                        </button>
                    </div>
                </header>

                <div className="fade-in-up" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', overflow: 'hidden', animationDelay: '100ms' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--input-bg)', borderBottom: '1px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ padding: '20px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>User</th>
                                <th style={{ padding: '20px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Role</th>
                                <th style={{ padding: '20px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '20px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div className="skeleton-pulse" style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--input-bg)' }}></div>
                                                <div>
                                                    <div className="skeleton-pulse" style={{ width: 120, height: 16, backgroundColor: 'var(--input-bg)', borderRadius: 4, marginBottom: 6 }}></div>
                                                    <div className="skeleton-pulse" style={{ width: 160, height: 12, backgroundColor: 'var(--border-color)', borderRadius: 4 }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 32px' }}><div className="skeleton-pulse" style={{ width: 80, height: 24, backgroundColor: 'var(--input-bg)', borderRadius: 12 }}></div></td>
                                        <td style={{ padding: '20px 32px' }}><div className="skeleton-pulse" style={{ width: 100, height: 16, backgroundColor: 'var(--input-bg)', borderRadius: 4 }}></div></td>
                                        <td style={{ padding: '20px 32px' }}></td>
                                    </tr>
                                ))
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '80px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>👥</div>
                                        <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 900 }}>No members found</h3>
                                        <p style={{ margin: 0, color: 'var(--text-sub)', fontWeight: 500 }}>Try a different search term or invite a new member.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => {
                                    const roleInfo = getRoleBadge(member.role || 'Team Member');
                                    return (
                                        <tr key={member.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <Avatar name={member.name} size={48} />
                                                    <div>
                                                        <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.3px' }}>{member.name}</p>
                                                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 500 }}>{member.email || 'No email provided'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <span style={{ backgroundColor: roleInfo.bg, color: roleInfo.text, padding: '6px 14px', borderRadius: '20px', fontSize: '0.80rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                    {member.role || 'Team Member'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: member.isAssigned ? '#10b981' : 'var(--text-sub)', boxShadow: member.isAssigned ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none' }}></div>
                                                    <span style={{ color: member.isAssigned ? 'var(--text-main)' : 'var(--text-sub)', fontWeight: '700', fontSize: '0.9rem' }}>
                                                        {member.isAssigned ? 'Working on Tasks' : 'Available'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                                <button onClick={() => handleRemoveMember(member.id, member.name)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#fecaca'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* ── TOASTS ───────────────────────────────────────────────────────────── */}
            <div style={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ padding: '16px 24px', borderRadius: '12px', backgroundColor: t.type === 'error' ? '#fee2e2' : t.type === 'info' ? '#eff6ff' : '#10b981', color: t.type === 'error' ? '#b91c1c' : t.type === 'info' ? '#1d4ed8' : '#ffffff', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'} {t.msg}
                    </div>
                ))}
            </div>

            {/* ── INVITE MODAL ─────────────────────────────────────────────────────── */}
            {showInviteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }} onClick={e => { if (e.target === e.currentTarget && !isInviting) setShowInviteModal(false); }}>
                    <div className="dropdown-pop" style={{ backgroundColor: 'var(--bg-card)', padding: '48px', borderRadius: '24px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--input-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', border: '1px solid var(--border-color)', marginBottom: '20px' }}>👋</div>
                        <h2 style={{ marginTop: 0, color: 'var(--text-main)', marginBottom: '8px', fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Invite Colleague</h2>
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: '32px', lineHeight: '1.5', fontWeight: 500 }}>Send an invitation to join your workspace. They will receive an email with instructions.</p>

                        <form onSubmit={handleInviteMember} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.9rem' }}>Full Name</label>
                                <input autoFocus type="text" placeholder="e.g. Jane Doe" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} required disabled={isInviting} style={S.input} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.9rem' }}>Email Address</label>
                                <input type="email" placeholder="jane@company.com" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} required disabled={isInviting} style={S.input} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '700', fontSize: '0.9rem' }}>Workspace Role</label>
                                <select value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} disabled={isInviting} style={{ ...S.input, cursor: 'pointer', appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'}>
                                    <option value="Team Member">Team Member</option>
                                    <option value="Project Manager">Project Manager</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setShowInviteModal(false)} disabled={isInviting} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)') }}>Cancel</button>
                                <button type="submit" disabled={isInviting} style={{ ...S.btn('#3b82f6'), opacity: isInviting ? 0.7 : 1 }}>
                                    {isInviting ? 'Inviting...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}