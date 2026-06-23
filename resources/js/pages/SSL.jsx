// SSL.jsx
import React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Shield, RefreshCw } from 'lucide-react'

export default function SSL() {
    const { data: certs = [], isLoading, refetch } = useQuery({
        queryKey: ['ssl'],
        queryFn: () => axios.get('/ssl/certificates').then(r => r.data),
    })

    const renewAll = useMutation({
        mutationFn: () => axios.post('/ssl/renew-all'),
        onSuccess: () => refetch(),
    })

    const renew = useMutation({
        mutationFn: (domain) => axios.post(`/ssl/renew/${domain}`),
        onSuccess: () => refetch(),
    })

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>SSL Certificates</h1>
                    <span className="page-sub">Let's Encrypt certificates via Certbot</span>
                </div>
                <button className="btn-primary" style={{ width: 'auto', padding: '0 16px', display: 'flex', gap: 6, alignItems: 'center' }}
                    onClick={() => renewAll.mutate()} disabled={renewAll.isPending}>
                    <RefreshCw size={14} /> {renewAll.isPending ? 'Renewing...' : 'Renew All'}
                </button>
            </div>

            <div className="table-card">
                <table className="data-table">
                    <thead><tr><th>Certificate</th><th>Domains</th><th>Expires</th><th>Days Left</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {certs.length > 0 ? certs.map(c => (
                            <tr key={c.name}>
                                <td><strong>{c.name}</strong></td>
                                <td className="muted small">{c.domains?.join(', ')}</td>
                                <td className="muted">{c.expiry}</td>
                                <td>
                                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: c.days_left > 30 ? 'var(--green)' : c.days_left > 7 ? 'var(--amber)' : 'var(--red)' }}>
                                        {c.days_left}d
                                    </span>
                                </td>
                                <td><span className={`ssl-badge ${c.status}`}>{c.status}</span></td>
                                <td>
                                    <button className="btn-icon blue" onClick={() => renew.mutate(c.name)} title="Force renew">
                                        <RefreshCw size={14} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No certificates found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
