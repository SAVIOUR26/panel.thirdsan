import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import '../css/app.css'

import Layout from './layouts/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Services from './pages/Services'
import Domains from './pages/Domains'
import SSL from './pages/SSL'
import Deployments from './pages/Deployments'
import Logs from './pages/Logs'

// Axios defaults
axios.defaults.baseURL = '/api'
axios.defaults.withCredentials = true
axios.defaults.headers.common['Accept'] = 'application/json'

// Auth token
const token = localStorage.getItem('panel_token')
if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 30000 }
    }
})

function PrivateRoute({ children }) {
    const token = localStorage.getItem('panel_token')
    return token ? children : <Navigate to="/login" />
}

ReactDOM.createRoot(document.getElementById('app')).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="services" element={<Services />} />
                    <Route path="domains" element={<Domains />} />
                    <Route path="ssl" element={<SSL />} />
                    <Route path="deployments" element={<Deployments />} />
                    <Route path="logs" element={<Logs />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </QueryClientProvider>
)
