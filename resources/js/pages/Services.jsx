import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Play, Square, RotateCcw, FileText, Server } from 'lucide-react'

export default function Services() {
    const qc = useQueryClient()
    const [logs, setLogs] = useState(null)
    const [logsService, setLogsService] = useState(null)

    const { data: services = [], isLoading } = useQuery({
        queryKey: ['services'],
        queryFn: () => axios.get('/services').then(r => r.data),
        refetchInterval: 10000,
    })

    const action = useMutation({
        mutationFn: ({ name, act }) => axios.post(`/services/${name}/${act}`),
        onSuccess: () => qc.invalidateQueries(['services']),
    })

    async function viewLogs(name) {
        const res = await axios.get(`/services/${name}/logs`)
        setLogsService(name)
        setLogs(res.data.logs)
    }

    if (isLoading) return <div className="page-loading"><Server size={32} className="spin" /><span>Loading services...</span></div>

    return (
        <div className="page">
            <div className="page-header">
                <h1>Services</h1>
                <span className="page-sub">Manage Docker containers</span>
            </div>

            <div className="table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Container</th>
                            <th>Image</th>
                            <th>Status</th>
                            <th>Ports</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(s => (
                            <tr key={s.name}>
                                <td>
                                    <div className="service-name-cell">
                                        <span className={`dot ${s.status === 'running' ? 'green' : 'red'}`} />
                                        <strong>{s.name}</strong>
                                        {s.managed && <span className="badge managed">managed</span>}
                                    </div>
                                </td>
                                <td className="muted">{s.image}</td>
                                <td>
                                    <span className={`status-pill ${s.status}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="muted small">{s.ports || '—'}</td>
                                <td>
                                    <div className="action-btns">
                                        <button
                                            className="btn-icon green"
                                            title="Start"
                                            onClick={() => action.mutate({ name: s.name, act: 'start' })}
                                            disabled={s.status === 'running'}
                                        >
                                            <Play size={14} />
                                        </button>
                                        <button
                                            className="btn-icon red"
                                            title="Stop"
                                            onClick={() => action.mutate({ name: s.name, act: 'stop' })}
                                            disabled={s.status === 'stopped'}
                                        >
                                            <Square size={14} />
                                        </button>
                                        <button
                                            className="btn-icon blue"
                                            title="Restart"
                                            onClick={() => action.mutate({ name: s.name, act: 'restart' })}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                        <button
                                            className="btn-icon gray"
                                            title="View Logs"
                                            onClick={() => viewLogs(s.name)}
                                        >
                                            <FileText size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Logs Modal */}
            {logs && (
                <div className="modal-overlay" onClick={() => setLogs(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span>Logs — {logsService}</span>
                            <button onClick={() => setLogs(null)}>✕</button>
                        </div>
                        <pre className="log-output">{logs}</pre>
                    </div>
                </div>
            )}
        </div>
    )
}
