import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ─── floating cards animation component ───────────────────────────────────
function FloatingCard({ delay, duration = 10, children }) {
    return (
        <div style={{ animation: `float ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s infinite alternate` }}>
            {children}
        </div>
    );
}

// ─── feature card with hover effect ──────────────────────────────────────
function FeatureCard({ icon, title, desc, badge = null, delay = 0 }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            className="fade-in-up"
            style={{ animationDelay: `${delay}s` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{
                backgroundColor: 'var(--bg-card)',
                padding: '40px',
                borderRadius: '24px',
                border: `1px solid ${isHovered ? '#3b82f6' : 'var(--border-color)'}`,
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateY(-8px) scale(1.01)' : 'translateY(0)',
                cursor: 'default',
                boxShadow: isHovered ? '0 30px 60px -12px rgba(59,130,246,0.15)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                height: '100%',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    fontSize: '3rem',
                    marginBottom: '24px',
                    display: 'inline-block',
                    backgroundColor: 'var(--input-bg)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isHovered ? 'translateY(-5px) scale(1.05)' : 'translateY(0)'
                }}>
                    {icon}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '800', letterSpacing: '-0.5px' }}>{title}</h3>
                    {badge && (
                        <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '99px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            {badge}
                        </span>
                    )}
                </div>
                <p style={{ color: 'var(--text-sub)', lineHeight: '1.7', fontSize: '1.05rem', margin: 0, fontWeight: '500' }}>
                    {desc}
                </p>
            </div>
        </div>
    );
}

// ─── 60FPS smooth stats counter ───────────────────────────────────────
function StatCounter({ number, label, suffix = '' }) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (!hasAnimated) {
            let startTimestamp = null;
            const duration = 2000; // 2 seconds to finish counting

            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);

                // easeOutQuart for a buttery smooth deceleration
                const easeProgress = 1 - Math.pow(1 - progress, 4);
                setCount(Math.floor(easeProgress * number));

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    setHasAnimated(true);
                }
            };

            // Start the animation frame
            window.requestAnimationFrame(step);
        }
    }, [number, hasAnimated]);

    return (
        <div style={{ textAlign: 'center', padding: '32px 24px', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', flex: 1, minWidth: '200px', transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#3b82f6', marginBottom: '8px', letterSpacing: '-2px' }}>
                {count}{suffix}
            </div>
            <p style={{ color: 'var(--text-sub)', fontSize: '1rem', margin: 0, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</p>
        </div>
    );
}

// ─── testimonial card ───────────────────────────────────────────────────
function TestimonialCard({ quote, author, role, avatar, delay = 0 }) {
    return (
        <div className="fade-in-up" style={{ animationDelay: `${delay}s`, height: '100%' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '24px', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'default', height: '100%', boxSizing: 'border-box' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = '#3b82f6'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', lineHeight: '1.7', margin: 0, fontStyle: 'italic', fontWeight: '500' }}>
                    "{quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 'auto' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)' }}>
                        {avatar}
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1.05rem' }}>{author}</div>
                        <div style={{ color: 'var(--text-sub)', fontSize: '0.9rem', fontWeight: '600' }}>{role}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── main landing page ──────────────────────────────────────────────────
export default function Landing() {
    const [scrollY, setScrollY] = useState(0);
    const [ctaEmail, setCtaEmail] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('shedula_theme') || 'System');
    const navigate = useNavigate();

    // Scroll listener for sticky nav and parallax effects
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                root.style.setProperty('--input-bg', '#1e293b');
                root.style.setProperty('--nav-bg', 'rgba(2, 6, 23, 0.85)');
            } else {
                root.style.setProperty('--bg-main', '#ffffff');
                root.style.setProperty('--bg-card', '#ffffff');
                root.style.setProperty('--text-main', '#0f172a');
                root.style.setProperty('--text-sub', '#64748b');
                root.style.setProperty('--border-color', '#e2e8f0');
                root.style.setProperty('--input-bg', '#f1f5f9');
                root.style.setProperty('--nav-bg', 'rgba(255, 255, 255, 0.85)');
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

    const scrollToFeatures = (e) => {
        e.preventDefault();
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'Dark' ? 'Light' : 'Dark';
        setTheme(nextTheme);
    };

    return (
        <div style={{ fontFamily: '"Inter", "SF Pro Display", sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', overflowX: 'hidden', transition: 'background-color 0.4s ease, color 0.4s ease' }}>

            {/* ─── ELITE NAVBAR ─────────────────────────────────────────────────── */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: scrollY > 20 ? '16px 60px' : '24px 60px', backgroundColor: scrollY > 20 ? 'var(--nav-bg)' : 'transparent', backdropFilter: scrollY > 20 ? 'blur(16px)' : 'none', borderBottom: scrollY > 20 ? '1px solid var(--border-color)' : '1px solid transparent', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Shedula<span style={{ color: '#f59e0b', fontSize: '2rem' }}>.</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Dark Mode Toggle Button */}
                    <button onClick={toggleTheme} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: 'var(--input-bg)', transition: 'background-color 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {theme === 'Dark' ? '☀️' : '🌙'}
                    </button>
                    <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-sub)', fontWeight: '700', fontSize: '0.95rem', padding: '10px 20px', borderRadius: '12px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} onMouseOver={(e) => { e.target.style.color = '#3b82f6'; e.target.style.backgroundColor = 'var(--input-bg)'; }} onMouseOut={(e) => { e.target.style.color = 'var(--text-sub)'; e.target.style.backgroundColor = 'transparent'; }}>
                        Sign In
                    </Link>
                    <Link to="/register" style={{ textDecoration: 'none', padding: '12px 28px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '12px', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onMouseOver={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'; e.target.style.backgroundColor = '#2563eb'; }} onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)'; e.target.style.backgroundColor = '#3b82f6'; }}>
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* ─── HERO SECTION ───────────────────────────────────────────── */}
            <section style={{ textAlign: 'center', padding: '160px 20px 100px', background: 'radial-gradient(ellipse at top, var(--input-bg) 0%, var(--bg-main) 100%)', position: 'relative', overflow: 'hidden' }}>
                <FloatingCard delay={0} duration={12}>
                    <div style={{ position: 'absolute', top: '-10%', left: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0 }}></div>
                </FloatingCard>
                <FloatingCard delay={2} duration={15}>
                    <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%)', borderRadius: '50%', zIndex: 0 }}></div>
                </FloatingCard>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
                    <div className="fade-in-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '99px', fontWeight: '800', fontSize: '0.85rem', marginBottom: '32px', border: '1px solid rgba(59, 130, 246, 0.2)', letterSpacing: '0.5px' }}>
                        <span style={{ fontSize: '1.2rem' }}>✨</span> Introducing Shedula AI 1.0
                    </div>

                    <h1 className="fade-in-up" style={{ fontSize: '4.8rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 24px 0', lineHeight: '1.1', letterSpacing: '-2px', animationDelay: '0.1s' }}>
                        Build projects 10x faster with <br />
                        <span style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            AI-Powered Precision.
                        </span>
                    </h1>

                    <p className="fade-in-up" style={{ fontSize: '1.25rem', color: 'var(--text-sub)', maxWidth: '750px', margin: '0 auto 48px', lineHeight: '1.7', fontWeight: '500', animationDelay: '0.2s' }}>
                        The modern command center for software teams. Generate complete task lists with AI, automate workflows, and ship faster than ever before.
                    </p>

                    <div className="fade-in-up" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', animationDelay: '0.3s' }}>
                        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '16px 40px', backgroundColor: '#0f172a', color: 'white', borderRadius: '14px', fontWeight: '800', fontSize: '1.05rem', boxShadow: '0 10px 30px rgba(15,23,42,0.3)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(15,23,42,0.4)'; e.currentTarget.style.backgroundColor = '#1e293b'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(15,23,42,0.3)'; e.currentTarget.style.backgroundColor = '#0f172a'; }}>
                            🚀 Start Free Trial
                        </Link>
                        <a href="#features" onClick={scrollToFeatures} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', padding: '16px 40px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '14px', fontWeight: '800', fontSize: '1.05rem', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--input-bg)'; e.currentTarget.style.borderColor = 'var(--text-sub)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                            Learn More ↓
                        </a>
                    </div>

                    {/* 🚀 ELITE PURE-CSS APP MOCKUP */}
                    <div className="fade-in-up" style={{ marginTop: '80px', padding: '12px', background: 'linear-gradient(180deg, var(--input-bg) 0%, var(--border-color) 100%)', borderRadius: '24px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', animationDelay: '0.4s', transform: `translateY(${scrollY * 0.05}px)`, transition: 'transform 0.1s linear' }}>
                        <div style={{ width: '100%', height: '500px', backgroundColor: 'var(--bg-main)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)', textAlign: 'left' }}>

                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', backgroundColor: 'var(--bg-card)' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                                <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
                            </div>

                            <div style={{ display: 'flex', flexGrow: 1 }}>
                                <div style={{ width: '22%', borderRight: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-card)' }}>
                                    <div style={{ height: '24px', width: '70%', backgroundColor: 'var(--border-color)', borderRadius: '6px', marginBottom: '24px' }} />
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} style={{ height: '16px', width: i === 1 ? '90%' : '100%', backgroundColor: i === 1 ? '#3b82f6' : 'var(--border-color)', borderRadius: '6px', opacity: i === 1 ? 1 : 0.6 }} />
                                    ))}
                                </div>

                                <div style={{ flexGrow: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ height: '32px', width: '200px', backgroundColor: 'var(--text-main)', opacity: 0.1, borderRadius: '8px', marginBottom: '12px' }} />
                                            <div style={{ height: '16px', width: '300px', backgroundColor: 'var(--border-color)', borderRadius: '6px' }} />
                                        </div>
                                        <div style={{ height: '40px', width: '160px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: '10px' }} />
                                    </div>

                                    <div style={{ display: 'flex', gap: '24px', flexGrow: 1 }}>
                                        {[...Array(3)].map((_, colIndex) => (
                                            <div key={colIndex} style={{ flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div style={{ height: '16px', width: '40%', backgroundColor: 'var(--text-sub)', opacity: 0.5, borderRadius: '6px' }} />
                                                    <div style={{ height: '20px', width: '24px', backgroundColor: 'var(--border-color)', borderRadius: '10px' }} />
                                                </div>
                                                <div style={{ height: '80px', width: '100%', backgroundColor: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                                                {colIndex !== 2 && <div style={{ height: '100px', width: '100%', backgroundColor: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }} />}
                                                {colIndex === 0 && <div style={{ height: '80px', width: '100%', backgroundColor: 'var(--input-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="fade-in-up" style={{ marginTop: '80px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', animationDelay: '0.6s' }}>
                        <StatCounter number={10} label="Tasks Generated" suffix="k+" />
                        <StatCounter number={50} label="Active Projects" suffix="+" />
                        <StatCounter number={99} label="Uptime" suffix=".9%" />
                    </div>
                </div>
            </section>

            {/* ─── AI FEATURES SHOWCASE ──────────────────────────────────── */}
            <section id="features" style={{ padding: '140px 60px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '80px', maxWidth: '800px', margin: '0 auto 80px' }}>
                    <h2 style={{ fontSize: '3.5rem', margin: '0 0 20px 0', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
                        Meet Your AI Assistant
                    </h2>
                    <p style={{ color: 'var(--text-sub)', fontSize: '1.25rem', lineHeight: '1.7', margin: 0, fontWeight: '500' }}>
                        Stop managing tasks manually. Let our Gemini-powered AI generate complete task breakdowns, suggest optimizations, and detect project risks before they happen.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
                    <FeatureCard delay={0.1} icon="🪄" title="AI Task Generator" desc="Describe your project in plain English. Our Gemini-powered AI instantly generates a complete, structured task list with estimated time and complexity." />
                    <FeatureCard delay={0.2} icon="⚡" title="Smart Sub-tasks" desc="Stuck on a complex feature? Click the AI magic button to get step-by-step implementation checklists, code snippets, and best practices." />
                    <FeatureCard delay={0.3} icon="📊" title="Risk Detection" desc="AI continuously scans your workspace to flag delayed projects, overloaded team members, and potential bottlenecks before they derail you." badge="Coming Soon" />
                    <FeatureCard delay={0.4} icon="🤖" title="Auto-Optimization" desc="Let AI suggest task reordering, resource allocation, and timeline adjustments based on team capacity and project dependencies." badge="Coming Soon" />
                    <FeatureCard delay={0.5} icon="📈" title="Predictive Analytics" desc="Real-time insights on velocity trends, burndown patterns, and delivery forecasts powered by machine learning models." badge="Coming Soon" />
                    <FeatureCard delay={0.6} icon="🔗" title="GitHub Integration" desc="Auto-sync your GitHub issues and PRs with Shedula tasks. Never miss a deadline or duplicate work again." badge="Coming Soon" />
                </div>
            </section>

            {/* ─── TECH STACK SECTION ────────────────────────────────────── */}
            <section style={{ padding: '140px 60px', backgroundColor: 'var(--bg-main)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <h2 className="fade-in-up" style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 80px 0', textAlign: 'center', letterSpacing: '-1.5px' }}>Built with Enterprise-Grade Tech</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        {[
                            { icon: '☕', title: 'Java Spring Boot', desc: 'Robust, scalable REST APIs with security-first architecture' },
                            { icon: '⚛️', title: 'React 18+', desc: 'Lightning-fast UI with hooks, context, and modern patterns' },
                            { icon: '🤖', title: 'Google Gemini AI', desc: 'State-of-the-art LLM for intelligent task generation' },
                            { icon: '🗄️', title: 'MySQL', desc: 'Reliable relational database with secure data relationships' },
                            { icon: '🔐', title: 'JWT Auth', desc: 'Enterprise authentication and authorization protocols' },
                            { icon: '☁️', title: 'Cloud-Ready', desc: 'Modern architecture ready for AWS/GCP/Azure deployment' }
                        ].map((tech, i) => (
                            <div key={i} className="fade-in-up" style={{ backgroundColor: 'var(--bg-card)', padding: '48px 32px', borderRadius: '24px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)', animationDelay: `${i * 0.1}s` }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-12px)'; e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(59,130,246,0.15)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.05)'; }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '24px' }}>{tech.icon}</div>
                                <h3 style={{ margin: '0 0 16px', color: 'var(--text-main)', fontWeight: '800', fontSize: '1.3rem' }}>{tech.title}</h3>
                                <p style={{ color: 'var(--text-sub)', fontSize: '1.05rem', margin: 0, lineHeight: '1.7' }}>{tech.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TESTIMONIALS ──────────────────────────────────────────── */}
            <section style={{ padding: '140px 60px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                <h2 className="fade-in-up" style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 80px 0', textAlign: 'center', letterSpacing: '-1.5px' }}>Loved by Leading Teams</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', maxWidth: '1400px', margin: '0 auto' }}>
                    <TestimonialCard delay={0.1} quote="Shedula cut our project planning time in half. The AI task generator is incredibly accurate and understands technical context." author="Sarah Chen" role="CTO at TechCorp" avatar="SC" />
                    <TestimonialCard delay={0.3} quote="Finally, a project manager that actually understands complexity. The UI is gorgeous and the speed is unmatched." author="Alex Rivera" role="Engineering Lead at StartupXyz" avatar="AR" />
                    <TestimonialCard delay={0.5} quote="The master dashboard gives us real-time insights we never had before. Highly recommend to any modern engineering team." author="Jordan Mills" role="Product Manager at DataSys" avatar="JM" />
                </div>
            </section>

            {/* ─── CREATOR SECTION ───────────────────────────────────────── */}
            <section style={{ padding: '140px 60px', backgroundColor: 'var(--bg-main)' }}>
                <div className="fade-in-up" style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: 'var(--bg-card)', padding: '80px 60px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontSize: '3.5rem', margin: '0 auto 32px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 30px rgba(59,130,246,0.3)' }}>👨‍💻</div>

                    {/* Updated Name Here */}
                    <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: '0 0 12px 0', fontWeight: '900', letterSpacing: '-1px' }}>Built by Amit Beloshe</h2>
                    <p style={{ fontSize: '1.2rem', color: '#3b82f6', margin: '0 0 32px 0', fontWeight: '800' }}>Full-Stack Software Developer</p>

                    <p style={{ color: 'var(--text-sub)', fontSize: '1.15rem', lineHeight: '1.8', marginBottom: '40px', fontWeight: '500' }}>
                        I built <strong>Shedula</strong> to solve the chaos of modern project management. By combining a robust <strong>Java Spring Boot</strong> backend, a lightning-fast <strong>React</strong> frontend, and integrating <strong>Google's Gemini AI</strong>, I created a platform that doesn't just track tasks—it helps you generate, execute, and optimize them.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        {/* Updated LinkedIn and GitHub Links Here */}
                        <a href="https://linkedin.com/in/amit-beloshe-29162133b" target="_blank" rel="noreferrer" style={{ padding: '16px 36px', backgroundColor: '#0a66c2', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(10, 102, 194, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-4px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Connect on LinkedIn</a>
                        <a href="https://github.com/amti3109" target="_blank" rel="noreferrer" style={{ padding: '16px 36px', backgroundColor: '#24292e', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 4px 12px rgba(36, 41, 46, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-4px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>View on GitHub</a>
                    </div>
                </div>
            </section>

            {/* ─── FUNCTIONAL CTA SECTION ───────────────────────────────────────────── */}
            <section style={{ padding: '160px 60px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)', zIndex: 0 }}></div>
                <div className="fade-in-up" style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '3.8rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 24px 0', letterSpacing: '-1.5px' }}>Ready to Ship Faster?</h2>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-sub)', margin: '0 0 48px 0', lineHeight: '1.7', fontWeight: '500' }}>Join teams worldwide who are building faster with AI-powered project management. Start free, no credit card required.</p>

                    <form onSubmit={(e) => { e.preventDefault(); navigate('/register'); }} style={{ display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto', backgroundColor: 'var(--input-bg)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={ctaEmail}
                            onChange={(e) => setCtaEmail(e.target.value)}
                            required
                            style={{ flexGrow: 1, padding: '16px 20px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1.05rem', outline: 'none' }}
                        />
                        <button type="submit" style={{ padding: '16px 32px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={e => e.target.style.backgroundColor = '#2563eb'} onMouseOut={e => e.target.style.backgroundColor = '#3b82f6'}>
                            Get Started
                        </button>
                    </form>
                </div>
            </section>

            {/* ─── FOOTER ────────────────────────────────────────────────── */}
            <footer style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-sub)', padding: '80px 60px 40px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '60px', marginBottom: '60px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.5px' }}>
                                <span style={{ color: '#3b82f6' }}>❖</span> Shedula
                            </h3>
                            <p style={{ color: 'var(--text-sub)', lineHeight: '1.7', margin: 0, maxWidth: '300px', fontSize: '1.05rem' }}>AI-powered project management for modern engineering teams. Ship faster, ship smarter.</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 20px 0' }}>Product</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {['Features', 'Pricing', 'Security', 'Roadmap'].map(item => (<li key={item} style={{ marginBottom: '14px' }}><a href="#" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#3b82f6'} onMouseOut={e => e.target.style.color = 'var(--text-sub)'}>{item}</a></li>))}
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 20px 0' }}>Company</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {['About', 'Blog', 'Careers', 'Contact'].map(item => (<li key={item} style={{ marginBottom: '14px' }}><a href="#" style={{ color: 'var(--text-sub)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#3b82f6'} onMouseOut={e => e.target.style.color = 'var(--text-sub)'}>{item}</a></li>))}
                            </ul>
                        </div>
                    </div>
                    <div style={{ paddingTop: '40px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                        <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: '0.95rem', fontWeight: '500' }}>© 2026 Shedula. Designed and Built by Amit Beloshe.</p>
                    </div>
                </div>
            </footer>

            {/* Global Smooth Transitions */}
            <style>{`
                @keyframes slideUpFade { 
                    0% { opacity: 0; transform: translateY(40px); } 
                    100% { opacity: 1; transform: translateY(0); } 
                }
                .fade-in-up { animation: slideUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
            `}</style>
        </div>
    );
}