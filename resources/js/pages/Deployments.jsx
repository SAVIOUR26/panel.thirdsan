import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Rocket, CheckCircle, XCircle, Clock } from 'lucide-react'

const SERVICES = [
    { name: 'kandafm',    label: 'Kanda FM',      desc: 'Radio streaming platform' },
    { name: 'kandatv',    label: 'Kanda TV',       desc: 'Video streaming platform' },
    { name: 'kandanews',  label: 'KandaNews',      desc: 'Digital news platform' },
    { name: 'ngabopay',   label: 'NgaboPay',       desc: 'Payments platform' },
    { name: 'thirdmoney', label: 'ThirdMoney',     desc: 'Digital wallet' },
]

export default function Deployments() {
    const qc = useQueryClient()

    const { data: history = [] } = useQuery({
        queryKey: ['deployments'],
        queryFn: () => axios.get('/deployments').then(r => r.data),
    })

    const deploy = useMutation({
        mutationFn: (name) => axios.post(`/deployments/${name}/deploy`),
        onSuccess: () => qc.invalidateQueries(['deployments']),
    })

    return (
        <div className="page">
            <div className="page-header">
                <h1>Deployments</h1>
                <span className="page-sub">Deploy and manage Thirdsan services</span>
            </div>

            {/* Deploy Cards */}
            <div className="deploy-grid">
                {SERVICES.map(s => (
                    <div key={s.name} className="deploy-card">
                        <div className="deploy-name">{s.label}</div>
                        <div className="deploy-meta">{s.desc}</div>
                        <button
                            className="btn-deploy"
                            onClick={() => deploy.mutate(s.name)}
                            disabled={deploy.isPending}
                        >
                            <Rocket size={14} />
                            {deploy.isPending ? 'Deploying...' : 'Deploy Latest'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Deployment History */}
            <div className="table-card">
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <Clock size={16} />
                    <span style={{ fontWeight: 600 }}>Deployment History</span>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Status</th>
                            <th>Deployed By</th>
                            <th>Duration</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length > 0 ? history.map((d, i) => (
                            <tr key={i}>
                                <td><strong>{d.service}</strong></td>
                                <td>
                                    <span className={`status-pill ${d.status}`}>
                                        {d.status === 'success'
                                            ? <><CheckCircle size={11} /> Success</>
                                            : <><XCircle size={11} /> Failed</>
                                        }
                                    </span>
                                </td>
                                <td className="muted">{d.deployed_by}</td>
                                <td className="muted">{d.duration}</td>
                                <td className="muted small">{new Date(d.started_at).toLocaleString()}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                                    No deployments yet
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
