import { useEffect, useState, useRef } from 'react';
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

// ─── ELITE STAT CARD ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
    return (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '28px 30px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = accent || '#3b82f6'; e.currentTarget.style.boxShadow = `0 12px 24px -10px ${accent ? accent + '60' : 'rgba(59,130,246,0.3)'}`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: `radial-gradient(circle, ${accent ? accent + '20' : 'rgba(59,130,246,0.1)'} 0%, transparent 70%)`, borderBottomLeftRadius: '100%' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1, letterSpacing: '-1px' }}>{value}</span>
            {sub && <span style={{ fontSize: '0.85rem', color: accent || 'var(--text-sub)', fontWeight: 600 }}>{sub}</span>}
        </div>
    );
}

// ─── ELITE BAR CHART ───────────────────────────────────────────────────────
function SimpleTaskChart({ tasks }) {
    const byStatus = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
    const total = tasks.length || 1;
    const maxHeight = 160;

    return (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 24px', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Task Distribution</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, justifyContent: 'center', flexGrow: 1 }}>
                {Object.entries(byStatus).map(([status, count]) => {
                    const m = STATUS_META[status];
                    const height = (count / total) * maxHeight;
                    return (
                        <div key={status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <div style={{ height: maxHeight, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: 64, backgroundColor: 'var(--input-bg)', borderRadius: '12px' }}>
                                <div style={{ width: '100%', height: Math.max(height, 10), backgroundColor: m.color, backgroundImage: `linear-gradient(180deg, ${m.color} 0%, transparent 100%)`, borderRadius: '12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, transition: 'height 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                    <span style={{ fontWeight: 900, color: '#fff', fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{count > 0 ? count : ''}</span>
                                </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-sub)' }}>{m.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── ELITE PROJECT CARD ───────────────────────────────────────────────────
function ProjectCard({ project, pTasks, pDone, pRate, navigate, onEdit, onDelete, onDuplicate }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '28px', display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#6366f1'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.3, letterSpacing: '-0.5px', maxWidth: '80%' }}>{project.name}</h3>

                <div style={{ position: 'relative', display: 'flex' }} onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
                    <button style={{ border: 'none', background: 'var(--input-bg)', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-sub)', padding: '4px 8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'}>⋯</button>
                    {menuOpen && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', paddingTop: '8px', zIndex: 20 }}>
                            <div className="dropdown-pop" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', overflow: 'hidden', width: 160 }}>
                                {[['✏️ Rename', onEdit], ['📋 Duplicate', onDuplicate], ['🗑️ Delete', onDelete]].map(([label, fn]) => (
                                    <div key={label} onClick={(e) => { e.stopPropagation(); setMenuOpen(false); fn(); }} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem', color: label.includes('Delete') ? '#ef4444' : 'var(--text-main)', fontWeight: 600, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{label}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', backgroundColor: 'var(--input-bg)', padding: '4px 12px', borderRadius: '99px', fontWeight: 700 }}>📋 {pTasks.length} Tasks</span>
                <span style={{ fontSize: '0.8rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '99px', fontWeight: 700 }}>✅ {pDone} Done</span>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Progress</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6366f1' }}>{pRate}%</span>
                </div>
                <div style={{ height: 8, backgroundColor: 'var(--input-bg)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pRate}%`, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                </div>
            </div>
            <button onClick={() => navigate(`/project/${project.id}`)} style={{ padding: '12px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.9rem', transition: 'all 0.2s', width: '100%' }} onMouseEnter={e => { e.target.style.backgroundColor = '#3b82f6'; e.target.style.color = '#fff'; e.target.style.borderColor = '#3b82f6'; }} onMouseLeave={e => { e.target.style.backgroundColor = 'var(--input-bg)'; e.target.style.color = 'var(--text-main)'; e.target.style.borderColor = 'var(--border-color)'; }}>
                Open Workspace →
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
    // 🚀 SMART PROFILE LOGIC
    const rawName = localStorage.getItem('name');
    const rawEmail = localStorage.getItem('email') || localStorage.getItem('username') || '';

    let displayName = 'User';
    if (rawName && rawName !== 'undefined' && rawName.trim() !== '') displayName = rawName;
    else if (rawEmail && rawEmail !== 'undefined' && rawEmail.trim() !== '') displayName = rawEmail.split('@')[0];

    const [userProfile, setUserProfile] = useState({ name: displayName, email: rawEmail });

    // Auto-Capitalize First Name
    const rawFirstName = userProfile.name.split(' ')[0];
    const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);

    // 🚀 GLOBAL THEME ENGINE INITIALIZATION
    useEffect(() => {
        const root = document.documentElement;

        const applyTheme = (themeName) => {
            if (themeName === 'Dark' || (themeName === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.style.setProperty('--bg-main', '#020617'); // Ultra dark slate
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

        // Listen for storage changes across all tabs
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

    function getGreeting() {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    }

    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);

    const isProjectsPage = location.pathname === '/projects';

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [projects, setProjects] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [pendingTaskCount, setPendingTaskCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [activeView, setActiveView] = useState('grid');
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editProject, setEditProject] = useState(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [quickTaskProject, setQuickTaskProject] = useState('');

    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiTargetProject, setAiTargetProject] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');
        else setIsAuthenticated(true);
    }, [navigate]);

    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // FIX: Get ALL projects, no workspace blindfold
            const projRes = await api.get('/api/projects');
            const projectsData = projRes.data;
            setProjects(projectsData);

            // Fetch tasks for every project and attach the IDs
            const taskPromises = projectsData.map(project =>
                api.get(`/api/tasks/project/${project.id}`)
                    .then(res => res.data.map(task => ({
                        ...task,
                        projectId: project.id,
                        projectName: project.name
                    })))
                    .catch(() => [])
            );

            const allTasksArrays = await Promise.all(taskPromises);
            const tasksCollection = allTasksArrays.flat();

            const totalPending = tasksCollection.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;

            setPendingTaskCount(totalPending);
            setAllTasks(tasksCollection);
            setRecentActivity([...tasksCollection].sort((a, b) => b.id - a.id).slice(0, 30));

        } catch (err) {
            toast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProject = async (e) => {
        e.preventDefault();
        if (!editProject.name.trim()) { toast('Enter a project name', 'error'); return; }
        try {
            await api.put(`/api/projects/${editProject.id}`, { name: editProject.name });
            fetchProjects();
            setShowEditModal(false);
            setEditProject(null);
            toast('Project renamed!');
        } catch (err) { toast('Failed to rename project', 'error'); }
    };

    const handleDeleteProject = async (projectId, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/projects/${projectId}`);
            fetchProjects();
            toast(`Project "${name}" deleted.`, 'info');
        } catch (err) { toast('Failed to delete project', 'error'); }
    };

    const handleDuplicateProject = async (project) => {
        try {
            await api.post('/api/projects', { name: `${project.name} (copy)` }); // <-- FIXED!
            fetchProjects();
            toast(`Duplicated "${project.name}"`);
        } catch (err) { toast('Failed to duplicate', 'error'); }
    };

    const handleQuickTask = async (e) => {
        e.preventDefault();
        if (!quickTaskProject || !quickTaskTitle.trim()) return;
        try {
            await api.post('/api/tasks', { title: quickTaskTitle, status: 'TODO', project: { id: Number(quickTaskProject) } });
            fetchProjects();
            setShowTaskModal(false);
            setQuickTaskTitle('');
            setQuickTaskProject('');
            toast('Task added!');
        } catch (err) { toast('Failed to add task', 'error'); }
    };

    const handleGenerateAITasks = async (e) => {
        e.preventDefault();
        if (!aiTargetProject || !aiPrompt.trim()) return;
        setIsGenerating(true);

        try {
            await api.post(`/api/ai/generate/${aiTargetProject}`, { prompt: aiPrompt });
            fetchProjects();
            setShowAiModal(false);
            setAiPrompt('');
            toast('✨ AI successfully generated tasks!');
        } catch (err) {
            toast('Failed to generate AI tasks. Check backend console.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const doneCount = allTasks.filter(t => t.status === 'DONE').length;
    const completionRate = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0;
    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => sortBy === 'name' ? a.name.localeCompare(b.name) : 0);

    if (!isAuthenticated) return null;

    const S = {
        overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200, backdropFilter: 'blur(8px)' },
        modal: { backgroundColor: 'var(--bg-card)', padding: '36px', borderRadius: '24px', width: 460, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' },
        input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', boxSizing: 'border-box', transition: 'border-color 0.2s' },
        btn: (bg, color = '#fff') => ({ padding: '12px 24px', backgroundColor: bg, color, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem', transition: 'all 0.2s' }),
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", "SF Pro Display", sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden', transition: 'background-color 0.3s ease' }}>

            {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
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
                    ].map(([icon, label, path]) => {
                        const isActive = location.pathname === path;
                        return (
                            <div
                                key={label}
                                onClick={() => navigate(path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                                    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    color: isActive ? '#3b82f6' : 'var(--text-sub)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--input-bg)'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{icon}</span>{label}
                            </div>
                        );
                    })}

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '16px 0' }}></div>

                    <div onClick={() => setShowTaskModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-sub)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ fontSize: '1.1rem' }}>⚡</span> Quick Task
                    </div>
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

            {/* ── MAIN AREA ──────────────────────────────────────────────────────── */}
            <main style={{ flexGrow: 1, overflowY: 'auto', padding: '48px 56px', position: 'relative' }}>

                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
                    <div>
                        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-1px' }}>
                            Good {getGreeting()}, {firstName} 👋
                        </h1>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={() => setShowAiModal(true)} style={{ ...S.btn('#8b5cf6'), background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 10px 20px -10px rgba(99, 102, 241, 0.5)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            ✨ Generate AI Tasks
                        </button>

                        <div style={{ position: 'relative', display: 'flex' }} onMouseEnter={() => setNotifOpen(true)} onMouseLeave={() => setNotifOpen(false)}>
                            <button style={{ ...S.btn('var(--bg-card)', 'var(--text-main)'), border: '1px solid var(--border-color)', padding: '12px 16px', position: 'relative', cursor: 'pointer' }}>
                                🔔
                                {pendingTaskCount > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444', border: '3px solid var(--bg-main)' }} />}
                            </button>

                            {notifOpen && (
                                <div style={{ position: 'absolute', right: 0, top: '100%', paddingTop: '12px', zIndex: 50 }}>
                                    <div className="dropdown-pop" style={{ width: 320, backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 900, color: 'var(--text-main)', fontSize: '1rem' }}>Notifications</div>
                                        <div style={{ padding: '16px 20px', color: 'var(--text-sub)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                            {pendingTaskCount > 0 ? <span>You have <strong style={{ color: '#f59e0b', fontSize: '1rem' }}>{pendingTaskCount}</strong> pending tasks across {projects.length} projects.</span> : 'All caught up! You are doing great. 🎉'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowCreateModal(true)} style={{ ...S.btn('#3b82f6') }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>+ New Project</button>
                    </div>
                </header>

                {!isProjectsPage && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
                            <StatCard label="Active Projects" value={projects.length} sub={`${filteredProjects.length} visible in workspace`} accent="#3b82f6" />
                            <StatCard label="Pending Tasks" value={pendingTaskCount} sub="Tasks marked TODO or In Progress" accent="#f59e0b" />
                            <StatCard label="Completed Tasks" value={doneCount} sub="Total finished items all-time" accent="#10b981" />
                            <StatCard label="Completion Rate" value={`${completionRate}%`} sub={`Out of ${allTasks.length} total generated tasks`} accent="#8b5cf6" />
                        </div>

                        <div style={{ display: 'flex', gap: 32, marginBottom: 40, height: '380px' }}>
                            <div style={{ flex: 2, height: '100%' }}>
                                <SimpleTaskChart tasks={allTasks} />
                            </div>

                            <div style={{ flex: 1.2, backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Activity Log</h3>
                                </div>
                                <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: '10px', flexGrow: 1 }}>
                                    {recentActivity.map((a, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px', backgroundColor: 'var(--input-bg)', borderRadius: '14px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--border-color)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'}>
                                            <div style={{ fontSize: '1.4rem', backgroundColor: 'var(--bg-card)', padding: '8px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>🗂️</div>
                                            <div style={{ flexGrow: 1, paddingTop: 2 }}>
                                                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: 4 }}>{a.title}</div>
                                                <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600 }}>Project: {a.projectName}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {recentActivity.length === 0 && <span style={{ color: 'var(--text-sub)', fontSize: '0.9rem', textAlign: 'center', marginTop: 40, fontWeight: 600 }}>No recent activity found.</span>}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                    <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
                        {isProjectsPage ? 'Workspace Projects' : 'Your Projects'}
                    </h2>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)', fontSize: '1rem' }}>🔍</span>
                        <input ref={searchRef} type="text" placeholder="Search projects… (⌘K)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...S.input, paddingLeft: 42, width: 280, fontSize: '0.95rem', fontWeight: 600 }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 80, textAlign: 'center', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 700 }}>Scanning workspace…</div>
                ) : filteredProjects.length === 0 ? (
                    <div style={{ padding: 80, textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '2px dashed var(--border-color)', color: 'var(--text-sub)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: 20 }}>📂</div>
                        <p style={{ fontWeight: 900, color: 'var(--text-main)', margin: '0 0 12px', fontSize: '1.2rem' }}>No projects found</p>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>Create your first project to start organizing tasks.</p>
                        <button onClick={() => setShowCreateModal(true)} style={{ ...S.btn('#3b82f6'), marginTop: 24 }}>Create Project</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, paddingBottom: 60 }}>
                        {filteredProjects.map(project => {
                            const pTasks = allTasks.filter(t => t.projectId === project.id);
                            const pDone = pTasks.filter(t => t.status === 'DONE').length;
                            const pRate = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
                            return <ProjectCard key={project.id} project={project} pTasks={pTasks} pDone={pDone} pRate={pRate} navigate={navigate} onEdit={() => { setEditProject({ ...project }); setShowEditModal(true); }} onDelete={() => handleDeleteProject(project.id, project.name)} onDuplicate={() => handleDuplicateProject(project)} />;
                        })}
                    </div>
                )}
            </main>

            {/* ── TOASTS ── */}
            <div style={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ padding: '16px 24px', borderRadius: '14px', backgroundColor: t.type === 'error' ? '#fee2e2' : t.type === 'info' ? '#eff6ff' : '#f0fdf4', color: t.type === 'error' ? '#b91c1c' : t.type === 'info' ? '#1d4ed8' : '#15803d', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'} {t.msg}
                    </div>
                ))}
            </div>

            {/* ── MODALS ── */}
            {showCreateModal && (
                <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
                    <div className="dropdown-pop" style={S.modal}>
                        <h2 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 900, marginBottom: 24, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>New Project</h2>
                        <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <input autoFocus type="text" placeholder="e.g. Q3 Marketing Launch" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} required style={S.input} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)') }}>Cancel</button>
                                <button type="submit" style={{ ...S.btn('#3b82f6') }}>Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTaskModal && (
                <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowTaskModal(false); }}>
                    <div className="dropdown-pop" style={S.modal}>
                        <h2 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 900, marginBottom: 24, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>⚡ Quick Add Task</h2>
                        <form onSubmit={handleQuickTask} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <input autoFocus type="text" placeholder="What needs to be done?" value={quickTaskTitle} onChange={e => setQuickTaskTitle(e.target.value)} required style={S.input} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                            <select value={quickTaskProject} onChange={e => setQuickTaskProject(e.target.value)} required style={{ ...S.input, cursor: 'pointer', appearance: 'none' }}>
                                <option value="" disabled hidden>Assign to project…</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowTaskModal(false)} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)') }}>Cancel</button>
                                <button type="submit" style={{ ...S.btn('#10b981') }}>Add Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAiModal && (
                <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget && !isGenerating) setShowAiModal(false); }}>
                    <div className="dropdown-pop" style={{ ...S.modal, borderTop: '6px solid #8b5cf6', width: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>✨</div>
                            <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Shedula AI</h2>
                        </div>
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: 24, lineHeight: 1.5, fontWeight: 500 }}>Describe your feature, and our AI model will automatically break it down into actionable Kanban tasks.</p>
                        <form onSubmit={handleGenerateAITasks} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <select value={aiTargetProject} onChange={e => setAiTargetProject(e.target.value)} required disabled={isGenerating} style={{ ...S.input, cursor: 'pointer' }}>
                                <option value="" disabled hidden>Select target project…</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <textarea autoFocus placeholder="e.g. Build a secure checkout system with Stripe..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} required disabled={isGenerating} style={{ ...S.input, height: 120, resize: 'none', lineHeight: 1.5 }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowAiModal(false)} disabled={isGenerating} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)') }}>Cancel</button>
                                <button type="submit" disabled={isGenerating} style={{ ...S.btn('linear-gradient(135deg, #8b5cf6, #3b82f6)'), opacity: isGenerating ? 0.7 : 1 }}>
                                    {isGenerating ? '⏳ Generating...' : 'Generate Tasks'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && editProject && (
                <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
                    <div className="dropdown-pop" style={S.modal}>
                        <h2 style={{ marginTop: 0, color: 'var(--text-main)', fontWeight: 900, marginBottom: 24, fontSize: '1.6rem', letterSpacing: '-0.5px' }}>Rename Project</h2>
                        <form onSubmit={handleEditProject} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <input autoFocus type="text" value={editProject.name} onChange={e => setEditProject({ ...editProject, name: e.target.value })} required style={S.input} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)') }}>Cancel</button>
                                <button type="submit" style={{ ...S.btn('#3b82f6') }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes iosPop { 
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
                    100% { opacity: 1; transform: scale(1) translateY(0); } 
                }
                .dropdown-pop { 
                    animation: iosPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                    transform-origin: center;
                }
                @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

                .custom-scroll::-webkit-scrollbar { width: 8px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-sub); }
            `}</style>
        </div>
    );
}