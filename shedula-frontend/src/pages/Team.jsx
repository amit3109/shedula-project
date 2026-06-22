import React from 'react';

export default function Team() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>👥</div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontWeight: '900' }}>Team Directory</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-sub)' }}>This module is currently under development.</p>
        </div>
    );
}