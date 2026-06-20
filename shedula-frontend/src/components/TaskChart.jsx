import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function TaskChart({ tasks }) {
    // 1. Calculate the numbers for each category
    const data = [
        { name: 'To Do', value: tasks.filter(t => t.status === 'TODO').length },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length },
        { name: 'Review', value: tasks.filter(t => t.status === 'REVIEW').length },
        { name: 'Done', value: tasks.filter(t => t.status === 'DONE').length },
    ];

    const COLORS = ['#dc2626', '#eab308', '#8b5cf6', '#22c55e'];

    return (
        <div style={{ width: '100%', height: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#666', fontSize: '1rem' }}>Task Distribution</h3>
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}