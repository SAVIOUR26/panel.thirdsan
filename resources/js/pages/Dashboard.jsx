import React from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { Cpu, MemoryStick, HardDrive, Clock, Activity, Shield } from 'lucide-react'

function StatCard({ icon: Icon, label, value, percent, color, sub }) {
    return (
        <div className="stat-card">
            <div className="stat-header">
                <div className="stat-icon" style={{ background: color + '22', color }}>
                    <Icon size={20} />
                </div>
                <span className="stat-label">{label}</span>
            </div>
            <div className="stat-value">{value}</div>
            {percent !== undefined && (
                <div className="stat-bar">
                    <div
                        className="stat-bar-fill"
                        style={{ width: `${percent}%`, background: color }}
                    />
                </div>
            )}
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    )
}

function ServiceBadge({ name, status }) {
    const isRunning = status === 'running'
    return (
        <div className="service-badge">
            <span className={`dot ${isRunning ? 'green' : 'red'}`} />
            <span className="service-name">{name}</span>
            <span className={`service-status ${isRunning ? 'up' : 'down'}`}>
                {isRunning ? 'Running' : 'Stopped'}
            </span>
        </div>
    )
}

export default function Dashboard() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: () => axios.get('/dashboard/stats').then(r => r.data),
        refetchInterval: 10000,
    })

    const { data: health, isLoading: healthLoading } = useQuery({
        queryKey: ['health'],
        queryFn: () => axios.get('/dashboard/health').then(r => r.data),
        refetchInterval: 15000,
    })

    if (statsLoading || healthLoading) {
        return (
            <div className="page-loading">
                <Activity size={32} className="spin" />
                <span>Loading server stats...</span>
            </div>
        )
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Dashboard</h1>
                <span className="page-sub">Thirdsan VPS — vmi3391950</span>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    icon={Cpu}
                    label="CPU Usage"
                    value={`${stats?.cpu?.percent ?? 0}%`}
                    percent={stats?.cpu?.percent}
                    color="#3b82f6"
                    sub={`${stats?.cpu?.cores} cores • Load: ${stats?.cpu?.load_1}`}
                />
                <StatCard
                    icon={MemoryStick}
                    label="RAM Usage"
                    value={`${stats?.ram?.used ?? 0} GB`}
                    percent={stats?.ram?.percent}
                    color="#8b5cf6"
                    sub={`${stats?.ram?.used} / ${stats?.ram?.total} GB used`}
                />
                <StatCard
                    icon={HardDrive}
                    label="Disk Usage"
                    value={`${stats?.disk?.used ?? 0} GB`}
                    percent={stats?.disk?.percent}
                    color="#f59e0b"
                    sub={`${stats?.disk?.used} / ${stats?.disk?.total} GB used`}
                />
                <StatCard
                    icon={Clock}
                    label="Uptime"
                    value={stats?.uptime ?? '--'}
                    color="#10b981"
                    sub="Server running since last reboot"
                />
            </div>

            {/* Services + SSL */}
            <div className="two-col">
                {/* Docker Containers */}
                <div className="panel-card">
                    <div className="card-header">
                        <Activity size={18} />
                        <span>Running Services</span>
                    </div>
                    <div className="services-list">
                        {health?.containers?.length > 0
                            ? health.containers.map(c => (
                                <ServiceBadge key={c.name} name={c.name} status={c.status} />
                            ))
                            : <p className="empty">No containers found</p>
                        }
                    </div>
                </div>

                {/* SSL Certificates */}
                <div className="panel-card">
                    <div className="card-header">
                        <Shield size={18} />
                        <span>SSL Certificates</span>
                    </div>
                    <div className="ssl-list">
                        {health?.ssl?.length > 0
                            ? health.ssl.map(cert => (
                                <div key={cert.domain} className="ssl-item">
                                    <span className="ssl-domain">{cert.domain}</span>
                                    <span className={`ssl-badge ${cert.status}`}>
                                        {cert.days_left}d left
                                    </span>
                                </div>
                            ))
                            : <p className="empty">No SSL certificates found</p>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
