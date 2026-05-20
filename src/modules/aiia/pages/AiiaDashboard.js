"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ShieldCheck, ClipboardList, BarChart3, RefreshCw, Edit,
  FileText, Clock, CheckCircle2, AlertCircle,
  Plus, TrendingUp, UserCheck, Eye, Layers,
  Brain,
} from 'lucide-react';
import PlanAssessmentModal from '../components/PlanAssessmentModal';
import MyAssignments from '../pages/MyAssignments';
import ManageAiiaModal from './ManageAiiaModal';
import { stage1Api, stage2Api, risksApi } from '../services/aiiaApi';
import { captureActivity } from '../../../services/activities';

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
function PieTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 150,
    }}>
      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13, marginBottom: 2 }}>{d.name}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{d.value}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{((d.value / (total || 1)) * 100).toFixed(1)}% of total</div>
    </div>
  );
}

function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    }}>
      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{d.name}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{d.value}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>assessments</div>
    </div>
  );
}

function getMonthLabel(dateStr) {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }); }
  catch { return null; }
}

// ─── Status display helpers ───────────────────────────────────────────────────
const STATUS_LABEL = {
  DRAFT:     'Pending',
  SUBMITTED: 'Completed',
  APPROVED:  'Approved',
  REJECTED:  'Rejected',
};

const STATUS_COLORS = {
  DRAFT:     { bg: '#fef3c7', color: '#b45309' },
  SUBMITTED: { bg: '#d1fae5', color: '#065f46' },
  APPROVED:  { bg: '#ede9fe', color: '#5b21b6' },
  REJECTED:  { bg: '#fee2e2', color: '#dc2626' },
};

// ─── Shared Charts Column ─────────────────────────────────────────────────────
function ChartsColumn({ total, pieData, barData, BAR_COLORS, loadingStats, stats }) {
  const chartsContainerRef = useRef(null);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      clearTimeout(window._aiiaRO);
      window._aiiaRO = setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    });
    if (chartsContainerRef.current) ro.observe(chartsContainerRef.current);
    return () => { if (chartsContainerRef.current) ro.unobserve(chartsContainerRef.current); };
  }, []);

  return (
    <div ref={chartsContainerRef} className="space-y-6">
      {/* Pie Chart */}
      <motion.div
        className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72 flex flex-col"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ scale: 1.01 }}
      >
        <h3 className="text-base font-semibold text-slate-800 mb-4">Assessment Status</h3>
        <div className="flex-1 flex items-center justify-center min-h-0">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={75} paddingAngle={3} stroke="white" strokeWidth={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip total={total} />} />
                <text x="50%" y="43%" textAnchor="middle" dominantBaseline="middle" style={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}>Total</text>
                <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" style={{ fill: '#1e293b', fontSize: 22, fontWeight: 800 }}>{total}</text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <ShieldCheck size={40} className="text-slate-300 mb-3" strokeWidth={1.5} />
              <p className="text-base font-semibold text-slate-400 mb-1">No Assessments Yet</p>
              <p className="text-sm text-slate-400">Create your first assessment to get started</p>
            </div>
          )}
        </div>
        {total > 0 && (
          <div className="flex gap-4 justify-center mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Bar Chart */}
      <motion.div
        className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-72"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ scale: 1.01 }}
      >
        <div className="mb-3">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Assessment Trends</h3>
          <p className="text-xs text-slate-500">
            Assessments by month{' '}
            <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">{total} total</span>
          </p>
        </div>
        {barData.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid vertical={false} stroke="#f8fafc" strokeDasharray="3 3" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} />
              <YAxis hide />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={24}>
                {barData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BarChart3 size={40} className="text-slate-300 mb-3" strokeWidth={1.5} />
            <p className="text-base font-semibold text-slate-400 mb-1">No Trend Data</p>
            <p className="text-sm text-slate-400">Assessments need date fields for trends</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AiiaDashboard() {
  const router = useRouter();

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userRoles = Array.isArray(user?.role) ? user.role : user?.role ? [user.role] : [];

  // ── Role checks ───────────────────────────────────────────────────────────
  const isRoot  = userRoles.includes('root');
  const isAio   = userRoles.includes('aio');
  const isRisk  = userRoles.some(r => r?.toLowerCase().includes('risk'));
  const canPlan = isRoot || isAio;

  // ── State ─────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalAssessments: 0, approvedCount: 0,
    pendingCount: 0, highRisks: 0, averageCompletion: 0,
    draftCount: 0, submittedCount: 0,
  });
  const [assessments, setAssessments]             = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [loadingStats, setLoadingStats]           = useState(true);
  const [error, setError]                         = useState(null);
  const [showPlanModal, setShowPlanModal]         = useState(false);
  const [showMyAssignments, setShowMyAssignments] = useState(false);
  const [showManageModal, setShowManageModal]     = useState(false);

  // ── Data fetch ────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadingStats(true);
    setError(null);
    try {
      const [s1Res, s2Res, riskRes] = await Promise.all([
        stage1Api.getAll(),
        stage2Api.getAll(),
        risksApi.getAll(),
      ]);

      const stage1Data = s1Res.data.data   || [];
      const stage2Data = s2Res.data.data   || [];
      const risksData  = riskRes.data.data || [];

      const draftCount     = stage1Data.filter(a => a.status === 'DRAFT').length;
      const submittedCount = stage1Data.filter(a => a.status === 'SUBMITTED').length;
      const approvedCount  = stage1Data.filter(a => a.status === 'APPROVED').length;

      const highRisks     = risksData.filter(r => r.likelihood === 'HIGH' && r.impact === 'HIGH').length;
      const avgCompletion = stage2Data.length > 0
        ? Math.round(stage2Data.reduce((sum, a) => sum + (a.completionPercentage || 0), 0) / stage2Data.length)
        : 0;

      setStats({
        totalAssessments: stage1Data.length,
        approvedCount,
        pendingCount: draftCount,
        highRisks,
        avgCompletion,
        draftCount,
        submittedCount,
      });
      setAssessments(stage1Data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { 
    fetchDashboardData(); 
    captureActivity({ action: 'AIIA_DASHBOARD_VISITED', item: 'Visited AI Impact Assessment Dashboard' });
  }, [fetchDashboardData]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const total = stats.totalAssessments;

  const pieData = [
    { name: 'Approved',  value: stats.approvedCount,  color: '#10b981' },
    { name: 'Completed', value: stats.submittedCount, color: '#6366f1' },
    { name: 'Pending',   value: stats.draftCount,     color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const monthlyMap = assessments.reduce((acc, a) => {
    const m = getMonthLabel(a.createdAt);
    if (m) acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const barData = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    .map(m => ({ name: m, value: monthlyMap[m] || 0 }));
  const BAR_COLORS = [
    '#3b82f6','#60a5fa','#93c5fd','#bfdbfe','#dbeafe','#eff6ff',
    '#e0f2fe','#bae6fd','#7dd3fc','#38bdf8','#0ea5e9','#0284c7',
  ];

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    { label: 'Total',        value: total,                     Icon: FileText,     color: 'from-blue-400 to-blue-500' },
    { label: 'Approved',     value: stats.approvedCount,       Icon: CheckCircle2, color: 'from-emerald-400 to-emerald-500' },
    { label: 'Completed',    value: stats.submittedCount,      Icon: UserCheck,    color: 'from-indigo-400 to-indigo-500' },
    { label: 'Pending',      value: stats.draftCount,          Icon: Clock,        color: 'from-amber-400 to-amber-500' },
    { label: 'Avg Complete', value: `${stats.avgCompletion}%`, Icon: TrendingUp,   color: 'from-violet-400 to-violet-500' },
  ];

  // ── Quick actions — root/AIO: View + Plan + Manage (mirrors DPIA pattern) ─
  const rootAioActions = [
    {
      key: 'view',
      Icon: Eye,
      title: 'View Assessments',
      subtitle: 'Browse all AIIA assessments',
      color: 'from-emerald-400 to-emerald-600',
      onClick: () => router.push('/aiia/my-assignments'),
    },
    {
      key: 'plan',
      Icon: Plus,
      title: 'Plan Assessment',
      subtitle: 'Create a new AI assessment',
      color: 'from-blue-400 to-blue-600',
      onClick: () => setShowPlanModal(true),
    },
    {
      key: 'manage',
      Icon: Layers,
      title: 'Manage AIIA',
      subtitle: 'Edit or delete assessments',
      color: 'from-amber-400 to-amber-600',
      onClick: () => setShowManageModal(true),
    },
  ];

  // ── Quick actions — risk owner ─────────────────────────────────────────────
  const riskOwnerActions = [
    {
      key: 'assignments',
      Icon: ClipboardList,
      title: 'Conduct AIIA',
      subtitle: 'View your assigned assessments',
      color: 'from-violet-400 to-violet-600',
      onClick: () => setShowMyAssignments(true),
    },
    {
      key: 'view',
      Icon: Eye,
      title: 'View Assessments',
      subtitle: 'Browse all AIIA assessments',
      color: 'from-emerald-400 to-emerald-600',
      onClick: () => router.push('/aiia/my-assignments'),
    },
  ];

  const quickActions = canPlan ? rootAioActions : riskOwnerActions;

  // ── Role badge ────────────────────────────────────────────────────────────
  const roleBadge = isRoot
    ? { label: 'Root',       style: 'bg-blue-100 text-blue-700' }
    : isAio
    ? { label: 'AIO',        style: 'bg-indigo-100 text-indigo-700' }
    : isRisk
    ? { label: 'Risk Owner', style: 'bg-violet-100 text-violet-700' }
    : null;

  // ── My Assignments modal — rendered inline at bottom of dashboard ─────────
  // (see AnimatePresence block near end of JSX)

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-28">

        {/* ── HEADER ── */}
        <motion.header
          className="bg-white/80 backdrop-blur-md border border-slate-100/50 rounded-xl shadow-md mb-6 p-6"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Brain className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-800 leading-tight">
                  AI Impact Assessment
                </h1>
                <p className="text-base text-slate-600 mt-1">
                  {isRoot ? 'Root Dashboard' : isAio ? 'AIO Dashboard' : 'Risk Owner Dashboard'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {roleBadge && (
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${roleBadge.style}`}>
                  {roleBadge.label}
                </span>
              )}
              <span className="text-sm font-semibold text-slate-600">{user?.name || 'User'}</span>
              <motion.button
                onClick={fetchDashboardData}
                title="Refresh"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw
                  size={15}
                  className="text-slate-500"
                  style={loading ? { animation: 'spin 1s linear infinite' } : {}}
                />
              </motion.button>
            </div>
          </div>
        </motion.header>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
            ⚠ {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* ══════════════════════════════════════════════════════════════════
              LEFT COLUMN — split by role (mirrors DPIA pattern exactly)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-8">

            {/* ── ROOT / AIO: stat cards + actions ── */}
            {canPlan && (
              <>
                {/* Stat Cards */}
                <motion.section
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {statCards.map((stat, i) => {
                    const Icon = stat.Icon;
                    return (
                      <motion.div
                        key={stat.label}
                        className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3 h-20 hover:bg-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                          <Icon size={20} className="text-white drop-shadow-sm" />
                        </div>
                        <div>
                          <span className="text-2xl font-semibold text-slate-800 block leading-tight group-hover:text-slate-900">
                            {loadingStats ? '—' : stat.value}
                          </span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {stat.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.section>

                {/* Quick Actions — root/AIO: View + Plan + Manage */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                      {quickActions.map((action, i) => {
                        const Icon = action.Icon;
                        return (
                          <motion.div
                            key={action.key}
                            className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={action.onClick}
                          >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md mb-4`}>
                              <Icon size={22} className="text-white drop-shadow-sm" />
                            </div>
                            <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </p>
                            <p className="text-xs text-slate-500">{action.subtitle}</p>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.section>
              </>
            )}

            {/* ── RISK OWNER: assignment summary card + actions ── */}
            {!canPlan && (
              <>
                {/* Assignment summary card — mirrors DPIA risk owner card */}
                <motion.div
                  className="bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center shadow-md">
                      <UserCheck size={18} className="text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700">
                      AIIAs assigned to {user?.name || 'you'}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    Open "Conduct AIIA" to view your assigned assessments and complete the checklist, or "View Assessments" to browse all AI Impact Assessments in your organisation.
                  </p>
                </motion.div>

                {/* Quick Actions — risk owner: Conduct + View */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {quickActions.map((action, i) => {
                        const Icon = action.Icon;
                        return (
                          <motion.div
                            key={action.key}
                            className="group bg-white/70 backdrop-blur-sm border border-slate-100/50 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:bg-white transition-all duration-300 cursor-pointer"
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={action.onClick}
                          >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md mb-4`}>
                              <Icon size={22} className="text-white drop-shadow-sm" />
                            </div>
                            <p className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </p>
                            <p className="text-xs text-slate-500">{action.subtitle}</p>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.section>
              </>
            )}

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              RIGHT COLUMN — charts (same for all roles)
          ══════════════════════════════════════════════════════════════════ */}
          <ChartsColumn
            total={total}
            pieData={pieData}
            barData={barData}
            BAR_COLORS={BAR_COLORS}
            loadingStats={loadingStats}
            stats={stats}
          />

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-slate-100/50 shadow-lg px-8 py-5 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} CalVant. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── MY ASSIGNMENTS MODAL ── */}
      <AnimatePresence>
        {showMyAssignments && (
          <>
            {/* Backdrop */}
            <motion.div
              key="assignments-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setShowMyAssignments(false); fetchDashboardData(); }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(15, 34, 71, 0.45)',
                backdropFilter: 'blur(4px)',
                zIndex: 100,
              }}
            />
            {/* Centering wrapper */}
            <div style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 101, pointerEvents: 'none',
            }}>
            {/* Panel */}
            <motion.div
              key="assignments-panel"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: 'min(780px, 95vw)',
                maxHeight: '82vh',
                background: '#fff',
                borderRadius: 20,
                boxShadow: '0 24px 80px rgba(15,34,71,0.22)',
                pointerEvents: 'all',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 24px 16px',
                borderBottom: '1px solid #e4eaf4',
                background: 'linear-gradient(90deg, #0f224708, transparent)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ClipboardList size={17} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f2247' }}>My Assignments</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Click an assessment to open it</div>
                  </div>
                </div>
                <button
                  onClick={() => { setShowMyAssignments(false); fetchDashboardData(); }}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #e4eaf4', background: '#f8fafc',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16, color: '#64748b',
                    fontWeight: 700,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
                <MyAssignments
                  onSelectAssignment={(assignment) => {
                    router.push({
                      pathname: `/aiia/my-assignments/${assignment._id || assignment.id}`,
                      state: { assignment },
                    });
                    setShowMyAssignments(false);
                  }}
                />
              </div>
            </motion.div>
            </div>{/* end centering wrapper */}
          </>
        )}
      </AnimatePresence>

      {/* ── EXISTING MODALS ── */}
      {showManageModal && (
        <ManageAiiaModal
          onClose={() => setShowManageModal(false)}
          onSaved={() => { setShowManageModal(false); fetchDashboardData(); }}
        />
      )}
      {showPlanModal && (
        <PlanAssessmentModal
          onClose={() => setShowPlanModal(false)}
          onSaved={() => { setShowPlanModal(false); fetchDashboardData(); }}
        />
      )}
    </div>
  );
}
