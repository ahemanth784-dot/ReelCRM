import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Edit2, AlertCircle, X, Loader2, Save } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const PAYMENT_STATUSES = ['pending', 'deposit_received', 'partially_paid', 'fully_paid'];
const calculatePaymentStatus = ({ total, paid, deposit }) => {
  const balance = Math.max(0, Number(total || 0) - Number(paid || 0));
  if (Number(total || 0) > 0 && Number(paid || 0) === Number(total || 0) && balance === 0) return 'fully_paid';
  if (Number(deposit || 0) > 0 && Number(paid || 0) >= Number(deposit || 0)) return 'deposit_received';
  return 'pending';
};
export default function PaymentsPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      const records = Array.isArray(res.data) ? res.data : res.data.payments;
      setPayments((records || []).map(payment => ({
        ...payment,
        name: payment.name || payment.client_name,
      })));
    } catch (error) {
      setPayments([]);
      addToast(error.response?.data?.message || 'Failed to load payment records', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPayments();
  }, [fetchPayments]);

  const totals = useMemo(() => {
    const booked = payments.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);
    const collected = payments.reduce((acc, curr) => acc + Number(curr.paid_amount || 0), 0);
    const outstanding = booked - collected;
    return { booked, collected, outstanding };
  }, [payments]);

  const handleEditClick = (pay) => {
    setSelectedPayment(pay);
    setEditModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedPayment(null);
    setEditModalOpen(false);
  };

  const handleSavePayment = async (updated) => {
    try {
      const clientId = updated.client_id;
      if (!clientId) throw new Error('Missing client ID');
      await api.put(`/payments/${clientId}`, updated);
      addToast('Payment record updated successfully', 'success');
      await fetchPayments();
      handleModalClose();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update payment', 'error');
    }
  };

  const filteredPayments = payments.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.event_type?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtCurrency = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const PayStatusBadge = ({ status }) => {
    const m = {
      fully_paid: { l: 'Fully Paid', c: 'badge-success' },
      deposit_received: { l: 'Deposit Paid', c: 'badge-info' },
      partially_paid: { l: 'Partial', c: 'badge-warning' },
      pending: { l: 'Pending', c: 'badge-danger' }
    };
    const s = m[status] || { l: status || '—', c: 'badge-gray' };
    return <span className={`badge ${s.c}`}>{s.l}</span>;
  };

  return (
    <div style={{ padding: '16px 20px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>Payments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track budgets, invoice details, deposit receipts, and balances.</p>
        </div>
      </div>

      {/* Summary KPI Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Booked</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, fontFamily: 'Outfit' }}>{fmtCurrency(totals.booked)}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Collected</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 8, fontFamily: 'Outfit' }}>{fmtCurrency(totals.collected)}</p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Outstanding Balance</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', marginTop: 8, fontFamily: 'Outfit' }}>{fmtCurrency(totals.outstanding)}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Filters */}
        <div style={{ padding: 18, borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="search-box" style={{ maxWidth: 320, width: '100%' }}>
            <Search size={16} className="search-icon" />
            <input 
              className="input search-input" 
              placeholder="Search by client or event..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <Loader2 className="animate-spin" size={28} color="var(--primary)" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ padding: '40px 0', textTransform: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No payment records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Event Type</th>
                  <th>Total Budget</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                    </td>
                    <td>{p.event_type}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(p.total_amount)}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{fmtCurrency(p.paid_amount)}</td>
                    <td style={{ color: Number(p.balance_amount || 0) > 0 ? '#EF4444' : 'var(--text-muted)', fontWeight: 600 }}>
                      {fmtCurrency(p.balance_amount || (p.total_amount - p.paid_amount))}
                    </td>
                    <td>{fmtDate(p.due_date)}</td>
                    <td>
                      <PayStatusBadge status={p.payment_status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {user?.role === 'admin' ? (
                        <button onClick={() => handleEditClick(p)} className="btn btn-secondary btn-icon" title="Edit details">
                          <Edit2 size={14} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Admin only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Payment Modal */}
      {editModalOpen && selectedPayment && (
        <EditPaymentModal 
          payment={selectedPayment} 
          onClose={handleModalClose} 
          onSave={handleSavePayment} 
        />
      )}
    </div>
  );
}

function EditPaymentModal({ payment, onClose, onSave }) {
  const [form, setForm] = useState({
    id: payment.id,
    client_id: payment.client_id,
    name: payment.name,
    total_amount: payment.total_amount || 0,
    deposit_amount: payment.deposit_amount || 0,
    paid_amount: payment.paid_amount || 0,
    balance_amount: payment.balance_amount || 0,
    payment_status: payment.payment_status || 'pending',
    due_date: payment.due_date ? payment.due_date.split('T')[0] : '',
    notes: payment.notes || ''
  });

  const set = (k, v) => {
    setForm(f => {
      const updated = { ...f, [k]: v };
      if (k === 'total_amount' || k === 'paid_amount') {
        const total = Math.max(0, Number(k === 'total_amount' ? v : f.total_amount) || 0);
        const requestedPaid = Math.max(0, Number(k === 'paid_amount' ? v : f.paid_amount) || 0);
        const paid = Math.min(requestedPaid, total);
        updated.total_amount = total;
        updated.paid_amount = paid;
        updated.deposit_amount = Math.min(Number(f.deposit_amount || 0), total);
        updated.balance_amount = Math.max(0, total - paid);
        updated.payment_status = calculatePaymentStatus({ total, paid, deposit: updated.deposit_amount });
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-up" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Payment Details</h2>
          <button onClick={onClose} className="btn btn-icon btn-secondary"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Client Name</label>
              <input className="input" value={form.name} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="label">Total Amount (₹)</label>
                <input 
                  className="input" 
                  type="number" 
                  value={form.total_amount} 
                  onChange={e => set('total_amount', Number(e.target.value))} 
                  min="0"
                />
              </div>
              <div className="form-group">
                <label className="label">Paid Amount (₹)</label>
                <input 
                  className="input" 
                  type="number" 
                  value={form.paid_amount} 
                  onChange={e => set('paid_amount', Number(e.target.value))} 
                  min="0"
                  max={Number(form.total_amount || 0)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="label">Balance Amount (₹)</label>
                <input className="input" value={form.balance_amount} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label className="label">Payment Status</label>
                <div className="input" style={{ opacity: 0.85, cursor: 'not-allowed', display: 'flex', alignItems: 'center' }}>
                  {form.payment_status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <span className="field-hint">Status is calculated automatically from paid and balance amounts.</span>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Due Date</label>
              <input 
                className="input" 
                type="date" 
                value={form.due_date} 
                onChange={e => set('due_date', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="label">Notes</label>
              <textarea 
                className="input" 
                rows="2" 
                value={form.notes} 
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
