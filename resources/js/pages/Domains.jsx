// Domains.jsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Globe, Plus, Trash2, RefreshCw } from 'lucide-react'

export function Domains() {
    const qc = useQueryClient()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ domain: '', proxy_port: '', issue_ssl: true })

    const { data: domains = [], isLoading } = useQuery({
        queryKey: ['domains'],
        queryFn: () => axios.get('/nginx/domains').then(r => r.data),
    })

    const reload = useMutation({
        mutationFn: () => axios.post('/nginx/reload'),
    })

    const addDomain = useMutation({
        mutationFn: (data) => axios.post('/nginx/domains', data),
        onSuccess: () => { qc.invalidateQueries(['domains']); setShowForm(false); setForm({ domain: '', proxy_port: '', issue_ssl: true }) },
    })

    const removeDomain = useMutation({
        mutationFn: (name) => axios.delete(`/nginx/domains/${name}`),
        onSuccess: () => qc.invalidateQueries(['domains']),
    })

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Domains</h1>
                    <span className="page-sub">Nginx virtual hosts and routing</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-icon blue" style={{ width: 'auto', padding: '0 14px', gap: 6 }} onClick={() => reload.mutate()}>
                        <RefreshCw size={14} /> Reload Nginx
                    </button>
                    <button className="btn-primary" style={{ width: 'auto', padding: '0 16px', display: 'flex', gap: 6, alignItems: 'center' }} onClick={() => setShowForm(!showForm)}>
                        <Plus size={14} /> Add Domain
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="panel-card" style={{ marginBottom: 20 }}>
                    <div className="card-header"><Globe size={16} /><span>Add New Domain</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Domain</label>
                            <input className="form-input" placeholder="example.com" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Proxy Port</label>
                            <input className="form-input" placeholder="8001" type="number" value={form.proxy_port} onChange={e => setForm(f => ({ ...f, proxy_port: e.target.value }))} />
                        </div>
                        <button className="btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={() => addDomain.mutate(form)} disabled={addDomain.isPending}>
                            {addDomain.isPending ? 'Adding...' : 'Add + SSL'}
                        </button>
                    </div>
                </div>
            )}

            <div className="table-card">
                <table className="data-table">
                    <thead><tr><th>Config</th><th>Domains</th><th>Port</th><th>SSL</th><th>Action</th></tr></thead>
                    <tbody>
                        {domains.map(d => (
                            <tr key={d.config}>
                                <td><strong>{d.config}</strong></td>
                                <td className="muted small">{d.domains?.join(', ')}</td>
                                <td className="muted">{d.port ?? '—'}</td>
                                <td><span className={`status-pill ${d.ssl ? 'success' : 'stopped'}`}>{d.ssl ? 'HTTPS' : 'HTTP'}</span></td>
                                <td>
                                    <button className="btn-icon red" onClick={() => removeDomain.mutate(d.config)}><Trash2 size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Domains
