import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
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

export default function Reports() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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

    // ── Real Data States ──
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
    const [toasts, setToasts] = useState([]);

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

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ── Toast Notification System ──
    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };

    // ── Fetch Real Data ──
    const fetchAnalyticsData = async () => {
        setIsLoading(true);
        try {
            const projectRes = await api.get('/api/projects/workspace/1');
            const fetchedProjects = projectRes.data;
            setProjects(fetchedProjects);

            let tasksCollection = [];
            for (const project of fetchedProjects) {
                try {
                    const taskRes = await api.get(`/api/tasks/project/${project.id}`);
                    const tasksWithProject = taskRes.data.map(t => ({ ...t, projectName: project.name, projectId: project.id }));
                    tasksCollection = [...tasksCollection, ...tasksWithProject];
                } catch (err) {
                    console.warn(`Could not fetch tasks for project ${project.id}`);
                }
            }
            setAllTasks(tasksCollection);
        } catch (err) {
            toast('Failed to load analytics data', 'error');
        } finally {
            setTimeout(() => setIsLoading(false), 600);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchAnalyticsData();
    }, [isAuthenticated]);

    // ── Derived Analytics ──
    const displayTasks = selectedProjectFilter === 'all'
        ? allTasks
        : allTasks.filter(t => t.projectId.toString() === selectedProjectFilter);

    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    displayTasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

    const totalTasks = displayTasks.length;
    const completedTasks = statusCounts.DONE || 0;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const pieData = [
        { name: 'To Do', value: statusCounts.TODO },
        { name: 'In Progress', value: statusCounts.IN_PROGRESS },
        { name: 'Done', value: statusCounts.DONE }
    ].filter(d => d.value > 0);

    const PIE_COLORS = ['#94a3b8', '#f59e0b', '#10b981'];

    const projectComparisonData = projects.map(p => {
        const pTasks = allTasks.filter(t => t.projectId === p.id);
        const pDone = pTasks.filter(t => t.status === 'DONE').length;
        return {
            name: p.name.length > 12 ? p.name.substring(0, 12) + '...' : p.name,
            Completion: pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0
        };
    });

    // ── Export Features ──
    const handleExportPDF = async () => {
        if (selectedProjectFilter === 'all') {
            toast('Please select a specific project to export its PDF report.', 'error');
            return;
        }
        try {
            toast('Generating PDF...', 'info');
            const response = await api.get(`/api/projects/${selectedProjectFilter}/report`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Project_${selectedProjectFilter}_Report.pdf`);
            document.body.appendChild(link);
            link.click();
            toast('PDF Downloaded successfully!');
        } catch (error) {
            toast('Failed to download PDF. Check backend console.', 'error');
        }
    };

    const handleExportCSV = () => {
        if (displayTasks.length === 0) {
            toast('No tasks to export.', 'error');
            return;
        }
        toast('Generating CSV...', 'info');
        const headers = ['Task ID', 'Project', 'Title', 'Status', 'Priority'];
        const csvRows = displayTasks.map(t =>
            `${t.id},"${t.projectName}","${t.title}",${t.status},${t.priority || 'Normal'}`
        );
        const csvString = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Shedula_Analytics_Export.csv');
        document.body.appendChild(link);
        link.click();
        toast('CSV Downloaded successfully!');
    };

    const S = {
        btn: (bg, color = '#fff') => ({ padding: '10px 20px', backgroundColor: bg, color, border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }),
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
                @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .skeleton-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: var(--text-sub); }

                /* Recharts Specific Dark Mode Overrides */
                .recharts-legend-item-text { color: var(--text-sub) !important; }
            `}</style>

            {/* ── FULLY CONNECTED SIDEBAR ────────────────────────────────────────────── */}
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
                        <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', backgroundColor: label === 'Reports' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: label === 'Reports' ? '#3b82f6' : 'var(--text-sub)', transition: 'all 0.2s' }} onMouseEnter={e => { if (label !== 'Reports') e.currentTarget.style.backgroundColor = 'var(--input-bg)'; }} onMouseLeave={e => { if (label !== 'Reports') e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <span style={{ fontSize: '1.1rem' }}>{icon}</span>{label}
                        </div>
                    ))}
                </nav>

                {/* 🚀 UPGRADED: Google-Style Profile Menu inside Sidebar */}
                <div style={{ position: 'relative', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                    <div
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: '14px', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Avatar name={userProfile.name} size={40} />
                        <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userProfile.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userProfile.email}
                            </div>
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
                                    <button
                                        onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}
                                        style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '99px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={e => { e.target.style.backgroundColor = '#3b82f6'; e.target.style.color = 'white'; e.target.style.borderColor = '#3b82f6'; }}
                                        onMouseLeave={e => { e.target.style.backgroundColor = 'var(--input-bg)'; e.target.style.color = 'var(--text-main)'; e.target.style.borderColor = 'var(--border-color)'; }}
                                    >
                                        Manage Account
                                    </button>
                                </div>

                                <div style={{ padding: '8px' }}>
                                    <div
                                        onClick={() => { handleLogout(); }}
                                        style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#ef4444', cursor: 'pointer', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', fontWeight: 700 }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <span>🚪</span> Sign Out
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
            <main style={{ flexGrow: 1, padding: '48px 56px', overflowY: 'auto' }}>
                <header className="fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1px' }}>Reports & Analytics</h1>
                        <p style={{ margin: '8px 0 0 0', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 500 }}>Generate insights and export data for stakeholders.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <select
                            value={selectedProjectFilter}
                            onChange={(e) => setSelectedProjectFilter(e.target.value)}
                            style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontWeight: '700', color: 'var(--text-main)', backgroundColor: 'var(--input-bg)', cursor: 'pointer', appearance: 'none', minWidth: '180px' }}
                        >
                            <option value="all">🌐 Entire Workspace</option>
                            {projects.map(p => <option key={p.id} value={p.id}>📁 {p.name}</option>)}
                        </select>
                        <button onClick={handleExportCSV} style={{ ...S.btn('var(--input-bg)', 'var(--text-main)') }} onMouseOver={e => { e.target.style.backgroundColor = 'var(--border-color)'; e.target.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.target.style.backgroundColor = 'var(--input-bg)'; e.target.style.transform = 'translateY(0)' }}>
                            📊 Export CSV
                        </button>
                        <button onClick={handleExportPDF} style={{ ...S.btn('#3b82f6', 'white'), borderColor: '#3b82f6', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                            📥 Export PDF
                        </button>
                    </div>
                </header>

                {/* KPI METRIC CARDS */}
                <div className="fade-in-up" style={{ display: 'flex', gap: '24px', marginBottom: '40px', animationDelay: '100ms' }}>
                    {[
                        { title: 'Total Tasks Generated', value: totalTasks, color: '#3b82f6' },
                        { title: 'Workspace Completion', value: `${completionRate}%`, color: '#10b981' },
                        { title: 'Pending Action Items', value: statusCounts.TODO + statusCounts.IN_PROGRESS, color: '#f59e0b' }
                    ].map((item, i) => (
                        <div key={i} style={{ flex: 1, backgroundColor: 'var(--bg-card)', padding: '28px 30px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', borderTop: `4px solid ${item.color}`, transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            {isLoading ? (
                                <>
                                    <div className="skeleton-pulse" style={{ width: '50%', height: '14px', borderRadius: '4px', backgroundColor: 'var(--input-bg)', marginBottom: '12px' }}></div>
                                    <div className="skeleton-pulse" style={{ width: '30%', height: '36px', borderRadius: '4px', backgroundColor: 'var(--border-color)' }}></div>
                                </>
                            ) : (
                                <>
                                    <div style={{ color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.title}</div>
                                    <div style={{ fontSize: '2.8rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '8px', lineHeight: 1, letterSpacing: '-1px' }}>{item.value}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* CHARTS ROW */}
                <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginBottom: '40px', animationDelay: '200ms' }}>

                    {/* DONUT CHART */}
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Task Distribution</h3>
                        {isLoading ? (
                            <div className="skeleton-pulse" style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'var(--input-bg)', margin: '20px auto' }}></div>
                        ) : pieData.length === 0 ? (
                            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontWeight: 'bold' }}>No tasks found.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 'bold', color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* BAR CHART */}
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Project Completion Comparison</h3>
                        {isLoading ? (
                            <div className="skeleton-pulse" style={{ width: '100%', height: '250px', borderRadius: '16px', backgroundColor: 'var(--input-bg)' }}></div>
                        ) : projects.length === 0 ? (
                            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontWeight: 'bold' }}>No projects found.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={projectComparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-sub)', fontSize: 12, fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-sub)', fontSize: 12, fontWeight: 700 }} dx={-10} domain={[0, 100]} />
                                    <RechartsTooltip cursor={{ fill: 'var(--input-bg)' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontWeight: 'bold', color: 'var(--text-main)' }} itemStyle={{ color: 'var(--text-main)' }} formatter={(value) => [`${value}%`, 'Completion']} />
                                    <Bar dataKey="Completion" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* DATA TABLE */}
                <div className="fade-in-up" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden', animationDelay: '300ms' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Task Data Log</h3>
                        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800' }}>Showing {displayTasks.length} items</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: 'var(--input-bg)' }}>
                            <tr>
                                <th style={{ padding: '16px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Project</th>
                                <th style={{ padding: '16px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Task</th>
                                <th style={{ padding: '16px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Priority</th>
                                <th style={{ padding: '16px 32px', color: 'var(--text-sub)', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '32px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="skeleton-pulse" style={{ height: '20px', backgroundColor: 'var(--input-bg)', borderRadius: '4px', width: '100%' }}></div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ) : displayTasks.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)', fontWeight: '600' }}>No tasks available for the selected view.</td></tr>
                            ) : (
                                displayTasks.slice(0, 8).map((task) => (
                                    <tr key={task.id} style={{ borderTop: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '18px 32px', color: 'var(--text-sub)', fontWeight: '700', fontSize: '0.9rem' }}>📁 {task.projectName}</td>
                                        <td style={{ padding: '18px 32px', color: 'var(--text-main)', fontWeight: '800' }}>{task.title}</td>
                                        <td style={{ padding: '18px 32px' }}>
                                            <span style={{ color: (task.priority === 'High' || task.priority === 'Urgent') ? '#ef4444' : '#f59e0b', fontWeight: '800', fontSize: '0.85rem' }}>
                                                {task.priority || 'Medium'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 32px' }}>
                                            <span style={{ backgroundColor: task.status === 'DONE' ? 'rgba(16, 185, 129, 0.15)' : 'var(--input-bg)', color: task.status === 'DONE' ? '#10b981' : 'var(--text-sub)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800' }}>
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* ── TOASTS ── */}
            <div style={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ padding: '16px 24px', borderRadius: '14px', backgroundColor: t.type === 'error' ? '#fee2e2' : t.type === 'info' ? '#eff6ff' : '#10b981', color: t.type === 'error' ? '#b91c1c' : t.type === 'info' ? '#1d4ed8' : '#ffffff', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'} {t.msg}
                    </div>
                ))}
            </div>

        </div>
    );
}