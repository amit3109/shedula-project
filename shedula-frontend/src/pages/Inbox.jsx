import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

// ─── STATUS METADATA ────────────────────────────────────────────────────────
const STATUS_META = {
    TODO: { label: 'To Do', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
    IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    DONE: { label: 'Done', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
};

// ─── AVATAR COMPONENT ──────────────────────────────────────────────────────
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

export default function Inbox() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 🚀 SMART PROFILE LOGIC
    const rawName = localStorage.getItem('name') || '';
    const rawEmail = localStorage.getItem('email') || localStorage.getItem('username') || '';

    let displayName = 'User';
    if (rawName && rawName !== 'undefined' && rawName.trim() !== '') displayName = rawName;
    else if (rawEmail && rawEmail !== 'undefined' && rawEmail.trim() !== '') displayName = rawEmail.split('@')[0];

    const [userProfile, setUserProfile] = useState({ name: displayName, email: rawEmail });
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    // Auto-Capitalize First Name
    const rawFirstName = userProfile.name.split(' ')[0];
    const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);

    // ── Core States ──
    const [isLoading, setIsLoading] = useState(true);
    const [myTasks, setMyTasks] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [completingTaskId, setCompletingTaskId] = useState(null);

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
            if (e.key === 'shedula_theme') applyTheme(e.newValue);
            if (e.key === 'name' || !e.key) {
                const nName = localStorage.getItem('name') || 'User';
                const nEmail = localStorage.getItem('email') || '';
                setUserProfile({ name: nName, email: nEmail });
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

    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ── FETCH INBOX TASKS ──
    // ── FETCH INBOX TASKS (FAST & ACCURATE METHOD) ──
    const fetchMyTasks = async () => {
        setIsLoading(true);
        try {
            // 1. Get all projects
            const projRes = await api.get('/api/projects');
            const projectsData = projRes.data;
            const safeUserName = (userProfile.name || '').trim().toLowerCase();

            // 2. Fetch tasks per project to force the ID and Name connection
            const taskPromises = projectsData.map(project =>
                api.get(`/api/tasks/project/${project.id}`)
                    .then(res => res.data.map(task => ({
                        ...task,
                        projectId: project.id,
                        projectName: project.name
                    })))
                    .catch(() => [])
            );

            // Wait for all to finish, then combine into one list
            const allTasksArrays = await Promise.all(taskPromises);
            const allTasks = allTasksArrays.flat();

            const myActiveTasks = allTasks
                .filter(t => t.status !== 'DONE')
                // 🚀 RESTORED FILTER: Only show tasks explicitly assigned to YOU!
                .filter(t => {
                    const assigned = (t.assignedTo || '').trim().toLowerCase();
                    return assigned === safeUserName;
                });

            myActiveTasks.sort((a, b) => {
                const priorityWeight = { 'Urgent': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
                const wA = priorityWeight[a.priority] || 1;
                const wB = priorityWeight[b.priority] || 1;
                if (wA !== wB) return wB - wA;
                if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
                return 0;
            });

            setMyTasks(myActiveTasks);
        } catch (err) {
            console.error("Inbox fetch error:", err);
            toast('Failed to load inbox data.', 'error');
        } finally {
            setTimeout(() => setIsLoading(false), 400);
        }
    };

    useEffect(() => {
        if (isAuthenticated && userProfile.name !== 'User') fetchMyTasks();
    }, [isAuthenticated, userProfile.name]);

    // ── INSTANT TASK COMPLETION ──
    const handleMarkComplete = async (taskId) => {
        setCompletingTaskId(taskId);
        try {
            await api.patch(`/api/tasks/${taskId}/status`, { status: 'DONE' });
            toast("Task completed! Great job.");
            setTimeout(() => {
                setMyTasks(prev => prev.filter(t => t.id !== taskId));
                setCompletingTaskId(null);
            }, 300);
        } catch (err) {
            toast("Failed to update task.", "error");
            setCompletingTaskId(null);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", "SF Pro Display", sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>

            <style>{`
                @keyframes iosPop { 0% { opacity: 0; transform: scale(0.95) translateY(5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                .dropdown-pop { animation: iosPop 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards; transform-origin: bottom left; }
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in-up { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .skeleton-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                
                /* Custom Checkbox Animation */
                .task-row { transition: all 0.2s ease; border-bottom: 1px solid var(--border-color); }
                .task-row:hover { background-color: var(--input-bg); }
                .task-checkbox { width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--text-sub); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
                .task-row:hover .task-checkbox { border-color: #3b82f6; }
                .task-checkbox.completing { background-color: #10b981; border-color: #10b981; transform: scale(1.1); }
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
                        <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderRadius: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', backgroundColor: path === '/inbox' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: path === '/inbox' ? '#3b82f6' : 'var(--text-sub)', transition: 'all 0.2s' }} onMouseEnter={e => { if (path !== '/inbox') e.currentTarget.style.backgroundColor = 'var(--input-bg)' }} onMouseLeave={e => { if (path !== '/inbox') e.currentTarget.style.backgroundColor = 'transparent' }}>
                            <span style={{ fontSize: '1.2rem' }}>{icon}</span>{label}
                        </div>
                    ))}
                </nav>

                <div style={{ position: 'relative', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                    <div onClick={() => setProfileMenuOpen(!profileMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Avatar name={userProfile.name} size={42} />
                        <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Workspace Member</div>
                        </div>
                        <span style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>⋮</span>
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

            {/* ── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
            <main style={{ flexGrow: 1, padding: '56px 72px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '900px' }}>

                    <header className="fade-in-up" style={{ marginBottom: '40px', animationDelay: '0ms', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px' }}>My Inbox</h1>
                            <p style={{ margin: '12px 0 0 0', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 500 }}>Your personal focus view. Tasks assigned to you across all projects.</p>
                        </div>
                        <div style={{ backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '12px', fontWeight: '800', color: 'var(--text-main)' }}>
                            {myTasks.length} Active Tasks
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px', animationDelay: '100ms' }}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="skeleton-pulse" style={{ height: '64px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', opacity: 1 - (i * 0.15) }} />
                            ))}
                        </div>
                    ) : myTasks.length === 0 ? (
                        <div className="fade-in-up" style={{ textAlign: 'center', padding: '100px 40px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px dashed var(--border-color)', animationDelay: '100ms' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎉</div>
                            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '900', letterSpacing: '-0.5px' }}>Inbox Zero!</h2>
                            <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-sub)' }}>You have no pending tasks. Enjoy your day!</p>
                        </div>
                    ) : (
                        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', animationDelay: '100ms', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.03)' }}>
                            {myTasks.map(task => {
                                const isCompleting = completingTaskId === task.id;
                                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

                                return (
                                    <div key={task.id} className="task-row" style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', gap: '20px', opacity: isCompleting ? 0.5 : 1 }}>
                                        {/* Custom Checkbox */}
                                        <div
                                            className={`task-checkbox ${isCompleting ? 'completing' : ''}`}
                                            onClick={() => handleMarkComplete(task.id)}
                                        >
                                            {isCompleting && <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>}
                                        </div>

                                        {/* Task Info */}
                                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: isCompleting ? 'var(--text-sub)' : 'var(--text-main)', textDecoration: isCompleting ? 'line-through' : 'none' }}>
                                                {task.title}
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: '600' }}>{task.projectName}</span>
                                                <span style={{ color: 'var(--border-color)' }}>•</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: (task.priority === 'High' || task.priority === 'Urgent') ? '#ef4444' : '#f59e0b' }}>
                                                    {task.priority || 'Medium'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Due Date */}
                                        {task.dueDate && (
                                            <div style={{ fontSize: '0.85rem', fontWeight: '700', padding: '6px 12px', borderRadius: '8px', backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)', color: isOverdue ? '#ef4444' : 'var(--text-sub)' }}>
                                                {isOverdue ? '⚠️ Overdue' : new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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