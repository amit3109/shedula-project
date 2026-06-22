import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// ─── Avatar Component for Sidebar ──────────────────────────────────────────
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

export default function CalendarView() {
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

    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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

    const fetchAllTasks = async () => {
        setIsLoading(true);
        try {
            const projectRes = await api.get('/api/projects');
            const projects = projectRes.data;

            let allTasks = [];
            for (const project of projects) {
                try {
                    const taskRes = await api.get(`/api/tasks/project/${project.id}`);
                    const tasksWithProjectName = taskRes.data.map(task => ({
                        ...task,
                        projectName: project.name
                    }));
                    allTasks = [...allTasks, ...tasksWithProjectName];
                } catch (err) {
                    console.warn(`Failed fetching tasks for project ${project.id}`);
                }
            }

            const formattedEvents = allTasks
                .filter(task => task.dueDate)
                .map(task => {
                    const shortProjectName = task.projectName.length > 15 ? task.projectName.substring(0, 15) + '...' : task.projectName;
                    const cleanTaskName = task.title.replace('✨ AI: ', '').replace('✨ ', '').trim();

                    return {
                        id: task.id,
                        title: `${shortProjectName}: ${cleanTaskName}`,
                        fullProjectName: task.projectName,
                        taskName: cleanTaskName,
                        start: new Date(task.dueDate),
                        end: new Date(task.dueDate),
                        allDay: true,
                        status: task.status,
                        priority: task.priority
                    };
                });

            setEvents(formattedEvents);
        } catch (err) {
            console.error("Error fetching tasks for calendar:", err);
        } finally {
            setTimeout(() => setIsLoading(false), 400);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchAllTasks();
    }, [isAuthenticated]);

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3b82f6';
        let color = '#ffffff';
        let borderLeft = '4px solid #2563eb';

        if (event.priority === 'High' || event.priority === 'Urgent' || event.priority === 'Critical') {
            backgroundColor = 'rgba(239, 68, 68, 0.15)';
            color = '#ef4444';
            borderLeft = '4px solid #ef4444';
        } else if (event.status === 'DONE' || event.status === 'Completed') {
            backgroundColor = 'rgba(16, 185, 129, 0.15)';
            color = '#10b981';
            borderLeft = '4px solid #10b981';
        } else if (event.status === 'TODO') {
            backgroundColor = 'var(--input-bg)';
            color = 'var(--text-sub)';
            borderLeft = '4px solid #94a3b8';
        }

        return {
            style: {
                backgroundColor,
                color,
                border: 'none',
                borderLeft,
                borderRadius: '6px',
                opacity: 0.95,
                display: 'block',
                fontWeight: '700',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }
        };
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
                .fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                
                /* ELITE REACT BIG CALENDAR THEMING MATRIX */
                .rbc-calendar { font-family: "Inter", "SF Pro Display", sans-serif; border: none; background: transparent; color: var(--text-main); }
                .rbc-month-view { border: 1px solid var(--border-color); border-radius: 20px; overflow: hidden; background: var(--bg-card); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .rbc-header { padding: 16px 0; font-weight: 800; color: var(--text-sub); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; border-bottom: 1px solid var(--border-color) !important; border-left: none !important; }
                .rbc-day-bg { border-left: 1px solid var(--border-color) !important; border-bottom: 1px solid var(--border-color) !important; transition: background-color 0.2s; }
                .rbc-day-bg:hover { background-color: var(--input-bg); }
                .rbc-today { background-color: rgba(59, 130, 246, 0.08) !important; }
                .rbc-date-cell { padding: 10px; font-weight: 800; color: var(--text-main); font-size: 0.9rem; }
                .rbc-off-range-bg { background-color: var(--input-bg); opacity: 0.4; }
                .rbc-off-range .rbc-date-cell { color: var(--text-sub); opacity: 0.5; }
                .rbc-month-row { border-bottom: 1px solid var(--border-color) !important; }
                
                /* TOOLBAR EXTRACTION */
                .rbc-toolbar { margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; }
                .rbc-toolbar-label { font-weight: 900; font-size: 1.6rem; color: var(--text-main); letter-spacing: -0.5px; }
                .rbc-toolbar button { border-radius: 12px; font-weight: 700; color: var(--text-main); border: 1px solid var(--border-color); padding: 10px 18px; transition: all 0.2s; background: var(--bg-card); cursor: pointer; }
                .rbc-toolbar button:hover { background-color: var(--input-bg); border-color: var(--text-sub); }
                .rbc-toolbar button.rbc-active { background-color: #3b82f6; color: white; border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
                .rbc-btn-group { background: var(--input-bg); padding: 4px; border-radius: 14px; display: inline-flex; gap: 2px; }
                .rbc-btn-group button { border: none !important; margin: 0 !important; }
                .rbc-btn-group button.rbc-active:hover { background-color: #3b82f6; }
            `}</style>

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
                    ].map(([icon, label, path]) => (
                        <div
                            key={label}
                            onClick={() => navigate(path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem',
                                backgroundColor: label === 'Calendar' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                color: label === 'Calendar' ? '#3b82f6' : 'var(--text-sub)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { if (label !== 'Calendar') e.currentTarget.style.backgroundColor = 'var(--input-bg)'; }}
                            onMouseLeave={e => { if (label !== 'Calendar') e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
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

            {/* ── MAIN CONTENT AREA ────────────────────────────────────────────────── */}
            <div style={{ flexGrow: 1, padding: '48px 56px', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <header className="fade-in-up" style={{ marginBottom: '36px', animationDelay: '0ms' }}>
                    <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1px' }}>Master Calendar</h1>
                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 500 }}>Track all your deadlines across every project in one view.</p>
                </header>

                <div className="fade-in-up" style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', flexGrow: 1, minHeight: '650px', animationDelay: '100ms' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 700 }}>
                            Scanning schedule channels...
                        </div>
                    ) : (
                        <BigCalendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: '100%' }}
                            eventPropGetter={eventStyleGetter}
                            views={['month', 'week', 'day']}
                            formats={{ eventTimeRangeFormat: () => '' }}
                            onSelectEvent={(event) => setSelectedEvent(event)}
                            popup={true}
                        />
                    )}
                </div>
            </div>

            {/* ── METICULOUS GLASSMORPHISM EVENT MODAL ──────────────────────────────── */}
            {selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }} onClick={() => setSelectedEvent(null)}>
                    <div className="dropdown-pop" style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', width: '440px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: 'var(--input-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.3rem', border: '1px solid var(--border-color)' }}>📌</div>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-sub)', padding: 0 }}>✕</button>
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <span style={{ color: 'var(--text-sub)', fontSize: '0.80rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Project Namespace</span>
                            <h3 style={{ margin: '6px 0 20px 0', color: '#3b82f6', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '-0.3px' }}>{selectedEvent.fullProjectName}</h3>

                            <span style={{ color: 'var(--text-sub)', fontSize: '0.80rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Task Assignment</span>
                            <p style={{ margin: '6px 0 0 0', color: 'var(--text-main)', fontWeight: '900', fontSize: '1.4rem', lineHeight: '1.35', letterSpacing: '-0.5px' }}>{selectedEvent.taskName}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                            <div style={{ flex: 1, padding: '14px', backgroundColor: 'var(--input-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <div style={{ color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Status</div>
                                <div style={{ fontWeight: '800', color: selectedEvent.status === 'DONE' ? '#10b981' : 'var(--text-main)', fontSize: '0.95rem' }}>{selectedEvent.status}</div>
                            </div>
                            <div style={{ flex: 1, padding: '14px', backgroundColor: 'var(--input-bg)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                                <div style={{ color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Priority Level</div>
                                <div style={{ fontWeight: '800', color: (selectedEvent.priority === 'High' || selectedEvent.priority === 'Urgent') ? '#ef4444' : '#f59e0b', fontSize: '0.95rem' }}>{selectedEvent.priority || 'Medium'}</div>
                            </div>
                        </div>

                        <div style={{ padding: '16px 20px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '1.6rem' }}>📅</span>
                            <div>
                                <div style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline Deadline</div>
                                <div style={{ color: 'var(--text-main)', fontWeight: '800', fontSize: '1.05rem', marginTop: '2px' }}>{selectedEvent.start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}