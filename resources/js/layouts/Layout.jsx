import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
    LayoutDashboard, Server, Globe, Shield, Rocket,
    FileText, LogOut, Menu, X, Cpu
} from 'lucide-react'

const nav = [
    { to: '/',            icon: LayoutDashboard, label: 'Dashboard'   },
    { to: '/services',    icon: Server,           label: 'Services'    },
    { to: '/domains',     icon: Globe,            label: 'Domains'     },
    { to: '/ssl',         icon: Shield,           label: 'SSL Certs'   },
    { to: '/deployments', icon: Rocket,           label: 'Deployments' },
    { to: '/logs',        icon: FileText,         label: 'Logs'        },
]

export default function Layout() {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    async function logout() {
        try { await axios.post('/auth/logout') } catch {}
        localStorage.removeItem('panel_token')
        delete axios.defaults.headers.common['Authorization']
        navigate('/login')
    }

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className={`sidebar ${open ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <Cpu size={24} />
                    <span>Thirdsan Panel</span>
                </div>

                <nav className="sidebar-nav">
                    {nav.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setOpen(false)}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="server-badge">
                        <span className="dot green" />
                        <span>vmi3391950 — EU</span>
                    </div>
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {open && <div className="overlay" onClick={() => setOpen(false)} />}

            {/* Main content */}
            <main className="main">
                <header className="topbar">
                    <button className="menu-btn" onClick={() => setOpen(!open)}>
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="topbar-right">
                        <span className="topbar-ip">82.208.22.164</span>
                    </div>
                </header>

                <div className="page-content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
