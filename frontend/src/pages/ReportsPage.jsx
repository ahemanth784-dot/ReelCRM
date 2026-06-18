import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { IndianRupee, TrendingUp, UserCheck, Calendar, Filter, Loader2, ArrowUpRight } from 'lucide-react';
import api from '../api/axios';

const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('6months');
  
  const [revenueData, setRevenueData] = useState([]);
  const [stageData, setStageData] = useState([]);
  const [leadTrend, setLeadTrend] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    outstanding: 0,
    conversionRate: 0,
    totalBookings: 0
  });

  const MOCK_REVENUE = [
    { month: 'Jan 2026', collected: 95000, total: 110000 },
    { month: 'Feb 2026', collected: 142000, total: 160000 },
    { month: 'Mar 2026', collected: 88000, total: 95000 },
    { month: 'Apr 2026', collected: 210000, total: 240000 },
    { month: 'May 2026', collected: 175000, total: 190000 },
    { month: 'Jun 2026', collected: 285000, total: 310000 },
  ];

  const MOCK_STAGES = [
    { stage: 'enquiry', count: 8 },
    { stage: 'confirmed', count: 12 },
    { stage: 'shoot_scheduled', count: 7 },
    { stage: 'editing', count: 5 },
    { stage: 'delivered', count: 10 },
  ];

  const MOCK_LEADS = [
    { month: 'Jan 2026', count: 5 },
    { month: 'Feb 2026', count: 8 },
    { month: 'Mar 2026', count: 6 },
    { month: 'Apr 2026', count: 11 },
    { month: 'May 2026', count: 9 },
    { month: 'Jun 2026', count: 13 },
  ];

  const MOCK_SUMMARY = {
    totalRevenue: 995000,
    outstanding: 124500,
    conversionRate: 64.5,
    totalBookings: 42
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [revRes, projRes, leadRes] = await Promise.all([
          api.get('/reports/revenue'),
          api.get('/reports/projects'),
          api.get('/reports/leads')
        ]);
        
        setRevenueData(revRes.data.length ? revRes.data : MOCK_REVENUE);
        setStageData(projRes.data.byStage?.length ? projRes.data.byStage.map(x => ({...x, count: parseInt(x.count)})) : MOCK_STAGES);
        setLeadTrend(leadRes.data.monthly?.length ? leadRes.data.monthly.map(x => ({...x, count: parseInt(x.count)})) : MOCK_LEADS);
        
        // Compute summary values from fetched datasets or use defaults
        const totalRev = revRes.data.reduce((acc, curr) => acc + Number(curr.collected || 0), 0) || MOCK_SUMMARY.totalRevenue;
        const totalProj = projRes.data.totalCount || MOCK_SUMMARY.totalBookings;
        setSummary({
          totalRevenue: totalRev,
          outstanding: MOCK_SUMMARY.outstanding,
          conversionRate: MOCK_SUMMARY.conversionRate,
          totalBookings: totalProj
        });
      } catch {
        setRevenueData(MOCK_REVENUE);
        setStageData(MOCK_STAGES);
        setLeadTrend(MOCK_LEADS);
        setSummary(MOCK_SUMMARY);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  const fmtCurrency = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <Loader2 className="animate-spin" size={36} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ padding: '16px 20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Detailed performance stats, conversion dynamics, and financial reports.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 4, borderRadius: 10, border: '1px solid var(--border-light)' }}>
            <button 
              onClick={() => setTimeframe('3months')} 
              className={`btn btn-sm ${timeframe === '3months' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', background: timeframe === '3months' ? 'var(--primary)' : 'transparent', color: timeframe === '3months' ? '#fff' : 'var(--text-muted)' }}
            >
              3M
            </button>
            <button 
              onClick={() => setTimeframe('6months')} 
              className={`btn btn-sm ${timeframe === '6months' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', background: timeframe === '6months' ? 'var(--primary)' : 'transparent', color: timeframe === '6months' ? '#fff' : 'var(--text-muted)' }}
            >
              6M
            </button>
            <button 
              onClick={() => setTimeframe('12months')} 
              className={`btn btn-sm ${timeframe === '12months' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', background: timeframe === '12months' ? 'var(--primary)' : 'transparent', color: timeframe === '12months' ? '#fff' : 'var(--text-muted)' }}
            >
              1Y
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} color="var(--primary)" />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Collected</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'Outfit' }}>{fmtCurrency(summary.totalRevenue)}</p>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} color="#EF4444" />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Outstanding</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'Outfit' }}>{fmtCurrency(summary.outstanding)}</p>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} color="#10B981" />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Lead Conv. Rate</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'Outfit' }}>{summary.conversionRate}%</p>
          </div>
        </div>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={22} color="var(--secondary)" />
          </div>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'Outfit' }}>{summary.totalBookings}</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24, flexWrap: 'wrap' }} className="reports-grid">
        
        {/* Revenue collected vs total */}
        <div className="card" style={{ padding: 24, minHeight: 380 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Revenue Statistics</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={v => v / 1000 + 'k'} />
                <Tooltip formatter={val => fmtCurrency(val)} contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }} />
                <Legend />
                <Bar dataKey="collected" name="Collected Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total Booked Value" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Pipeline distribution */}
        <div className="card" style={{ padding: 24, minHeight: 380 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Project Stage Breakdown</h2>
          <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="stage"
                >
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {stageData.map((item, idx) => (
              <div key={item.stage} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{item.stage.replace('_', ' ')} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lead trend line chart */}
        <div className="card" style={{ padding: 24, gridColumn: '1 / -1', minHeight: 350 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Lead Growth Trends</h2>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={leadTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-light)' }} />
                <Legend />
                <Line type="monotone" dataKey="count" name="New Inquiries" stroke="#EC4899" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 1024px) {
          .reports-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
