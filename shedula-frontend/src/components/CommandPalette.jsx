import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [projects, setProjects] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // ─── Fetch Projects for Quick Jump ───
    useEffect(() => {
        if (isOpen) {
            api.get('/api/projects/workspace/1')
                .then(res => setProjects(res.data))
                .catch(err => console.warn("Palette couldn't load projects", err));
        }
    }, [isOpen]);

    // ─── Global Keystroke Listener (Cmd+K / Ctrl+K) ───
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setSearch('');
                setSelectedIndex(0);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // ─── Define Available Commands ───
    const actions = [
        { id: 'nav-dash', section: 'Navigation', title: 'Go to Dashboard', icon: '🏠', action: () => navigate('/dashboard') },
        { id: 'nav-proj', section: 'Navigation', title: 'Go to Projects', icon: '📁', action: () => navigate('/projects') },
        { id: 'nav-cal', section: 'Navigation', title: 'Go to Calendar', icon: '📅', action: () => navigate('/calendar') },
        { id: 'nav-team', section: 'Navigation', title: 'Go to Team Directory', icon: '👥', action: () => navigate('/team') },
        { id: 'nav-rep', section: 'Navigation', title: 'Go to Reports', icon: '📊', action: () => navigate('/reports') },
        { id: 'nav-set', section: 'Navigation', title: 'Go to Settings', icon: '⚙️', action: () => navigate('/settings') },

        {
            id: 'act-theme', section: 'Quick Actions', title: 'Toggle Dark/Light Mode', icon: '🌗', action: () => {
                const current = localStorage.getItem('shedula_theme') || 'System';
                const next = current === 'Dark' ? 'Light' : 'Dark';
                localStorage.setItem('shedula_theme', next);
                window.dispatchEvent(new StorageEvent('storage', { key: 'shedula_theme', newValue: next }));
            }
        },
        {
            id: 'act-logout', section: 'Quick Actions', title: 'Secure Logout', icon: '🚪', action: () => {
                localStorage.clear();
                navigate('/login');
            }
        }
    ];

    const projectCommands = projects.map(p => ({
        id: `proj-${p.id}`,
        section: 'Workspaces',
        title: p.name,
        icon: 'kanban',
        action: () => navigate(`/project/${p.id}`)
    }));

    const allCommands = [...actions, ...projectCommands];

    // Filter commands based on search
    const filteredCommands = allCommands.filter(cmd =>
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.section.toLowerCase().includes(search.toLowerCase())
    );

    // ─── Handle Keyboard Navigation ───
    useEffect(() => {
        const handleNavigation = (e) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handleNavigation);
        return () => window.removeEventListener('keydown', handleNavigation);
    }, [isOpen, filteredCommands, selectedIndex]);

    // Reset selection when search changes
    useEffect(() => { setSelectedIndex(0); }, [search]);

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', paddingTop: '12vh' }}>
            {/* Glassmorphic Backdrop */}
            <div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease forwards' }}
                onClick={() => setIsOpen(false)}
            />

            {/* Command Palette Modal */}
            <div className="palette-pop" style={{ position: 'relative', width: '100%', maxWidth: '650px', backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '60vh' }}>

                {/* Search Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '1.4rem', color: 'var(--text-sub)' }}>🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="What do you need? Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flexGrow: 1, backgroundColor: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', outline: 'none', fontWeight: '600' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <kbd style={kbdStyle}>ESC</kbd>
                    </div>
                </div>

                {/* Results Area */}
                <div className="custom-scroll" style={{ overflowY: 'auto', padding: '16px', flexGrow: 1 }}>
                    {filteredCommands.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sub)' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👻</div>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>No commands found.</div>
                            <div style={{ fontSize: '0.9rem' }}>Try searching for "Dashboard" or "Settings".</div>
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => {
                            const isSelected = index === selectedIndex;
                            // Add headers for sections
                            const showHeader = index === 0 || filteredCommands[index - 1].section !== cmd.section;

                            return (
                                <div key={cmd.id}>
                                    {showHeader && (
                                        <div style={{ padding: '16px 12px 8px 12px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {cmd.section}
                                        </div>
                                    )}
                                    <div
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        onClick={() => { cmd.action(); setIsOpen(false); }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            color: isSelected ? '#3b82f6' : 'var(--text-main)',
                                            transition: 'background-color 0.1s',
                                            borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span style={{ fontSize: '1.2rem', filter: cmd.icon === 'kanban' ? 'grayscale(1)' : 'none' }}>
                                                {cmd.icon === 'kanban' ? '📋' : cmd.icon}
                                            </span>
                                            <span style={{ fontWeight: isSelected ? '800' : '600', fontSize: '1rem' }}>
                                                {cmd.title}
                                            </span>
                                        </div>
                                        {isSelected && <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '700' }}>⏎ Enter</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Footer */}
                <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><kbd style={kbdStyle}>↑</kbd><kbd style={kbdStyle}>↓</kbd> to navigate</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><kbd style={kbdStyle}>↵</kbd> to select</div>
                </div>

            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popDown { 
                    0% { opacity: 0; transform: scale(0.98) translateY(-20px); } 
                    100% { opacity: 1; transform: scale(1) translateY(0); } 
                }
                .palette-pop { animation: popDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
            `}</style>
        </div>
    );
}

const kbdStyle = {
    backgroundColor: 'var(--border-color)',
    color: 'var(--text-main)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    borderBottom: '2px solid rgba(0,0,0,0.1)'
};