import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { FileText } from 'lucide-react'

const LOG_SOURCES = [
    { key: 'nginx',  label: 'Nginx Access' },
    { key: 'system', label: 'System Log' },
    { key: 'azuracast', label: 'AzuraCast' },
    { key: 'kandafm',   label: 'Kanda FM' },
]

export default function Logs() {
    const [source, setSource] = useState('nginx')

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['logs', source],
        queryFn: () => axios.get(`/logs/${source}`).then(r => r.data),
        refetchInterval: 15000,
    })

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Logs</h1>
                    <span className="page-sub">Live server and service logs</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {LOG_SOURCES.map(s => (
                        <button key={s.key}
                            onClick={() => setSource(s.key)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid',
                                borderColor: source === s.key ? 'var(--blue)' : 'var(--border)',
                                background: source === s.key ? 'var(--blue-dim)' : 'none',
                                color: source === s.key ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 500,
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-card" style={{ padding: 0 }}>
                <div className="card-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    <FileText size={16} />
                    <span style={{ fontWeight: 600 }}>{LOG_SOURCES.find(s => s.key === source)?.label} — Last 100 lines</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Auto-refreshes every 15s</span>
                </div>
                {isLoading
                    ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading logs...</div>
                    : <pre className="log-output" style={{ maxHeight: '60vh', borderRadius: '0 0 var(--radius) var(--radius)' }}>
                        {data?.logs || data?.content || 'No logs available'}
                    </pre>
                }
            </div>
        </div>
    )
}
