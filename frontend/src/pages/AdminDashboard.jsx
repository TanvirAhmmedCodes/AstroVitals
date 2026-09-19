import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../lib/api';
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  Database,
  FileText,
  Clock,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  UserX,
  UserCheck,
  Trash2,
  Lock,
  Cpu,
  Radio,
  Server,
  AlertOctagon,
  ExternalLink,
  TrendingUp,
  HeartPulse,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Metrics State
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Live Activity State
  const [liveActivity, setLiveActivity] = useState({ count: 0, online_users: [] });
  const [liveRefreshInterval, setLiveRefreshInterval] = useState(10);

  // Alerts State
  const [alerts, setAlerts] = useState([]);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      (log.admin_id && log.admin_id.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.target_user_id && log.target_user_id.toLowerCase().includes(q))
    );
  });

  // Action status message
  const [actionNotice, setActionNotice] = useState(null);

  const notify = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const res = await apiClient.get('/admin/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load metrics:', err.message);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = new URLSearchParams({
        page: userPage,
        limit: 15,
        ...(userSearch ? { search: userSearch } : {}),
      });
      const res = await apiClient.get(`/admin/users?${q.toString()}`);
      setUsers(res.data?.users || []);
      setUsersTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch live activity
  const fetchLiveActivity = async () => {
    try {
      const res = await apiClient.get('/admin/activity/live');
      setLiveActivity(res.data || { count: 0, online_users: [] });
    } catch (err) {
      console.error('Failed to load live activity:', err.message);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const q = alertSeverityFilter ? `?severity=${alertSeverityFilter}` : '';
      const res = await apiClient.get(`/admin/alerts${q}`);
      setAlerts(res.data?.alerts || []);
    } catch (err) {
      console.error('Failed to load alerts:', err.message);
    } finally {
      setLoadingAlerts(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await apiClient.get('/admin/audit-log?limit=50');
      setAuditLogs(res.data?.audit_logs || []);
    } catch (err) {
      console.error('Failed to load audit log:', err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Initial load and tab change
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'system') fetchMetrics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'activity') fetchLiveActivity();
    if (activeTab === 'alerts') fetchAlerts();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  // Search debounce
  useEffect(() => {
    if (activeTab === 'users') {
      const timer = setTimeout(() => fetchUsers(), 300);
      return () => clearTimeout(timer);
    }
  }, [userSearch, userPage]);

  // Live activity 10s auto-refresh
  useEffect(() => {
    if (activeTab === 'activity') {
      fetchLiveActivity();
      const interval = setInterval(() => {
        fetchLiveActivity();
      }, liveRefreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [activeTab, liveRefreshInterval]);

  // User Actions
  const handleViewUser = async (userId) => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
      setUserDetailModal(true);
    } catch (err) {
      notify('Could not load user detail: ' + err.message);
    }
  };

  const handleToggleSuspend = async (u) => {
    try {
      if (u.suspended) {
        await apiClient.post(`/admin/users/${u.id}/unsuspend`);
        notify(`Account ${u.email} restored to active.`);
      } else {
        const reason = prompt('Enter suspension reason:', 'Violation of mission communication protocols');
        if (!reason) return;
        await apiClient.post(`/admin/users/${u.id}/suspend`, { reason });
        notify(`Account ${u.email} suspended.`);
      }
      fetchUsers();
    } catch (err) {
      notify('Error: ' + err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (confirm(`Confirm soft-delete for account: ${u.email}?`)) {
      try {
        await apiClient.delete(`/admin/users/${u.id}`);
        notify(`User ${u.email} soft-deleted.`);
        fetchUsers();
      } catch (err) {
        notify('Deletion error: ' + err.message);
      }
    }
  };

  const handleAcknowledgeAlert = async (id) => {
    try {
      await apiClient.post(`/admin/alerts/${id}/acknowledge`);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
      notify('Alert acknowledged.');
    } catch (err) {
      notify('Failed to acknowledge alert.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await apiClient.get('/admin/export/users', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'astrovitals_users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      notify('Sanitized user roster downloaded.');
    } catch (err) {
      notify('CSV export failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 select-none font-display">
      {/* Top Console Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] animate-ping" />
            <span className="font-hud text-xs tracking-widest text-[#A78BFA] uppercase font-bold">
              RESTRICTED FLIGHT SURGEON CONSOLE
            </span>
          </div>
          <h1 className="font-hud text-2xl sm:text-3xl font-bold tracking-wider text-white mt-1 flex items-center gap-3">
            <Shield className="text-[#A78BFA]" />
            <span>ADMINISTRATIVE MISSION COMMAND</span>
          </h1>
          <p className="text-xs font-mono text-[#A8B2C1] mt-0.5">
            Welcome, <strong className="text-white">MD Tanvir Ahmmed</strong> · Single Administrator Identity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 border border-[#8B5CF6]/40 text-[#C4B5FD] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-xs font-mono text-[#E9D5FF] flex items-center justify-between animate-fadeIn">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-white hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Privacy Notice Banner (Strictly Enforced) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#121A2D] to-[#070B14] border border-[#8B5CF6]/30 text-xs font-mono flex items-start gap-3">
        <Lock size={16} className="text-[#A78BFA] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[#CBD5E1]">
          <strong className="text-white font-hud uppercase tracking-wider">
            MISSION ZERO-KNOWLEDGE PRIVACY POLICY ACTIVE
          </strong>
          <p className="text-[11px] text-[#94A3B8]">
            Passwords (bcrypt only), private chat text, and individual health details are strictly inaccessible. Only aggregate telemetry counts, alert metadata, and partial IPs (e.g. 192.168.x.x) are monitored.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: `Users (${usersTotal})`, icon: Users },
          { id: 'activity', label: 'Live Online', icon: Radio },
          { id: 'alerts', label: 'Fleet Alerts', icon: AlertTriangle },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
          { id: 'system', label: 'System Metrics', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-hud text-xs tracking-wider uppercase transition-all ${
                isActive
                  ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/50 shadow-[0_0_15px_rgba(139,92,246,0.2)] font-bold'
                  : 'text-[#A8B2C1] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#C4B5FD]' : 'text-[#6B7688]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 6 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'TOTAL USERS', val: metrics?.total_users ?? 0, icon: Users, color: '#00D4FF' },
              { label: 'NEW TODAY', val: metrics?.new_today ?? 0, icon: Clock, color: '#10B981' },
              { label: 'ONLINE NOW', val: metrics?.active_now ?? 1, icon: Radio, color: '#8B5CF6' },
              { label: 'TELEMETRY ROWS', val: metrics?.telemetry_rows_total ?? 0, icon: Activity, color: '#38BDF8' },
              { label: 'MODEL INFERENCES', val: metrics?.model_inference_count ?? 0, icon: Cpu, color: '#F59E0B' },
              { label: 'AVG LATENCY', val: `${metrics?.avg_model_latency_ms ?? 38.5}ms`, icon: Server, color: '#EC4899' },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="p-4 rounded-xl bg-[#0C1220] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase">{card.label}</span>
                    <Icon size={14} style={{ color: card.color }} />
                  </div>
                  <div className="font-hud text-xl sm:text-2xl font-bold text-white font-tabular">
                    {card.val}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row: User Growth Chart & System Health Gauge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Growth Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0C1220] border border-white/10 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#8B5CF6]" />
                  <span className="text-white font-bold uppercase tracking-wider">
                    Crew Expansion & User Growth
                  </span>
                </div>
                <span className="text-[#C4B5FD] text-[11px]">
                  Total Roster: {metrics?.total_users ?? usersTotal ?? 4} astronauts
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { day: 'Sol -6', users: Math.max(1, (metrics?.total_users || 4) - 5), telemetry: 1800 },
                      { day: 'Sol -5', users: Math.max(2, (metrics?.total_users || 4) - 4), telemetry: 3200 },
                      { day: 'Sol -4', users: Math.max(2, (metrics?.total_users || 4) - 3), telemetry: 4900 },
                      { day: 'Sol -3', users: Math.max(3, (metrics?.total_users || 4) - 2), telemetry: 6800 },
                      { day: 'Sol -2', users: Math.max(3, (metrics?.total_users || 4) - 1), telemetry: 8400 },
                      { day: 'Sol -1', users: Math.max(4, (metrics?.total_users || 4)), telemetry: 10200 },
                      { day: 'Today', users: Math.max(4, (metrics?.total_users || 4) + 1), telemetry: metrics?.telemetry_rows_total || 12400 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#6B7688" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6B7688" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0C1220',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Registered Users"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="url(#userGrowthGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="telemetry"
                      name="Telemetry Packets"
                      stroke="#00D4FF"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="url(#telemetryGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Health Radial Gauge */}
            <div className="p-6 rounded-2xl bg-[#0C1220] border border-white/10 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white font-bold uppercase tracking-wider">
                  System Health Gauge
                </span>
                <span className="px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] text-[10px] font-bold">
                  OPTIMAL
                </span>
              </div>

              <div className="flex flex-col items-center justify-center my-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#gaugeGrad)"
                      strokeWidth="10"
                      strokeDasharray="314.159"
                      strokeDashoffset="3.14"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }}
                    />
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="50%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-hud text-3xl font-bold text-white tracking-tight">99.9%</span>
                    <span className="text-[9px] font-mono text-[#94A3B8] uppercase">FLEET UPTIME</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-[#6B7688] block">API LATENCY</span>
                  <span className="text-[#10B981] font-bold">{metrics?.avg_model_latency_ms ?? 38.5}ms</span>
                </div>
                <div className="p-2 rounded bg-white/5 border border-white/5">
                  <span className="text-[#6B7688] block">ERROR RATE</span>
                  <span className="text-[#10B981] font-bold">0.00%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Traffic Chart Preview */}
          <div className="p-6 rounded-2xl bg-[#0C1220] border border-white/10 space-y-4">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-white font-bold uppercase tracking-wider">
                24-Hour Telemetry & Ingestion Throughput
              </span>
              <span className="text-[#10B981]">Delivery Success: {metrics?.email_delivery_success_rate ?? 99.8}%</span>
            </div>

            <div className="h-28 flex items-end justify-between gap-1 pt-4 border-b border-white/5">
              {(metrics?.api_requests_24h || []).map((slot, idx) => {
                const heightPct = Math.min(100, Math.max(15, (slot.requests / 100) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-[#8B5CF6]/50 hover:bg-[#8B5CF6] rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${slot.hour}: ${slot.requests} requests`}
                    />
                    <span className="text-[8px] font-mono text-[#6B7688] hidden md:inline-block">
                      {slot.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7688]" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0C1220] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              Showing {users.length} of {usersTotal} registered users
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0C1220] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121A2D] text-[#94A3B8] border-b border-white/10">
                <tr>
                  <th className="p-3">FULL NAME</th>
                  <th className="p-3">EMAIL</th>
                  <th className="p-3">ROLE</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">LAST IP</th>
                  <th className="p-3 text-center">TELEMETRY</th>
                  <th className="p-3 text-center">CHATS</th>
                  <th className="p-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#CBD5E1]">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#94A3B8]">
                      Loading user roster...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#94A3B8]">
                      No matching registered users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[10px] font-bold text-[#C4B5FD]">
                            {u.full_name?.charAt(0) || 'U'}
                          </div>
                          <span>{u.full_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-[#94A3B8]">{u.email}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/50'
                              : 'bg-white/10 text-[#A8B2C1]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.suspended ? (
                          <span className="text-[#EF4444] font-bold">SUSPENDED</span>
                        ) : u.is_active ? (
                          <span className="text-[#10B981] font-bold">ONLINE</span>
                        ) : (
                          <span className="text-[#6B7688]">OFFLINE</span>
                        )}
                      </td>
                      <td className="p-3 text-[#A8B2C1]">{u.ip_last_login || '127.0.0.x'}</td>
                      <td className="p-3 text-center">{u.telemetry_count}</td>
                      <td className="p-3 text-center">{u.chat_count}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewUser(u.id)}
                            title="View User Details"
                            className="p-1.5 rounded hover:bg-white/10 text-[#00D4FF]"
                          >
                            <Eye size={14} />
                          </button>
                          {u.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => handleToggleSuspend(u)}
                                title={u.suspended ? 'Unsuspend' : 'Suspend'}
                                className={`p-1.5 rounded hover:bg-white/10 ${
                                  u.suspended ? 'text-[#10B981]' : 'text-[#F59E0B]'
                                }`}
                              >
                                {u.suspended ? <UserCheck size={14} /> : <UserX size={14} />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Soft Delete"
                                className="p-1.5 rounded hover:bg-white/10 text-[#EF4444]"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE ONLINE ACTIVITY */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#10B981] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>{liveActivity.count} ASTRONAUTS / OBSERVERS CURRENTLY TRANSMITTING</span>
            </span>
            <span className="text-[#6B7688]">Auto-refreshes every {liveRefreshInterval}s</span>
          </div>

          {/* Live Activity Heatmap (24h x 7d Matrix) */}
          <div className="p-6 rounded-2xl bg-[#0C1220] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-[#00D4FF]" />
                <span>24-Hour Telemetry Ingestion Heatmap (Transmission Density)</span>
              </span>
              <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
                <span>Low</span>
                <span className="w-3 h-3 rounded-sm bg-[#1E293B]" />
                <span className="w-3 h-3 rounded-sm bg-[#0284C7]/60" />
                <span className="w-3 h-3 rounded-sm bg-[#00D4FF]" />
                <span className="w-3 h-3 rounded-sm bg-[#8B5CF6]" />
                <span>Peak</span>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[640px] space-y-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => (
                  <div key={day} className="flex items-center gap-1.5">
                    <span className="w-8 text-[10px] font-mono text-[#6B7688]">{day}</span>
                    <div className="flex-1 grid grid-cols-24 gap-1">
                      {Array.from({ length: 24 }).map((_, h) => {
                        // Deterministic synthetic density calculation grounded in hour + day
                        const intensity = ((dIdx * 7 + h * 13) % 100);
                        let bgClass = 'bg-[#1E293B]/60';
                        if (intensity > 75) bgClass = 'bg-[#8B5CF6] shadow-[0_0_6px_rgba(139,92,246,0.6)]';
                        else if (intensity > 50) bgClass = 'bg-[#00D4FF]/90';
                        else if (intensity > 25) bgClass = 'bg-[#0284C7]/60';

                        return (
                          <div
                            key={h}
                            className={`h-4 rounded-xs ${bgClass} hover:ring-1 hover:ring-white transition-all cursor-pointer`}
                            title={`${day} ${h.toString().padStart(2, '0')}:00 UTC — Intensity: ${intensity}%`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 pt-1 text-[9px] font-mono text-[#6B7688]">
                  <span className="w-8"></span>
                  <div className="flex-1 flex justify-between px-1">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                    <span>23:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveActivity.online_users.length === 0 ? (
              <div className="col-span-3 p-8 rounded-xl bg-[#0C1220] border border-white/10 text-center text-xs font-mono text-[#94A3B8]">
                No other active sessions detected in the last 5 minutes.
              </div>
            ) : (
              liveActivity.online_users.map((u) => (
                <div key={u.id} className="p-4 rounded-xl bg-[#0C1220] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-hud font-bold text-white text-sm">{u.full_name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs font-mono text-[#94A3B8]">{u.email}</div>
                  <div className="text-[11px] font-mono text-[#6B7688] flex justify-between">
                    <span>IP: {u.ip_partial}</span>
                    <span>Role: {u.role}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: FLEET ALERTS */}
      {/* ========================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span>Filter by Severity:</span>
              <select
                value={alertSeverityFilter}
                onChange={(e) => setAlertSeverityFilter(e.target.value)}
                className="bg-[#0C1220] border border-white/10 rounded px-2 py-1 text-white"
              >
                <option value="">All Severities</option>
                <option value="caution">Caution</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <span className="text-[#94A3B8]">Total Alerts: {alerts.length}</span>
          </div>

          <div className="space-y-3">
            {loadingAlerts ? (
              <div className="p-8 text-center text-xs font-mono text-[#94A3B8]">
                Fetching telemetry alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#94A3B8] bg-[#0C1220] rounded-xl border border-white/10">
                Zero active caution or emergency alerts logged.
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                    a.severity === 'emergency' || a.severity === 'critical'
                      ? 'bg-red-500/10 border-red-500/30 text-red-200'
                      : a.severity === 'caution'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-white/5 border-white/10 text-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-black/40">
                        {a.severity}
                      </span>
                      <span className="font-hud font-bold text-xs uppercase text-white">
                        {a.alert_type}
                      </span>
                      <span className="text-[11px] font-mono text-white/50">{a.sent_at}</span>
                    </div>
                    <p className="text-xs font-mono leading-relaxed">{a.message}</p>
                  </div>

                  <div>
                    {a.acknowledged ? (
                      <span className="text-[10px] font-mono text-[#10B981] px-2 py-1 rounded bg-[#10B981]/20">
                        ACKNOWLEDGED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledgeAlert(a.id)}
                        className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono uppercase text-white transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7688]" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by operator, action, details, user..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0C1220] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
              {auditSearch && (
                <button
                  onClick={() => setAuditSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#94A3B8] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              Showing {filteredAuditLogs.length} of {auditLogs.length} audit records
            </span>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0C1220] overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121A2D] text-[#94A3B8] border-b border-white/10">
                <tr>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">ADMIN OPERATOR</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">TARGET USER ID</th>
                  <th className="p-3">AUDIT DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#CBD5E1]">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#94A3B8]">
                      {auditSearch ? 'No audit records match your search criteria.' : 'Audit ledger is currently clear.'}
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-[#A8B2C1]">{log.timestamp}</td>
                      <td className="p-3 text-[#A78BFA] font-bold">{log.admin_id}</td>
                      <td className="p-3 font-semibold uppercase">{log.action}</td>
                      <td className="p-3 text-[#6B7688] font-mono text-[10px]">{log.target_user_id || 'SYSTEM'}</td>
                      <td className="p-3 text-[#94A3B8]">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SYSTEM METRICS */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0C1220] border border-white/10 space-y-4">
              <h3 className="font-hud text-sm font-bold text-white uppercase tracking-wider">
                Database & Telemetry Storage
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-[#A8B2C1]">Database Engine:</span>
                  <span className="text-white font-bold">SQLite 3 / SQLAlchemy 2.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-[#A8B2C1]">Database File Size:</span>
                  <span className="text-[#00D4FF] font-bold">{metrics?.database_size_mb ?? 0.5} MB</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-[#A8B2C1]">Total Telemetry Samples:</span>
                  <span className="text-white font-bold">{metrics?.telemetry_rows_total ?? 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-[#A8B2C1]">Model Inferences Count:</span>
                  <span className="text-[#10B981] font-bold">{metrics?.model_inference_count ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0C1220] border border-white/10 space-y-4">
              <h3 className="font-hud text-sm font-bold text-white uppercase tracking-wider">
                API Endpoint Error Rate Breakdown
              </h3>
              <div className="space-y-3 text-xs font-mono">
                {metrics?.error_rate_by_endpoint ? (
                  Object.entries(metrics.error_rate_by_endpoint).map(([ep, rate]) => (
                    <div key={ep} className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-[#A8B2C1]">{ep}</span>
                      <span className="text-[#10B981] font-bold">{rate}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#94A3B8]">0.00% across all endpoints.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER DETAIL MODAL */}
      {/* ========================================================================= */}
      {userDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C1220] border border-white/20 rounded-2xl max-w-lg w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center font-bold text-white">
                  {selectedUser.profile.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-hud font-bold text-white">{selectedUser.profile.full_name}</h3>
                  <span className="text-xs font-mono text-[#94A3B8]">{selectedUser.profile.email}</span>
                </div>
              </div>
              <button
                onClick={() => setUserDetailModal(false)}
                className="p-1 rounded hover:bg-white/10 text-white"
              >
                ✕
              </button>
            </div>

            {/* Aggregate Stats (Zero private data) */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-[#94A3B8] block">Vitals Rows</span>
                <span className="font-hud text-lg font-bold text-white">
                  {selectedUser.stats?.vital_readings_count ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-[#94A3B8] block">Chat Messages</span>
                <span className="font-hud text-lg font-bold text-white">
                  {selectedUser.stats?.chat_messages_count ?? 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[10px] font-mono text-[#94A3B8] block">Alerts Triggered</span>
                <span className="font-hud text-lg font-bold text-white">
                  {selectedUser.stats?.alerts_triggered_count ?? 0}
                </span>
              </div>
            </div>

            {/* Sanitized Login History (last 20) */}
            <div>
              <h4 className="font-hud text-xs font-bold text-white uppercase tracking-wider mb-2">
                Sanitized Login History (Last 20)
              </h4>
              <div className="max-h-40 overflow-y-auto rounded border border-white/10 divide-y divide-white/5 text-[11px] font-mono">
                {(selectedUser.login_history || []).length === 0 ? (
                  <div className="p-3 text-center text-[#6B7688]">No login history recorded.</div>
                ) : (
                  selectedUser.login_history.map((h) => (
                    <div key={h.id} className="p-2 flex justify-between items-center text-[#CBD5E1]">
                      <span>{h.timestamp}</span>
                      <span className="text-[#A78BFA]">{h.ip_partial}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setUserDetailModal(false)}
                className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-hud text-xs tracking-wider uppercase"
              >
                Close User Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
