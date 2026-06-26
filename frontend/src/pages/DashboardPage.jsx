import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, Camera, Package, IndianRupee, AlertCircle,
  TrendingUp, ArrowUpRight, Clock, CheckCircle2, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981'];

const fmtCurrency = v => `₹${Number(v||0).toLocaleString('en-IN')}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const daysBetween = d => d ? Math.max(0, Math.round((Date.now()-new Date(d))/(1000*86400))) : 0;

const StatCard = ({ label, value, icon: Icon, gradient, change, prefix='' }) => (
  <div className="card card-stat animate-slide-up" style={{ background:'var(--bg-card)' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:8, letterSpacing:'0.02em' }}>{label}</p>
        <p style={{ fontSize:30, fontWeight:800, color:'var(--text-primary)', fontFamily:'Outfit,sans-serif', letterSpacing:'-0.5px' }}>
          {prefix}{typeof value==='number' ? value.toLocaleString('en-IN') : value}
        </p>
        {change !== undefined && (
          <p style={{ fontSize:12, color:'#10B981', display:'flex', alignItems:'center', gap:4, marginTop:6, fontWeight:600 }}>
            <TrendingUp size={12}/> {change}% vs last month
          </p>
        )}
      </div>
      <div className={`${gradient}`} style={{ width:52, height:52, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(0,0,0,0.15)' }}>
        <Icon size={24} color="#fff" />
      </div>
    </div>
  </div>
);

const PaymentBadge = ({ status }) => {
  const map = {
    fully_paid: { label:'Fully Paid', cls:'badge-success' },
    deposit_received: { label:'Deposit Paid', cls:'badge-info' },
    partially_paid: { label:'Partial', cls:'badge-warning' },
    pending: { label:'Pending', cls:'badge-danger' },
  };
  const s = map[status] || { label: status||'—', cls:'badge-gray' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

const StageBadge = ({ stage }) => {
  const map = {
    enquiry:'badge-gray', confirmed:'badge-info', shoot_scheduled:'badge-primary',
    editing:'badge-warning', delivered:'badge-success'
  };
  return <span className={`badge ${map[stage]||'badge-gray'}`}>{stage?.replace('_',' ')}</span>;
};

const ActivityIcon = ({ type }) => {
  const m = {
    client_added: { bg:'rgba(99,102,241,0.12)', color:'#6366F1' },
    payment_received: { bg:'rgba(16,185,129,0.12)', color:'#10B981' },
    delivery: { bg:'rgba(139,92,246,0.12)', color:'#8B5CF6' },
    contract_signed: { bg:'rgba(59,130,246,0.12)', color:'#3B82F6' },
    stage_updated: { bg:'rgba(245,158,11,0.12)', color:'#F59E0B' },
    lead_added: { bg:'rgba(236,72,153,0.12)', color:'#EC4899' },
  };
  const s = m[type] || { bg:'rgba(100,116,139,0.12)', color:'#64748B' };
  return (
    <div className="activity-dot" style={{ background:s.bg }}>
      <Activity size={14} color={s.color} />
    </div>
  );
};

const timeAgo = ts => {
  const diff = Date.now() - new Date(ts);
  const mins = Math.floor(diff/60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [stages, setStages] = useState([]);
  const [leadTrend, setLeadTrend] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [pending, setPending] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, p, l, u, pd] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/reports/revenue'),
          api.get('/reports/projects'),
          api.get('/reports/leads'),
          api.get('/reports/upcoming-shoots'),
          api.get('/reports/pending-deliveries'),
        ]);
        setStats(s.data);
        setRevenue(Array.isArray(r.data) ? r.data : []);
        setStages(Array.isArray(p.data.byStage) ? p.data.byStage.map(x=>({...x,count:parseInt(x.count) || 0})) : []);
        setLeadTrend(Array.isArray(l.data.monthly) ? l.data.monthly.map(x=>({...x,count:parseInt(x.count) || 0})) : []);
        setUpcoming(Array.isArray(u.data) ? u.data : []);
        setPending(Array.isArray(pd.data) ? pd.data : []);
        setActivities(Array.isArray(s.data.recentActivities) ? s.data.recentActivities : []);
      } catch {
        setStats({ totalClients:0, activeProjects:0, upcomingShoots:0, pendingDeliveries:0, revenueThisMonth:0, outstandingPayments:0, recentActivities:[] });
        setRevenue([]); setStages([]); setLeadTrend([]);
        setUpcoming([]); setPending([]); setActivities([]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h<12) return 'Good morning';
    if (h<17) return 'Good afternoon';
    return 'Good evening';
  };

  const STAT_CARDS = stats ? [
    { label:'Total Clients', value:stats.totalClients, icon:Users, gradient:'stat-gradient-1', change:12 },
    { label:'Active Projects', value:stats.activeProjects, icon:Briefcase, gradient:'stat-gradient-2', change:8 },
    { label:'Upcoming Shoots', value:stats.upcomingShoots, icon:Camera, gradient:'stat-gradient-3' },
    { label:'Pending Deliveries', value:stats.pendingDeliveries, icon:Package, gradient:'stat-gradient-4' },
    { label:'Revenue This Month', value:fmtCurrency(stats.revenueThisMonth), icon:IndianRupee, gradient:'stat-gradient-5', change:15 },
    { label:'Outstanding Payments', value:fmtCurrency(stats.outstandingPayments), icon:AlertCircle, gradient:'stat-gradient-6' },
  ] : [];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'4px solid var(--border)', borderTopColor:'var(--primary)', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', boxShadow:'var(--shadow-lg)' }}>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ fontSize:13, fontWeight:600, color:p.color }}>
            {p.name==='collected'?'Collected':'Total'}: {typeof p.value==='number'&&p.value>1000?`₹${p.value.toLocaleString('en-IN')}`:p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's what's happening at thereelshoot today</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Revenue bar chart */}
        <div className="chart-container">
          <p className="chart-title">Monthly Revenue</p>
          <p className="chart-subtitle">Collected vs total billed</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenue} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Bar dataKey="total" name="total" fill="#E0E7FF" radius={[4,4,0,0]} />
              <Bar dataKey="collected" name="collected" fill="#6366F1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="chart-container">
          <p className="chart-title">Pipeline Status</p>
          <p className="chart-subtitle">Projects by stage</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={stages} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {stages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v,n)=>[v, n.replace('_',' ')]} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:13 }} />
              <Legend formatter={v=>v.replace('_',' ')} wrapperStyle={{ fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lead conversion line chart */}
      <div className="chart-container" style={{ marginBottom:28 }}>
        <p className="chart-title">Lead Acquisition Trend</p>
        <p className="chart-subtitle">New leads per month</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={leadTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, fontSize:13 }} />
            <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} dot={{ fill:'#6366F1', r:4 }} activeDot={{ r:6 }} name="Leads" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tables */}
      <div className="tables-grid">
        {/* Upcoming shoots */}
        <div className="table-container">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-light)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, fontFamily:'Outfit,sans-serif' }}>Upcoming Shoots</h3>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Next 30 days</p>
            </div>
            <Link to="/calendar" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Event Type</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length ? upcoming.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.phone||''}</div>
                  </td>
                  <td><span className="badge badge-primary">{u.event_type}</span></td>
                  <td style={{ fontSize:13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{fmtDate(u.event_date)}</td>
                  <td><StageBadge stage={u.stage} /></td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ textAlign:'center', padding:32, color:'var(--text-muted)', fontSize:14 }}>No upcoming shoots 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pending deliveries */}
        <div className="table-container">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-light)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, fontFamily:'Outfit,sans-serif' }}>Pending Deliveries</h3>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Currently in editing</p>
            </div>
            <Link to="/pipeline" className="btn btn-secondary btn-sm">Pipeline</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Event Date</th>
                <th>Delay</th>
              </tr>
            </thead>
            <tbody>
              {pending.length ? pending.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight:600, fontSize:13 }}>{p.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.event_type}</div>
                  </td>
                  <td style={{ fontSize:13, color:'var(--text-secondary)', whiteSpace:'nowrap' }}>{fmtDate(p.event_date)}</td>
                  <td>
                    {(parseInt(p.delay_days)||daysBetween(p.event_date)) > 0 ? (
                      <span className="badge badge-danger">
                        <Clock size={10} /> {parseInt(p.delay_days)||daysBetween(p.event_date)} days
                      </span>
                    ) : <span className="badge badge-success"><CheckCircle2 size={10}/> On time</span>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} style={{ textAlign:'center', padding:32, color:'var(--text-muted)', fontSize:14 }}>No pending deliveries 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="chart-container">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, fontFamily:'Outfit,sans-serif' }}>Recent Activity</h3>
            <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Latest updates across your studio</p>
          </div>
          <ArrowUpRight size={18} color="var(--text-muted)" />
        </div>
        {activities.map(a => (
          <div key={a.id} className="activity-item">
            <ActivityIcon type={a.type} />
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:14, color:'var(--text-primary)', fontWeight:500, marginBottom:2 }}>{a.description}</p>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>{timeAgo(a.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

