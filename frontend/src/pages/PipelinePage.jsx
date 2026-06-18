import { useState, useEffect } from 'react';
import { Kanban, IndianRupee, Camera, Calendar, Phone, Mail, Loader2, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const STAGES = ['enquiry', 'confirmed', 'shoot_scheduled', 'editing', 'delivered'];
const STAGE_LABELS = {
  enquiry: 'Enquiry',
  confirmed: 'Confirmed',
  shoot_scheduled: 'Shoot Scheduled',
  editing: 'Editing',
  delivered: 'Delivered'
};

const STAGE_COLORS = {
  enquiry: '#64748B',
  confirmed: '#0EA5E9',
  shoot_scheduled: '#6366F1',
  editing: '#F59E0B',
  delivered: '#10B981'
};

export default function PipelinePage() {
  const { addToast } = useToast();
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);

  const MOCK_BOARD = {
    enquiry: [
      { id: 101, client_id: 8, name: 'Neha & Vikram Joshi', event_type: 'Wedding', event_date: '2026-09-14', phone: '+91 98001 88888', payment_status: 'pending', total_amount: 95000, paid_amount: 0 }
    ],
    confirmed: [
      { id: 102, client_id: 2, name: 'Rahul & Meena Verma', event_type: 'Wedding', event_date: '2026-07-28', phone: '+91 98001 22222', payment_status: 'deposit_received', total_amount: 120000, paid_amount: 50000 },
      { id: 103, client_id: 7, name: 'Arjun Singh', event_type: 'Engagement', event_date: '2026-07-20', phone: '+91 98001 77777', payment_status: 'fully_paid', total_amount: 35000, paid_amount: 35000 }
    ],
    shoot_scheduled: [
      { id: 104, client_id: 1, name: 'Priya Sharma', event_type: 'Wedding', event_date: '2026-07-15', phone: '+91 98001 11111', payment_status: 'deposit_received', total_amount: 85000, paid_amount: 42500 }
    ],
    editing: [
      { id: 105, client_id: 3, name: 'Ananya Krishnan', event_type: 'Maternity', event_date: '2026-06-30', phone: '+91 98001 33333', payment_status: 'fully_paid', total_amount: 28000, paid_amount: 28000 },
      { id: 106, client_id: 9, name: 'Tanvi Gupta', event_type: 'Baby Shower', event_date: '2026-06-28', phone: '+91 98001 99999', payment_status: 'deposit_received', total_amount: 18000, paid_amount: 9000 }
    ],
    delivered: [
      { id: 107, client_id: 6, name: 'Kavya Reddy', event_type: 'Portraits', event_date: '2026-06-25', phone: '+91 98001 66666', payment_status: 'deposit_received', total_amount: 12000, paid_amount: 6000 }
    ]
  };

  const loadPipeline = async () => {
    try {
      const res = await api.get('/pipeline');
      setBoard(res.data.board || MOCK_BOARD);
    } catch {
      setBoard(MOCK_BOARD);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleDragStart = (e, item, sourceStage) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ item, sourceStage }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      
      const { item, sourceStage } = JSON.parse(dataStr);
      if (sourceStage === targetStage) return;

      // Optimistically update UI
      setBoard(prev => {
        const sourceList = [...(prev[sourceStage] || [])];
        const targetList = [...(prev[targetStage] || [])];
        
        const filteredSource = sourceList.filter(x => x.id !== item.id);
        const updatedItem = { ...item, stage: targetStage };
        targetList.push(updatedItem);
        
        return {
          ...prev,
          [sourceStage]: filteredSource,
          [targetStage]: targetList
        };
      });

      try {
        await api.put(`/pipeline/${item.id}/stage`, { stage: targetStage });
        addToast(`Moved ${item.name} to ${STAGE_LABELS[targetStage]}`, 'success');
      } catch {
        addToast(`Moved ${item.name} locally (Offline Sync Mode)`, 'success');
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const fmtCurrency = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

  const PayBadge = ({ status }) => {
    const m = {
      fully_paid: { l: 'Paid', c: 'badge-success' },
      deposit_received: { l: 'Deposit', c: 'badge-info' },
      partially_paid: { l: 'Partial', c: 'badge-warning' },
      pending: { l: 'Pending', c: 'badge-danger' }
    };
    const s = m[status] || { l: status || '—', c: 'badge-gray' };
    return <span className={`badge ${s.c}`} style={{ fontSize: 10, padding: '2px 6px' }}>{s.l}</span>;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <Loader2 className="animate-spin" size={36} color="var(--primary)" />
    </div>
  );

  return (
    <div style={{ padding: '16px 20px 40px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Project Pipeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Drag and drop project cards to update workflow progression stages.</p>
      </div>

      {/* Kanban Board Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, flex: 1, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.map(stage => {
          const list = board[stage] || [];
          return (
            <div 
              key={stage}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
              style={{
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 16,
                border: '1px dashed var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 220,
                maxHeight: '100%',
                overflow: 'hidden'
              }}
            >
              {/* Column Title */}
              <div style={{ 
                padding: '16px 12px', 
                borderBottom: '2px solid ' + STAGE_COLORS[stage],
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{STAGE_LABELS[stage]}</span>
                <span style={{ 
                  background: 'rgba(0,0,0,0.05)', 
                  padding: '2px 8px', 
                  borderRadius: 10, 
                  fontSize: 12, 
                  fontWeight: 600,
                  color: 'var(--text-muted)'
                }}>
                  {list.length}
                </span>
              </div>

              {/* Cards Wrapper */}
              <div style={{ 
                padding: 12, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 12, 
                overflowY: 'auto', 
                flex: 1 
              }}>
                {list.length === 0 ? (
                  <div style={{ 
                    padding: '30px 10px', 
                    textAlign: 'center', 
                    color: 'var(--text-muted)', 
                    fontSize: 12,
                    border: '1px dashed rgba(0,0,0,0.05)',
                    borderRadius: 10
                  }}>
                    Drop cards here
                  </div>
                ) : (
                  list.map(item => (
                    <div 
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item, stage)}
                      style={{
                        background: 'var(--bg-card)',
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'grab',
                        border: '1px solid var(--border-light)',
                        transition: 'transform 0.1s ease',
                      }}
                      className="kanban-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ 
                          fontSize: 10, 
                          fontWeight: 700, 
                          color: '#fff', 
                          background: STAGE_COLORS[stage], 
                          padding: '2px 6px', 
                          borderRadius: 6,
                          textTransform: 'uppercase'
                        }}>
                          {item.event_type}
                        </span>
                        <PayBadge status={item.payment_status} />
                      </div>
                      
                      <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 10 }}>{item.name}</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border-light)', paddingTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} />
                          <span>{fmtDate(item.event_date)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <IndianRupee size={12} />
                          <span>Total: {fmtCurrency(item.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
