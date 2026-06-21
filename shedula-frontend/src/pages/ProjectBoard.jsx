import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// 🚀 NEW IMPORTS FOR MULTIPLAYER WEBSOCKETS
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// ─── Avatar Component ───────────────────────────────────────
function Avatar({ name = '', size = 40 }) {
    const [avatarData, setAvatarData] = useState(localStorage.getItem('shedula_avatar'));

    useEffect(() => {
        const handleAvatarUpdate = () => setAvatarData(localStorage.getItem('shedula_avatar'));
        window.addEventListener('storage', handleAvatarUpdate);
        window.addEventListener('avatar-update', handleAvatarUpdate);
        return () => {
            window.removeEventListener('storage', handleAvatarUpdate);
            window.removeEventListener('avatar-update', handleAvatarUpdate);
        };
    }, []);

    if (avatarData) {
        return <img src={avatarData} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />;
    }

    const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const colors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
    const bg = colors[name?.charCodeAt(0) % colors.length] || '#f59e0b';
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.36, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {initials}
        </div>
    );
}

// ─── ELITE TASK MODAL ────────────────────────────────────────────────────
function TaskModal({ task, teamMembers, onClose, onSave, onDelete, onComment }) {
    const [title, setTitle] = useState(task.title || '');
    const [description, setDescription] = useState(task.description || '');
    const [dueDate, setDueDate] = useState(task.dueDate || '');
    const [priority, setPriority] = useState(task.priority || 'Medium');
    const [assignedTo, setAssignedTo] = useState(task.assignedTo || 'Unassigned');
    const [newComment, setNewComment] = useState('');

    const [subTasks, setSubTasks] = useState(task.subTasks || [
        { id: 1, text: 'Review requirements', completed: true },
        { id: 2, text: 'Draft initial implementation', completed: false }
    ]);
    const [newSubTask, setNewSubTask] = useState('');

    const toggleSubTask = (id) => setSubTasks(prev => prev.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
    const addSubTask = (e) => {
        if (e.key === 'Enter' && newSubTask.trim() !== '') {
            e.preventDefault();
            setSubTasks([...subTasks, { id: Date.now(), text: newSubTask, completed: false }]);
            setNewSubTask('');
        }
    };
    const submitComment = () => {
        if (newComment.trim() === '') return;
        onComment(task.id, newComment);
        setNewComment('');
    };

    const progress = subTasks.length > 0 ? Math.round((subTasks.filter(st => st.completed).length / subTasks.length) * 100) : 0;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease forwards' }} onClick={onClose} />
            <div className="task-modal-pop" style={{ position: 'relative', width: '100%', maxWidth: '900px', maxHeight: '90vh', backgroundColor: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--input-bg)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', padding: '4px 10px', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>{task.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => onSave({ ...task, title, description, dueDate, priority, assignedTo })} style={{ padding: '8px 24px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }}>Save Changes</button>
                        <button onClick={onClose} style={{ padding: '8px', background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-sub)', cursor: 'pointer' }}>✖</button>
                    </div>
                </div>

                <div className="custom-scroll" style={{ padding: '32px', overflowY: 'auto', display: 'flex', gap: '40px' }}>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task Title" style={{ width: '100%', fontSize: '1.8rem', fontWeight: '900', color: 'var(--text-main)', border: 'none', backgroundColor: 'transparent', outline: 'none', marginBottom: '16px', letterSpacing: '-0.5px' }} />
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Description</h4>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a more detailed description..." rows={4} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', outline: 'none', resize: 'vertical' }} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sub-tasks Checklist</h4>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: progress === 100 ? '#10b981' : '#3b82f6' }}>{progress}% Complete</span>
                            </div>
                            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--input-bg)', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progress === 100 ? '#10b981' : '#3b82f6', transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {subTasks.map(st => (
                                    <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--input-bg)' }}>
                                        <input type="checkbox" checked={st.completed} onChange={() => toggleSubTask(st.id)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                                        <span style={{ fontSize: '0.95rem', color: st.completed ? 'var(--text-sub)' : 'var(--text-main)', textDecoration: st.completed ? 'line-through' : 'none', transition: 'all 0.2s' }}>{st.text}</span>
                                    </div>
                                ))}
                                <input type="text" value={newSubTask} onChange={e => setNewSubTask(e.target.value)} onKeyDown={addSubTask} placeholder="+ Add an item (Press Enter)" style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', marginTop: '4px' }} />
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Activity & Comments</h4>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 }}>ME</div>
                                <div style={{ flexGrow: 1, position: 'relative' }}>
                                    <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitComment() }} placeholder="Write a comment..." style={{ width: '100%', padding: '14px 48px 14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                                    <button onClick={submitComment} style={{ position: 'absolute', right: '8px', top: '8px', padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>Send</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'var(--input-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Assign To</label>
                            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}>
                                <option value="Unassigned">Unassigned</option>
                                {teamMembers.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', outline: 'none' }}>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
                        <div>
                            <button onClick={() => onDelete(task.id)} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1px dashed #ef4444', color: '#ef4444', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Delete Task</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── MAIN PROJECT BOARD COMPONENT ──────────────────────────────────────
export default function ProjectBoard() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [userProfile, setUserProfile] = useState({ name: localStorage.getItem('name') || 'User', email: localStorage.getItem('email') || '' });
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [projectName, setProjectName] = useState('Loading...');
    const [allProjects, setAllProjects] = useState([]);
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('shedula_theme') || 'System');

    const [showTaskInput, setShowTaskInput] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [activeColumn, setActiveColumn] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);

    const [showAiModal, setShowAiModal] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [showHealthModal, setShowHealthModal] = useState(false);
    const [healthReport, setHealthReport] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // 🚀 NEW: MULTIPLAYER WEBSOCKET CONNECTION
    useEffect(() => {
        // Connect to the Spring Boot /ws endpoint
        const socket = new SockJS('https://shedula-project.onrender.com/ws');
        const stompClient = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('📡 Connected to Live Multiplayer WebSocket!');

                // Listen for any Task Updates or Creations on this specific Project
                stompClient.subscribe(`/topic/project/${projectId}`, (message) => {
                    const updatedTask = JSON.parse(message.body);
                    setTasks(prevTasks => {
                        const existingIndex = prevTasks.findIndex(t => t.id === updatedTask.id);
                        if (existingIndex >= 0) {
                            // If it exists, replace it (Someone edited or moved it)
                            const newTasks = [...prevTasks];
                            newTasks[existingIndex] = updatedTask;
                            return newTasks;
                        } else {
                            // If it doesn't exist, add it (Someone created a new task)
                            return [...prevTasks, updatedTask];
                        }
                    });
                });

                // Listen for Task Deletions
                stompClient.subscribe(`/topic/project/${projectId}/delete`, (message) => {
                    const deletedId = parseInt(message.body, 10);
                    setTasks(prevTasks => prevTasks.filter(t => t.id !== deletedId));
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            }
        });

        stompClient.activate();

        // Disconnect when we leave the board
        return () => stompClient.deactivate();
    }, [projectId]);

    useEffect(() => {
        const root = document.documentElement;
        const applyTheme = (themeName) => {
            if (themeName === 'Dark' || (themeName === 'System' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.style.setProperty('--bg-main', '#020617'); root.style.setProperty('--bg-card', '#0f172a'); root.style.setProperty('--text-main', '#f8fafc'); root.style.setProperty('--text-sub', '#94a3b8'); root.style.setProperty('--border-color', '#1e293b'); root.style.setProperty('--input-bg', '#1e293b');
            } else {
                root.style.setProperty('--bg-main', '#f8fafc'); root.style.setProperty('--bg-card', '#ffffff'); root.style.setProperty('--text-main', '#0f172a'); root.style.setProperty('--text-sub', '#64748b'); root.style.setProperty('--border-color', '#e2e8f0'); root.style.setProperty('--input-bg', '#f1f5f9');
            }
        };
        applyTheme(theme);
        const handleStorageChange = (e) => { if (e.key === 'shedula_theme') applyTheme(e.newValue); };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [theme]);

    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };

    const fetchTasks = async () => {
        try { setTasks((await api.get(`/api/tasks/project/${projectId}`)).data); }
        catch (err) { toast("Failed to fetch tasks.", "error"); }
    };

    const fetchUsers = async () => {
        try { setTeamMembers((await api.get('/api/users')).data); }
        catch (err) { console.error("Error fetching users"); }
    };

    const fetchProjectDetails = async () => {
        try {
            const response = await api.get(`/api/projects/workspace/1`);
            setAllProjects(response.data);
            const targetProject = response.data.find(p => p.id.toString() === projectId.toString());
            setProjectName(targetProject ? targetProject.name : `Project #${projectId}`);
        } catch (err) { setProjectName(`Project #${projectId}`); }
    };

    useEffect(() => {
        const loadBoard = async () => {
            setIsLoading(true);
            await Promise.all([fetchTasks(), fetchUsers(), fetchProjectDetails()]);
            setTimeout(() => setIsLoading(false), 500);
        };
        loadBoard();
    }, [projectId]);

    const handleCreateTask = async (statusName) => {
        if (!newTaskTitle.trim()) return;
        try {
            await api.post(`/api/tasks/project/${projectId}`, { title: newTaskTitle, status: statusName });
            // 🚀 We no longer need to call fetchTasks() here! 
            // The WebSocket will automatically receive the new task and add it to the screen.
            setNewTaskTitle('');
            setShowTaskInput(false);
            toast("Task added successfully!");
        } catch (err) { toast("Failed to create task.", "error"); }
    };

    const handleGenerateAITasks = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        toast("Cooking AI magic... please wait.", "info");
        try {
            await api.post(`/api/ai/generate/${projectId}`, { prompt: aiPrompt });
            fetchTasks(); // Keeping fetch here since AI generates multiple at once
            setShowAiModal(false);
            setAiPrompt('');
            toast("✨ AI successfully generated tasks!");
        } catch (err) { toast("The AI failed to generate tasks.", "error"); }
        finally { setIsGenerating(false); }
    };

    const handleGenerateHealthReport = async () => {
        setIsAnalyzing(true);
        setShowHealthModal(true);
        setHealthReport('');

        try {
            const boardContext = tasks.map(t => `[${t.status}] ${t.title} (Priority: ${t.priority || 'Medium'})`).join('\n');
            const response = await api.post(`/api/ai/analyze`, { projectData: boardContext });
            setHealthReport(response.data.summary);
        } catch (err) {
            setHealthReport("⚠️ Failed to generate health report. Ensure your backend /api/ai/analyze endpoint is running.");
            toast("Failed to reach AI.", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Delete this task permanently?")) return;
        try {
            await api.delete(`/api/tasks/${taskId}`);
            setSelectedTask(null);
            toast("Task deleted.", "info");
            // WebSocket will handle removing it from the screen!
        } catch (err) { toast("Failed to delete task.", "error"); }
    };

    const handleSaveTaskDetails = async (updatedTask) => {
        try {
            await api.put(`/api/tasks/${updatedTask.id}`, updatedTask);
            setSelectedTask(null);
            toast("Task updated successfully!");
            // WebSocket handles screen update!
        } catch (err) { toast("Failed to save task details.", "error"); }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

        const newStatus = destination.droppableId;
        const taskId = parseInt(draggableId);

        // Optimistic UI Update (Makes it feel instant for the person dragging)
        const newTasks = [...tasks];
        const taskIndex = newTasks.findIndex(t => t.id === taskId);
        const movedTask = { ...newTasks[taskIndex], status: newStatus };

        newTasks.splice(taskIndex, 1);
        const destColumnTasks = newTasks.filter(t => t.status === newStatus);

        if (destination.index >= destColumnTasks.length) {
            newTasks.push(movedTask);
        } else {
            const targetTaskId = destColumnTasks[destination.index].id;
            const targetFlatIndex = newTasks.findIndex(t => t.id === targetTaskId);
            newTasks.splice(targetFlatIndex, 0, movedTask);
        }
        setTasks(newTasks);

        if (newStatus === 'DONE' && source.droppableId !== 'DONE') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#3b82f6', '#f59e0b'] });
        }

        try {
            await api.patch(`/api/tasks/${taskId}/status`, { status: newStatus });
            // Java will now broadcast this move to everyone else!
        }
        catch (err) { fetchTasks(); toast("Failed to move task. Reverting.", "error"); }
    };

    const renderColumn = (title, statusName, config) => {
        const columnTasks = tasks.filter(t => t.status === statusName);
        return (
            <div style={{ width: '340px', minWidth: '340px', backgroundColor: config.bg, padding: '24px', borderRadius: '20px', minHeight: '65vh', display: 'flex', flexDirection: 'column', border: `1px solid ${config.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: config.dot }}></div>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: '800' }}>{title}</h3>
                    </div>
                    <span style={{ backgroundColor: config.countBg, color: config.countText, fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}>
                        {isLoading ? '-' : columnTasks.length}
                    </span>
                </div>

                <Droppable droppableId={statusName} key={statusName}>
                    {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1, minHeight: '100px', paddingBottom: '30px', borderRadius: '12px', backgroundColor: snapshot.isDraggingOver ? config.dragBg : 'transparent', transition: 'background-color 0.2s ease' }}>
                            {isLoading ? (
                                [...Array(3)].map((_, i) => <div key={i} className="skeleton-pulse" style={{ backgroundColor: 'var(--bg-card)', height: '100px', borderRadius: '16px', border: '1px solid var(--border-color)' }}></div>)
                            ) : (
                                columnTasks.map((task, index) => {
                                    const isOverdue = task.dueDate && statusName !== 'DONE' && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
                                    return (
                                        <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index} isDragDisabled={!!selectedTask || showAiModal || showHealthModal}>
                                            {(provided, snapshot) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={(e) => { if (!e.defaultPrevented && !snapshot.isDragging) setSelectedTask(task); }} style={{ ...provided.draggableProps.style, backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: snapshot.isDragging ? 'grabbing' : 'grab', border: isOverdue ? '1px solid #ef4444' : '1px solid var(--border-color)', boxShadow: snapshot.isDragging ? '0 15px 30px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.05)' }}>
                                                    <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: '800', fontSize: '1rem', lineHeight: '1.4' }}>{task.title}</p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {task.priority && <span style={{ fontSize: '0.70rem', padding: '4px 10px', backgroundColor: (task.priority === 'High' || task.priority === 'Urgent') ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)', color: (task.priority === 'High' || task.priority === 'Urgent') ? '#ef4444' : 'var(--text-sub)', borderRadius: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{task.priority}</span>}
                                                        {task.dueDate && <span style={{ fontSize: '0.75rem', padding: '4px 10px', backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)', color: isOverdue ? '#ef4444' : 'var(--text-sub)', borderRadius: '12px', fontWeight: '700' }}>{isOverdue ? '⚠️ ' : '📅 '} {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                                    </div>
                                                    {(task.assignedTo && task.assignedTo !== 'Unassigned') && (
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                            <Avatar name={task.assignedTo} size={28} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })
                            )}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                <div style={{ marginTop: '16px' }}>
                    {showTaskInput && activeColumn === statusName && (
                        <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid #3b82f6', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)', marginBottom: '12px' }}>
                            <input autoFocus type="text" placeholder="What needs to be done?" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(statusName) }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', boxSizing: 'border-box', marginBottom: '12px', outline: 'none', fontSize: '0.95rem' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleCreateTask(statusName)} style={{ flex: 1, padding: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                                <button onClick={() => { setShowTaskInput(false); setNewTaskTitle(''); }} style={{ padding: '8px 12px', backgroundColor: 'transparent', color: 'var(--text-sub)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                            </div>
                        </div>
                    )}
                    {!showTaskInput && !isLoading && (
                        <button onClick={() => { setActiveColumn(statusName); setShowTaskInput(true); }} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', borderRadius: '12px', fontWeight: '800', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = config.hover; e.currentTarget.style.color = 'var(--text-main)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-sub)'; }}>
                            <span style={{ fontSize: '1.2rem' }}>+</span> Add Task
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Inter", "SF Pro Display", sans-serif', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden' }}>

            <style>{`
                @keyframes popUp { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                .task-modal-pop { animation: popUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .fade-in-up { animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
                .skeleton-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .custom-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
            `}</style>

            <aside style={{ width: 260, minWidth: 260, backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-color)', padding: '28px 20px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                <div style={{ padding: '0 8px 36px 8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#3b82f6', letterSpacing: '-0.5px' }}>
                        Shedula<span style={{ color: '#f59e0b' }}>.</span>
                    </h2>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
                    {[
                        ['📥', 'Inbox', '/inbox'],
                        ['🏠', 'Dashboard', '/dashboard'],
                        ['📁', 'Projects', '/projects'],
                        ['📅', 'Calendar', '/calendar'],
                        ['👥', 'Team', '/team'],
                        ['⚙️', 'Settings', '/settings']
                    ].map(([icon, label, path]) => {
                        const isActive = path === '/projects';
                        return (
                            <div key={label} onClick={() => navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderRadius: '16px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent', color: isActive ? '#3b82f6' : 'var(--text-sub)', transition: 'all 0.2s' }} onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--input-bg)' }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}>
                                <span style={{ fontSize: '1.2rem' }}>{icon}</span>{label}
                            </div>
                        );
                    })}
                </nav>
                <div style={{ position: 'relative', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                    <div onClick={() => setProfileMenuOpen(!profileMenuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--input-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Avatar name={userProfile.name} size={42} />
                        <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>Workspace Member</div>
                        </div>
                    </div>
                </div>
            </aside>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-main)' }}>
                <header className="fade-in-up" style={{ padding: '36px 48px', backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 5 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => navigate('/projects')} onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-sub)'}>
                                📁 ALL PROJECTS
                            </span>
                            <span style={{ color: 'var(--border-color)' }}>›</span>

                            <div style={{ position: 'relative' }} onMouseEnter={() => setIsProjectDropdownOpen(true)} onMouseLeave={() => setIsProjectDropdownOpen(false)}>
                                <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', backgroundColor: isProjectDropdownOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', padding: '6px 14px', borderRadius: '10px', transition: 'background-color 0.2s' }}>
                                    {projectName}
                                    <span style={{ fontSize: '0.65rem', transform: isProjectDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                                </span>
                                {isProjectDropdownOpen && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, paddingTop: '8px', zIndex: 100 }}>
                                        <div style={{ width: '280px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', padding: '8px', textTransform: 'none', letterSpacing: 'normal' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
                                                {allProjects.map(p => {
                                                    const isCurrent = p.id.toString() === projectId.toString();
                                                    return (
                                                        <div key={p.id} onClick={() => { setIsProjectDropdownOpen(false); navigate(`/project/${p.id}`); }} style={{ padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 700, color: isCurrent ? '#3b82f6' : 'var(--text-main)', backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }} onMouseOver={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'var(--input-bg)'; }} onMouseOut={e => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                                            <span>{isCurrent ? '📁' : '📂'}</span> <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 style={{ color: 'var(--text-main)', margin: 0, fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {projectName}
                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '6px 14px', borderRadius: '99px', letterSpacing: '0' }}>ACTIVE</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginLeft: 'auto' }}>
                        <button onClick={handleGenerateHealthReport} style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', padding: '14px 24px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.4)', cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)' }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--input-bg)' }}>
                            📊 Health Report
                        </button>

                        <button onClick={() => setShowAiModal(true)} style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', padding: '14px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem', boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            ✨ Generate AI Tasks
                        </button>
                    </div>
                </header>

                <div style={{ padding: '40px 48px', flexGrow: 1, overflowX: 'auto', overflowY: 'auto' }} className="custom-scroll">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', minWidth: 'max-content', paddingBottom: '20px' }}>
                            {renderColumn('To Do', 'TODO', { bg: 'var(--bg-card)', dragBg: 'var(--input-bg)', border: 'var(--border-color)', dot: 'var(--text-sub)', countBg: 'var(--input-bg)', countText: 'var(--text-sub)', hover: 'var(--input-bg)' })}
                            {renderColumn('In Progress', 'IN_PROGRESS', { bg: 'var(--bg-card)', dragBg: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.3)', dot: '#3b82f6', countBg: 'rgba(59, 130, 246, 0.1)', countText: '#3b82f6', hover: 'var(--input-bg)' })}
                            {renderColumn('Done', 'DONE', { bg: 'var(--bg-card)', dragBg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.3)', dot: '#10b981', countBg: 'rgba(16, 185, 129, 0.1)', countText: '#10b981', hover: 'var(--input-bg)' })}
                        </div>
                    </DragDropContext>
                </div>
            </div>

            {/* ── AI TASK GENERATION MODAL ── */}
            {showAiModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(8px)' }} onClick={e => { if (e.target === e.currentTarget && !isGenerating) setShowAiModal(false); }}>
                    <div className="fade-in-up" style={{ backgroundColor: 'var(--bg-card)', padding: '48px', borderRadius: '28px', width: '500px', border: '1px solid var(--border-color)', borderTop: '6px solid #8b5cf6' }}>
                        <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', fontSize: '1.6rem' }}>✨ Generate Tasks</h2>
                        <textarea autoFocus placeholder="Describe your project..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} required disabled={isGenerating} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '1rem', minHeight: '120px', resize: 'vertical', marginBottom: '24px', outline: 'none' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" onClick={() => setShowAiModal(false)} disabled={isGenerating} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-sub)', border: 'none', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleGenerateAITasks} disabled={isGenerating} style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>{isGenerating ? '⏳ Generating...' : 'Generate'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── AI HEALTH REPORT MODAL ── */}
            {showHealthModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(8px)' }} onClick={e => { if (e.target === e.currentTarget && !isAnalyzing) setShowHealthModal(false); }}>
                    <div className="fade-in-up" style={{ backgroundColor: 'var(--bg-card)', padding: '48px', borderRadius: '28px', width: '600px', border: '1px solid var(--border-color)', borderTop: '6px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📊</div>
                            <h2 style={{ margin: 0, color: 'var(--text-main)', fontWeight: '900', fontSize: '1.6rem' }}>Project Health Analysis</h2>
                        </div>

                        <div className="custom-scroll" style={{ backgroundColor: 'var(--input-bg)', padding: '24px', borderRadius: '16px', minHeight: '150px', maxHeight: '50vh', overflowY: 'auto', color: 'var(--text-main)', lineHeight: '1.6', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                            {isAnalyzing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-sub)' }}>
                                    <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>Gemini is analyzing your workflow...</p>
                                </div>
                            ) : (
                                healthReport.split('**').map((text, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#10b981' }}>{text}</strong> : text)
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button onClick={() => setShowHealthModal(false)} disabled={isAnalyzing} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Close Report</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    teamMembers={teamMembers}
                    onClose={() => setSelectedTask(null)}
                    onSave={handleSaveTaskDetails}
                    onDelete={handleDeleteTask}
                    onComment={(taskId, comment) => console.log(`Comment on ${taskId}: ${comment}`)}
                />
            )}

            <div style={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 999999 }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ padding: '16px 24px', borderRadius: '16px', backgroundColor: t.type === 'error' ? '#fee2e2' : t.type === 'info' ? 'var(--input-bg)' : '#10b981', color: t.type === 'error' ? '#b91c1c' : t.type === 'info' ? 'var(--text-main)' : '#ffffff', border: t.type === 'info' ? '1px solid var(--border-color)' : 'none', fontWeight: 800, fontSize: '0.95rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', animation: 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        {t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'} {t.msg}
                    </div>
                ))}
            </div>
        </div>
    );
}